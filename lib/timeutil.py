"""Timestamp helper shared by the state/queue/creator managers."""
import datetime


def now_iso():
    # callers may pass an explicit --timestamp; default uses local wall clock
    return datetime.datetime.now().isoformat(timespec="seconds")
