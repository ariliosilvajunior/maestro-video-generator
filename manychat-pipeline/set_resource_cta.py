#!/usr/bin/env python3
"""
set_resource_cta.py — the ONE deterministic way to write the comment-CTA contract.

Phase 2 (write-script-ptbr) and the link path call this to stamp `resource_cta` into
pipeline-state.json AND atomically reserve the keyword in keyword-ledger.json — in a single
command, so there is no hand-editing of JSON (the #1 cause of "default" inconsistency found in
an instruction audit). Phase 4 (capture-references) and Phase 11 (manage-comment-dm)
call `set-link` to backfill the captured URL.

Keyword uniqueness = accent/spacing-fold EXACT match against used_keywords[] (GRÁTIS collides with
GRATIS, 'CãoBom' with 'CÃO BOM'; a longer word that merely *contains* the keyword does not count as
used). The script refuses to reserve a colliding keyword.

Keyword VARIANTS: pass --keyword in the NATURAL caption spelling (accents OK: GRÁTIS,
VÍDEO). The tool stores an accent-folded ASCII PRIMARY in `resource_cta.keyword` + the ledger, and
emits `resource_cta.keyword_variants` = every spelling form to register as ManyChat triggers (the
folded form + the accented form + space-join forms). ManyChat match is case-insensitive but NOT
accent-insensitive, so without the fold form a no-accent comment ('gratis') silently misses (the
incident that motivated this). Letter-level typos are NOT generated (collision/false-fire risk).

Modes:
  enable   --name N --kind K --keyword KW [--link URL] [--video V]
           [--blurb "what it does (Y, PT-BR)"] [--dm-message "verbatim override"]
           [--follow-gate true|false] [--mode create|modify]         # set enabled cta + reserve keyword
  disable                                                            # write the canonical disabled shape
  set-link --link URL --source capture-references|owner|re-derived   # backfill link (Phase 4 / 12)
  check-keyword --keyword KW                                         # exit 0 free / 3 used (no write)
  set-status --status pending|live|manual|skipped|failed [--flow-id ID]   # Phase-11 stamp after verify gate ("manual" = ManyChat disabled: link delivered by hand)
  show                                                               # print current resource_cta

Keyword-specific DM (house rule): the automation no longer sends a bare link — it
sends a resource-specific message composed from --blurb ("aqui está o <kind> <name> que faz <Y>: link"),
gates delivery behind a FOLLOW requirement (--follow-gate, default true), and defaults to --mode create
(one live automation per keyword → multiple keywords run concurrently, each with its own message+link).

Common: --state PATH / --ledger PATH may go BEFORE or AFTER the subcommand (both work). Omit them
in PRODUCTION — they default to the repo's pipeline-state.json + keyword-ledger.json. Pass temp paths
only to dry-run safely. `enable` is idempotent: re-enabling the same run with a different keyword
releases the previously-reserved keyword (no ledger orphans).

Examples:
  python3 manychat-pipeline/set_resource_cta.py enable --name "Claude Code" --kind repo \
      --keyword MAESTRO --link https://github.com/anthropics/claude-code --video ClaudeCodeReel
  python3 manychat-pipeline/set_resource_cta.py disable
  python3 manychat-pipeline/set_resource_cta.py set-link --link https://github.com/anthropics/claude-code --source capture-references
  python3 manychat-pipeline/set_resource_cta.py check-keyword --keyword MAESTRO
"""
import argparse, json, os, sys, datetime, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
# Concurrency-safe writes (QCR-173): per-run state file resolved from MAESTRO_RUN + atomic
# flock'd read-modify-write so parallel runs never clobber resource_cta / the keyword ledger.
sys.path.insert(0, REPO)
import maestro_state  # noqa: E402
# MAESTRO_RUN-aware: pipeline-runs/<run>.json when a run is active, else the legacy single file.
DEFAULT_STATE = maestro_state.state_path()
DEFAULT_LEDGER = os.path.join(HERE, "keyword-ledger.json")
LEDGER = DEFAULT_LEDGER  # overridden by --ledger at runtime
from lib import config as _cfg  # noqa: E402
# The master TEMPLATE every new automation is DUPLICATED from (Flow Builder, kept DRAFT) — set it in
# config.json → manychat.template_flow_id (see MANYCHAT_INSTRUCTIONS.md §B0). Used as the initial
# placeholder for `manychat_flow_id` until Phase 11 mints the dedicated per-keyword flow id.
TEMPLATE_FLOW_ID = _cfg.get("manychat.template_flow_id", "") or ""
FLOW_ID = TEMPLATE_FLOW_ID

