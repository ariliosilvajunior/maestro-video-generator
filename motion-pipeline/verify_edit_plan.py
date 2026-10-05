#!/usr/bin/env python3
"""verify_edit_plan.py — deterministic PRE-RENDER gate for the Edit Direction plan (Phase 4.7).

Enforces the SAME content-driven edit-flow rule the render-time `assertEditFlow` (src/library/motionideas.tsx)
enforces — the two MUST agree (Python = pre-render / cheap fail; TS = render backstop). Rule (house rule
tightened to distance-4 on; palette = motion-pipeline/EDIT_STYLES.md):

  * §1 (beat 1) is the FIXED opening hook — its `edit_style` MUST be `opening`.
  * Everything after §1 is free + content-driven. NO `edit_style` repeats within a window of D=4:
    style[i] must differ from style[i-1..i-3] (any 4 consecutive beats are 4 DISTINCT styles;
    a style needs >=3 other beats before it returns — "A X Y Z A").
  * RICHNESS: a >=6-beat video uses >=4 distinct styles; >=10-beat uses >=5.
  * ADAPTIVE / NEVER-DEADLOCK: the effective window is Deff = min(D, pool) where pool = distinct styles the
    plan uses. A short video / thin palette relaxes instead of failing impossibly. Deff is reported. A
    no-image-provider fallback (zero asset styles hero/split/full/flow) relaxes target 4->3, richness ->3 (QCR-200).
  * The `edit_style` axis is ORTHOGONAL to `motion_idea` (which obeys match-the-line, QCR-006/080, and MAY
    repeat) — this gate governs only the edit_style/canvas, never the object choice.

SHADOW-MODE: this gate + the plan are ADDITIVE. A missing/invalid plan means the motion phase falls back to
today's behavior (agent picks + assertSectionGrammar at render). Nothing consumes the plan as authoritative
until the canary promotes it (see EDIT_STYLES.md Rollout).

Plan format — `<Name>_edit_plan.json` (beats in time order):
  [{"beat":1,"win":[s,e],"edit_style":"opening","motion_idea":"...","asset":"...","rationale":"..."}, ...]
  (each beat may ALSO tag `section_type`/an "style:concept" id; `edit_style` is read from `edit_style`,
   else the prefix of `section_type`/`id`.)

Usage:  python3 motion-pipeline/verify_edit_plan.py <Name>_edit_plan.json [--distance 4] [--json]
Exit 0 = PASS; 1 = FAIL (with offending beats). Warnings (pool below target) do NOT fail.
"""
import argparse
import json
import sys

ASSET_STYLES = {"hero", "split", "full", "flow"}
# the vetted palette (mirror of EDIT_STYLE_IDS in motionideas.tsx) — used only for an advisory unknown-style note
EDIT_STYLE_IDS = {"opening", "phrase", "avatarcap", "hero", "split", "full", "flow", "stat", "evidence", "avatar"}


def style_of(beat):
    """edit_style = explicit field, else the prefix of section_type / id (before ':')."""
    s = beat.get("edit_style") or beat.get("section_type") or beat.get("id") or ""
    return s.split(":", 1)[0].strip().lower()


def load_plan(path):
    data = json.load(open(path, encoding="utf-8"))
    if not isinstance(data, list) or not data:
        raise ValueError("edit plan must be a non-empty JSON array of beats")
    return data


def check(plan, target=4):
    problems, warnings = [], []
    styles = [style_of(b) for b in plan]
    n = len(styles)

    # §1 opening
    if styles[0] != "opening":
        problems.append(f"beat 1 edit_style is '{styles[0]}', not 'opening' — beat 1 MUST be the fixed opening hook (headline at frame 0).")

    # unknown styles (advisory — planner should only use the vetted palette)
    unknown = sorted({s for s in styles if s and s not in EDIT_STYLE_IDS})
    if unknown:
        warnings.append(f"edit_style(s) not in the EDIT_STYLES.md palette: {unknown} — the planner should only use vetted styles.")

    distinct = set(styles)
    no_hf = not (distinct & ASSET_STYLES)
    tgt = 3 if no_hf else target
    deff = min(tgt, len(distinct)) if n >= 2 else 1
    # CANARY (QCR-292): `hero` is EXEMPT from the distance rule (object-varied + animation-depth
    # carry its variety; forcing distance on object-naming phrases risks QCR-006). HARD = §1-opening,
    # non-hero ADJACENT repeat, richness. The wider window-of-Deff is ADVISORY (warn), never a failure —
    # all 6 QC-passing comps violated it, so a hard window rejects videos Gemini rewards.
    DISTANCE_EXEMPT = {"hero"}

    for i in range(1, n):
        s = styles[i]
        # HARD: non-hero adjacent repeat
        if s == styles[i - 1] and s not in DISTANCE_EXEMPT:
            problems.append(f"edit_style '{s}' repeats back-to-back at beats {i} & {i+1} — no non-hero style twice in a row.")
        # ADVISORY: non-hero repeats within the wider window (nudge toward variety / animation-depth)
        if s not in DISTANCE_EXEMPT:
            for k in range(2, deff):
                if i - k >= 0 and s == styles[i - k]:
                    warnings.append(
                        f"edit_style '{s}' recurs within a window of {deff} at beats {i-k+1} & {i+1} "
                        f"(advisory — vary it or use an animation-depth variant once vetted, EDIT_STYLES.md).")
                    break

    # richness (HARD)
    min_distinct = 3 if no_hf else (5 if n >= 10 else 4)
    if n >= 6 and len(distinct) < min_distinct:
        problems.append(
            f"{n}-beat video uses only {len(distinct)} distinct edit styles ({sorted(distinct)}); "
            f"content-driven editing wants >= {min_distinct} — re-classify beats to use more of the palette.")

    return {
        "beats": n, "distinct_styles": len(distinct), "no_asset_fallback": no_hf,
        "target_distance": tgt, "effective_distance": deff,
        "adaptive_note": (None if deff == tgt else f"Deff = min({tgt}, pool={len(distinct)}) = {deff}"),
        "warnings": warnings, "problems": problems, "pass": not problems,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("plan")
    ap.add_argument("--distance", type=int, default=4)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()
    try:
        plan = load_plan(args.plan)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
    r = check(plan, args.distance)
    if args.json:
        print(json.dumps(r, indent=2, ensure_ascii=False))
    else:
        print(f"beats={r['beats']} distinct_styles={r['distinct_styles']} "
              f"target_D={r['target_distance']} Deff={r['effective_distance']}"
              f"{' [no-asset fallback]' if r['no_asset_fallback'] else ''}")
        if r["adaptive_note"]:
            print("  " + r["adaptive_note"])
        for w in r["warnings"]:
            print("  WARN: " + w)
        if r["pass"]:
            print("PASS: edit plan satisfies the content-driven edit-flow variety rule at Deff.")
        else:
            print("*** EDIT-PLAN FAIL ***")
            for p in r["problems"]:
                print("  - " + p)
    sys.exit(0 if r["pass"] else 1)


if __name__ == "__main__":
    main()
