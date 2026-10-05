#!/usr/bin/env python3
"""
maestro_state.py — CONCURRENCY-SAFE pipeline state for the Maestro Video Generator repo.

WHY (QCR-173): the repo used a SINGLE shared `pipeline-state.json` plus a
shared `keyword-ledger.json`, and every phase did a non-atomic read-modify-write. Two
pipeline runs in parallel (or an orphan being finished by another session) clobbered each
other: `resource_cta` flipped between runs, phase entries were lost, the keyword reservation
was rolled back. This helper fixes that with TWO mechanisms:

  1. PER-RUN STATE FILES — each run writes `pipeline-runs/<run>.json`, never the shared file.
     The run is resolved from `--run` or the `MAESTRO_RUN` env var. With no run set, it falls
     back to the legacy `./pipeline-state.json` so single-run flows are byte-for-byte unchanged.

  2. ATOMIC LOCKED WRITES — every read-modify-write takes an exclusive `flock` on a sidecar
     `<file>.lock` and writes via temp-file + `os.replace` (atomic rename). This protects the
     GLOBAL files that CANNOT be per-run: the keyword ledger, the pipeline-log.csv, and Root.tsx.

USAGE (set MAESTRO_RUN once at the top of a run, then everything is isolated):
    export MAESTRO_RUN=MyVideo
    python3 maestro_state.py init  --note "link run …" --field source_url=https://…
    python3 maestro_state.py phase --num 3 --name generate-avatar-heygen --status done \
            --output "avatar 71s" --resume-next 4
    python3 maestro_state.py set   --field auto_post=true
    python3 maestro_state.py show
    python3 maestro_state.py path                    # -> pipeline-runs/MyVideo.json
    python3 maestro_state.py list                    # all active runs
    python3 maestro_state.py log --row-json '["2026-…","<avatar>", …]'   # atomic CSV append
    python3 maestro_state.py register-comp --name MyVideo --duration 1778   # locked Root.tsx insert
    python3 maestro_state.py migrate --run MyVideo   # legacy pipeline-state.json -> per-run file

Library use:
    import maestro_state
    maestro_state.update(run, lambda d: {**d, "x": 1})   # atomic, locked
    d = maestro_state.load(run)
"""
import argparse, csv, json, os, sys, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from lib.locking import flock as _flock, atomic_write as _atomic_write  # noqa: E402
from lib.timeutil import now_iso as _now  # noqa: E402
from lib.paths import remotion_root, downloads  # noqa: E402

REPO = HERE
RUNS_DIR = os.path.join(REPO, "pipeline-runs")
LEGACY_STATE = os.path.join(REPO, "pipeline-state.json")
LOG_CSV = os.path.join(REPO, "pipeline-log.csv")
# Root.tsx of the Remotion project (motion-pipeline/remotion-agent by default; env-overridable
# via MAESTRO_REMOTION — see lib.paths.remotion_root).
DEFAULT_ROOT_TSX = os.path.join(remotion_root(), "src", "Root.tsx")


# ── run / path resolution ───────────────────────────────────────────────────
def resolve_run(run=None):
    """The run name: explicit arg > MAESTRO_RUN env > None (legacy single-file mode)."""
    return run or os.environ.get("MAESTRO_RUN") or None


def state_path(run=None):
    run = resolve_run(run)
    if not run:
        return LEGACY_STATE
    return os.path.join(RUNS_DIR, f"{run}.json")


# ── atomic locked read-modify-write (_flock/_atomic_write now live in lib/locking.py) ──
def _read_json(path, default):
    if not os.path.exists(path):
        return json.loads(json.dumps(default))  # deep copy
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def update_at(path, mutator, default=None):
    """Atomic, locked read-modify-write of an EXPLICIT json file path. `mutator(data) -> data`.
    If the mutator raises, no write happens (the lock is released cleanly) — so a collision
    check can `raise` to abort the reservation without leaving a partial file."""
    default = default if default is not None else {}
    with _flock(path):
        data = _read_json(path, default)
        data = mutator(data) or data
        _atomic_write(path, data)
    return data


