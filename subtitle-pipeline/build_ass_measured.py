#!/usr/bin/env python3
"""build_ass_measured.py — avatar captions built from the AUDIO (measured), not from a proportional guess.

Why it exists: an independent review of four avatar videos rejected all of them for the SAME
classes of caption defects, every one born from how captions used to be built:
  * `build_srt_from_script.py` distribui o tempo PROPORCIONALMENTE por caracteres (ou por trechos de
    VAD) — nunca mede onde cada palavra começa. Resultado: blocos até 418 ms antes da voz (a4 v2),
    340 ms (a1 v2), 170 ms (a2 v1).
  * `srt_to_ass.py` re-fatia um segmento de 7 palavras em 5 + 2 → blocos de DUAS palavras (a2 v1
    2×, a4 v1 4×; a régua da casa é 3–5), e estica cada cue até a seguinte (mexeu a fronteira do
    CTA em 0,3 s no a1).
  * o tempo das legendas era conferido contra o MESMO arquivo que as gerou (`word_times.json` do
    ASR com pausa esticada) — conferência circular, que sempre fecha.
  * o áudio que vai ao ar está **48 ms atrasado** em relação à narração limpa do HeyGen, de forma
    constante nos 4 vídeos (medido por correlação cruzada de envelope: `_avatar.mp4` × `_music.mp4`).
    O `add_music.py` isolado dá 0 ms — o atraso nasce no render do Remotion. Quem temporiza pela
    narração limpa entrega tudo ~48 ms cedo; somado a uma fronteira de plano visual, vira 300–400 ms.

O que este script faz, na ordem, e o que cada passo prova:
  1. Word-level ASR on the narration (mlx-whisper / faster-whisper / whisper, large-v3-turbo) — the TIME source.
  2. Alinhamento char-a-char do ROTEIRO (fonte do TEXTO; o HeyGen lê verbatim) com o ASR — cada
     token do roteiro herda o tempo das palavras do ASR que casaram com os seus caracteres;
     merges/splits («coreyhaines31» × «corey haines 31») ficam certos por construção; token sem
     casamento interpola entre vizinhos por comprimento.
  3. ÂNCORA ACÚSTICA: todo token precedido de pausa ≥ 0,15 s tem o início re-medido pelo envelope
     RMS da narração (`acoustic.onset_near`, a mesma régua do gate) — é o que corrige o ASR que
     estica a pausa antes de palavra curta («E», «Seu», «Tudo»). O ASR marca; o áudio decide.
  4. DESLOCAMENTO ao áudio que vai ao ar (`--align-to <vídeo>`): correlação cruzada de envelope a
     1 ms entre a narração e o alvo → lag constante aplicado a todos os tempos. Sem `--align-to`
     o script avisa que a legenda vale só para a narração limpa.
  5. AGRUPAMENTO por programação dinâmica com as regras da casa como restrições DURAS: 3–5 palavras
     por bloco, exibição ≥ 0,70 s (início do próximo − início deste), ≤ 3 palavras e ≤ 18 caracteres
     por linha, ≤ 2 linhas (geometria de `srt_to_ass.py`). Custos brandos: bloco que não termina em
     pontuação, pontuação forte no meio, pausa > 0,45 s dentro do bloco, exibição > 3,2 s, linha de
     uma palavra. Se não existir partição viável, sai != 0 dizendo onde — não afrouxa a régua.
  6. Cada evento termina onde o próximo começa quando a voz continua (zero «piscada», classe C8);
     em pausa longa, termina 0,30 s depois da última palavra. O CTA falado (`--cta-text`) fica FORA
     do corpo — é o card que o cobre — e o script devolve `cta_onset` para o card começar antes.
  7. GATES on the produced file itself, with the vendored `delivery_gates` rulers: rhythm,
     fonte uniforme, piscada, onset acústico no timeline do alvo; e `srt_to_ass.validate_ass_file`
     para o placement. Só sai 0 se tudo passar. Quem constrói não aprova o QC independente — mas
     não pode gastar uma revisão de 20 min num defeito que 2 s de régua pegam.

Uso:
  python3 subtitle-pipeline/build_ass_measured.py --script <Name>_script.txt \
      --narration motion-pipeline/remotion-agent/public/<Name>_avatar.mp4 \
      --align-to ~/Downloads/<Name>_final.mp4 --cta-text "Comenta PALAVRA aqui embaixo que eu te mando o link." \
      --out-dir ~/Downloads --name <Name>
  # saídas: <Name>.ass  <Name>.srt  <Name>_cues.json  <Name>_tokens.json  <Name>_caption_measure.json
  # --words-json <arquivo> reaproveita um ASR já feito (testes / re-runs); --no-asr-cache ignora.
"""
import argparse, difflib, json, math, os, pathlib, re, subprocess, sys, tempfile, unicodedata

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import srt_to_ass  # geometria/placement canônicos (MOTION_HEADER, add_line_breaks, validate_*)

