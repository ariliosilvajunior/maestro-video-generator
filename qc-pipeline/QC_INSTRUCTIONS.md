# QC Gate — Gemini Video Analysis Pipeline

> **OPTIONAL PHASE.** This phase runs only when `config.qc.enabled` is `true` (default `false`; set it in
> `config/config.json` or with `python3 lib/config.py set qc.enabled true`). Pass threshold =
> `config.qc.threshold` (default `75`); iteration cap = `config.qc.max_iterations` (default `3`).
> When disabled, Phase 10 is a no-op pass-through (see `.claude/skills/qc-gate-gemini/SKILL.md`): it
> ffprobe-checks the finished file, stamps `qc_grade="DISABLED"` and advances to Phase 11. The
> deterministic gates (subtitle validators, caption-sync, SRT timing, audio↔subtitle match) run regardless.
> Placeholders: `<downloads>` = `paths.downloads` (default `~/Downloads`), `<scratch>` = `paths.tmp`.

## Overview

**This phase runs only when `config.qc.enabled` is true.**

The QC Gate is a **mandatory quality control checkpoint** that runs after `_music.mp4` is created (subtitles burned + background music added). It uses Google Gemini's video analysis API to review the video as an expert content head would — identifying every editing issue, grading the video, and driving iterative fixes until the video is publication-ready.

**This step runs AFTER Phase 9 (Sound Design) and BEFORE Phase 11 (Comment→DM → mark-ready). Posting never happens here.**

**Core loop:** Render → Analyze → Fix → Re-render → Re-analyze → repeat until PASS (grade ≥ `config.qc.threshold`) or `config.qc.max_iterations` reads.

---

## Prerequisites

| Item | Value |
|------|-------|
| **Gemini API Key** | resolved by `lib/api_keys.py` → `resolve_key("gemini")` (env `GEMINI_API_KEY`, else the `## Gemini` section of `.claude/keys.md` written by `/setup`) |
| **Model** | `gemini-2.5-flash` |
| **Max output tokens** | `16384` |
| **Temperature** | `0.1` (lowered from 0.4 on QCR-013 — reduces the 30-37pt read-to-read variance that tipped phantom-flag counts <75) |
| **Grade threshold** | `config.qc.threshold` (default `75`) — a grade ≥ threshold PASSES |
| **Max iterations** | `config.qc.max_iterations` (default `3`). Every iteration ALSO runs Step 5.6 (Self-Improve), so the loop both fixes THIS video and permanently hardens the pipeline. After `max_iterations` reads below the threshold, STOP and report to the user — never post. |
| **Credentials file** | `.claude/keys.md` (gitignored, created by `/setup`) — never grep it by key pattern; use `lib/api_keys.py` |

---

## Pipeline Steps

### Step 5.1: Read Lessons Learned (MANDATORY — BEFORE analysis)

Before every QC run, read the accumulated lessons file:

```
Read file: qc-pipeline/QCR_INDEX.md # índice compacto; abra as entradas qc-tagged completas em active-rules.md
```

This file contains every past Gemini finding and the permanent fix applied. **You MUST apply all rules from this file DURING Phase 3 (Motion) and Phase 4 (Subtitles)** — before the video even reaches QC. The goal is to pass on the first attempt.

### Step 5.2: Upload Video to Gemini File API

> **FILE-URI REUSE (speed): if this iteration's video file is UNCHANGED** (a clean re-read
> after a prompt/ground-truth-only hardening — the QCR-012/055/272 family), **SKIP the upload and REUSE
> the previous iteration's `FILE_URI`** (Gemini files stay ACTIVE ~48h; verify with a GET on `FILE_NAME`
> showing `state: ACTIVE`). Re-upload ONLY when the mp4 actually changed (re-render/re-burn/re-mix).
> Saves ~2–5 min + the full upload per phantom-storm re-read.

```bash
GEMINI_KEY="$(python3 -c 'import sys; sys.path.insert(0,"."); from lib.api_keys import resolve_key; print(resolve_key("gemini"))')"   # env GEMINI_API_KEY or .claude/keys.md ## Gemini — never grep the key by pattern
VIDEO_FILE=<downloads>/VideoName_music.mp4
FILE_SIZE=$(stat -f%z "$VIDEO_FILE")

# Start resumable upload
UPLOAD_URL=$(curl -s -X POST \
 "https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_KEY}" \
 -H "X-Goog-Upload-Protocol: resumable" \
 -H "X-Goog-Upload-Command: start" \
 -H "X-Goog-Upload-Header-Content-Length: ${FILE_SIZE}" \
 -H "X-Goog-Upload-Header-Content-Type: video/mp4" \
 -H "Content-Type: application/json" \
 -d '{"file": {"display_name": "QC_Analysis"}}' \
 -D - | grep -i "x-goog-upload-url:" | sed 's/x-goog-upload-url: //i' | tr -d '\r\n')

# Upload file
UPLOAD_RESULT=$(curl -s -X POST "$UPLOAD_URL" \
 -H "X-Goog-Upload-Offset: 0" \
 -H "X-Goog-Upload-Command: upload, finalize" \
 -H "Content-Length: ${FILE_SIZE}" \
 --data-binary "@${VIDEO_FILE}")

FILE_URI=$(echo "$UPLOAD_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['file']['uri'])")
FILE_NAME=$(echo "$UPLOAD_RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin)['file']['name'])")
echo "Uploaded: $FILE_URI"
```

**Timeout:** Use `timeout: 180000` (3 min) for the upload commands.

### Step 5.3: Wait for File Processing

```bash
for i in $(seq 1 30); do
 STATE=$(curl -s "https://generativelanguage.googleapis.com/v1beta/${FILE_NAME}?key=${GEMINI_KEY}" | \
 python3 -c "import sys,json; print(json.load(sys.stdin)['state'])")
 if [ "$STATE" = "ACTIVE" ]; then echo "Ready"; break; fi
 sleep 5
done
```

### Step 5.3b: Build the Authoritative Text Layers (MANDATORY — QCR-013)

> **PREFERRED: generate the whole ground-truth text part with the deterministic builder**
> — it encodes QCR-013/016/020/034/066/070/072/171/193/231/239/245/247/263/266/268/269/270/272/274/276/280
> in one pass (subtitle rows + [YELLOW], mechanical zero-wrap assert, caption-suppression windows with
> verbatim text + [SUB:SUPPRESSED] and an "applied?" check, motion list with pre-computed
> max-consecutive-shared, b-roll windows, standing timing tolerances):
> ```bash
> python3 qc-pipeline/build_qc_ground_truth.py \
> --ass <downloads>/<Name>.ass --srt <downloads>/<Name>.srt \
> --segments <downloads>/<Name>_caption_segments.json \
> --caption-windows <downloads>/<Name>_caption_windows.json \ # MANDATORY when it exists (QCR-315/322): picks up grouped/CTA §3b windows that _caption_segments.json omits
> --plan <downloads>/<Name>_visual_plan.json \
> --motion-list <scratch>/<Name>_motion_list.json \
> --tsx motion-pipeline/remotion-agent/src/compositions/<CompId>.tsx \ # MANDATORY when the composition exists (QCR-328): overrides §4 hero-label text with the REAL on-screen labels so a hand-built motion-list carrying the visual_plan's PROSE can't fabricate a phantom MOTION_DUPLICATE
> --name <Name>
> # → <scratch>/<Name>_qc_ground_truth.txt (use as the auth-layers text part in Step 5.4)
> ```
> `--motion-list` = JSON `[{"win":[s,e],"text":"<on-screen title>","id":"<type:concept>"}]` read off the
> final `.tsx`. Review the output (it WARNS on wrap violations and un-applied suppression windows — fix
> those BEFORE grading). **FALLBACK: if the script errors, assemble manually per the recipe below (unchanged).**