def update(run, mutator, default=None):
    """Atomic, locked read-modify-write of a RUN's state (resolves the per-run path).
    Every run-state write stamps `heartbeat_ts` (and `worker_pid`) so a concurrent
    session can detect that this run is actively OWNED and refuse to double-own it
    (QCR-222 ownership lock — see `check-owner`)."""
    def mut2(d):
        d = mutator(d) or d
        d["heartbeat_ts"] = _now()
        d["worker_pid"] = os.getpid()
        return d
    return update_at(state_path(run), mut2, default)


def load(run=None):
    return _read_json(state_path(run), {})


# ── ledger (GLOBAL — locked, never per-run) ─────────────────────────────────
def ledger_update(ledger_path, mutator):
    """Atomic, locked update of the GLOBAL keyword ledger (shared across all runs)."""
    return update_at(ledger_path, mutator, default={"used_keywords": [], "history": []})


# ── CLI ─────────────────────────────────────────────────────────────────────
def _parse_field(kv):
    if "=" not in kv:
        sys.exit(f"ERROR: --field expects key=value, got {kv!r}")
    k, v = kv.split("=", 1)
    try:
        return k, json.loads(v)         # typed (true/123/"…"/[…])
    except json.JSONDecodeError:
        return k, v                     # bare string


def cmd_path(a):
    print(state_path(a.run)); return 0


def cmd_init(a):
    run = resolve_run(a.run)
    base = {
        "run_name": run or "default",
        "status": "in_progress",
        "resume_from": 1,
        "phases": [],
    }
    for kv in (a.field or []):
        k, v = _parse_field(kv); base[k] = v

    def mut(d):
        # don't wipe an existing run; merge missing base keys only
        for k, v in base.items():
            d.setdefault(k, v)
        d["run_name"] = base["run_name"]
        return d
    out = update(a.run, mut)
    print(json.dumps(out, ensure_ascii=False)); return 0


def cmd_set(a):
    fields = dict(_parse_field(kv) for kv in (a.field or []))

    def mut(d):
        d.update(fields); return d
    out = update(a.run, mut)
    print(json.dumps({k: out.get(k) for k in fields}, ensure_ascii=False)); return 0


def cmd_phase(a):
    entry = {"phase": _num(a.num), "name": a.name, "status": a.status}
    if a.output:
        entry["output"] = a.output
    entry["timestamp"] = a.timestamp or _now()

    def mut(d):
        d.setdefault("phases", [])
        for i, p in enumerate(d["phases"]):
            if str(p.get("phase")) == str(entry["phase"]) and p.get("name") == a.name:
                d["phases"][i] = entry; break
        else:
            d["phases"].append(entry)
        if a.resume_next is not None:
            d["resume_from"] = _num(a.resume_next)
        if a.run_status:
            d["status"] = a.run_status
        return d
    out = update(a.run, mut)
    print(f"phase {entry['phase']} ({a.name}) = {a.status}; resume_from={out.get('resume_from')}")
    return 0


def cmd_check_owner(a):
    """OWNERSHIP GUARD (QCR-222) — decide if a run is actively owned by a live sibling.
    A run is OWNED when status=='in_progress' AND its heartbeat_ts is fresher than
    --max-age seconds (default 180). Prints a JSON verdict and EXITS 3 when owned, 0
    otherwise. The orchestrator MUST consult this before taking over / resuming an
    in_progress run (esp. at Phase >=11): OWNED -> do NOT touch it (a sibling is
    mid-post; posting takes 10-15 min) -> claim the NEXT queued link instead.
    `peek` already skips RUNNING queue entries, so the normal path never collides;
    this guards the manual-takeover path that once caused duplicate posts."""
    d = load(a.run)
    status = d.get("status")
    hb = d.get("heartbeat_ts")
    try:
        threshold = float(a.max_age)
    except (TypeError, ValueError):
        threshold = 180.0
    age = None
    if hb:
        try:
            age = (datetime.datetime.now() - datetime.datetime.fromisoformat(hb)).total_seconds()
        except Exception:
            age = None
    owned = bool(status == "in_progress" and age is not None and 0 <= age < threshold)
    print(json.dumps({
        "owned": owned, "status": status, "heartbeat_ts": hb,
        "age_s": round(age, 1) if age is not None else None,
        "threshold_s": threshold, "worker_pid": d.get("worker_pid"),
    }, ensure_ascii=False))
    return 3 if owned else 0