import acoustic                     # noqa: E402  10 ms RMS + voice onset (same ruler as the gates)
import delivery_gates as dg         # noqa: E402  C1/C3/C4/C8
sys.path.insert(0, str(HERE.parent))
try:
    from lib import config as _cfg  # noqa: E402
    _LANG = (_cfg.get("brand.language", "pt-BR") or "pt-BR").split("-")[0].lower()
except Exception:  # noqa: BLE001
    _LANG = "pt"

FF = acoustic.FF
ASR_MODEL = "mlx-community/whisper-large-v3-turbo"
MINW, MAXW = 3, 5
MIN_SHOW = 0.70          # exibição mínima (início do próximo − início deste); régua C3
PAUSE_ANCHOR = 0.15      # pausa (s) a partir da qual o onset é re-medido no áudio
PAUSE_INSIDE = 0.45      # pausa dentro de um bloco que custa pontos
MAX_SHOW = 3.2
TAIL_HOLD = 0.30         # quanto a legenda fica depois da última palavra, se vier pausa longa
GAP_BRIDGE = 0.60        # pausa até aqui é "ponte": o bloco fica na tela até o próximo começar
FONT = 68


# ------------------------------------------------------------------ texto
def norm(s):
    s = unicodedata.normalize("NFD", s.lower())
    return "".join(c for c in s if not unicodedata.combining(c) and c.isalnum())


_U = ["zero", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove", "dez", "onze", "doze",
      "treze", "catorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"]
_D = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"]
_C = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"]


def _spell_int(n):
    """0–999999 por extenso em PT-BR (sem dependência externa; num2words não está instalado).
    Cobre o que aparece em roteiro de avatar: contagens, anos, estrelas («213», «40», «11»)."""
    if n < 20:
        return _U[n]
    if n < 100:
        d, u = divmod(n, 10)
        return _D[d] + (f" e {_U[u]}" if u else "")
    if n == 100:
        return "cem"
    if n < 1000:
        c, r = divmod(n, 100)
        return _C[c] + (f" e {_spell_int(r)}" if r else "")
    if n < 1000000:
        k, r = divmod(n, 1000)
        head = "mil" if k == 1 else f"{_spell_int(k)} mil"
        if not r:
            return head
        sep = " e " if (r < 100 or r % 100 == 0) else " "
        return head + sep + _spell_int(r)
    return str(n)


def spell_numbers(word):
    """«40» → «quarenta», «213» → «duzentos e treze», «65%» → «sessenta e cinco por cento».
    O roteiro é escrito por extenso (é o que o TTS lê) e o ASR devolve dígitos; sem isto o alinhamento
    char-a-char não casa e o tempo desses tokens vira interpolação (a1: quarenta/seis/onze/três)."""
    def rep(m):
        raw = m.group(0).replace(".", "").replace(",", ".")
        try:
            v = float(raw)
        except ValueError:
            return m.group(0)
        if v.is_integer():
            return _spell_int(int(v))
        i, f = str(raw).split(".")
        return f"{_spell_int(int(i))} vírgula {' '.join(_spell_int(int(c)) for c in f)}"
    w = re.sub(r"\d[\d.,]*", rep, word)
    return w.replace("%", " por cento")


def upper(s):
    return s.upper()


def strong_punct(tok):
    return tok.rstrip("»\"')") and tok.rstrip("»\"')")[-1] in ".!?…"


def any_punct(tok):
    t = tok.rstrip("»\"')")
    return bool(t) and t[-1] in ".!?…,;:"


# ------------------------------------------------------------------ áudio
def to_wav16(src):
    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    subprocess.run([FF, "-v", "error", "-i", str(src), "-ac", "1", "-ar", "16000", "-f", "wav", tmp, "-y"], check=True)
    return tmp