**This is the single highest-leverage QC fix.** Gemini's recurring SUBTITLE_WRAP / MOTION_DUPLICATE deductions (the whole QCR-010 family) are NOT real defects — they are Gemini *guessing* the on-screen text because the call never gave it ground truth. It samples adjacent subtitle frames and stitches them into phantom 3-line wraps. Hand it the real text and the hallucination dies.

Extract the exact subtitle Dialogue list (with literal `\N` shown) and the motion scene-title list, and pass BOTH as a second text part in the request:

```bash
# (a) Authoritative subtitle list from the burned ASS — exact text + timing, \N shown literally
ASS=<downloads>/<VideoName>.ass
SUB_LIST=$(python3 - "$ASS" <<'PY'
import sys, re
lines=[]
for ln in open(sys.argv[1], encoding="utf-8"):
 if not ln.startswith("Dialogue:"): continue
 f = ln.split(",", 9)
 start, end, text = f[1].strip, f[2].strip, f[9].rstrip("\n")
 # QCR-016: capture which words are yellow-highlighted BEFORE stripping tags, so the
 # grader judges checklist #11 (highlight consistency) against ground truth instead of
 # guessing visually from frames (the recurring STYLE hallucination: numbers/brands that
 # ARE yellow get flagged "not highlighted"). A word listed here IS rendered yellow.
 yel = re.findall(r"\{\\rYellow\}(.*?)\{\\rWhite\}", text)
 yel = [re.sub(r"\{[^}]*\}|\\N", " ", y).strip for y in yel]
 text = re.sub(r"\{[^}]*\}", "", text) # strip ASS override tags ({\rYellow} etc.)
 # QCR-014: list EACH visual line separately WITH its exact char count, so the grader
 # cannot sum L1+L2 across the break and flag a correct 2-line entry as ">18 chars".
 vis = text.split("\\N")
 parts = " | ".join(f'L{i+1}:"{v.strip}"({len(v.strip)} chars)' for i, v in enumerate(vis))
 hl = f" [YELLOW: {', '.join(yel)}]" if yel else " [YELLOW: none]"
 lines.append(f"[{start}-{end}] {len(vis)} visual line(s): {parts}{hl}")
print("\n".join(lines))
PY
)

# (b) Authoritative motion-title list from the visual plan (titles + their time windows)
PLAN=<downloads>/<VideoName>_visual_plan.json
MOTION_LIST=$(python3 - "$PLAN" <<'PY'
import sys, json
try:
 d=json.load(open(sys.argv[1], encoding="utf-8"))
except Exception:
 print("(no visual plan found)"); sys.exit
segs = d.get("motion_segments") or d.get("scenes") or d.get("segments") or []
out=[]
for s in segs:
 t = s.get("title") or s.get("text") or s.get("label") or ""
 a = s.get("start", s.get("from","?")); b = s.get("end", s.get("to","?"))
 out.append(f"[{a}-{b}s] {t}")
print("\n".join(out) if out else "(motion titles not enumerated in plan — read them from the .tsx scenes)")
PY
)
```

```bash
# (c) Authoritative B-ROLL WINDOWS (QCR-034) — time ranges where the FULL frame is a stock
# b-roll clip and the motion layer is ABSENT. The grader must NOT invent motion titles or
# flag MOTION_DUPLICATE/MOTION_* inside these ranges (it was reading subtitle words during
# b-roll windows and matching them against themselves -> 7 phantom -35 on a real run).
MANIFEST=<downloads>/<VideoName>_broll_manifest.json
BROLL_LIST=$(python3 - "$MANIFEST" <<'PY'
import sys, json
try:
 d = json.load(open(sys.argv[1], encoding="utf-8"))
except Exception:
 print("(no b-roll manifest — no full-frame b-roll windows)"); sys.exit
out = []
for b in d.get("brolls", []):
 a = b.get("insert_at"); dur = b.get("duration", 5.0)
 out.append(f"[{a}-{round(a+dur,2)}s] FULL-FRAME B-ROLL (no motion layer here)")
print("\n".join(out) if out else "(no b-roll windows)")
PY
)
```

If the visual plan does not enumerate scene titles, read them off the Remotion `.tsx` scene components manually and build the list by hand. The list MUST reflect what is actually rendered. Pass `$BROLL_LIST` as part of the ground-truth text part (Step 5.4) alongside `$SUB_LIST` and `$MOTION_LIST`.

```bash
# (d) CAPTION-SUPPRESSION WINDOWS (QCR-248) — premium §3b/§5b windows where suppress_windows.py
# DROPPED the burned bottom subtitle, so the single centered/floating caption IS the only
# on-screen text (QCR-193). These are written deterministically to <Name>_caption_windows.json
# by Phase 8. ALWAYS auto-ingest that file (do NOT hand-read the .tsx comment) and append the
# windows to the MOTION_LIST so the grader applies the QCR-193 double-count immunity inside them.
CAPWIN=<downloads>/<VideoName>_caption_windows.json
CAP_LIST=$(python3 - "$CAPWIN" <<'PY'
import sys, json
try:
 w = json.load(open(sys.argv[1], encoding="utf-8"))
except Exception:
 print("(no caption-suppression windows — no §3b/§5b on this video)"); sys.exit
rows = [f"{a}-{b}s" for a, b in w] if w else []
print("CAPTION-SUPPRESSION WINDOWS (QCR-193 — burned subtitle removed; the centered/floating caption is the ONLY on-screen text and IS the subtitle-equivalent → FORBIDDEN to flag MOTION_DUPLICATE / SUBTITLE_* in these ranges): " + (", ".join(rows) if rows else "(none)"))
PY
)
# Append $CAP_LIST to the MOTION_LIST ground-truth text part.
```

**QCR-072: PAIR each motion title with its TIME-CONCURRENT subtitle + the pre-computed max consecutive-shared-word count.** Build each MOTION_LIST row as `[window] "TITLE sub-line"(Nw) || concurrent sub: "<exact subtitle text spoken in that window>" → max shared consecutive = K → COMPLEMENT`, and restate the b-roll windows as motion-free. The word count alone (QCR-022) did not stop the storm on how-to/list videos whose titles reuse the narration's nouns (foto/imagem/etc.): the grader mis-paired titles against non-concurrent subtitles and invented titles from subtitle text inside b-roll windows (a real run iter1=70, 6 phantom MOTION_DUPLICATE). Supplying the concurrent pairing collapsed all 6 → grade 100 on a clean re-read. Do this whenever motion titles share the narration's key nouns (the norm for how-to/list shapes).

**QCR-022: annotate each motion title sub-line with its WORD COUNT** (e.g. `CountUp "$3850" (1 word) / "CINCO TRILHAS" (2 words)`). The grader repeatedly violates QCR-020 by flagging a 1–2-word number/brand title as "shares 4 consecutive words" with the concurrent subtitle (a 1-word title cannot share even 2). Stating the word count inline removes the miscount: a title whose annotated count is ≤3 is, by QCR-020, mechanically incapable of a MOTION_DUPLICATE and MUST NOT be flagged. Build the count per individual sub-line (split on `/`), not the whole scene.

### Step 5.4: Send Analysis Request

