#!/usr/bin/env python3
"""Compute the next SAFE posting slot for the Maestro Video Generator pipeline (Phase 11).

WHY: when several pipeline runs finish close together (e.g. you saw 3 Instagram
references and fired the pipeline 3 times back-to-back), the old `now+5min`
scheduling stacked every video on top of the previous one, so they all went live
within minutes of each other. This script instead queries Metricool for ALL
future-scheduled posts on the brand and returns a datetime that is at least
`--gap-hours` (default 2h) AFTER the latest already-scheduled future post — so
repeated runs space out across the day in healthy intervals automatically.

Used by the Metricool fallback path of `post-and-log` (only when config posting.metricool.enabled).

RULE the slot obeys:
  - If there ARE future scheduled posts: slot = latest_future_post + gap_hours.
  - If there are NONE:                   slot = now + lead_minutes (default 5).
  - The slot is never earlier than now + lead_minutes.
  The gap is enforced BETWEEN videos.

OUTPUT: prints the chosen slot as `YYYY-MM-DDTHH:MM:SS` (brand timezone, naive)
to STDOUT — capture it directly into SCHEDULE_TIME. A human-readable summary of
what was found and why goes to STDERR.

FAIL-SAFE: if the Metricool query fails for any reason, it falls back to
now + lead_minutes and warns on STDERR — a query hiccup must never block a post.

The timezone comes from config.json (posting.metricool.timezone, default America/Sao_Paulo).
"""
import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lib import config as _cfg  # noqa: E402


def _tz():
    name = _cfg.get("posting.metricool.timezone", "America/Sao_Paulo")
    try:
        from zoneinfo import ZoneInfo
        return ZoneInfo(name)
    except Exception:  # noqa: BLE001 — fixed UTC-3 fallback (Brazil has no DST since 2019)
        return timezone(timedelta(hours=-3))


SAO_PAULO = _tz()  # the brand's timezone (config posting.metricool.timezone)
API = "https://app.metricool.com/api/v2/scheduler/posts"


def fetch_future_posts(auth, blog_id, user_id, now_sp, horizon_days):
    """Return the raw scheduler-post list for [today .. today+horizon] in SP tz."""
    start = now_sp.strftime("%Y-%m-%dT00:00:00")
    end = (now_sp + timedelta(days=horizon_days)).strftime("%Y-%m-%dT23:59:59")
    qs = urllib.parse.urlencode(
        {"blogId": blog_id, "userId": user_id, "start": start, "end": end}
    )
    req = urllib.request.Request(f"{API}?{qs}", headers={"X-Mc-Auth": auth})
    with urllib.request.urlopen(req, timeout=30) as r:
        d = json.load(r)
    items = d.get("data", d) if isinstance(d, dict) else d
    return items if isinstance(items, list) else []


def latest_future_dt(posts, now_sp):
    """Latest publicationDate strictly in the future (drafts ignored), + count."""
    latest, count = None, 0
    for p in posts:
        pd = p.get("publicationDate") or {}
        dt = pd.get("dateTime") if isinstance(pd, dict) else pd
        if not dt:
            continue
        try:
            t = datetime.strptime(dt[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=SAO_PAULO)
        except ValueError:
            continue
        if t <= now_sp:          # already published / in the past — doesn't occupy a slot
            continue
        if p.get("draft") is True:  # drafts aren't going live, don't reserve a slot
            continue
        count += 1
        if latest is None or t > latest:
            latest = t
    return latest, count


def main():
    ap = argparse.ArgumentParser(description="Compute next spaced posting slot (Metricool).")
    ap.add_argument("--auth", required=True, help="Metricool X-Mc-Auth token")
    ap.add_argument("--blog-id", default=_cfg.get("posting.metricool.blog_id", ""), help="Metricool blogId (default: config posting.metricool.blog_id)")
    ap.add_argument("--user-id", default=_cfg.get("posting.metricool.user_id", ""), help="Metricool userId (default: config posting.metricool.user_id)")
    ap.add_argument("--gap-hours", type=float, default=float(_cfg.get("posting.metricool.gap_hours", 2)), help="Min gap after the latest future post (default 2)")
    ap.add_argument("--lead-minutes", type=int, default=5, help="Min lead from now when the queue is empty (default 5)")
    ap.add_argument("--horizon-days", type=int, default=30, help="How far ahead to scan for scheduled posts")
    args = ap.parse_args()

    if not args.blog_id or not args.user_id:
        print("WARN: Metricool blog_id/user_id not configured (config posting.metricool.*); falling back to now+lead", file=sys.stderr)
        print((datetime.now(timezone.utc).astimezone(SAO_PAULO) + timedelta(minutes=args.lead_minutes)).strftime("%Y-%m-%dT%H:%M:%S"))
        return
    now_sp = datetime.now(timezone.utc).astimezone(SAO_PAULO)
    floor = now_sp + timedelta(minutes=args.lead_minutes)

    try:
        posts = fetch_future_posts(args.auth, args.blog_id, args.user_id, now_sp, args.horizon_days)
    except Exception as e:  # noqa: BLE001 — any failure must fall back, never block
        print(f"WARN: could not query Metricool ({e}); falling back to now+{args.lead_minutes}min",
              file=sys.stderr)
        print(floor.strftime("%Y-%m-%dT%H:%M:%S"))
        return

    latest, count = latest_future_dt(posts, now_sp)
    if latest is None:
        chosen = floor
        print(f"No future scheduled posts on blogId {args.blog_id} -> scheduling at now+"
              f"{args.lead_minutes}min: {chosen:%Y-%m-%d %H:%M} ({_cfg.get('posting.metricool.timezone', 'America/Sao_Paulo')})", file=sys.stderr)
    else:
        chosen = max(latest + timedelta(hours=args.gap_hours), floor)
        print(f"{count} future post(s) on blogId {args.blog_id}; latest at {latest:%Y-%m-%d %H:%M}. "
              f"+{args.gap_hours}h gap -> scheduling at {chosen:%Y-%m-%d %H:%M} ({_cfg.get('posting.metricool.timezone', 'America/Sao_Paulo')})",
              file=sys.stderr)

    print(chosen.strftime("%Y-%m-%dT%H:%M:%S"))


if __name__ == "__main__":
    main()
