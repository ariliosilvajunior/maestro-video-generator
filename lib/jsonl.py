"""Tolerant JSONL reader — extracted from next_videos.py `_read_entries`."""
import json
import os


def read_jsonl(path):
    """Read a JSONL file into a list of dicts (skips blank/corrupt lines, never raises)."""
    if not os.path.exists(path):
        return []
    out = []
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue  # tolerate a hand-edited/garbled line rather than crashing the pipeline
    return out