The `parts` array now carries **three** parts: the video, the authoritative text layers (QCR-013), then the rubric prompt. Build the auth-layers text part from Step 5.3b (`$SUB_LIST` + `$MOTION_LIST`) and substitute it where shown. **Temperature is 0.1** (QCR-013).

```bash
ANALYSIS=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}" \
 -H "Content-Type: application/json" \
 -d '{
 "contents": [{
 "parts": [
 {"fileData": {"mimeType": "video/mp4", "fileUri": "FILE_URI_HERE"}},
 {"text": "AUTHORITATIVE TEXT LAYERS (GROUND TRUTH — do NOT reconstruct on-screen text from frames; judge SUBTITLE_WRAP and MOTION_DUPLICATE ONLY against these lists).\n\n--- SUBTITLE TRACK (each row = ONE subtitle screen; it lists every visual line Lx with that line's EXACT character count in parentheses. A 2-line screen is CORRECT — NEVER add L1+L2 counts together) ---\nSUB_LIST_HERE\n\n--- MOTION SCENE TITLES (text shown in the top motion area, with time window) ---\nMOTION_LIST_HERE"},
 {"text": "ANALYSIS_PROMPT_HERE"}
 ]
 }],
 "generationConfig": {"temperature": 0.1, "maxOutputTokens": 16384, "thinkingConfig": {"thinkingBudget": 2048}}
}')

# Extract text and grade
# QCR-230 (a real run): Gemini's report text contains LITERAL newlines inside the JSON
# string value (the "=== SECTION ... ===\n\n1. ..." body). Default json.load is STRICT and raises
# "Invalid control character at: line N" on those raw \n — silently zeroing ANALYSIS_TEXT and faking
# a "no grade" failure on a clean 100/100. ALWAYS parse with strict=False. Also guard a missing
# parts[] (thinking-budget empty response) so we print a diagnostic instead of crashing the pipe.
ANALYSIS_TEXT=$(echo "$ANALYSIS" | python3 -c "
import sys,json
d=json.loads(sys.stdin.read, strict=False)
c=d.get('candidates',[{}])[0]
parts=c.get('content',{}).get('parts')
print(parts[0]['text'] if parts else 'EXTRACT_FAIL finishReason='+str(c.get('finishReason')))")
# QCR-067: the grade can be written "GRADE: 85/100", "GRADE: 100 - 33 = 67/100", OR
# "GRADE: [100]/100" (Gemini sometimes echoes the prompt's literal "[X]" brackets). A naive
# 'GRADE: [0-9]+' MISSES the bracketed form (the '[' breaks the match) and a leading-number grab
# mis-reads the math form's start-at-100. Robust parse: take the GRADE line, STRIP the "/100"
# denominator, then take the LAST remaining number (the math form's result; the bracketed value).
GRADE=$(echo "$ANALYSIS_TEXT" | grep -iE 'GRADE:' | sed -E 's#/ ?100##g' | grep -oE '\-?[0-9]+' | tail -1)
# QCR-075 (a real run): Gemini sometimes OMITS the literal "GRADE:" prefix and
# writes the score only under "=== GRADING ===" as a math line ("100 - 0 = 100/100"). The
# GRADE: grep then returns empty (mis-read as "no grade"). Fallback: take the LAST "N/100"
# token anywhere in the report (the final computed result).
[ -z "$GRADE" ] && GRADE=$(echo "$ANALYSIS_TEXT" | grep -oE '\-?[0-9]+ ?/ ?100' | tail -1 | grep -oE '\-?[0-9]+' | head -1)
echo "Grade: $GRADE/100"
```

**Timeout:** Use `timeout: 300000` (5 min) for the analysis call.

**Known failure modes:**
- **HTTP 503 UNAVAILABLE** ("high demand") — transient. Retry with backoff (e.g. 15s/30s/45s, up to 5 attempts).
- **Empty response** (`candidates[0].content` has NO `parts`, `finishReason: STOP`, large `thoughtsTokenCount`) — the model spent the whole output budget on internal thinking. Fix: keep `thinkingConfig.thinkingBudget: 2048` in generationConfig (already in the payload above). Without it the call can silently return zero text.

### Step 5.5: Parse Grade and Decide

| Grade | Action |
|-------|--------|
| **>= threshold** (`config.qc.threshold`, default 75) | **PASS** — proceed to Phase 11 (Comment→DM → mark-ready) |
| **< threshold** | **FAIL** — parse issues, apply fixes, run Step 5.6 (Self-Improve), re-render, re-analyze (up to `config.qc.max_iterations` iterations, default 3) |
| **After `config.qc.max_iterations` fails** | **STOP and report** — print the full analysis to the user and wait; NEVER post below the threshold without explicit approval |

### Step 5.6: Self-Improve the Repo / Skill / Pipeline (MANDATORY — runs after EVERY QC read, pass OR fail)

**House rule: every run is an optimization run.** Immediately after each QC analysis — whether it passed, failed, or you are about to loop again — you MUST turn what went wrong THIS run into a permanent fix to the pipeline itself, so the same friction has a lower chance of recurring next time. Logging a lesson is not enough; **edit the actual file** that would prevent the recurrence.

This step covers BOTH kinds of problem encountered during the run:
1. **QC findings** (what Gemini deducted for) — already handled by the existing lessons-learned + source-file fix loop below.
2. **Pipeline friction** — anything that cost time or a retry that was NOT a content defect: a script bug, a wrong CLI flag, an env/key issue, a tool that truncated a large file, a validator false-positive, a format-string crash, a hallucination-inducing prompt, a missing default, etc.

**Procedure (do all four):**
1. **Enumerate every problem hit this run** — from the QC report AND from your own execution log (failed commands, retries, manual workarounds, files you had to hand-edit). Be honest; a workaround you did silently is exactly what must be captured.
2. **Root-cause each** to a specific file + parameter/line: which script, skill, instruction doc, template, or default caused it.
3. **Apply the permanent fix at the source** — edit the actual `.py` / `SKILL.md` / `*_INSTRUCTIONS.md` / template / `.tsx` / `CLAUDE.md` so the problem cannot recur unattended. Prefer fixing the tool over documenting a manual step. Examples: add a missing default flag; make a script use the full ffmpeg path; harden a regex; add a validation gate; fix a prompt that induced a hallucination; add per-line char counts to the QC ground truth.
4. **Record it** as a new `QCR-xxx` (or pipeline-friction) entry in `qc-pipeline/active-rules.md` with finding → root cause → the exact source edit made → verification. One line per fix is fine; the edit itself is the real artifact.

**Rules:**
- This step is NOT optional and NOT gated on a passing grade — a PASS run with friction still gets its friction fixed.
- Never "fix" by gutting an intended design (e.g. do not remove the V8 handheld CameraRig drift just because a grader read it as "off-center" — that is the premium look; instead harden the QC ground truth / prompt so the grader stops misreading it).
- Honor QCR-007: the Self-Improve step never edits or re-grades to manufacture a passing score; it improves the machinery, not the verdict.
- Keep edits surgical and within this pipeline's files. Do not touch unrelated repos.

---

## QC Prompt Variables

Before sending the analysis prompt, substitute these variables with actual values from the current video:

