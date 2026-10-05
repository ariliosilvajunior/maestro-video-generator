"""File-lock + atomic-write primitives shared by every state/queue/ledger writer.

Two runs of the pipeline can execute in parallel; every read-modify-write of a shared file
(run state, queues, keyword ledger, pipeline-log.csv, Root.tsx) goes through `flock()` and
lands on disk via temp-file + `os.replace` (atomic rename), so a crash mid-write can never
leave a half-written JSON behind.

Cross-platform: `fcntl.flock` on macOS/Linux, `msvcrt.locking` on Windows.
"""
import contextlib
import json
import os

try:
    import fcntl  # POSIX
except ImportError:  # Windows
    fcntl = None
    import msvcrt


@contextlib.contextmanager
def flock(target):
    """Exclusive advisory lock on a sidecar `<target>.lock` for the duration of the block."""
    d = os.path.dirname(target)
    if d:
        os.makedirs(d, exist_ok=True)
    lock = target + ".lock"
    f = open(lock, "a+")
    try:
        if fcntl is not None:
            fcntl.flock(f, fcntl.LOCK_EX)
        else:
            f.seek(0)
            while True:
                try:
                    msvcrt.locking(f.fileno(), msvcrt.LK_LOCK, 1)  # blocks up to ~10s, then retries
                    break
                except OSError:
                    continue
        yield
    finally:
        try:
            if fcntl is not None:
                fcntl.flock(f, fcntl.LOCK_UN)
            else:
                f.seek(0)
                msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
        finally:
            f.close()


def try_flock(target):
    """Non-blocking probe: True if the lock is FREE right now (used by `--status` displays)."""
    lock = target + ".lock"
    f = open(lock, "a+")
    try:
        if fcntl is not None:
            try:
                fcntl.flock(f, fcntl.LOCK_EX | fcntl.LOCK_NB)
                fcntl.flock(f, fcntl.LOCK_UN)
                return True
            except BlockingIOError:
                return False
        f.seek(0)
        try:
            msvcrt.locking(f.fileno(), msvcrt.LK_NBLCK, 1)
            msvcrt.locking(f.fileno(), msvcrt.LK_UNLCK, 1)
            return True
        except OSError:
            return False
    finally:
        f.close()


def atomic_write(path, data):
    """JSON-dict writer (indent=2, trailing newline), atomic."""
    d = os.path.dirname(path)
    if d:
        os.makedirs(d, exist_ok=True)
    tmp = f"{path}.tmp.{os.getpid()}"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def atomic_write_text(path, text):
    """Raw-text writer (JSONL callers serialize their own payload), atomic."""
    d = os.path.dirname(path)
    if d:
        os.makedirs(d, exist_ok=True)
    tmp = f"{path}.tmp.{os.getpid()}"
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(text)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)