def _pid_alive(pid):
    try:
        os.kill(int(pid), 0)
        return True
    except (TypeError, ValueError, ProcessLookupError, PermissionError, OSError):
        return False


def cmd_stale(a):
    """STALE-RUN DETECTOR — deterministic input for the Stage-0 recovery sweep
    (PIPELINE_DIRECTIVES §12d / skill `recover-stalled-runs`). A run is STALE (orphaned) when:
      status in (in_progress, failed)  AND  worker_pid is dead/absent
      AND heartbeat_ts is older than --max-age seconds (default 1800) or absent.
    This is the OPPOSITE side of `check-owner` (QCR-222): check-owner protects a LIVE sibling;
    `stale` surfaces the runs NO ONE owns anymore (orphans left by sessions that ended their
    turn with phases still running in the background).
    Prints one JSON row per stale run; exit 0 always (empty output = none)."""
    try:
        threshold = float(a.max_age)
    except (TypeError, ValueError):
        threshold = 1800.0
    now = datetime.datetime.now()
    rows = []
    if os.path.isdir(RUNS_DIR):
        for fn in sorted(os.listdir(RUNS_DIR)):
            if not fn.endswith(".json"):
                continue
            d = _read_json(os.path.join(RUNS_DIR, fn), {})
            if d.get("status") not in ("in_progress", "failed"):
                continue
            pid = d.get("worker_pid")
            if _pid_alive(pid):
                continue
            hb = d.get("heartbeat_ts")
            age = None
            if hb:
                try:
                    age = (now - datetime.datetime.fromisoformat(hb)).total_seconds()
                except Exception:
                    age = None
            if age is not None and age < threshold:
                continue  # recent write, PID check may race a respawn — leave it alone
            run = fn[:-5]
            phases = d.get("phases", [])
            last = phases[-1] if phases else {}
            cta = d.get("resource_cta") or {}
            music = os.path.join(downloads(), f"{run}_music.mp4")
            rows.append({
                "run": run, "status": d.get("status"), "resume_from": d.get("resume_from"),
                "heartbeat_ts": hb, "age_s": round(age, 1) if age is not None else None,
                "worker_pid": pid, "last_phase": last.get("phase"),
                "last_phase_name": last.get("name"), "last_phase_status": last.get("status"),
                "cta_status": cta.get("status"), "music_exists": os.path.exists(music),
            })
    for r in rows:
        print(json.dumps(r, ensure_ascii=False))
    return 0