| Variable | Source | Example |
|----------|--------|---------|
| `{{SUBTITLE_FONT_SIZE}}` | ASS file Fontsize field | `68` |
| `{{SUBTITLE_MARGIN_V}}` | ASS file MarginV field | `280` |
| `{{SUBTITLE_OUTLINE}}` | ASS file Outline field | `5` |
| `{{VIDEO_DURATION_S}}` | `ffprobe -v error -show_entries format=duration` | `52` |
| `{{NUM_SUBTITLE_ENTRIES}}` | `grep -c "^Dialogue:" subtitles.ass` | `38` |
| `{{MAX_CHARS_PER_LINE}}` | From SUBTITLE_INSTRUCTIONS.md | `18` |
| `{{MAX_WORDS_PER_SEGMENT}}` | From SUBTITLE_INSTRUCTIONS.md | `5` |
| `{{MOTION_COMPOSITION_NAME}}` | Remotion composition ID | `<Name>` |
| `{{SUBTITLE_BOTTOM_PIXEL}}` | `1920 - MarginV` | `1640` |
| `{{SUBTITLE_LINE_HEIGHT}}` | `FontSize + 2*Outline` | `78` |
| `{{SUBTITLE_2LINE_TOP}}` | `SUBTITLE_BOTTOM_PIXEL - 2*LINE_HEIGHT` | `1484` |
| `{{SUBTITLE_AUTHORITATIVE_LIST}}` | Step 5.3b `$SUB_LIST` | exact ASS Dialogue list (text + timing, `\N` shown) — passed as the GROUND-TRUTH text part, not interpolated into the rubric |
| `{{MOTION_TITLE_LIST}}` | Step 5.3b `$MOTION_LIST` | exact motion scene titles + windows — same text part |

The agent MUST compute these before every QC call and substitute them into the prompt template below. The two authoritative lists (QCR-013) go in the dedicated GROUND-TRUTH text part built in Step 5.4, NOT inline in the rubric.

---

## The Analysis Prompt

Use this EXACT prompt. Substitute `{{VARIABLES}}` with actual values before sending. Do NOT modify the structure.

