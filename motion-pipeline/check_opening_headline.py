#!/usr/bin/env python3
"""
Opening-headline + silent-downgrade conformance gate  (QCR-181)

WHY THIS EXISTS
---------------
A posted reel once shipped with:
  • NO §1 clickbait headline in the first frame (the open was an EvidenceReveal
    screenshot card + a tiny kicker — frame 0 was blank during the scroll-in), and
  • the OLD hand-drawn style with ZERO generated image assets,
even though its creative brief correctly chose `premium-classic`.

Two root causes, both silent:
  1. The image provider was unavailable, so the run AUTO-
     downgraded premium-classic → hand-drawn-annotation. The fallback clause said
     "automatic, never blocks, just log it" — so nobody was told and an inferior
     video posted.
  2. The §1 opening section was tagged `evidence:` and used `EvidenceReveal` with no
     `PillHeadline`/`HeadlineHook`. `assertSectionGrammar` only checks type-variety,
     never that §1 carries a headline — so a headline-less open passed.

WHAT THIS GATE DOES (deterministic, source+state based — no fragile frame OCR)
------------------------------------------------------------------------------
A) HEADLINE PRESENCE (hard block, BOTH styles): the composition .tsx MUST RENDER at
   least one headline component — `<PillHeadline`, `<PremiumOpeningHook`, or
   `<HeadlineHook`. Importing one without rendering it (one run imported HeadlineHook
   but never used it) FAILS. Every compliant comp renders exactly one.
B) SILENT-DOWNGRADE (block UNLESS the user was alerted): if the run's brief chose
   `premium-classic` but the build is hand-drawn, the run state MUST carry both a
   `images_fallback` reason AND `images_alert_sent: true` (the user got an alert to fix
   the image provider). The fallback still proceeds — but it can
   never be SILENT again.

USAGE
-----
  python3 check_opening_headline.py --tsx motion-pipeline/remotion-agent/src/compositions/<Name>.tsx \
      [--state pipeline-runs/<Name>.json]

Exit 0 = PASS. Exit 1 = FAIL (prints what to fix). Run it in generate-motion-remotion
step 5 (conformance gate) and again pre-post in post-and-log.
"""

import argparse
import json
import os
import re
import sys

HEADLINE_COMPONENTS = ("PillHeadline", "PremiumOpeningHook", "HeadlineHook")


def fail(msg):
    print(f"FAIL {msg}")
    sys.exit(1)


def check_headline(tsx_path):
    with open(tsx_path, encoding="utf-8", errors="replace") as f:
        src = f.read()
    # A RENDERED component looks like `<PillHeadline ...` / `<HeadlineHook>` — not a bare
    # import. Match the JSX open tag specifically.
    rendered = [c for c in HEADLINE_COMPONENTS
                if re.search(r"<\s*" + re.escape(c) + r"[\s/>]", src)]
    if not rendered:
        imported = [c for c in HEADLINE_COMPONENTS if c in src]
        hint = (f" (it IMPORTS {imported} but never RENDERS it — a known defect)"
                if imported else "")
        fail("§1 OPENING HEADLINE MISSING: the composition renders none of "
             f"{HEADLINE_COMPONENTS}{hint}.\n"
             "  The §1 opening hook MUST show a clickbait headline at frame 0 in BOTH "
             "styles (premium: <PremiumOpeningHook .../> with a `headline=` pill; "
             "hand-drawn: <HeadlineHook lead=[...] accent=... /> or a <PillHeadline>). "
             "An EvidenceReveal/PremiumEvidence screenshot card with only a kicker is NOT "
             "a headline. Add the headline component to §1 and re-render. (QCR-181)")
    return rendered


def check_downgrade(state_path):
    try:
        with open(state_path, encoding="utf-8") as f:
            st = json.load(f)
    except OSError:
        print(f"[check] note: state file not found ({state_path}); skipping downgrade check")
        return
    motion_style = (st.get("motion_style") or "").lower()
    is_handdrawn = "hand" in motion_style  # hand-drawn / hand-drawn-annotation

    # premium intent comes from the creative brief
    style_id = ""
    brief_path = st.get("creative_brief")
    if brief_path and os.path.exists(brief_path):
        try:
            with open(brief_path, encoding="utf-8") as f:
                style_id = (json.load(f).get("style_id") or "").lower()
        except Exception:  # noqa
            pass

    if style_id == "premium-classic" and is_handdrawn:
        reason = st.get("images_fallback")
        alerted = st.get("images_alert_sent") is True
        if not reason:
            fail("SILENT DOWNGRADE: brief chose premium-classic but the build is "
                 f"hand-drawn ('{motion_style}') and state has NO `images_fallback` "
                 "reason. Record WHY premium could not run.")
        if not alerted:
            fail("SILENT DOWNGRADE: brief chose premium-classic but the build downgraded "
                 f"to hand-drawn ('{motion_style}') WITHOUT alerting the user.\n"
                 f"  Reason logged: {reason}\n"
                 "  Fire the alert so the image provider can be fixed, then stamp it:\n"
                 "    python3 post-pipeline/alert.py --platform images "
                 "--run <Name> --reason \"<the fallback reason>\"\n"
                 "    python3 maestro_state.py set --field images_alert_sent=true\n"
                 "  The fallback build still proceeds — it just may never be SILENT. (QCR-181)")
        print(f"[check] premium→hand-drawn downgrade is DECLARED + alerted (reason: {reason})")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--tsx", required=True, help="path to the composition .tsx")
    p.add_argument("--state", default=None, help="path to pipeline-runs/<Name>.json (optional)")
    args = p.parse_args()

    if not os.path.exists(args.tsx):
        fail(f"composition not found: {args.tsx}")

    rendered = check_headline(args.tsx)
    if args.state:
        check_downgrade(args.state)

    print(f"PASS opening headline present ({', '.join(rendered)})"
          + ("; style/downgrade conformant" if args.state else ""))
    sys.exit(0)


if __name__ == "__main__":
    main()