def _collect(result):
    out = []
    for seg in result.get("segments", []):
        for w in seg.get("words", []):
            txt = (w.get("word") or "").strip()
            if txt:
                out.append({"word": txt, "start": float(w["start"]), "end": float(w["end"])})
    return out


def asr_words(wav, model=ASR_MODEL, language=None):
    """Word-level ASR through the first backend installed: mlx_whisper (Apple Silicon), faster_whisper
    (any machine, GPU/CPU), or openai-whisper. `--words-json` skips ASR entirely."""
    language = language or _LANG
    try:
        import mlx_whisper
        r = mlx_whisper.transcribe(wav, path_or_hf_repo=model, language=language, word_timestamps=True,
                                   condition_on_previous_text=False)
        return _collect(r)
    except ImportError:
        pass
    try:
        from faster_whisper import WhisperModel
        size = re.sub(r"^.*whisper-", "", model) or "large-v3-turbo"
        m = WhisperModel(size, device="auto", compute_type="auto")
        segs, _ = m.transcribe(wav, language=language, word_timestamps=True, condition_on_previous_text=False)
        out = []
        for seg in segs:
            for w in (seg.words or []):
                if (w.word or "").strip():
                    out.append({"word": w.word.strip(), "start": float(w.start), "end": float(w.end)})
        return out
    except ImportError:
        pass
    try:
        import whisper
        m = whisper.load_model("turbo")
        return _collect(m.transcribe(wav, language=language, word_timestamps=True, condition_on_previous_text=False))
    except ImportError:
        sys.exit("no local word-level ASR installed — `pip install mlx-whisper` (Apple Silicon) or `pip install faster-whisper`, "
                 "or pass --words-json with word timings from another tool")


def load_words(path):
    """ASR de qualquer produtor deste run: {word|w|text, start|s|t0, end|e|t1} (ou {words:[...]})."""
    d = json.loads(pathlib.Path(path).read_text(encoding="utf-8"))
    items = d if isinstance(d, list) else (d.get("words") or d.get("segments") or [])
    out = []
    for w in items:
        txt = w.get("word", w.get("w", w.get("text", "")))
        s = w.get("start", w.get("s", w.get("t0"))); e = w.get("end", w.get("e", w.get("t1")))
        if txt and s is not None and e is not None:
            out.append({"word": str(txt).strip(), "start": float(s), "end": float(e)})
    return out