```
You are a video QC engineer. Analyze this 9:16 vertical video (1080x1920) and produce a STRUCTURED fix report. Your output must follow the exact format below — no prose, no filler.

=== GROUND-TRUTH RULE (QCR-013 — READ FIRST) ===
A separate "AUTHORITATIVE TEXT LAYERS" message part lists the EXACT subtitle track (one line = one subtitle screen; ⏎(line-break) marks a real line break) and the EXACT motion scene titles. You MUST judge SUBTITLE_WRAP and MOTION_DUPLICATE ONLY against those lists — do NOT reconstruct on-screen text by reading it off the video frames. Reading text across multiple frames and concatenating it is FORBIDDEN: that produces false "wrap" findings. Concretely:
- The subtitle list gives, for each screen, every visual line Lx WITH its exact character count in parentheses. SUBTITLE_WRAP exists ONLY if a screen has 3+ visual lines (an L3 or beyond), OR a single Lx's stated count is greater than 18. NEVER add L1+L2 counts together — they are separate physical rows; a 2-line screen is CORRECT and is NOT a wrap even if L1+L2 combined exceed 18. **QCR-171 (a real run): a 2-VISUAL-LINE screen where BOTH lines are <=18 chars is the INTENDED motion style — you MUST NOT flag it SUBTITLE_WRAP and MUST NOT recommend "combine into a single line". Any row admitting "both lines fit / short enough / under 18 / could be one line" is self-refuting and FORBIDDEN. (Unhardened, this produced 25 phantom -1 wraps → borderline 75; hardened → 89.)** Use ONLY the per-line counts provided; do not re-count from frames. If neither condition holds for the listed screen, there is NO wrap — do not flag it, regardless of what consecutive frames look like.
- **QCR-034 — B-ROLL WINDOWS have NO motion layer.** A third authoritative list, "B-ROLL WINDOWS", gives time ranges where the FULL frame is a stock b-roll clip and the motion area is ABSENT. You MUST NOT invent a motion title, nor flag MOTION_DUPLICATE / MOTION_ALIGN / MOTION_OVERLAP / MOTION_TIMING, for any timestamp inside a b-roll window. If a candidate motion finding's timestamp falls in a b-roll range, drop it — there is no motion text there, and any on-screen words you see are the burned subtitle, not a motion title.
- MOTION_DUPLICATE exists ONLY if a listed motion title shares 4+ consecutive words with the SPECIFIC subtitle line whose [start-end] window overlaps that motion title's [start-end] window. You MUST match against the time-concurrent subtitle only — find the subtitle row whose window contains (or overlaps) the motion title's window, quote THAT row's Lx text, and compare. Matching a motion title against a subtitle spoken at a different timestamp is FORBIDDEN and is the #1 false-duplicate source. If the concurrent subtitle shares fewer than 4 consecutive words with the motion title, there is NO duplicate — drop it.
- **QCR-020 — word-count floor (mechanical, non-negotiable): a motion title of N words can share AT MOST N consecutive words. Therefore any motion title with 3 or fewer words makes the 4+-consecutive test PHYSICALLY IMPOSSIBLE — MOTION_DUPLICATE MUST NOT be flagged for it, EVER, regardless of how similar it looks.** Before writing a MOTION_DUPLICATE row, count the words in the listed motion title (a "/" separates scene sub-lines; count words in the single line you are matching). If that line has ≤3 words, drop the finding. This kills the recurring short payoff/CTA-banner false-duplicate (e.g. a 3-word "A GUERRA COMEÇOU" banner flagged as "4 consecutive words" — invented). Claiming "4 consecutive words" against a ≤3-word title is a self-contradiction and is FORBIDDEN.
- **QCR-015 — "near-duplicate" / "conceptual overlap" are NOT defects and MUST NOT be deducted.** The ONLY duplicate condition is the literal **4+ consecutive shared words** test above. If you count 0/1/2/3 shared words (or merely a paraphrase, summary, synonym such as "5"≈"cinco", or same-theme idea), the motion title is a COMPLEMENT and is CORRECT — do NOT add a MOTION_DUPLICATE row, do NOT deduct "to be safe", and do NOT mark checklist #13 NO for it. Brand/topic banners (e.g. an S0 headline) and CTA banners (e.g. "SALVA esse vídeo") sharing ≤3 words are explicitly sanctioned (MOTION_DESIGN_SYSTEM.md §2.5, QCR-011). Writing a row whose own "What's Wrong" text admits the overlap is "allowed" / "not a word-for-word duplicate" / "conceptual" is a self-contradiction and is FORBIDDEN.
- **QCR-016 — SUBTITLE_STYLE highlights are GROUND-TRUTHED.** Each subtitle row ends with a `[YELLOW: ...]` tag listing the words actually rendered yellow (or `[YELLOW: none]`). A word listed there IS highlighted yellow — do NOT flag it as "not highlighted" or add a SUBTITLE_STYLE row for it, and do NOT mark checklist #11 NO for it, regardless of what a sampled frame looks like (low-contrast frames and motion glow cause false "white" reads). Flag #11 NO ONLY if the `[YELLOW: ...]` lists are genuinely inconsistent across rows (e.g. one number/brand highlighted, the same category un-highlighted elsewhere) — judged from the lists, not the frames.
- **QCR-066 — checklist #13 and MOTION_DUPLICATE are MUTUALLY EXCLUSIVE.** If you answer checklist item #13 = YES (every motion title shares ≤3 consecutive words with its concurrent subtitle), then by definition there is NO double-subtitling and you MUST NOT write ANY MOTION_DUPLICATE row in the FIXES TABLE — the two statements contradict each other. Likewise, never write a MOTION_DUPLICATE row whose own "What's Wrong" text contains the phrases "not a direct 4+ word match", "conceptual overlap", "strong conceptual", "even if it's technically allowed", "sanctioned", **"redundant", "direct/exact match", "the key phrase", "implied", "too similar", "usually fine", "while 2 words", "while 3 words", or "1st place is the main prize"** — each of those is an admission that the 4+-consecutive condition is NOT met, which makes the row self-refuting and FORBIDDEN. **QCR-070 (a real run iter1=60→iter2=55→iter3=100): an EXACT match of a brand/tool name or number at ≤3 consecutive shared words is the SANCTIONED, PREFERRED complement (§2.5) — being a "direct/exact match" of a brand/number is CORRECT, never "redundant". Match each motion sub-line SEPARATELY (a "/" separates sub-lines — e.g. "1º LUGAR NO HACKATHON DA ANTHROPIC" = "1º LUGAR"(2w) + "NO HACKATHON DA ANTHROPIC"(4w), counted apart), never the whole scene as one string.** A MOTION_DUPLICATE row is valid ONLY when you can quote 4+ literally consecutive shared words from BOTH the listed motion title sub-line AND its time-concurrent subtitle line; if you cannot, drop the row and keep #13 = YES (do not deduct "to be safe").
- MOTION_ALIGN: the motion layer is wrapped in an INTENTIONAL handheld camera rig (slow drift + micro-jitter + ±0.3° roll — the V8 premium look, by design). Do NOT flag small frame-to-frame position offsets, slight rotation, or a title that sits a few px off-center in a single sampled frame as MOTION_ALIGN. Flag MOTION_ALIGN ONLY if text is consistently and obviously mis-anchored across its WHOLE scene (e.g. clipped at an edge, or left/right-justified when it should be centered) — never for the ambient drift itself.
- **QCR-208 — SUBTITLE_OVERLAP / text-on-text REGION RULE (a real run iter1=50→iter2=100).** The burned subtitle sits at the BOTTOM (px ~1484-1640, over the avatar's chest). Premium top-panel text — an EVIDENCE-card caption/stamp/kicker (e.g. "Foundation Models" / "iOS 27" / "Apple"), a §4 hero LABEL, or the §1 PILL headline — sits in the TOP region (px 0-820). These are SEPARATE, non-overlapping screen bands. Two text elements merely being ON SCREEN AT THE SAME TIME is NOT an overlap. Flag SUBTITLE_OVERLAP / SUBTITLE_POSITION / MOTION_OVERLAP ONLY when two text BOXES actually occupy the SAME y-band (their pixel rectangles intersect). A top-panel evidence caption co-occurring with a bottom subtitle — even sharing the same WORDS ("Foundation Models" on the card + "Foundation Models" in the subtitle) — is CORRECT and FORBIDDEN to flag (it is the a real run-class region-separation hallucination that produced 5 phantom -10 SUBTITLE_OVERLAP on a real run iter1). Before writing such a row, quote BOTH elements' pixel y-ranges; if they do not intersect, drop the row and keep items 2/#2 = YES.
- Face-occlusion / positioning / readability ARE still judged visually from the video — the text lists do not tell you where pixels land.
- Before writing any SUBTITLE_WRAP or MOTION_DUPLICATE row, quote the exact offending line FROM THE AUTHORITATIVE LIST. If you cannot find it there verbatim, the finding is invalid — drop it.
- **QCR-266 — SUBTITLE_TIMING: a small gap between consecutive subtitle entries is INTENDED, NOT a defect.** This pipeline's SRT is VAD-anchored to the REAL speech (the narration has natural pauses between sentences), so a short blank between two captions is CORRECT and REQUIRED — it means the caption is not lingering over silence. Two hard rules: (1) a gap of **0.00s** (previous End == next Start) is NOT a gap at all — there is NO blank screen, the next caption begins the exact frame the previous ends; NEVER flag it. (2) An inter-caption gap **< 0.30s** (≤ ~7 frames, e.g. 0.03s / 0.23s / 0.25s) is a natural micro-pause and is sub-perceptual/intended — do NOT flag it SUBTITLE_TIMING and do NOT deduct for it. Flag SUBTITLE_TIMING ONLY for (a) a caption that is genuinely mis-synced to the audio by **> 0.5s** (words appear well before/after they are spoken), or (b) a blank gap **> 1.0s** in the MIDDLE of continuous speech. A row whose "What's Wrong" text says "0.00s gap" / "0.03s gap" / "brief blank screen" / "gap of 0.2s" is self-refuting and FORBIDDEN (unhardened this produced 27 phantom -1 SUBTITLE_TIMING on a correctly VAD-timed reel → 73; hardened → passes). **QCR-267 (KiloCode 16 phantom -1 → 84; would be 100): a LARGE inter-caption gap (0.68s / 2.43s / 4.33s / 5.24s …) that coincides with REAL SILENCE — the speaker has finished a sentence and is not yet speaking the next — is INTENDED at ANY size and is NOT a defect. Because the SRT is VAD-anchored, EVERY inter-caption gap corresponds to actual silence in the audio, so a caption that simply is not on screen while nobody is speaking is CORRECT (it is NOT "mis-synced" — the previous words WERE synced to when they were spoken). Condition (b) requires the blank to fall DURING continuous speech (words are audibly being spoken with no caption) — a gap where the audio is SILENT does not qualify no matter how long. Do NOT deduct for a large gap unless you can hear words being spoken with no caption on screen; "reduce the gap to <0.30s" as a fix is FORBIDDEN (packing captions across real pauses reintroduces the QCR-232 desync). Rows 1-19 of the KiloCode report (all gaps over silence) are exactly this false family.**

> **SECTION-GRAMMAR videos (QCR-085) — SWAP THE REFERENCE CARD.** When the video is built
> on the 6-section grammar (`HandDrawnGrammarRef.tsx` / `PremiumSectionRef.tsx` pattern), the fixed "Top 40%
> motion / Bottom 60% avatar" card below is WRONG and will induce false flags. Use the GRAMMAR-AWARE
> card instead: layout VARIES by section — full-frame MOTION (graphics fill the whole frame, no avatar),
> full-frame ZOOMED-AVATAR (face high ~px 500-1050, fast zoom-punch is intentional), and SPLIT (motion
> top 40% + avatar bottom 60%). Sections 5 & 6 bake ZERO text by design (do not flag "empty/missing
> title"). Full-frame motion is CORRECT (do NOT flag "motion outside top 40%"). Checklist #5/#6 are N/A
> where a section is full-frame. ADD #14 (motion-idea variety+match: beats use DISTINCT mechanisms, each
> illustrating its line) and #15 (the screenshot circle rings the ACTUAL main element, not empty space).
> Also run `validate_subtitles.py --section-grammar` (QCR-084) so the 1450 face threshold doesn't false-fail.
>
> **CAPTION-WINDOW RULE (QCR-193, MANDATORY for premium §3b/§5b — prevents the double-count hallucination).**
> Premium-grammar videos REMOVE the burned bottom subtitle inside every §3b kinetic-caption and §5b
> avatar-floating-caption window (`suppress_windows.py` drops those Dialogue lines; the `<Name>_caption_windows.json`
> lists them). In those windows the single BIG centered/floating line of text IS the only text on screen and IS the
> subtitle-equivalent — there is NO separate bottom subtitle. So in those windows it is FORBIDDEN to flag
> SUBTITLE_STYLE / SUBTITLE_POSITION / SUBTITLE_OVERLAP / SUBTITLE_WRAP ("a subtitle overlaps the motion text") or
> MOTION_DUPLICATE ("the caption duplicates the subtitle"): counting the one caption as BOTH a subtitle AND a motion
> title and flagging them against each other is a self-refuting DOUBLE-COUNT of one element — drop it; items 2 & 13 = YES.
> **QCR-276 (a real run): ALSO FORBIDDEN — SUBTITLE_TIMING "blank/missing subtitle during continuous speech" / "add a subtitle entry" inside a caption-suppression window.** The burned bottom subtitle is INTENTIONALLY removed there because the BIG centered/floating caption already shows the exact spoken line — the screen is NOT blank, it carries the caption. A row that says "blank subtitle for N s" / "missing subtitle entry" / "add subtitle ... as per the caption-suppression window" is self-refuting (it cites the very window that removed it) and MUST be dropped, item 8 = YES. (Unhardened this produced 4 phantom -1 on a clean premium reel → 91 instead of ~99.)
> Pass the exact §3b/§5b windows in the ground-truth so the grader can verify (a real run iter1=64 → hardened → iter2=100).

=== REFERENCE CARD (correct values for this video) ===
Frame: 1080×1920, 25fps
Layout: Top 40% (px 0-768) = motion graphics | Bottom 60% (px 768-1920) = avatar speaker
Face zone: approximately px 950-1350 (eyes ~1050, chin ~1350)
Subtitle zone (correct): px {{SUBTITLE_2LINE_TOP}}-{{SUBTITLE_BOTTOM_PIXEL}} (MarginV={{SUBTITLE_MARGIN_V}}, Font {{SUBTITLE_FONT_SIZE}}, Outline {{SUBTITLE_OUTLINE}})
Subtitle line height: {{SUBTITLE_LINE_HEIGHT}}px per visual line
Max visual lines: 2 (2-line top edge = px {{SUBTITLE_2LINE_TOP}})
Max words/segment: {{MAX_WORDS_PER_SEGMENT}} | Max chars/line: {{MAX_CHARS_PER_LINE}}
Platform UI danger zone: px 1700-1920 (likes, comments, audio bar)
Video duration: {{VIDEO_DURATION_S}}s | Subtitle entries: {{NUM_SUBTITLE_ENTRIES}}

=== SECTION 1: VERIFICATION CHECKLIST ===
Answer YES or NO for each. If NO, note the timestamp(s).

1. Subtitles never overlap face (check at 0:03, 0:10, 0:20, 0:30, 0:40, 0:50): [ ]
2. Subtitles never overlap motion graphics text: [ ]
3. Subtitles never exceed 2 visual lines on screen: [ ]
4. All subtitle text readable on phone (sufficient size + contrast): [ ]
5. Motion graphics content stays within top 40% (above px 768): [ ]
6. Avatar head fully visible (not clipped by motion boundary): [ ]
7. Audio syncs with lip movements (within 0.3s tolerance): [ ]
8. No dead visual moments longer than 2 seconds: [ ]
9. First 2 seconds have a visual hook (motion or text appears): [ ]
10. Subtitles' BOTTOM edge stays ABOVE the px-1700 platform UI danger zone — i.e. NOTHING is rendered between px 1700-1920 (a track ending at px ~1640 is CORRECT and is a YES; do NOT read "above px 1700" as "top edge must be < 1700" — that inverted reading is the QCR-115 self-contradiction): [ ]
11. Yellow keyword highlights consistent (same category = same treatment): [ ]
12. Motion graphics text alignment pixel-perfect (centered): [ ]
13. Motion graphics text COMPLEMENTS the narration (distilled titles/keywords/numbers/icons) and never duplicates the subtitle text word-for-word (no double subtitling — motion may share at most 3 words with the concurrent subtitle, never 4+ consecutive). Answer YES if every motion title shares ≤3 consecutive words with its time-concurrent subtitle. "Near-duplicate" / "conceptual overlap" / paraphrase at ≤3 shared words = YES (QCR-015): [ ]
14. MOTION-IDEA VARIETY + MATCH (QCR-080): the video's motion beats use DISTINCT mechanisms — sample one frame per motion beat; answer YES only if no two motion beats look like the same idea (e.g. NOT "icon badges wired by lines" repeated) AND each beat's motion visibly illustrates its spoken line. Answer NO if two+ motion sections share the same visual mechanism (the rejected first-cut defect): [ ]

=== SECTION 2: FIXES TABLE ===
For EVERY issue found (even minor), add a row. If zero issues, write "NONE".

| # | Category | Severity | Timestamp | What's Wrong | Root Cause | Exact Fix | File to Edit | Parameter | Old Value | New Value |
|---|----------|----------|-----------|-------------|------------|-----------|-------------|-----------|-----------|-----------|

Categories: SUBTITLE_POSITION, SUBTITLE_WRAP, SUBTITLE_TIMING, SUBTITLE_STYLE, MOTION_ALIGN, MOTION_TIMING, MOTION_OVERLAP, MOTION_DUPLICATE, AVATAR_FRAME, AUDIO_SYNC, PACING, COMPOSITION, REFERENCE_MISSING
Severity: CRITICAL (-30pts face overlap, -15pts text overlap) | MAJOR (-5 to -10pts) | MINOR (-1 to -3pts)

=== SECTION 3: FIX COMMANDS (priority order — most impactful first) ===
For each fix from the table, provide the EXACT action. Self-contained steps.

Fix mapping reference:
- SUBTITLE_POSITION → edit ASS file: change MarginV value in Style lines. Then re-burn: ffmpeg -y -i input.mp4 -vf "ass=file.ass" -c:a copy output.mp4
- SUBTITLE_WRAP (3+ visual lines) → re-run srt_to_ass.py with stricter word limits, or manually split the offending Dialogue line into two entries with proportional timestamps
- SUBTITLE_TIMING → adjust Dialogue start/end times in ASS file to match audio
- SUBTITLE_STYLE (highlights) → add/fix {\rYellow}word{\rWhite} overrides in ASS Dialogue lines, then re-burn
- MOTION_ALIGN → edit Remotion .tsx: fix flexbox (alignItems/justifyContent/textAlign) in the scene component, re-render
- MOTION_TIMING → edit Remotion .tsx: adjust Sequence from/durationInFrames values, re-render
- MOTION_OVERLAP (extends below px 768) → edit Remotion .tsx: reduce element sizes or add overflow:hidden, re-render
- MOTION_DUPLICATE (motion text repeats subtitle text) → edit Remotion .tsx: replace transcription with distilled keywords/title/number/icon, re-render
- AVATAR_FRAME → edit Remotion .tsx: adjust objectPosition/objectFit in video layer CSS, re-render
- AUDIO_SYNC → UNFIXABLE (HeyGen output). Log only.
- PACING → if motion-related, adjust Sequence timing. If subtitle-related, adjust segment durations.

Number each step. Include exact parameter names and values. Example format:
1. [CRITICAL] SUBTITLE_POSITION: ASS file MarginV 280→320 in both White and Yellow Style lines. Re-burn subtitles.
2. [MAJOR] SUBTITLE_WRAP at 0:15: Split Dialogue entry #12 ("text here") into two entries at midpoint timestamp. Re-burn.

=== SECTION 4: RE-RENDER REQUIREMENTS ===
State which phases need re-running:
- [ ] Motion re-render needed (Remotion changes made)
- [ ] Subtitle re-burn needed (ASS changes made)
- [ ] Both (motion changes affect subtitle positioning)
- [ ] None (video passes as-is)

If motion re-render: re-burn subtitles AFTER motion render completes (new _motion.mp4 → new _final.mp4 → re-add music → new _music.mp4).
If subtitle-only fix: re-burn subtitles → new _final.mp4 → re-add music → new _music.mp4.
**Always re-add music after any re-burn:** `python3 add_music.py --input _final.mp4 --output _music.mp4`

=== GRADING ===
Start at 100. Subtract:
- Face occlusion: -30 per occurrence (max -60)
- Text-on-text overlap: -15 per occurrence (max -30)
- Major issues: -5 to -10 each
- Minor issues: -1 to -3 each
Show the math: 100 - [deduction1] - [deduction2] - ... = GRADE

GRADE: [X]/100
```

