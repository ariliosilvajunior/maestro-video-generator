---
name: qc-gate-gemini
description: Phase 10 of the Maestro Video Generator pipeline — the OPTIONAL Gemini QC gate. Off by default (`config.qc.enabled=false`) it is a no-op pass-through that ffprobe-checks the finished video, stamps qc_grade="DISABLED" and advances to Phase 11. When enabled it grades `<Name>_music.mp4` with Gemini (threshold `config.qc.threshold`, default 75; up to `config.qc.max_iterations` reads, default 3) exactly as qc-pipeline/QC_INSTRUCTIONS.md Steps 5.1–5.6, and STOPS to report when the video never reaches the threshold. Triggers — "run QC", "quality check", "grade this video", "analyze this video".
---

# Skill: qc-gate-gemini (Phase 10 — OPTIONAL Gemini QC gate)

> Precondition: `config/config.json` has `setup.completed: true` (run `/setup` otherwise).

Phase 10 sits between Phase 9 (Sound Design → `<downloads>/<Name>_music.mp4`) and Phase 11
(`manage-comment-dm` → mark-ready). It never posts anything. Whether it grades at all is decided by
`config.qc.enabled`:

| `config.qc.enabled` | What Phase 10 does |
|---|---|
| `false` (default) | **No-op pass-through** — deterministic ffprobe sanity check, stamp `qc_grade="DISABLED"`, advance to Phase 11. No Gemini call. |
| `true` | **Graded loop** — Steps 5.1–5.6 of `qc-pipeline/QC_INSTRUCTIONS.md` with `config.qc.threshold` (default `75`) and `config.qc.max_iterations` (default `3`). |

The deterministic gates that run BEFORE this phase (subtitle validators, `verify_caption_sync.py`,
`verify_srt_timing.py`, the QCR-180 audio↔subtitle match) are not part of this switch — they always run
in Phases 5/8 and a failure there is a build defect, not a quality score.

## STEP 0 — read the switch

```bash
export MAESTRO_RUN=<Name>
QC_ENABLED="$(python3 lib/config.py get qc.enabled)"          # prints true / false
QC_THRESHOLD="$(python3 lib/config.py get qc.threshold)"      # default 75
QC_MAX_ITER="$(python3 lib/config.py get qc.max_iterations)"  # default 3
```

## BRANCH A — `qc.enabled` is `false` → no-op pass-through

```bash
# INPUT (already produced by Phase 9 add-music): <downloads>/<Name>_music.mp4
# 1) sanity: confirm the finished video actually exists + is a real h264 1080x1920 file
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,codec_name \
  -of csv=p=0 <downloads>/${MAESTRO_RUN}_music.mp4   # expect: h264,1080,1920

# 2) stamp state and advance to Phase 11 (NO Gemini call)
python3 maestro_state.py set --field qc_grade="DISABLED"
python3 maestro_state.py phase --num 10 --name qc-gate-gemini --status skipped \
  --output "QC disabled in config" --resume-next 11
```

- If the `ffprobe` check fails (missing file / not 1080x1920 / not h264), that is a **build defect**, not a
  quality score — fix the upstream phase (sound/subtitles/motion) and re-run it. This deterministic file
  check stays even with QC off.
- Then proceed directly to **Phase 11 (`manage-comment-dm`)** → mark-ready.

## BRANCH B — `qc.enabled` is `true` → graded Gemini loop

Run the graded loop **exactly as `qc-pipeline/QC_INSTRUCTIONS.md` Steps 5.1–5.6**, with the configured
threshold and iteration cap. Summary of the contract (the instructions file is canonical — read it):

1. **Step 5.1 — read the rules first:** `qc-pipeline/QCR_INDEX.md` (compact index) → open the `qc`-tagged
   entries in `qc-pipeline/active-rules.md`. They are applied proactively in Phases 5/8; here they tell
   you which grader findings are the documented hallucination families and which are real.
2. **Step 0 gate (QCR-180, deterministic, before any grade):**
   `python3 subtitle-pipeline/verify_audio_subtitle_match.py <downloads>/${MAESTRO_RUN}_music.mp4 --subs <downloads>/${MAESTRO_RUN}.srt`
   — exit 1 = the embedded narration is not this run's script → build defect, STOP, do not grade.
3. **Step 5.2/5.3 — key + upload:** resolve the key with
   `GEMINI_KEY="$(python3 -c 'import sys; sys.path.insert(0,"."); from lib.api_keys import resolve_key; print(resolve_key("gemini"))')"`
   (env `GEMINI_API_KEY` or `.claude/keys.md` `## Gemini`; never grep the key by pattern). Upload
   `<downloads>/${MAESTRO_RUN}_music.mp4` to the Gemini File API and wait for `ACTIVE`. Reuse the previous
   `FILE_URI` when the mp4 is byte-identical (clean re-read after a ground-truth-only hardening).