# Link-DM is a 3-PARAGRAPH message — paragraphs are separated by a BLANK LINE (\n\n). These
# blank-line breaks are part of the copy and MUST be preserved when written into ManyChat
# (the bug: the message was collapsed to one line, losing the paragraph breaks).
LINK_DM_PARAGRAPH_SEP = "\n\n"
KINDS = ("repo", "skill", "agent", "tool", "app", "product", "site")


def _compose_dm(name, kind, blurb):
    """The link-DM text = the master TEMPLATE's "DM with a link" (Yes branch) with its two
    placeholders filled: `[NOME DO RECURSO]` → name, `[o que ele faz]` → blurb. Mirrors the master
    template EXACTLY, including the blank-line paragraph breaks
    (\\n\\n). Whoever writes this into ManyChat MUST keep the \\n\\n (set the textarea value with the
    real newlines — do NOT collapse to a single line). `kind` is kept for the data contract only."""
    # QCR-298: `blurb` is slotted after "Ele " → it MUST be a VERB PHRASE ("te protege do golpe").
    # An agent sometimes passes a NOUN PHRASE ("o guia completo pra não cair no golpe") which
    # produced the broken "Ele o guia completo…" on a real run. Auto-repair: if the
    # blurb opens with a PT-BR article/determiner (o/a/os/as/um/uma/uns/umas/esse/este/aquele…),
    # it is a noun phrase → prefix "é " so it reads "Ele é o guia completo…" (grammatical). Verb-
    # phrase blurbs are untouched. Non-destructive; never crashes the pipeline over copy.
    b = (blurb or "").strip()
    if b:
        _first = b.split(None, 1)[0].lower().strip(".,;:!?")
        _NOUN_LEADERS = {"o", "a", "os", "as", "um", "uma", "uns", "umas",
                         "esse", "essa", "este", "esta", "aquele", "aquela", "seu", "sua"}
        if _first in _NOUN_LEADERS:
            b = f"é {b}"
        ele = f"Ele {b}."
    else:
        ele = "Ele é o recurso que você pediu."
    return (
        f"Prontinho! Aqui está o {name} 🎁"
        f"{LINK_DM_PARAGRAPH_SEP}{ele}"
        f"{LINK_DM_PARAGRAPH_SEP}É só tocar no botão aqui embaixo pra acessar 👇"
    )


def _compose_opening_dm(opening_name):
    """The OPENING DM = the master TEMPLATE's first Send Message (sent on every comment, BEFORE the
    follow gate). It now NAMES the specific resource the viewer is getting — the same way _compose_dm
    names it in the link DM. `opening_name` is the agent-authored phrase that fills the blank in
    "Já separei o ___ pra você"; it is written from understanding the script + the resource's purpose
    (independent of resource_name, though it defaults to it). When `opening_name` is empty (no resource
    on this video) the message falls back BYTE-IDENTICAL to the legacy generic opening DM, so
    non-resource videos are completely unchanged. The greeting and the body are two paragraphs separated
    by a BLANK LINE (\\n\\n) — that break IS the copy and MUST be preserved when written into ManyChat."""
    thing = (opening_name or "").strip()
    if thing:
        body = f"Já separei o {thing} pra você! Agora é só tocar no botão aqui embaixo para receber ⚡"
    else:
        body = "Já separei o material pra você! Agora é só tocar no botão aqui embaixo para receber o que pediu ⚡"
    return f"Oiê! Que alegria te ver por aqui 😊{LINK_DM_PARAGRAPH_SEP}{body}"