---

## Feedback-to-Fix Mapping (Comprehensive)

When Gemini returns the FIXES TABLE, the agent processes each row and applies the corresponding fix. Every possible Gemini category maps to an exact file, parameter, and command.

### Category: SUBTITLE_POSITION

| Finding | File | Parameter | Fix Command | Re-burn? |
|---------|------|-----------|-------------|----------|
| Subtitles overlap face | `*.ass` | `MarginV` in both `Style: White` and `Style: Yellow` lines | Decrease MarginV by 20-40 (moves subtitles DOWN away from face). E.g., `280→240` | YES |
| Subtitles in UI danger zone (below px 1700) | `*.ass` | `MarginV` | Increase MarginV by 40-80 (moves subtitles UP). E.g., `280→340` | YES |
| Subtitles too close to motion area | `*.ass` | `MarginV` | Decrease MarginV (moves DOWN). Verify new top edge stays below px 1450 | YES |

**Re-burn command:** `ffmpeg -y -i _motion.mp4 -vf "ass=filename=subtitles.ass" -c:a copy _final.mp4` (QCR-324: on ffmpeg 8.x the `ass=<path>` shorthand fails with "No option name" — always use `ass=filename=<path>`)

### Category: SUBTITLE_WRAP

| Finding | File | Parameter | Fix Command | Re-burn? |
|---------|------|-----------|-------------|----------|
| 3+ visual lines on screen | `*.ass` | Dialogue text content | Split the offending Dialogue entry into 2 entries. Divide duration proportionally by word count. Each new entry ≤ 5 words, each line ≤ 3 words / 18 chars | YES |
| Single line too wide (wraps) | `*.ass` | `\N` position in Dialogue | Move `\N` break earlier so neither half exceeds 18 chars | YES |
| Systemic wrapping (many entries) | SRT → ASS | Re-run `srt_to_ass.py` | `python3 subtitle-pipeline/srt_to_ass.py input.srt output.ass` — script enforces 5 words/segment, 3 words/line, 18 chars/line | YES |