def cmd_assert_ready(a):
    """END-OF-CREATION GATE (PIPELINE_DIRECTIVES §12c) — the LAST command of every
    creation run. Exit 0 ONLY when the run is genuinely finished:
      1. state status == 'ready_to_post'
      2. resource_cta.enabled -> resource_cta.status in {'live','manual'} ('manual' = ManyChat disabled in config)
      3. post-queue.jsonl holds an ACTIVE entry for this run
    Anything else exits 4 with a JSON verdict — the run is NOT done; the agent must fix the
    missing piece IN THIS TURN (never report success, never end the turn on a background wait)."""
    run = resolve_run(a.run)
    d = load(a.run)
    problems = []
    if d.get("status") != "ready_to_post":
        problems.append(f"status={d.get('status')!r} (want 'ready_to_post')")
    cta = d.get("resource_cta") or {}
    if cta.get("enabled") and cta.get("status") not in ("live", "manual"):
        problems.append(f"resource_cta.status={cta.get('status')!r} (want 'live', or 'manual' when ManyChat is disabled)")
    queued = False
    qpath = os.path.join(REPO, "post-queue.jsonl")
    if run and os.path.exists(qpath):
        try:
            with open(qpath, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    e = json.loads(line)
                    if e.get("run_name") == run and e.get("status") in ("ready", "posting"):
                        queued = True
                        break
        except Exception:
            pass
    if not queued:
        problems.append("no ACTIVE post-queue.jsonl entry for this run")
    ok = not problems
    print(json.dumps({"run": run, "ready": ok, "problems": problems}, ensure_ascii=False))
    return 0 if ok else 4


def cmd_show(a):
    print(json.dumps(load(a.run), indent=2, ensure_ascii=False)); return 0


def cmd_get(a):
    v = load(a.run).get(a.key)
    print(json.dumps(v, ensure_ascii=False) if not isinstance(v, str) else v); return 0


def cmd_list(a):
    rows = []
    if os.path.isdir(RUNS_DIR):
        for fn in sorted(os.listdir(RUNS_DIR)):
            if fn.endswith(".json"):
                d = _read_json(os.path.join(RUNS_DIR, fn), {})
                rows.append((fn[:-5], d.get("status", "?"), d.get("resume_from", "?")))
    if os.path.exists(LEGACY_STATE):
        d = _read_json(LEGACY_STATE, {})
        rows.append(("(legacy pipeline-state.json)", d.get("status", "?"), d.get("resume_from", "?")))
    if not rows:
        print("(no runs)"); return 0
    for name, st, rf in rows:
        print(f"{name:40s} status={st:14s} resume_from={rf}")
    return 0


def cmd_log(a):
    row = json.loads(a.row_json)
    if not isinstance(row, list):
        sys.exit("ERROR: --row-json must be a JSON array (one CSV row)")
    with _flock(LOG_CSV):
        newfile = not os.path.exists(LOG_CSV)
        with open(LOG_CSV, "a", newline="", encoding="utf-8") as f:
            csv.writer(f).writerow(row)
    print(f"appended 1 row to {LOG_CSV}"); return 0


def cmd_migrate(a):
    run = resolve_run(a.run)
    if not run:
        sys.exit("ERROR: migrate needs --run (or MAESTRO_RUN)")
    if not os.path.exists(LEGACY_STATE):
        sys.exit("ERROR: no legacy pipeline-state.json to migrate")
    legacy = _read_json(LEGACY_STATE, {})
    dest = state_path(run)
    update(run, lambda d: {**legacy, "run_name": run})
    print(f"migrated legacy pipeline-state.json -> {dest}"); return 0


def cmd_register_comp(a):
    """Idempotent, LOCKED insertion of a Composition into Root.tsx so two parallel
    motion phases never corrupt it. Skips if the id is already registered."""
    root = a.root or DEFAULT_ROOT_TSX
    if not os.path.exists(root):
        sys.exit(f"ERROR: Root.tsx not found: {root}")
    imp = f'import {{ {a.name} }} from "./compositions/{a.name}";'
    # --duration is in SECONDS (the run's audio length). Emit a FRAME count: a value < 1000 is
    # seconds → Math.round(sec*fps); a large value is assumed to already be frames (back-compat).
    # (Bug fixed QCR: was emitting raw seconds as durationInFrames → a 3.3s render.)
    dur = _num(a.duration)
    dur_expr = f'Math.round({dur} * {a.fps})' if float(a.duration) < 1000 else f'{dur}'
    comp = (f'      <Composition id="{a.name}" component={{{a.name}}} '
            f'durationInFrames={{{dur_expr}}} fps={{{a.fps}}} '
            f'width={{{a.w}}} height={{{a.h}}} />')
    with _flock(root):
        src = open(root, encoding="utf-8").read()
        if f'id="{a.name}"' in src:
            print(f"already registered: {a.name} (no-op)"); return 0
        lines = src.splitlines()
        # 1) insert import after the last compositions import
        last_imp = max((i for i, l in enumerate(lines)
                        if l.startswith("import ") and './compositions/' in l), default=None)
        if last_imp is None:
            sys.exit("ERROR: no './compositions/' import anchor found in Root.tsx")
        lines.insert(last_imp + 1, imp)
        # 2) insert composition before the FINAL fragment close `    </>`
        close = max((i for i, l in enumerate(lines) if l.strip() == "</>"), default=None)
        if close is None:
            sys.exit("ERROR: no closing `</>` anchor found in Root.tsx")
        lines.insert(close, comp)
        tmp = f"{root}.tmp.{os.getpid()}"
        with open(tmp, "w", encoding="utf-8") as f:
            f.write("\n".join(lines) + "\n")
        os.replace(tmp, root)
    print(f"registered Composition {a.name} (dur={a.duration}) in {root}"); return 0


def _num(x):
    try:
        return int(x)
    except (TypeError, ValueError):
        return float(x)


def main():
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--run", default=None, help="run name (else MAESTRO_RUN env, else legacy file)")
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1], parents=[common])
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("path", parents=[common]).set_defaults(fn=cmd_path)

    p = sub.add_parser("init", parents=[common]); p.add_argument("--field", action="append"); p.add_argument("--note")
    p.set_defaults(fn=lambda a: (_init_note(a), cmd_init(a))[1])

    p = sub.add_parser("set", parents=[common]); p.add_argument("--field", action="append", required=True)
    p.set_defaults(fn=cmd_set)

    p = sub.add_parser("phase", parents=[common])
    p.add_argument("--num", required=True); p.add_argument("--name", required=True)
    p.add_argument("--status", required=True); p.add_argument("--output", default="")
    p.add_argument("--resume-next", dest="resume_next", default=None)
    p.add_argument("--run-status", dest="run_status", default=None)
    p.add_argument("--timestamp", default=None)
    p.set_defaults(fn=cmd_phase)

    sub.add_parser("show", parents=[common]).set_defaults(fn=cmd_show)
    p = sub.add_parser("check-owner", parents=[common]); p.add_argument("--max-age", dest="max_age", default=180); p.set_defaults(fn=cmd_check_owner)
    p = sub.add_parser("stale", parents=[common]); p.add_argument("--max-age", dest="max_age", default=1800); p.set_defaults(fn=cmd_stale)
    sub.add_parser("assert-ready", parents=[common]).set_defaults(fn=cmd_assert_ready)
    p = sub.add_parser("get", parents=[common]); p.add_argument("--key", required=True); p.set_defaults(fn=cmd_get)
    sub.add_parser("list", parents=[common]).set_defaults(fn=cmd_list)

    p = sub.add_parser("log", parents=[common]); p.add_argument("--row-json", dest="row_json", required=True)
    p.set_defaults(fn=cmd_log)

    p = sub.add_parser("migrate", parents=[common]).set_defaults(fn=cmd_migrate)

    p = sub.add_parser("register-comp", parents=[common])
    p.add_argument("--name", required=True); p.add_argument("--duration", required=True)
    p.add_argument("--fps", default=25); p.add_argument("--w", default=1080); p.add_argument("--h", default=1920)
    p.add_argument("--root", default=None)
    p.set_defaults(fn=cmd_register_comp)

    a = ap.parse_args()
    sys.exit(a.fn(a))


def _init_note(a):
    # fold --note into a field so `init --note` is ergonomic
    if getattr(a, "note", None):
        a.field = (a.field or []) + [f"note={json.dumps(a.note)}"]


if __name__ == "__main__":
    main()
