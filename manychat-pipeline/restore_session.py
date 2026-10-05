#!/usr/bin/env python3
"""
restore_session.py — restore the saved ManyChat browser session for re-use in a NEW
Playwright MCP session, WITHOUT a fresh login / 2FA.

Modeled on browser-post-pipeline/restore_session.py. Reads the saved Playwright storageState
captured after the user's last good ManyChat login
(.claude/auth/manychat-storage-state.json) and emits a CLEAN cookie array ready to inject
via Playwright `page.context().addCookies(...)` inside a `browser_run_code` call.

ACCOUNT: the ManyChat account + Instagram channel come from config.json (manychat.account_id /
manychat.instagram_handle). The ManyChat IG channel MUST equal the Instagram account the
pipeline posts Reels to, or comments are silently missed. The session lives ONLY in this
repo's .claude/auth/manychat-storage-state.json.

Usage:
  python3 manychat-pipeline/restore_session.py            # cookies JSON to stdout
  python3 manychat-pipeline/restore_session.py --snippet  # full browser_run_code JS to inject
  python3 manychat-pipeline/restore_session.py --check     # status only (exit 0 ok / 3 thin / 2 missing)

The `manage-comment-dm` skill calls this FIRST. If the auth cookies are present and unexpired,
restoring them re-establishes the ManyChat session with NO login. If missing/expired → STOP and
ask the user to re-login (Cloudflare/2FA can't be solved headlessly), then re-save the session.
"""
import argparse, json, os, sys, time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib import config as _cfg  # noqa: E402

AUTH_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "auth")
STATE_PATH = os.path.join(AUTH_DIR, "manychat-storage-state.json")

# ManyChat cookie domains, and the "is this still logged in" auth markers used by --check.
DOMAINS = ("manychat.com", "app.manychat.com", ".manychat.com", ".app.manychat.com")
AUTH_MARKERS = ("mc_production-main", "_mc_zd_dashboard_session")

# Fields Playwright addCookies accepts (drop partitionKey / _crHasCrossSiteAncestor etc.)
KEEP = ("name", "value", "domain", "path", "expires", "httpOnly", "secure", "sameSite")
VALID_SS = {"Strict", "Lax", "None"}


def load_cookies():
    if not os.path.exists(STATE_PATH):
        return None
    d = json.load(open(STATE_PATH, encoding="utf-8"))
    now = time.time()
    out = []
    for c in d.get("cookies", []):
        dom = c.get("domain") or ""
        if not any(x in dom for x in DOMAINS):
            continue
        exp = c.get("expires", -1)
        if isinstance(exp, (int, float)) and exp > 0 and exp < now:
            continue  # drop expired
        cc = {k: c[k] for k in KEEP if k in c}
        if cc.get("sameSite") not in VALID_SS:
            cc["sameSite"] = "Lax"
        out.append(cc)
    return out


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--snippet", action="store_true", help="emit full browser_run_code JS")
    p.add_argument("--check", action="store_true", help="status only; exit code signals freshness")
    args = p.parse_args()

    cookies = load_cookies()
    if cookies is None:
        print(f"[manychat] NO saved session at {STATE_PATH} → user-assisted login required.",
              file=sys.stderr)
        return 2
    if not cookies:
        print("[manychat] saved session has 0 live cookies (all expired) → fresh login required.",
              file=sys.stderr)
        return 2

    names = {c["name"] for c in cookies}
    have = [a for a in AUTH_MARKERS if a in names]
    auth = [c for c in cookies if c["name"] in AUTH_MARKERS]
    exps = [c["expires"] for c in auth if isinstance(c.get("expires"), (int, float)) and c["expires"] > 0]
    soonest = min(exps) if exps else None
    days = round((soonest - time.time()) / 86400, 1) if soonest else None

    print(f"[manychat] {len(cookies)} cookies | auth markers present: {have or 'NONE'} | "
          f"soonest auth expiry ~{days}d | account={_cfg.get('manychat.account_id', '?')} IG @{_cfg.get('manychat.instagram_handle', '?')}",
          file=sys.stderr)

    if args.check:
        return 0 if have else 3

    if args.snippet:
        js = ("async (page) => { await page.context().addCookies(" + json.dumps(cookies) +
              "); return 'restored ' + (await page.context().cookies()).filter(c=>(c.domain||'')"
              ".includes('manychat.com')).length + ' manychat cookies'; }")
        print(js)
    else:
        print(json.dumps(cookies))
    return 0


if __name__ == "__main__":
    sys.exit(main())