### Category: SUBTITLE_TIMING

| Finding | File | Parameter | Fix Command | Re-burn? |
|---------|------|-----------|-------------|----------|
| Subtitle appears early/late | `*.ass` | Dialogue start/end times | Shift the specific Dialogue entry's timestamps ±0.1-0.5s to align with audio | YES |
| Subtitle duration too short | `*.ass` | Dialogue end time | Extend end time (min 1.0s display per entry) | YES |
| Subtitle duration too long | `*.ass` | Dialogue times | Split into 2 entries with shorter durations (1.5-2.5s each) | YES |

### Category: SUBTITLE_STYLE

| Finding | File | Parameter | Fix Command | Re-burn? |
|---------|------|-----------|-------------|----------|
| Inconsistent highlights | `*.ass` | `{\rYellow}` tags in Dialogue | Add `{\rYellow}word{\rWhite}` to ALL instances of the same category (all numbers, all brand names, etc.) | YES |
| Font too small / unreadable | `*.ass` | `Fontsize` in Style lines | Change in both White and Yellow styles. Min: 68 (motion), 92 (standalone) | YES |
| Low contrast | `*.ass` | `Outline` in Style | Increase Outline value (current: 5). Or change `OutlineColour` | YES |
| Missing highlights on keywords | `*.ass` | Dialogue text | Add `{\rYellow}keyword{\rWhite}` overrides for numbers, percentages, brand names, power verbs | YES |
| Text cut off at edges | `*.ass` | `MarginL` / `MarginR` in Style | Increase side margins (current: 70). E.g., `70→90` | YES |

### Category: MOTION_ALIGN

| Finding | File | Parameter | Fix Command | Re-render? |
|---------|------|-----------|-------------|------------|
| Text not centered | `motion-pipeline/remotion-agent/src/compositions/{{MOTION_COMPOSITION_NAME}}.tsx` | `textAlign`, `alignItems` | Add `textAlign: "center"` to text elements, `alignItems: "center"` to parent flex | YES + re-burn |
| Elements misaligned | Same .tsx | `justifyContent`, `gap` | Fix flex properties in the specific Scene component | YES + re-burn |

### Category: MOTION_TIMING

| Finding | File | Parameter | Fix Command | Re-render? |
|---------|------|-----------|-------------|------------|
| Animation out of sync with narration | Same .tsx | `Sequence from` / `durationInFrames` | Adjust the `<Sequence from={X} durationInFrames={Y}>` for the affected scene. Calculate: `from = timestamp_seconds * 25` | YES + re-burn |
| Counter ticks too fast | Same .tsx | `interpolate` range | Widen the frame range so numbers hold 0.3s (8 frames) per significant value | YES + re-burn |
| Animation too slow / dead moment | Same .tsx | `durationInFrames` | Reduce scene duration, increase animation speed via spring config | YES + re-burn |

### Category: MOTION_OVERLAP

| Finding | File | Parameter | Fix Command | Re-render? |
|---------|------|-----------|-------------|------------|
| Motion graphics extend below px 768 | Same .tsx | `motionH`, element sizes, `overflow: "hidden"` | Verify `motionH = Math.round(height * 0.4)`. Add `overflow: "hidden"` to SceneLayout wrapper. Reduce oversized elements | YES + re-burn |

### Category: MOTION_DUPLICATE

| Finding | File | Parameter | Fix Command | Re-render? |
|---------|------|-----------|-------------|------------|
| Motion text duplicates the concurrent subtitle text (double subtitling) | Same .tsx | Scene text content | Replace the transcription with a distilled complement: PunchTitle conclusion/label, brand name, CountUp number, DrawBars comparison, IconDraw, or a 3-6 keyword burst. ≤3 words shared with the spoken sentence, never 4+ consecutive (MOTION_DESIGN_SYSTEM.md §2.5) | YES + re-burn |

### Category: AVATAR_FRAME

| Finding | File | Parameter | Fix Command | Re-render? |
|---------|------|-----------|-------------|------------|
| Head clipped at top | Same .tsx | `objectPosition` on OffthreadVideo style | Change from `"center top"` to `"center 10%"` or similar | YES + re-burn |
| Person too small | Same .tsx | `objectFit` / `transform: scale` | Adjust scale or objectFit on the video container div | YES + re-burn |
| Too much empty space | Same .tsx | video container height | Adjust `videoH` calculation or `objectPosition` | YES + re-burn |

### Category: AUDIO_SYNC / AUDIO_QUALITY

**UNFIXABLE** — Audio comes from HeyGen and is immutable.
- Log the finding
- Deductions from Gemini stand (do NOT override)
- If audio issues alone cause grade < threshold after `config.qc.max_iterations` iterations → stop and report to the user

### Category: PACING / COMPOSITION