def envelope_ms(path, sr=16000):
    """envelope RMS a 1 ms (para a correlação cruzada entre narração e alvo)."""
    import numpy as np
    raw = subprocess.run([FF, "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32)
    hop = sr // 1000; n = len(x) // hop
    return np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(axis=1))


def measure_lag_ms(narration, target, max_ms=300):
    """Quanto o áudio do ALVO está atrasado (+) ou adiantado (−) em relação à narração, em ms.
    Correlação cruzada normalizada dos envelopes a 1 ms; devolve (lag_ms, correlação)."""
    import numpy as np
    a = envelope_ms(narration); b = envelope_ms(target)
    n = min(len(a), len(b)); a = a[:n] - a[:n].mean(); b = b[:n] - b[:n].mean()
    na, nb = np.linalg.norm(a) + 1e-9, np.linalg.norm(b) + 1e-9
    best = (0, -1.0)
    for lag in range(-max_ms, max_ms + 1):
        c = (np.dot(a[:n - lag], b[lag:]) if lag >= 0 else np.dot(a[-lag:], b[:n + lag])) / (na * nb)
        if c > best[1]:
            best = (lag, float(c))
    return best


# ------------------------------------------------------------------ alinhamento roteiro ↔ ASR
def align(script_tokens, words):
    """Cada token do roteiro recebe start/end das palavras do ASR cujos CARACTERES casaram com os
    seus (SequenceMatcher char-a-char sobre o texto normalizado). Token sem casamento interpola."""
    s_chars, s_map = [], []
    for i, t in enumerate(script_tokens):
        for ch in norm(spell_numbers(t)):
            s_chars.append(ch); s_map.append(i)
    a_chars, a_map = [], []
    for j, w in enumerate(words):
        for ch in norm(spell_numbers(w["word"])):
            a_chars.append(ch); a_map.append(j)
    sm = difflib.SequenceMatcher(None, "".join(s_chars), "".join(a_chars), autojunk=False)
    hit = {}  # token idx -> set(word idx)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            hit.setdefault(s_map[blk.a + k], set()).add(a_map[blk.b + k])
    toks = []
    for i, t in enumerate(script_tokens):
        if i in hit:
            ws = sorted(hit[i])
            toks.append({"tok": t, "start": words[ws[0]]["start"], "end": words[ws[-1]]["end"],
                         "asr": " ".join(words[j]["word"] for j in ws), "matched": True})
        else:
            toks.append({"tok": t, "start": None, "end": None, "asr": None, "matched": False})
    # interpolação dos não casados, por comprimento, entre âncoras vizinhas
    n = len(toks)
    i = 0
    while i < n:
        if toks[i]["matched"]:
            i += 1; continue
        j = i
        while j < n and not toks[j]["matched"]:
            j += 1
        lo = toks[i - 1]["end"] if i > 0 else (toks[j]["start"] if j < n else 0.0)
        hi = toks[j]["start"] if j < n else (toks[i - 1]["end"] + 0.3 * (j - i) if i > 0 else 0.0)
        if hi <= lo:
            hi = lo + 0.12 * (j - i)
        total = sum(max(1, len(norm(toks[k]["tok"]))) for k in range(i, j))
        t = lo
        for k in range(i, j):
            d = (hi - lo) * max(1, len(norm(toks[k]["tok"]))) / total
            toks[k]["start"], toks[k]["end"] = round(t, 3), round(t + d, 3); t += d
        i = j
    # monotonia
    for k in range(1, n):
        if toks[k]["start"] < toks[k - 1]["end"]:
            toks[k]["start"] = toks[k - 1]["end"]
        if toks[k]["end"] < toks[k]["start"] + 0.04:
            toks[k]["end"] = toks[k]["start"] + 0.04
    return toks


def anchor_onsets(toks, rms, pause=PAUSE_ANCHOR):
    """Token cujo início vem depois de um VALE real no áudio tem o início trocado pelo onset acústico
    (`acoustic.onset_near`). A pausa é lida no envelope (`acoustic.pause_before`), não no gap do ASR:
    o ASR estica a pausa para dentro da palavra seguinte e esconde do critério exatamente o token que
    mais precisa ser re-medido («Isso», a1: gap ASR 0,10 s, vale real 0,30 s, erro 230 ms)."""
    moved = []
    for k, t in enumerate(toks):
        prev_end = toks[k - 1]["end"] if k > 0 else None
        lo = (prev_end - 0.20) if prev_end is not None else None
        on = acoustic.onset_near(rms, t["start"], win=0.40, t_start=0.0, lo=lo)
        if on is None:
            continue
        # o onset só vale para ESTE token: tem de estar antes do fim (ASR) da palavra + folga
        if on > t["end"] + 0.05:
            continue
        real_pause = acoustic.pause_before(rms, on)
        if real_pause < pause and k > 0:
            continue
        if abs(on - t["start"]) > 0.005:
            moved.append({"tok": t["tok"], "asr_start": t["start"], "onset": round(on, 3),
                          "pause_s": real_pause, "delta_ms": round((on - t["start"]) * 1000)})
            t["end"] = max(round(on + 0.04, 3), t["end"]) if on > t["start"] else t["end"]
            t["start"] = round(on, 3)
    return moved


def acoustic_pauses(toks, rms, lag_s=0.0):
    """pausa ACÚSTICA antes de cada token (no timeline da narração) — é o que o gate de onset usa
    para decidir quem é candidato a medição; o gap do ASR não serve (ver anchor_onsets)."""
    return [acoustic.pause_before(rms, t["start"] - lag_s) if k > 0 else 9.9 for k, t in enumerate(toks)]


# ------------------------------------------------------------------ agrupamento (DP)
def cue_lines(text):
    """linhas visuais pela geometria de srt_to_ass (≤3 palavras, ≤18 chars, ≤2 linhas) ou None."""
    wrapped = srt_to_ass.add_line_breaks(text, font_size=FONT)
    lines = wrapped.split("\\N")
    if len(lines) > 2:
        return None
    for ln in lines:
        if len(ln.split()) > 3 or srt_to_ass.visible_len(ln) > 18:
            return None
    return lines


def cost_of(toks, i, j, show):
    words = toks[i:j]
    c = abs(len(words) - 4) * 0.5
    if not any_punct(words[-1]["tok"]):
        c += 1.0
    if any(strong_punct(w["tok"]) for w in words[:-1]):
        c += 2.0
    gaps = [words[k + 1]["start"] - words[k]["end"] for k in range(len(words) - 1)]
    if gaps and max(gaps) > PAUSE_INSIDE:
        c += 2.0
    if show > MAX_SHOW:
        c += 1.5
    lines = cue_lines(upper(" ".join(w["tok"] for w in words)))
    if lines is None:
        return None
    if any(len(l.split()) == 1 for l in lines) and len(lines) > 1:
        c += 0.8
    return c


def group(toks, body_end):
    """Partição de toks em blocos de 3–5 palavras com exibição ≥ MIN_SHOW. Devolve lista de (i, j)."""
    n = len(toks)
    INF = float("inf")
    best = [INF] * (n + 1); back = [None] * (n + 1); best[0] = 0.0
    for j in range(1, n + 1):
        for size in range(MINW, MAXW + 1):
            i = j - size
            if i < 0 or best[i] == INF:
                continue
            nxt = toks[j]["start"] if j < n else body_end
            show = nxt - toks[i]["start"]
            if show + 1e-9 < MIN_SHOW:
                continue
            c = cost_of(toks, i, j, show)
            if c is None:
                continue
            if best[i] + c < best[j]:
                best[j] = best[i] + c; back[j] = i
    if best[n] == INF:
        return None
    cuts, j = [], n
    while j > 0:
        i = back[j]; cuts.append((i, j)); j = i
    return list(reversed(cuts))


def explain_infeasible(toks, body_end):
    """quando não há partição: aponta a janela de 3–5 palavras mais rápida (é onde a régua não cabe)."""
    worst = None
    for i in range(len(toks)):
        j = min(len(toks), i + MAXW)
        nxt = toks[j]["start"] if j < len(toks) else body_end
        show = nxt - toks[i]["start"]
        if worst is None or show < worst[0]:
            worst = (show, i, j)
    show, i, j = worst
    return (f"sem partição viável: até {MAXW} palavras a partir de «{' '.join(t['tok'] for t in toks[i:j])}» "
            f"ocupam só {show:.2f} s < {MIN_SHOW} s de exibição — fala a {(j - i) / max(show, 0.01):.1f} palavras/s")


# ------------------------------------------------------------------ eventos / arquivos
def build_events(toks, cuts, body_end):
    ev = []
    for k, (i, j) in enumerate(cuts):
        start = toks[i]["start"]
        last_end = toks[j - 1]["end"]
        nxt = toks[cuts[k + 1][0]]["start"] if k + 1 < len(cuts) else body_end
        if nxt - last_end <= GAP_BRIDGE:
            end = nxt                              # voz continua: sem piscada
        else:
            end = min(last_end + TAIL_HOLD, nxt)   # pausa longa: solta a legenda
        text = upper(" ".join(t["tok"] for t in toks[i:j]))
        # grade do .ass = centésimos: início arredondado PARA BAIXO (a legenda nunca entra depois da
        # palavra por arredondamento) e fim para cima; sem isto o token em 60,528 s virava «fala sem
        # legenda» de 2 ms contra o evento em 60,53 s (measured on a real run)
        ev.append({"i": i, "j": j, "start": math.floor(start * 100) / 100, "end": math.ceil(end * 100) / 100,
                   "text": text, "lines": cue_lines(text)})
    # ... mas o floor no início + ceil no fim fazem o evento terminar UM CENTÉSIMO DEPOIS do começo do
    # seguinte sempre que a voz continua (end == nxt antes de arredondar). Esses 10 ms de sobreposição
    # acionam a detecção de colisão do libass (`Collisions: Normal`), que empurra a cue nova PARA CIMA
    # da anterior e a deixa 146 px fora do lugar pelo resto da exibição — com as duas legendas na tela
    # ao mesmo tempo em parte dos frames. Passa em TODAS as réguas (ritmo/fonte/piscada/onset/placement)
    # porque elas leem o arquivo, e só aparece no render (seen on real runs).
    # Aparar o fim no início do seguinte preserva o "sem piscada" (a cue nova entra no mesmo centésimo).
    for a, b in zip(ev, ev[1:]):
        if a["end"] > b["start"]:
            a["end"] = b["start"]
    return ev


def ass_time(t):
    t = max(0.0, t); h = int(t // 3600); m = int((t % 3600) // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def srt_time(t):
    t = max(0.0, t); h = int(t // 3600); m = int((t % 3600) // 60); s = int(t % 60); ms = int(round((t - int(t)) * 1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_ass(events, path):
    lines = [srt_to_ass.MOTION_HEADER]
    for e in events:
        body = "\\N".join(e["lines"])   # fora da f-string: Python < 3.12 recusa barra na expressão
        lines.append(f"Dialogue: 0,{ass_time(e['start'])},{ass_time(e['end'])},White,,0,0,0,,{body}")
    pathlib.Path(path).write_text("\n".join(lines) + "\n", encoding="utf-8")


def write_srt(events, path):
    out = []
    for k, e in enumerate(events, 1):
        out.append(f"{k}\n{srt_time(e['start'])} --> {srt_time(e['end'])}\n{' '.join(e['lines'])}\n")
    pathlib.Path(path).write_text("\n".join(out) + "\n", encoding="utf-8")


# ------------------------------------------------------------------ gates no produzido
def run_gates(ass_path, toks, body_end, rms, lag_s):
    text = pathlib.Path(ass_path).read_text(encoding="utf-8")
    words_out = [{"w": t["tok"], "t0": t["start"], "t1": t["end"]} for t in toks]
    pauses = acoustic_pauses(toks, rms, lag_s)
    events = dg.ass_events(text)
    g = {
        "caption_rhythm": dg.rhythm_gate(text),
        "caption_font_uniform": dg.font_uniform_gate(text, body_fs=FONT),
        "caption_blink": dg.caption_blink_gate(text, words_out, body_end),
        # onset no timeline do ALVO: o envelope é da narração, deslocado pelo lag medido
        "caption_onset_acoustic": dg.onset_gate_from_profile(events, words_out, pauses, rms, t_start=lag_s),
    }
    rc = subprocess.run([sys.executable, str(HERE / "srt_to_ass.py"), "--validate-only", str(ass_path)],
                        capture_output=True, text=True)
    g["placement_validate_only"] = {"pass": rc.returncode == 0, "tail": (rc.stdout + rc.stderr).strip()[-300:]}
    g["pass"] = all(v.get("pass") for v in g.values() if isinstance(v, dict))
    return g


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--script", required=True); ap.add_argument("--narration", required=True)
    ap.add_argument("--align-to", default=None, help="vídeo/áudio que VAI AO AR (mede e aplica o lag)")
    ap.add_argument("--cta-text", default=None, help="frase do CTA falado, verbatim (fica fora do corpo)")
    ap.add_argument("--out-dir", required=True); ap.add_argument("--name", required=True)
    ap.add_argument("--words-json", default=None, help="ASR pronto [{word,start,end}] (pula o whisper)")
    ap.add_argument("--model", default=ASR_MODEL, help="mlx-community/whisper-* repo (mlx) or a faster-whisper size")
    ap.add_argument("--language", default=None, help="ASR language code (default: config brand.language)")
    ap.add_argument("--no-gates", action="store_true", help="só constrói (para diagnóstico) — NÃO use para entregar")
    a = ap.parse_args()

    out = pathlib.Path(os.path.expanduser(a.out_dir)); out.mkdir(parents=True, exist_ok=True)
    script = pathlib.Path(a.script).read_text(encoding="utf-8").strip()
    s_tokens = script.split()

    # 1. ASR
    wav = to_wav16(a.narration)
    try:
        words = load_words(a.words_json) if a.words_json else asr_words(wav, a.model, a.language)
        rms, _ = acoustic.rms_profile(wav)
    finally:
        pathlib.Path(wav).unlink(missing_ok=True)
    if not words:
        sys.exit("ASR vazio — a narração tem voz?")

    # 2. alinhamento + 3. âncora acústica
    toks = align(s_tokens, words)
    unmatched = [t["tok"] for t in toks if not t["matched"]]
    moved = anchor_onsets(toks, rms)

    # CTA fora do corpo
    cta_idx = None
    if a.cta_text:
        cta = [norm(x) for x in a.cta_text.split()]
        body = [norm(t["tok"]) for t in toks]
        for start in range(len(body) - len(cta), -1, -1):
            if body[start:start + len(cta)] == cta:
                cta_idx = start; break
        if cta_idx is None:
            sys.exit(f"CTA «{a.cta_text}» não encontrado verbatim no roteiro — o card não teria onset")
    body_toks = toks[:cta_idx] if cta_idx is not None else toks
    for k, tk in enumerate(toks):
        tk["cta"] = bool(cta_idx is not None and k >= cta_idx)   # o gate de ingest exclui o CTA da piscada/onset
    narr_end = words[-1]["end"] + TAIL_HOLD
    cta_onset_narr = toks[cta_idx]["start"] if cta_idx is not None else None
    body_end_narr = cta_onset_narr if cta_onset_narr is not None else narr_end

    # 4. lag para o alvo
    lag_ms, corr = (0, 1.0)
    if a.align_to:
        lag_ms, corr = measure_lag_ms(a.narration, a.align_to)
        if corr < 0.6:
            sys.exit(f"correlação narração×alvo = {corr:.2f} (< 0,6): os arquivos não são o mesmo áudio — nada alinhado")
    lag = lag_ms / 1000.0
    for t in toks:
        t["start"] = round(t["start"] + lag, 3); t["end"] = round(t["end"] + lag, 3)
    body_end = body_end_narr + lag
    cta_onset = (cta_onset_narr + lag) if cta_onset_narr is not None else None

    # 5. agrupamento
    cuts = group(body_toks, body_end)
    if cuts is None:
        sys.exit(explain_infeasible(body_toks, body_end))
    events = build_events(body_toks, cuts, body_end)

    # 6. arquivos
    ass_p, srt_p = out / f"{a.name}.ass", out / f"{a.name}.srt"
    write_ass(events, ass_p); write_srt(events, srt_p)
    (out / f"{a.name}_cues.json").write_text(json.dumps(events, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / f"{a.name}_tokens.json").write_text(json.dumps(toks, ensure_ascii=False, indent=1), encoding="utf-8")

    # 7. gates
    gates = None if a.no_gates else run_gates(ass_p, body_toks, body_end, rms, lag)
    shows = [((events[k + 1]["start"] if k + 1 < len(events) else body_end) - e["start"]) for k, e in enumerate(events)]
    measure = {
        "name": a.name, "narration": str(a.narration), "align_to": a.align_to,
        "lag_ms": lag_ms, "lag_corr": round(corr, 3),
        "asr_model": None if a.words_json else a.model, "asr_words": len(words),
        "script_tokens": len(s_tokens), "unmatched_tokens": unmatched,
        "onsets_reanchored": moved, "cta_onset_s": cta_onset, "body_end_s": round(body_end, 3),
        "events": len(events), "words_per_event": [e["j"] - e["i"] for e in events],
        "min_show_s": round(min(shows), 3) if shows else None, "median_show_s": round(sorted(shows)[len(shows) // 2], 3) if shows else None,
        "gates": gates,
    }
    (out / f"{a.name}_caption_measure.json").write_text(json.dumps(measure, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"[build_ass_measured] {a.name}: {len(words)} palavras ASR · {len(s_tokens)} tokens do roteiro "
          f"({len(unmatched)} interpolados) · {len(moved)} onsets re-ancorados (maior "
          f"{max((abs(m['delta_ms']) for m in moved), default=0)} ms) · lag {lag_ms:+d} ms (corr {corr:.3f})")
    print(f"  {len(events)} eventos · palavras {min(measure['words_per_event'])}–{max(measure['words_per_event'])} · "
          f"exibição mín {measure['min_show_s']} s · CTA onset {cta_onset if cta_onset is None else round(cta_onset, 3)} s")
    if gates:
        for k, v in gates.items():
            if isinstance(v, dict):
                extra = ""
                if k == "caption_onset_acoustic":
                    extra = f" pior {v.get('worst_ms')} ms ({v.get('measured')} medidos/{v.get('unmeasured')} sem vale)"
                if k == "caption_blink":
                    extra = f" {v.get('gaps')} vãos/{v.get('total_ms')} ms"
                if k == "caption_rhythm":
                    extra = f" dur mín {v.get('min_dur_s')} s, palavras {v.get('words_min')}–{v.get('words_max')}"
                print(f"  {'OK ' if v.get('pass') else 'FALHA'} {k}{extra}")
        print(f"-> {ass_p}  ({'PASS' if gates['pass'] else 'REPROVADO — não entregue'})")
        return 0 if gates["pass"] else 1
    print(f"-> {ass_p}  (sem gates — só diagnóstico)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