def _load(path, default=None):
    if not os.path.exists(path):
        if default is not None:
            return default
        sys.exit(f"ERROR: file not found: {path}")
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save(path, data):
    with open(path, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")


def _norm(kw):
    return (kw or "").strip().upper()


def _strip_accents(s):
    """Fold PT-BR accents to ASCII: GRÁTIS→GRATIS, VÍDEO→VIDEO, MAÇÃ→MACA."""
    return "".join(c for c in unicodedata.normalize("NFD", s or "")
                   if unicodedata.category(c) != "Mn")


def _fold(s):
    """The PRIMARY/canonical keyword form: accent-folded, UPPERCASE (ledger + state.keyword)."""
    return _strip_accents((s or "").strip().upper())


def _uniq_key(s):
    """Collision key for uniqueness: accent-folded + spaces removed. So 'CÃO BOM', 'CãoBom',
    'cao bom' all collide (same spoken CTA word) — prevents two videos' variants cross-routing."""
    return _fold(s).replace(" ", "")


def keyword_variants(raw):
    """ALL ManyChat trigger forms for a keyword, given as the audience SEES it in the caption
    (natural PT-BR spelling — may carry accents/spaces). Returns an ordered, deduped, UPPERCASE list:
      1. accent-folded ASCII form  (the PRIMARY — matches lazy/no-accent mobile typers: 'gratis')
      2. the original accented form (matches people who type the accent shown: 'grátis')
      3. if multi-word: the space-joined forms of (1) and (2)  ('cao bom' → also 'caobom')
    ManyChat matching is case-insensitive (so no case forms needed) but NOT accent-insensitive
    (so the fold form is REQUIRED) and 'contains' substring (so a keyword inside a longer comment
    still fires). Letter-level TYPO variants are deliberately NOT generated — with substring
    matching + global keyword-uniqueness they risk cross-routing collisions and false fires;
    typo-robustness comes from picking short, common, easy PT-BR words (ledger rule), not fuzzing."""
    raw = (raw or "").strip().upper()
    folded = _strip_accents(raw)
    forms = []
    def add(x):
        x = x.strip()
        if x and x not in forms:
            forms.append(x)
    add(folded)
    add(raw)
    if " " in raw:
        add(folded.replace(" ", ""))
        add(raw.replace(" ", ""))
    return forms


def _used_set(ledger):
    return {_uniq_key(k) for k in ledger.get("used_keywords", [])}


def _today():
    return datetime.date.today().isoformat()


def cmd_check_keyword(args):
    key = _uniq_key(args.keyword)
    if not key:
        sys.exit("ERROR: --keyword is empty")
    ledger = _load(LEDGER, {"used_keywords": [], "history": []})
    # accent-fold-aware: GRÁTIS collides with an existing GRATIS (and vice-versa), CãoBom with CÃO BOM.
    if key in _used_set(ledger):
        print(f"USED — '{_fold(args.keyword)}' (or an accent/spacing variant) is already in the ledger. Pick another.", file=sys.stderr)
        return 3
    print(f"FREE — '{_fold(args.keyword)}' is available (variants: {keyword_variants(args.keyword)}).", file=sys.stderr)
    return 0


def cmd_enable(args):
    # Pass the keyword as the AUDIENCE sees it in the caption (natural PT-BR spelling — accents OK,
    # e.g. GRÁTIS / VÍDEO). We fold it to an ASCII PRIMARY (`kw`) for the ledger/state, and register
    # ALL spelling variants in ManyChat so a no-accent comment ('gratis') still triggers (the
    # GRÁTIS miss). Validate on the FOLDED form so accents are accepted, spaces tolerated.
    kw = _fold(args.keyword)                 # PRIMARY: accent-folded, UPPERCASE
    variants = keyword_variants(args.keyword)  # all trigger forms to register in ManyChat
    kw_nospace = kw.replace(" ", "")
    if not kw_nospace or not kw_nospace.isascii() or not kw_nospace.isalnum():
        sys.exit(f"ERROR: keyword must be PT-BR alphanumeric word(s) (accents OK, folded form must be ASCII alnum). Got: {args.keyword!r}")
    if args.kind not in KINDS:
        sys.exit(f"ERROR: --kind must be one of {KINDS}. Got: {args.kind!r}")

    # Read THIS run's current state once (only this run writes its own state) to learn the
    # previously-reserved keyword. The WRITES below are atomic + locked (QCR-173).
    prev = (_load(args.state, {}).get("resource_cta") or {})
    key = _uniq_key(args.keyword)
    prev_key = _uniq_key(prev.get("keyword")) if prev.get("enabled") else ""
    already_ours = bool(prev_key) and (key == prev_key)  # re-enabling THIS run, same keyword → no re-reserve

    blurb = args.blurb or (prev.get("resource_blurb", "") if already_ours else "")
    dm_message = args.dm_message or _compose_dm(args.name, args.kind, blurb)
    # Opening-DM blank: agent-authored phrase naming the resource in "Já separei o ___ pra você".
    # Independent of resource_name (the agent may tailor it from the script + resource purpose), but
    # defaults to --name as a safe, already-script-derived value; preserved on idempotent re-enable.
    opening_name = (args.opening_name
                    or (prev.get("opening_name", "") if already_ours else "")
                    or args.name)
    opening_dm = args.opening_dm or _compose_opening_dm(opening_name)
    follow_gate = (args.follow_gate == "true")
    status = prev.get("status", "pending") if already_ours else "pending"

    # ── 1) RESERVE the keyword atomically in the GLOBAL ledger (release-old + collision-check +
    #        append are ALL inside one exclusive lock, so two parallel runs can't both grab it). ──
    def _ledger_mut(L):
        L.setdefault("used_keywords", []); L.setdefault("history", [])
        if prev_key and prev_key != key:  # idempotent re-enable: release this run's old keyword
            L["used_keywords"] = [k for k in L["used_keywords"] if _uniq_key(k) != prev_key]
            L["history"] = [h for h in L["history"] if _uniq_key(h.get("keyword")) != prev_key]
        used = {_uniq_key(k) for k in L["used_keywords"]}  # accent/spacing-fold-aware collision
        if not already_ours and key in used:
            raise SystemExit(f"ERROR: keyword '{kw}' (or an accent/spacing variant) already used (ledger). Choose a unique one — run check-keyword first.")
        if not already_ours:
            L["used_keywords"].append(kw)
            L["history"].append({"keyword": kw, "variants": variants, "video": args.video, "link": args.link or "", "date": _today()})
        return L
    maestro_state.ledger_update(LEDGER, _ledger_mut)  # raises (no write) on collision

    # ── 2) WRITE resource_cta into THIS run's state atomically (never clobbers another run). ──
    def _state_mut(S):
        S["resource_cta"] = {
            "enabled": True,
            "resource_name": args.name,
            "resource_kind": args.kind,
            "keyword": kw,                 # PRIMARY (accent-folded ASCII) — ledger + display
            "keyword_variants": variants,  # ALL ManyChat trigger forms (Phase 11 registers each)
            "link": args.link or (prev.get("link", "") if already_ours else ""),
            "link_source": (("owner" if args.link else prev.get("link_source", "")) if already_ours else ("owner" if args.link else "")),
            "resource_blurb": blurb,
            "dm_message": dm_message,
            "opening_name": opening_name,  # phrase that fills the opening-DM blank (defaults to resource name)
            "opening_dm": opening_dm,      # composed opening DM (names the resource); Phase 11 writes it into the flow
            "follow_gate": follow_gate,
            "mode": args.mode,
            # preserve an already-minted dedicated flow id on re-enable; never clobber it back to legacy
            "manychat_flow_id": (prev.get("manychat_flow_id") or FLOW_ID) if already_ours else FLOW_ID,
            "status": status,
        }
        if args.video and not S.get("run_name"):
            S["run_name"] = args.video
        return S
    out = maestro_state.update_at(args.state, _state_mut)

    print(json.dumps(out["resource_cta"], indent=2, ensure_ascii=False))
    msg = "re-used already-reserved keyword" if already_ours else "reserved keyword"
    print(f"\n{msg} '{kw}' in ledger; resource_cta written to {args.state}", file=sys.stderr)
    return 0


def cmd_disable(args):
    def _mut(S):
        S["resource_cta"] = {"enabled": False, "status": "skipped"}; return S
    out = maestro_state.update_at(args.state, _mut)
    print(json.dumps(out["resource_cta"], indent=2, ensure_ascii=False))
    print(f"resource_cta set to disabled (canonical shape) in {args.state}", file=sys.stderr)
    return 0


def cmd_set_link(args):
    rc_holder = {}

    def _mut(S):
        rc = S.get("resource_cta")
        if not rc or not rc.get("enabled"):
            raise SystemExit("ERROR: resource_cta is missing or disabled — nothing to set a link on.")
        rc["link"] = args.link
        rc["link_source"] = args.source
        rc_holder["rc"] = rc
        return S
    maestro_state.update_at(args.state, _mut)
    rc = rc_holder["rc"]
    kw = _norm(rc.get("keyword"))

    # backfill the ledger history entry for this keyword (atomic, locked)
    def _ledger_mut(L):
        for h in reversed(L.get("history", [])):
            if _norm(h.get("keyword")) == kw and not h.get("link"):
                h["link"] = args.link
                break
        return L
    maestro_state.ledger_update(LEDGER, _ledger_mut)
    print(json.dumps(rc, indent=2, ensure_ascii=False))
    print(f"link set ({args.source}) for keyword '{kw}' in {args.state}", file=sys.stderr)
    return 0


def cmd_set_status(args):
    """Phase-12 stamp: set resource_cta.status (+ optional manychat_flow_id) atomically.

    The legacy `enable` path hardcodes manychat_flow_id to the single permanent flow; in
    MODE=create each video mints its OWN dedicated flow id, and only after the Step-4
    NAME==KEYWORD verify gate passes may status be flipped to "live". This is the ONE
    deterministic, locked writer for that — never hand-edit the JSON (QCR-202 / house rules)."""
    valid = {"pending", "live", "manual", "skipped", "failed"}
    if args.status not in valid:
        sys.exit(f"ERROR: --status must be one of {sorted(valid)}. Got: {args.status!r}")

    def _mut(S):
        rc = S.get("resource_cta")
        if not rc or not rc.get("enabled"):
            raise SystemExit("ERROR: resource_cta is missing or disabled — nothing to set status on.")
        rc["status"] = args.status
        if args.flow_id:
            rc["manychat_flow_id"] = args.flow_id
        return S
    out = maestro_state.update_at(args.state, _mut)
    print(json.dumps(out["resource_cta"], indent=2, ensure_ascii=False))
    extra = f" + manychat_flow_id='{args.flow_id}'" if args.flow_id else ""
    print(f"status set to '{args.status}'{extra} in {args.state}", file=sys.stderr)
    return 0


def cmd_show(args):
    state = _load(args.state, {})
    print(json.dumps(state.get("resource_cta", {"(none)": True}), indent=2, ensure_ascii=False))
    return 0


def main():
    # --state/--ledger on a shared parent so they work BOTH before and after the subcommand.
    # SUPPRESS default => an absent flag never overwrites a value given in the other position.
    common = argparse.ArgumentParser(add_help=False)
    common.add_argument("--state", default=argparse.SUPPRESS, help="pipeline-state.json path (temp = dry-run)")
    common.add_argument("--ledger", default=argparse.SUPPRESS, help="keyword-ledger.json path (temp = dry-run)")

    ap = argparse.ArgumentParser(description="Deterministically write resource_cta + reserve keyword.", parents=[common])
    sub = ap.add_subparsers(dest="mode", required=True)

    e = sub.add_parser("enable", parents=[common])
    e.add_argument("--name", required=True)
    e.add_argument("--kind", required=True, help=f"one of {KINDS}")
    e.add_argument("--keyword", required=True,
                   help="natural caption spelling (accents OK: GRÁTIS, VÍDEO); folded to an ASCII primary + all variants registered")
    e.add_argument("--link", default="")
    e.add_argument("--video", default="")
    e.add_argument("--blurb", default="", help="PT-BR 'what it does' (Y) for the keyword-specific DM message")
    e.add_argument("--dm-message", dest="dm_message", default="", help="override the composed link-DM message verbatim")
    e.add_argument("--opening-name", dest="opening_name", default="",
                   help="agent-authored phrase that names the resource in the OPENING DM ('Já separei o ___ pra você'); written from the script + resource purpose; defaults to --name")
    e.add_argument("--opening-dm", dest="opening_dm", default="", help="override the composed opening-DM message verbatim")
    e.add_argument("--follow-gate", dest="follow_gate", default="true", choices=["true", "false"],
                   help="require the commenter to FOLLOW before the link is released (default true)")
    e.add_argument("--mode", default="create", choices=["create", "modify"],
                   help="create = one live automation per keyword (concurrent, DEFAULT); modify = the single permanent flow")
    e.set_defaults(fn=cmd_enable)

    d = sub.add_parser("disable", parents=[common]); d.set_defaults(fn=cmd_disable)

    sl = sub.add_parser("set-link", parents=[common])
    sl.add_argument("--link", required=True)
    sl.add_argument("--source", required=True, choices=["capture-references", "owner", "re-derived"])
    sl.set_defaults(fn=cmd_set_link)

    ck = sub.add_parser("check-keyword", parents=[common])
    ck.add_argument("--keyword", required=True)
    ck.set_defaults(fn=cmd_check_keyword)

    ss = sub.add_parser("set-status", parents=[common])
    ss.add_argument("--status", required=True, choices=["pending", "live", "manual", "skipped", "failed"])
    ss.add_argument("--flow-id", dest="flow_id", default="",
                    help="the NEW dedicated ManyChat flow id minted in MODE=create (overwrites manychat_flow_id)")
    ss.set_defaults(fn=cmd_set_status)

    sh = sub.add_parser("show", parents=[common]); sh.set_defaults(fn=cmd_show)

    args = ap.parse_args()
    args.state = getattr(args, "state", None) or DEFAULT_STATE
    global LEDGER
    LEDGER = getattr(args, "ledger", None) or DEFAULT_LEDGER
    sys.exit(args.fn(args))


if __name__ == "__main__":
    main()