| Finding | Fix Source | Action |
|---------|-----------|--------|
| No hook in first 2 seconds | Motion .tsx | Make Scene 1 animation start at frame 0 (not delayed). Add immediate text/icon appearance |
| Dead moment > 2s | Motion .tsx | Fill gap with transition animation or extend adjacent scene duration |
| Bottom UI overlap | ASS file | Adjust MarginV (see SUBTITLE_POSITION) |

### Re-render Decision Tree

```
If ANY motion fix applied:
 1. Edit Remotion .tsx → re-render _motion.mp4
 2. Re-insert b-rolls → new _broll.mp4
 3. Re-burn subtitles → new _final.mp4
 4. Re-add music → new _music.mp4
 5. Re-submit _music.mp4 to QC

If ONLY subtitle fixes applied:
 1. Edit ASS file → re-burn on existing _broll.mp4 → new _final.mp4
 2. Re-add music → new _music.mp4
 3. Re-submit _music.mp4 to QC

If ONLY unfixable issues remain:
 1. Log issues, resubmit as-is (Gemini may grade differently on re-analysis)
 2. After `config.qc.max_iterations` iterations below the threshold: stop and report to the user
```

---

## Lessons Learned System (CRITICAL)

### After EVERY QC analysis (pass or fail):

1. **Read the full Gemini analysis**
2. **For each issue found**, determine:
 - Is this a NEW issue never seen before? → Add to `qc-pipeline/active-rules.md`
 - Is this a REPEAT of an existing lesson? → Strengthen the existing rule
3. **For each new lesson**, write:
 - The problem description
 - The root cause (which config/parameter/prompt caused it)
 - The permanent fix (what to change in future pipeline runs)
 - The file(s) to update (e.g., SUBTITLE_INSTRUCTIONS.md, MOTION_INSTRUCTIONS.md)
4. **Update the source files** — modify the actual instruction files, templates, or configs so the mistake CANNOT recur

### What "permanent fix" means:

- If Gemini says subtitles are too low → update the MarginV value in `SUBTITLE_INSTRUCTIONS.md`, `FULL_PIPELINE.md`, and the ASS template
- If Gemini says motion text is too small → update the minimum font size rule in `MOTION_INSTRUCTIONS.md`
- If Gemini says subtitle lines are too long → add a stricter word-per-line limit to subtitle instructions
- If Gemini says timing is off → add a timing alignment check step to the pipeline

**The goal is ZERO repeat findings.** Every issue Gemini catches should be caught exactly ONCE, then permanently prevented.

---

## QC Loop Flow (Pseudocode)

```
iteration = 0
max_iterations = config.qc.max_iterations # default 3
threshold = config.qc.threshold # default 75

WHILE iteration < max_iterations:
 1. Upload _final.mp4 to Gemini File API
 2. Wait for ACTIVE state
 3. Send analysis prompt
 4. Parse grade and issues
 5. STEP 5.6 — SELF-IMPROVE: turn every problem hit this iteration (QC findings AND pipeline
 friction: bugs, retries, manual workarounds) into a permanent fix to the source
 file/script/skill/template. Runs on PASS and on FAIL. (See Step 5.6 above.)

 IF grade >= threshold:
 LOG "QC PASS (iteration {iteration+1}): Grade {grade}/100"
 RUN Step 5.6 (Self-Improve) — fix any friction even on a pass
 UPDATE active-rules.md with any new findings
 UPDATE source instruction files with permanent fixes
 PROCEED to Phase 11 (Comment→DM → mark-ready)
 BREAK

 ELSE:
 LOG "QC FAIL (iteration {iteration+1}): Grade {grade}/100"
 *** DO NOT override this grade. DO NOT rationalize. DO NOT skip to posting. ***
 PARSE all Critical and Major issues from Gemini's analysis
 FOR each issue:
 DETERMINE fix action (subtitle param → Phase 4, motion code → Phase 3, avatar CSS → Phase 3)
 APPLY the fix that Gemini specifically requested (use the cheapest effective lever:
 clean re-read for documented hallucination-family findings (QCR-012/013);
 targeted edit + re-render for real defects)
 RUN Step 5.6 (Self-Improve) — permanently harden the pipeline against what went wrong
 RE-RENDER affected phases (motion → subtitles → _final.mp4)
 UPDATE active-rules.md with new findings
 UPDATE source instruction files with permanent fixes
 iteration += 1

IF iteration == max_iterations AND grade < threshold:
 LOG "QC ESCALATE: Failed {max_iterations} iterations. Grade: {grade}/100"
 PRINT full Gemini analysis for human review
 REPORT to the user: "Video scored {grade}/100 after {max_iterations} QC iterations" + the full analysis, then STOP
 *** WAIT for the user. NEVER post without explicit approval when grade < threshold. ***
```

---

## Token Cost Estimate

Per QC analysis call:
- **Input:** ~18-20K tokens (video frames + audio + text prompt)
- **Output:** ~1.5-3K tokens (analysis text)
- **Thinking:** ~3-5K tokens (internal reasoning)
- **Total:** ~25K tokens per call
- **Estimated cost:** ~$0.01-0.02 per analysis (Gemini 2.5 Flash pricing)
- **Per video (1-`max_iterations` reads):** ~$0.01-0.10

---

## Integration with Pipeline Log (Phase 7)

After QC passes, add these columns to the pipeline-log.csv:

| Column | Description | Example |
|--------|-------------|---------|
| `qc_grade` | Final QC grade | `78` |
| `qc_iterations` | Number of QC loops | `2` |
| `qc_issues_found` | Count of issues in first analysis | `5` |
| `qc_issues_fixed` | Count of issues fixed before pass | `4` |

---

## Authority Hierarchy (when QC is enabled — NEVER OVERRIDE)

**Gemini's grade is the FINAL AUTHORITY on video quality.** The agent MUST NOT:
- Override Gemini's grade based on its own frame analysis
- Dismiss Gemini findings as "phantom" or "hallucinated" without fixing them
- Invent an "effective grade" that differs from Gemini's actual grade
- Skip the fix-and-resubmit loop by rationalizing that issues are "standard" or "intentional"
- Proceed to posting with a grade below `config.qc.threshold`

**Frame verification (Phase 3.7 and Phase 4 Step 7) is a PRE-CHECK tool** — it catches obvious rendering failures early so you don't waste a QC iteration. But it does NOT override Gemini. If your frames look fine but Gemini says there's a problem, **Gemini wins**. Fix the issue, re-render, and resubmit.

**The only escape from a failing grade is:**
1. Fix the issues Gemini identified and resubmit (up to `config.qc.max_iterations` iterations), running Step 5.6 (Self-Improve) each time
2. After `config.qc.max_iterations` failed iterations, stop and report to the user — NEVER silently bypass, NEVER post

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Gemini returns 429 (quota exceeded) | A per-minute cap clears with a 20-60s backoff and a retry. A daily/monthly cap does not: leave the run resumable at `resume_from=10` (the `_music.mp4` is intact) and re-run QC as-is once the key has quota, or raise the project's quota. Never switch to another QC path. |
| File stuck in PROCESSING | Wait up to 2 min. If still stuck, re-upload. |
| Grade parsing fails (no "GRADE:" line) | Re-run analysis with explicit instruction to end with "GRADE: X/100" |
| Analysis is cut short | Increase `maxOutputTokens` to 16384 |
| Gemini grade seems harsh | Fix every fixable issue and resubmit. Do NOT override the grade. The iteration loop exists for this purpose. |
| Grade < threshold after `config.qc.max_iterations` iterations | Stop and report to the user with the full analysis — never post, never decide alone. |
