#!/usr/bin/env python3
"""
restore_session.py — restore a saved social-platform browser session for re-use in a
new Playwright MCP session, WITHOUT a fresh login / 2FA.

Reads the saved Playwright storageState
captured after the user's last good login (.claude/auth/<platform>-storage-state.json) and
emits a CLEAN cookie array ready to inject via Playwright `page.context().addCookies(...)`
inside a `browser_run_code` call.

Platforms: youtube | tiktok | instagram

Usage:
  python3 browser-post-pipeline/restore_session.py youtube            # cookies JSON to stdout
  python3 browser-post-pipeline/restore_session.py tiktok --snippet   # full browser_run_code JS
  python3 browser-post-pipeline/restore_session.py instagram --check  # status only (exit 0 ok / 3 thin / 2 missing)

The `post-browser-manual` skill calls this FIRST per platform. If the auth cookies are present
and unexpired, restoring them re-establishes the session with NO login. If missing/expired →
the skill falls back to a fresh user-assisted login, then re-saves the session.
"""
import argparse, json, os, sys, time

AUTH_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".claude", "auth")

# Per-platform: which cookie domains belong to the session, and which cookie names are the
# "is this still logged in" auth markers (used for the freshness check / --check exit code).
#
# live_url / dead_marker drive the AUTHORITATIVE in-browser liveness gate (the `--liveness` helper).
# Cookie presence (what --check tests) is NOT proof the session is valid SERVER-SIDE: the platform
# can invalidate the session while the cookies sit unexpired on disk (YouTube/Google does this
# routinely — incident: --check green for ~390d yet studio.youtube.com redirected to the
# Google sign-in chooser). A cookie-only HTTP probe is ALSO unreliable (Google returns
# "LOGGED_IN":false to non-browser requests even when the browser session is fine → false negatives).
# So the real check MUST run in the live Playwright browser: navigate to live_url and if the resulting
# page.url() contains dead_marker, the session is dead → re-login / fire post-pipeline/alert.py + fallback.
PLATFORMS = {
    "youtube":   {"domains": ("youtube.com", "google.com", ".google.com"),
                  "auth": ("SID", "SSID", "HSID", "SAPISID", "__Secure-1PSID", "LOGIN_INFO"),
                  "live_url": "https://studio.youtube.com/", "dead_marker": "accounts.google.com"},
    "tiktok":    {"domains": ("tiktok.com",),
                  "auth": ("sessionid", "sessionid_ss", "sid_tt", "uid_tt"),
                  "live_url": "https://www.tiktok.com/tiktokstudio/content", "dead_marker": "/login"},
    "instagram": {"domains": ("instagram.com",),
                  "auth": ("sessionid", "ds_user_id", "csrftoken"),
                  "live_url": "https://www.instagram.com/accounts/edit/", "dead_marker": "/accounts/login"},
}

# Fields Playwright addCookies accepts (drop partitionKey / _crHasCrossSiteAncestor etc.)
KEEP = ("name", "value", "domain", "path", "expires", "httpOnly", "secure", "sameSite")
VALID_SS = {"Strict", "Lax", "None"}


def state_path(platform):
    return os.path.join(AUTH_DIR, f"{platform}-storage-state.json")


def load_cookies(platform):
    path = state_path(platform)
    if not os.path.exists(path):
        return None
    d = json.load(open(path, encoding="utf-8"))
    domains = PLATFORMS[platform]["domains"]
    now = time.time()
    out = []
    for c in d.get("cookies", []):
        dom = c.get("domain") or ""
        if not any(x in dom for x in domains):
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
    p.add_argument("platform", choices=sorted(PLATFORMS.keys()))
    p.add_argument("--snippet", action="store_true", help="emit full browser_run_code JS")
    p.add_argument("--check", action="store_true",
                   help="cookie-PRESENCE status only (exit 0 present / 3 thin / 2 none). "
                        "NOT a server-side liveness check — confirm with --liveness in-browser.")
    p.add_argument("--liveness", action="store_true",
                   help="emit JSON {live_url, dead_marker} for the AUTHORITATIVE in-browser gate: "
                        "navigate live_url, if page.url() contains dead_marker the session is DEAD.")
    args = p.parse_args()

    if args.liveness:
        cfg = PLATFORMS[args.platform]
        print(json.dumps({"platform": args.platform,
                          "live_url": cfg["live_url"], "dead_marker": cfg["dead_marker"]}))
        return 0

    cookies = load_cookies(args.platform)
    if cookies is None:
        print(f"[{args.platform}] NO saved session at {state_path(args.platform)} → user-assisted login required.",
              file=sys.stderr)
        return 2
    if not cookies:
        print(f"[{args.platform}] saved session has 0 live cookies (all expired) → fresh login required.",
              file=sys.stderr)
        return 2

    names = {c["name"] for c in cookies}
    auth_markers = PLATFORMS[args.platform]["auth"]
    have = [a for a in auth_markers if a in names]
    auth = [c for c in cookies if c["name"] in auth_markers]
    exps = [c["expires"] for c in auth if isinstance(c.get("expires"), (int, float)) and c["expires"] > 0]
    soonest = min(exps) if exps else None
    days = round((soonest - time.time()) / 86400, 1) if soonest else None

    print(f"[{args.platform}] {len(cookies)} cookies | auth markers present: {have or 'NONE'} | "
          f"soonest auth expiry ~{days}d", file=sys.stderr)

    if args.check:
        print(f"[{args.platform}] NOTE: --check is cookie-presence only; it does NOT prove the "
              f"session is valid server-side. Confirm with the in-browser --liveness gate before "
              f"trusting browser posting.", file=sys.stderr)
        return 0 if have else 3

    if args.snippet:
        dom = PLATFORMS[args.platform]["domains"][0]
        js = ("async (page) => { await page.context().addCookies(" + json.dumps(cookies) +
              "); return 'restored ' + (await page.context().cookies()).filter(c=>(c.domain||'')"
              f".includes('{dom}')).length + ' {args.platform} cookies'; " + "}")
        print(js)
    else:
        print(json.dumps(cookies))
    return 0


if __name__ == "__main__":
    sys.exit(main())
