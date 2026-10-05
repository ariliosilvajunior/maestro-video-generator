#!/usr/bin/env python3
"""acoustic.py — the shared ACOUSTIC ruler (10 ms RMS envelope + voice onset after a pause).

Vendored from the long-form-to-shorts toolkit of the same author; `build_ass_measured.py` and
`delivery_gates.py` import THIS module so the rule lives in exactly one place.

Por que existe (2º olhar do run V1nMBWzXsCI, classe C1): `caption_sync.py` media
ASR contra ASR — quando o whisper estica a pausa antes de uma palavra curta («E», «Seu»), os dois
modelos erram juntos e a régua dizia −20 ms onde havia 180 ms de silêncio digital. O árbitro de
OUTRA natureza é o envelope de energia do áudio ENTREGUE. Esta é a única implementação: `realign.py`
(arbitra os tempos antes de legendar) e `delivery_gates.onset_gate` (reprova o entregue) chamam
AS MESMAS funções — reimplementar inline é defeito (CLAUDE.md, «A régua mora num lugar só»).

Heurística de onset (calibrada contra os traces do revisor em `reports/second-eye-frames/`):
  * quiet: ≥ 3 frames de 10 ms consecutivos < QUIET (−52 dBFS) = vale real;
  * departure: 1º frame depois do vale com RMS ≥ QUIET = a voz começa a sair do vale (é aqui que
    a fricativa de «Seu» entra: 674.31 −82 → 674.32 −56 na fonte);
  * confirm: dentro de CONFIRM (120 ms) algum frame ≥ FLOOR (−42 dBFS) — senão era um estalo e o
    vale continua. A versão antiga exigia que o PRÓPRIO frame ≥ FLOOR viesse logo após 3 frames
    < QUIET, e por isso não via onsets que sobem em rampa (fricativas): ela devolvia [] para «Seu».
"""
import pathlib, subprocess, tempfile, wave

import numpy as np

import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__))))
from lib.ffmpeg import find_ffmpeg as _find_ffmpeg  # noqa: E402
FF = _find_ffmpeg()
HOP_S = 0.01
QUIET, FLOOR, CONFIRM_S, MIN_QUIET_FRAMES = -52.0, -42.0, 0.12, 3
VALLEY, MIN_VALLEY_FRAMES = -45.0, 10   # o vale tem de ser PAUSA (≥ 100 ms < −45), não oclusiva (30–90 ms)


def rms_profile(src, t0=None, t1=None, sr=16000):
    """RMS em dBFS por frame de 10 ms de <src> (mp4/wav/m4a) — mono 16 kHz. Devolve (rms, t_start)."""
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as f:
        tmp = f.name
    cmd = [FF, '-v', 'error']
    if t0 is not None:
        cmd += ['-ss', f'{t0:.3f}']
    if t1 is not None and t0 is not None:
        cmd += ['-t', f'{t1 - t0:.3f}']
    cmd += ['-i', str(src), '-ac', '1', '-ar', str(sr), '-f', 'wav', tmp, '-y']
    subprocess.run(cmd, check=True)
    w = wave.open(tmp)
    x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    w.close(); pathlib.Path(tmp).unlink(missing_ok=True)
    return rms_from_samples(x, sr), (t0 or 0.0)


def rms_from_samples(x, sr=16000):
    hop = int(round(sr * HOP_S)); n = len(x) // hop
    if n == 0:
        return np.zeros(0)
    y = x[:n * hop].reshape(n, hop)
    return 20 * np.log10(np.sqrt(np.mean(y ** 2, axis=1)) + 1e-9)


def find_onsets(rms, quiet=QUIET, floor=FLOOR, confirm_s=CONFIRM_S, min_quiet=MIN_QUIET_FRAMES,
                valley=VALLEY, min_valley=MIN_VALLEY_FRAMES):
    """Índices de frame (10 ms) em que a voz RECOMEÇA depois de um vale real.

    departure = 1º frame ≥ `quiet` depois de uma corrida de frames < `quiet`. Aceito quando, olhando para
    trás a partir dele, os frames < `valley` (−45) somam ≥ `min_valley` (100 ms — a oclusiva do «k» de
    «cookie» dura 30–90 ms e NÃO é pausa: um bloco real dava +290 ms falsos), dos quais ≥ `min_quiet`
    < `quiet`; e quando algum frame nos `confirm_s` seguintes chega a `floor` (senão foi estalo)."""
    rms = np.asarray(rms); n = len(rms); c = int(round(confirm_s / HOP_S))
    out = []
    for i in range(1, n):
        if not (rms[i] >= quiet and rms[i - 1] < quiet):
            continue
        k = i - 1; L = Q = 0
        while k >= 0 and rms[k] < valley:
            L += 1; Q += rms[k] < quiet; k -= 1
        if L >= min_valley and Q >= min_quiet and np.any(rms[i:i + c] >= floor):
            out.append(i)
    return out


def onset_near(rms, t, win=0.40, t_start=0.0, lo=None, **kw):
    """Onset (segundos) MAIS PRÓXIMO de `t` dentro de ±win, depois de `lo` (fim da palavra anterior).
    None quando não há vale+subida ali — sem pausa acústica não existe onset a medir."""
    cands = [t_start + i * HOP_S for i in find_onsets(rms, **kw)]
    cands = [x for x in cands if abs(x - t) <= win + 1e-9 and (lo is None or x > lo)]
    return min(cands, key=lambda x: abs(x - t)) if cands else None


def trace(rms, t_start, a, b):
    """string '(t,dB) …' do trecho [a,b] — vai para o qc.json como prova legível."""
    i0 = max(0, int(round((a - t_start) / HOP_S))); i1 = min(len(rms), int(round((b - t_start) / HOP_S)))
    return ' '.join(f'({t_start + i * HOP_S:.2f},{rms[i]:.0f})' for i in range(i0, i1))


def pause_before(rms, t, t_start=0.0, valley=VALLEY, max_s=2.0):
    """Segundos de VALE (< `valley` dBFS) imediatamente antes de `t`, medidos no áudio — não no ASR.

    Por que (gerador de legenda dos avatares): a régua «token precedido de pausa ≥ 0,15 s»
    era lida no GAP do ASR. Mas o ASR estica a pausa para dentro da palavra seguinte — «Isso» começou
    no ASR 230 ms antes da voz — e com isso o gap encolhe abaixo de 0,15 s e a pausa real (300 ms de
    vale) SOME do critério: o token que mais precisava de re-medição era o único que nunca era medido.
    A pausa tem de ser lida no envelope: frames < −45 dBFS contíguos antes de `t`, até `max_s`."""
    rms = np.asarray(rms)
    i = int(round((t - t_start) / HOP_S)) - 1
    n = 0
    while i >= 0 and rms[i] < valley and n * HOP_S < max_s:
        n += 1; i -= 1
    return round(n * HOP_S, 3)
