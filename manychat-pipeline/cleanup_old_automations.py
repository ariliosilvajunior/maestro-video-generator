#!/usr/bin/env python3
"""
cleanup_old_automations.py — bound the per-post ManyChat clutter.

One comment-DM automation is created per video/keyword (the confirmed standard — see
SINGLE_AUTOMATION_FINDINGS.md). Over time the live list grows unbounded, so old automations
(whose comment surge is long over) should be Stopped/Trashed. This tool computes WHICH keywords
are over-age from `keyword-ledger.json` and prints a cleanup PLAN + the exact, confirmed clickpath
to execute it in the ManyChat UI.

Why plan-only (no autonomous trashing):
  - The pipeline drives ManyChat via Playwright **MCP** (agent-controlled), not standalone Python
    Playwright (not installed here). The agent executes the trash step under confirmation.
  - The account may hold unrelated, important automations. An autonomous trasher that
    misidentifies a row is irreversible-adjacent. Trashing stays a confirmed step.
  - ManyChat trash is recoverable, but we still don't delete blind.

Usage:
  python3 manychat-pipeline/cleanup_old_automations.py                 # dry-run, threshold 30d
  python3 manychat-pipeline/cleanup_old_automations.py --days 45
  python3 manychat-pipeline/cleanup_old_automations.py --today   # pin "now" (tests)
  python3 manychat-pipeline/cleanup_old_automations.py --json          # machine-readable plan

Exit code: 0 always (it's an audit). The keyword list it prints is what the agent then trashes via
the MCP browser using the clickpath below.
"""
import argparse, datetime, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from lib import config as _cfg  # noqa: E402
_ACC = _cfg.get("manychat.account_id", "<ACCOUNT_ID>")
_IG = _cfg.get("manychat.instagram_handle", "<handle>")
LEDGER = os.path.join(HERE, "keyword-ledger.json")
# Keywords that are reference/test artifacts, never real video CTAs — always candidates to remove.
TEST_KEYWORDS = {"TESTE", "TESTEDM", "TEST"}

CLICKPATH = f"""\
Execute the plan in the ManyChat UI (account {_ACC}, IG @{_IG}):
  1. restore_session.py --check  (exit 0). If not, ask the user to re-login.
  2. Open the Automations list: app.manychat.com/{_ACC}/cms?path=/&field=modified&order=desc
  3. For each keyword in the plan, find its "Auto-DM links from comments" row (the row text ends
     with 'comment contains <KEYWORD>') and tick its 'Select flow' checkbox. Verify count.
  4. Click 'Bulk Actions' -> 'Delete' -> confirm 'Delete'. (Recoverable from Trash.)
  5. Mark the keyword's ledger history entry with {{"status":"trashed","trashed":"<date>"}} — via a
     helper, never hand-edit. The keyword STAYS in used_keywords (never reuse a retired keyword).
NOTE: trashing only removes the automation; the keyword remains reserved so it can't be reused."""


def _load_ledger():
    if not os.path.exists(LEDGER):
        sys.exit(f"ERROR: ledger not found: {LEDGER}")
    with open(LEDGER, encoding="utf-8") as f:
        return json.load(f)


def _parse(d):
    try:
        return datetime.date.fromisoformat(d)
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser(description="Plan cleanup of old comment-DM automations.")
    ap.add_argument("--days", type=int, default=30, help="age threshold in days (default 30)")
    ap.add_argument("--today", default="", help="override 'now' as YYYY-MM-DD (for tests)")
    ap.add_argument("--json", action="store_true", help="emit machine-readable JSON plan")
    ap.add_argument("--include-tests", action="store_true",
                    help="also flag TEST_KEYWORDS regardless of age (default: they're always flagged)")
    args = ap.parse_args()

    today = _parse(args.today) if args.today else datetime.date.today()
    if today is None:
        sys.exit(f"ERROR: --today must be YYYY-MM-DD, got {args.today!r}")

    led = _load_ledger()
    # latest history entry per keyword (history can hold dupes); fall back to no-date.
    latest = {}
    for h in led.get("history", []):
        kw = (h.get("keyword") or "").strip().upper()
        if not kw:
            continue
        d = _parse(h.get("date", "")) or datetime.date.min
        if kw not in latest or d >= latest[kw]["date"]:
            latest[kw] = {"date": d, "link": h.get("link", ""), "video": h.get("video", "")}

    plan = []
    for kw, info in sorted(latest.items()):
        age = (today - info["date"]).days if info["date"] != datetime.date.min else None
        is_test = kw in TEST_KEYWORDS
        over_age = age is not None and age >= args.days
        if over_age or is_test:
            plan.append({
                "keyword": kw,
                "date": info["date"].isoformat() if info["date"] != datetime.date.min else "unknown",
                "age_days": age,
                "reason": "test/reference" if is_test else f">= {args.days}d old",
                "link": info["link"], "video": info["video"],
            })

    if args.json:
        print(json.dumps({"threshold_days": args.days, "today": today.isoformat(),
                          "to_trash": plan}, indent=2, ensure_ascii=False))
        return 0

    print(f"== ManyChat per-post cleanup plan ==  (today={today}, threshold={args.days}d)")
    if not plan:
        print("Nothing to clean — no comment-DM keywords are over-age or test artifacts. ✅")
        return 0
    print(f"{len(plan)} automation(s) to TRASH (recoverable from ManyChat trash):\n")
    print(f"  {'KEYWORD':<12} {'DATE':<11} {'AGE':>5}  REASON           LINK")
    for p in plan:
        age = f"{p['age_days']}d" if p["age_days"] is not None else "  ?"
        print(f"  {p['keyword']:<12} {p['date']:<11} {age:>5}  {p['reason']:<15}  {p['link']}")
    print("\n" + CLICKPATH)
    return 0


if __name__ == "__main__":
    sys.exit(main())