4. **Step 5.3b — GROUND-TRUTH BUILDER (deterministic, PREFERRED):**
   ```bash
   python3 qc-pipeline/build_qc_ground_truth.py \
     --ass <downloads>/${MAESTRO_RUN}.ass --srt <downloads>/${MAESTRO_RUN}.srt \
     --segments <downloads>/${MAESTRO_RUN}_caption_segments.json \
     --caption-windows <downloads>/${MAESTRO_RUN}_caption_windows.json \   # MANDATORY when it exists (QCR-315/322)
     --plan <downloads>/${MAESTRO_RUN}_visual_plan.json \
     --motion-list <scratch>/${MAESTRO_RUN}_motion_list.json \             # read off the FINAL .tsx (never the plan's prose — QCR-NOTE-14/308)
     --tsx motion-pipeline/remotion-agent/src/compositions/<CompId>.tsx \ # MANDATORY when the comp exists (QCR-328)
     --name ${MAESTRO_RUN}
   # → <scratch>/${MAESTRO_RUN}_qc_ground_truth.txt = the AUTHORITATIVE TEXT LAYERS part
   ```
   It emits the subtitle rows with `[YELLOW: …]`, the mechanical zero-wrap assertion (QCR-272), the
   caption-suppression windows with verbatim text + `[SUB:SUPPRESSED]` (QCR-193/315), the motion list with
   pre-computed max-consecutive-shared counts (QCR-072/280/316/319), the b-roll windows (QCR-034) and the
   standing SUBTITLE_TIMING bans (QCR-245/266/268/269/274/309/325/329). Review its WARNs (wrap violations,
   un-applied suppression windows, `REVIEW (4+` §4 labels) and fix them BEFORE grading. If the script
   errors, assemble the layers manually per the recipe in QC_INSTRUCTIONS.md Step 5.3b (a)–(d).
5. **Step 5.4 — analysis request:** three parts — the video, the ground-truth text part, the rubric
   (`qc-pipeline/qc_prompt_body.txt` + the QC Prompt Variables). Temperature `0.1`, `maxOutputTokens`
   `16384`, `thinkingBudget` `2048`. Parse the grade with the QCR-067/075 two-stage parser (strip `/100`,
   take the LAST number on the `GRADE:` line; fallback = last `N/100` token). A response with no
   parseable grade, an empty `parts[]` or a degenerate >~50KB table is DISCARDED and re-called — it does
   not count as an iteration (QCR-012/235).
6. **Step 5.5 — decide:**
   - grade **≥ `QC_THRESHOLD`** → PASS. `maestro_state.py set --field qc_grade=<grade>`, record the
     iteration count, save the report to `<downloads>/${MAESTRO_RUN}_qc_report.txt`, then
     `maestro_state.py phase --num 10 --name qc-gate-gemini --status done --output "QC PASS <grade>/100 iter <n>" --resume-next 11`.
   - grade **< `QC_THRESHOLD`** → FAIL: apply the cheapest correct lever — a clean re-read on the
     UNCHANGED file for the documented hallucination families (QCR-010/012/013), a targeted edit +
     re-render/re-burn/re-mix for real defects — run Step 5.6, and grade again. Each parseable grade
     counts as one iteration.
   - after **`QC_MAX_ITER`** parseable grades below the threshold → **STOP and report to the user**
     (grade history + the last full analysis). Leave the run `in_progress` at `resume_from=10` so it can be
     re-graded later. **Never post, never enqueue, never override or "adjust" the grade** (QCR-007).
7. **Step 5.6 — Self-Improve** after EVERY read (pass or fail): turn each real finding and each piece
   of pipeline friction into a permanent source fix + a `QCR-nnn` entry in `qc-pipeline/active-rules.md`
   (and its one-liner in `QCR_INDEX.md`). Harden the machinery, never the verdict.

Then proceed to **Phase 11 (`manage-comment-dm`)** → mark-ready — only on a PASS.

## HARD RULES (when enabled)
- Gemini's grade is FINAL (QCR-007): no "effective grade", no dismissing findings as phantom without
  the documented clean-re-read path, no posting below the threshold without explicit user approval.
- The ground truth is built from the run's real artifacts (`.ass`, `.srt`, `caption_segments.json`,
  `caption_windows.json`, the rendered `.tsx`) — never from memory, never reused from another run
  (QCR-195/242: a stale rubric/ground-truth file from a previous run pollutes the grade).
- A Gemini `429`: a per-minute cap clears with a 20–60s backoff; a daily/monthly cap does not — leave the
  run resumable at `resume_from=10` with `_music.mp4` intact and re-run QC when the key has quota. Never
  substitute another grading path.
- Large uploads / encodes run as background tasks, not foreground shell calls (QCR-014).
