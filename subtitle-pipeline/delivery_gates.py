#!/usr/bin/env python3
"""delivery_gates.py — deterministic caption gates on the DELIVERED file (vendored subset).

Cada função devolve um dict com `pass` e os NÚMEROS que o decidiram; `qc_all.py` só chama e grava —
o REPORT-QC nasce daí. Nenhuma régua daqui é reimplementada em outro lugar (tests/ importam estas
mesmas funções; a calibração em reports/gates-calibration-v2.json também).

  C1 caption_onset_acoustic — bloco cuja 1ª palavra tem pausa ≥ 0,15 s na FONTE: |início do .ass −
     onset RMS no MP4 ENTREGUE| ≤ 150 ms (árbitro de outra natureza que ASR×ASR).
  C3 caption_rhythm — 3 ≤ palavras ≤ 5 e duração ≥ 0,70 s em todo evento do corpo.
  C4 caption_font_uniform — nenhum \\fs ≠ corpo padrão (70) nos eventos do corpo.
  C5 side_strip_sheet — folha do que o recorte joga fora existe para todo segmento `face`.
  C6 cfr_strict — todo delta de pts do vídeo = 1/30 ± 1 ms (frame esticado no corpo reprova).
  C8 caption_blink — fala DENTRO de um intervalo sem legenda. O texto está todo legendado (C2 cobre
     isso) mas a legenda pisca: o bloco fecha, a voz continua e o próximo bloco só entra depois.
     Achado do revisor independente do avatar a2 v3 (3.520 ms somados, maior trecho 225 ms) — os
     cortes deste worker não têm o defeito porque `captions.py` estica cada evento até o seguinte,
     o que dá o par calibrado: a2 v3 = ruim conhecido, cortes 04/07/08 = bom conhecido.
  C7 tail_scene_bleed — os últimos frames do CORPO pertencem à mesma cena do resto do corpo. A borda
     estendida até o vale de ÁUDIO arrasta frames da cena SEGUINTE (a fala já acabou, a imagem já
     mudou): no run V1nMBWzXsCI o 08 terminou com 3 frames (100 ms) da apresentadora em plano aberto
     depois de 22,6 s de tela. Achado do 2º olhar v2, que nenhum dos dois QCs anteriores viu.
(C2 words_edge_membership vive em `wordrange.py` + `qc_all.words_gate`.)
"""
import pathlib, re, subprocess, sys, unicodedata

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import acoustic
# (`wordrange`-based onset_gate wrapper and the side-strip sheet gate are NOT vendored — this copy
#  keeps the caption gates the avatar pipeline uses: C1 onset, C3 rhythm, C4 font, C6 cfr, C7 tail, C8 blink, C9 overlap.)

sys.path.insert(0, str(HERE.parent))
from lib.ffmpeg import find_ffmpeg as _find_ffmpeg, find_ffprobe as _find_ffprobe  # noqa: E402
FP = _find_ffprobe()
FF = _find_ffmpeg()
BODY_FS = 70
MINW, MAXW, MIN_DUR = 3, 5, 0.70
SYNC_TOL_S = 0.150
PAUSE_SRC_S = 0.15
ONSET_WIN_S = 0.40


def _sec(t):
    h, m, s = t.split(':'); return int(h) * 3600 + int(m) * 60 + float(s)


def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return ''.join(c for c in s if not unicodedata.combining(c) and c.isalnum())


def ass_events(text):
    """eventos Dialogue do .ass: {start, end, dur, text (sem tags), words (contagem), fs (tag \\fs ou None), raw}."""
    ev = []
    for ln in text.splitlines():
        if not ln.startswith('Dialogue:'):
            continue
        p = ln.split(',', 9)
        raw = p[9].strip()
        m = re.search(r'\\fs(\d+)', raw)
        txt = re.sub(r'\{[^}]*\}', '', raw)
        for sep in ('\\N', '\\n', '\\h'):
            txt = txt.replace(sep, ' ')
        words = sum(any(ch.isalnum() for ch in tok) for tok in txt.split())
        ev.append({'start': _sec(p[1]), 'end': _sec(p[2]), 'dur': round(_sec(p[2]) - _sec(p[1]), 3),
                   'text': ' '.join(txt.split()), 'words': words, 'fs': int(m.group(1)) if m else None, 'raw': raw})
    return ev


# ---------------- C3 ----------------
def overlap_gate(ass_text, tol=0.0005):
    """C9: nenhuma cue pode terminar DEPOIS do início da seguinte. O build_ass_measured fechava
    cada cue 1 centésimo depois do início da próxima; o libass trata isso como colisão e empurra a legenda
    ~146 px para cima (topo 1377 em vez de 1523) — sintoma visível no vídeo e invisível para ritmo/fonte/
    piscada/onset. Achado pelo produtor do ângulo 2 do run SDeQU0RDjgU; gate retro-adicionado antes de
    qualquer «concluído». Mede o .ass que foi queimado, em ordem de início."""
    ev = sorted(ass_events(ass_text), key=lambda e: e["start"])
    bad = [{"i": k, "end": a["end"], "next_start": b["start"], "overlap_ms": round((a["end"] - b["start"]) * 1000),
            "text": a["text"][:40]} for k, (a, b) in enumerate(zip(ev, ev[1:])) if a["end"] > b["start"] + tol]
    return {"pass": not bad, "events": len(ev), "overlaps": len(bad), "worst_ms": max((x["overlap_ms"] for x in bad), default=0),
            "bad": bad[:8]}


def rhythm_gate(ass_text, minw=MINW, maxw=MAXW, min_dur=MIN_DUR, tol=0.015):
    ev = ass_events(ass_text)
    bad = []
    for k, e in enumerate(ev, 1):
        why = []
        if not minw <= e['words'] <= maxw:
            why.append(f'{e["words"]} palavras')
        if e['dur'] < min_dur - tol:
            why.append(f'{e["dur"]:.2f} s')
        if why:
            bad.append({'blk': k, 'start': e['start'], 'dur': e['dur'], 'words': e['words'], 'text': e['text'], 'why': ', '.join(why)})
    return {'pass': bool(ev) and not bad, 'events': len(ev), 'min_dur_s': min([e['dur'] for e in ev] or [0]),
            'words_min': min([e['words'] for e in ev] or [0]), 'words_max': max([e['words'] for e in ev] or [0]), 'bad': bad}


# ---------------- C4 ----------------
def font_uniform_gate(ass_text, body_fs=BODY_FS):
    ev = ass_events(ass_text)
    style_fs = None
    for ln in ass_text.splitlines():
        if ln.startswith('Style:'):
            p = ln.split(':', 1)[1].split(',')
            if p[0].strip() == 'Cap':
                style_fs = int(float(p[2]))
    bad = [{'blk': k, 'start': e['start'], 'fs': e['fs'], 'text': e['text']} for k, e in enumerate(ev, 1)
           if e['fs'] is not None and e['fs'] != body_fs]
    ok_style = style_fs in (None, body_fs)
    return {'pass': bool(ev) and not bad and ok_style, 'style_fs': style_fs, 'body_fs': body_fs, 'events': len(ev), 'bad': bad}


# ---------------- C1 ----------------
def onset_gate_from_profile(events, words_out, pauses, rms, t_start=0.0, tol=SYNC_TOL_S, pause_min=PAUSE_SRC_S, win=ONSET_WIN_S):
    """events: ass_events(); words_out: tempos que FORAM para a legenda (words_out.json); pauses: pausa na
    fonte antes de cada palavra de words_out (mesma ordem); rms: perfil do MP4 ENTREGUE.
    delta_ms = início do .ass − onset acústico (negativo = legenda ANTES da voz)."""
    rows, unmeasured = [], []
    # Casamento evento ↔ palavra: por TEXTO, em ordem. A versão anterior casava por
    # tempo (|t0 − início| ≤ 11 ms), o que só funciona quando as palavras são as mesmas que geraram
    # o .ass — numa legenda ALHEIA com tempo errado (o caso que o gate existe para pegar) nada casava,
    # zero blocos eram medidos e o veredito saía PASS: na calibração com a v2 do a1 (−340 ms
    # conhecidos) o gate aprovou. Agora: a 1ª palavra do evento casa com a próxima palavra ainda não
    # consumida de mesmo texto normalizado (eventos e palavras estão os dois em ordem); o tempo só
    # desempata quando o texto é ambíguo.
    cursor = 0
    for k, e in enumerate(events, 1):
        toks = e['text'].split()
        first = norm(toks[0]) if toks else ''
        hit = [i for i in range(cursor, len(words_out)) if norm(words_out[i]['w'].split()[0]) == first]
        if len(hit) > 1:
            near = [i for i in hit if abs(words_out[i]['t0'] - e['start']) <= 0.6]
            hit = near or hit
        if not hit:
            hit = [i for i in range(cursor, len(words_out)) if abs(words_out[i]['t0'] - e['start']) <= 0.011]
        if not hit:
            continue
        i = hit[0]
        cursor = i + 1
        pause = pauses[i] if i < len(pauses) else None
        if pause is None or pause < pause_min:
            continue
        prev_end = words_out[i - 1]['t1'] if i > 0 else None
        lo = (prev_end - 0.15) if prev_end is not None else None
        on = acoustic.onset_near(rms, e['start'], win=win, t_start=t_start, lo=lo)
        if on is None:
            unmeasured.append({'blk': k, 'start': e['start'], 'word': e['text'].split()[0], 'pause_src': pause,
                               'trace': acoustic.trace(rms, t_start, e['start'] - 0.25, e['start'] + 0.25)})
            continue
        d = round((e['start'] - on) * 1000)
        rows.append({'blk': k, 'start': e['start'], 'word': e['text'].split()[0], 'pause_src': pause, 'onset': round(on, 2),
                     'delta_ms': d, 'pass': abs(d) <= tol * 1000 + 1e-6,
                     'trace': acoustic.trace(rms, t_start, min(on, e['start']) - 0.08, max(on, e['start']) + 0.04)})
    bad = [r for r in rows if not r['pass']]
    worst = max(rows, key=lambda r: abs(r['delta_ms'])) if rows else None
    # «PASS vazio» é reprovação (revisor do avatar a4 v2): com música alta o
    # `onset_near` não acha vale em NENHUM candidato e o gate devolvia measured=0 com pass=True —
    # aprovando exatamente o que não mediu. A lei da casa é o contrário: um QC só pode dizer
    # aprovado sobre o que ele mede. Havendo candidato (bloco com pausa na fonte) e zero medição,
    # o veredito é HOLD e o conserto é o limiar deslocado / banda espectral, não o silêncio.
    empty_pass = not rows and bool(unmeasured)
    return {'pass': not bad and not empty_pass, 'empty_pass': empty_pass,
            'tol_ms': int(tol * 1000), 'measured': len(rows), 'unmeasured': len(unmeasured),
            'worst_ms': worst['delta_ms'] if worst else None, 'worst_blk': worst['blk'] if worst else None,
            'worst_word': worst['word'] if worst else None, 'bad': bad, 'rows': rows, 'unmeasured_rows': unmeasured,
            'hold': bool(bad) or empty_pass,
            'error': ('nenhum dos %d candidatos pôde ser medido (piso de áudio alto?) — '
                      'gate que não mede não aprova' % len(unmeasured)) if empty_pass else None}


# ---------------- C6 ----------------
def cfr_gate(mp4, fps=30, tol_ms=1.0):
    o = subprocess.run([FP, '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=avg_frame_rate,r_frame_rate',
                        '-of', 'csv=p=0', str(mp4)], capture_output=True, text=True).stdout.strip().split(',')
    p = subprocess.run([FP, '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts_time', '-of', 'csv=p=0', str(mp4)],
                       capture_output=True, text=True).stdout
    pts = sorted(float(x.strip().rstrip(',')) for x in p.splitlines() if x.strip())
    want = 1000.0 / fps
    odd = [{'t': round(a, 3), 'delta_ms': round((b - a) * 1000, 2)} for a, b in zip(pts, pts[1:]) if abs((b - a) * 1000 - want) > tol_ms]
    rates = [x for x in o if x]
    rate_ok = all(x in (f'{fps}/1', str(fps)) for x in rates) if rates else False
    return {'pass': bool(pts) and not odd and rate_ok, 'frames': len(pts), 'r_frame_rate': rates[0] if rates else None,
            'avg_frame_rate': rates[1] if len(rates) > 1 else None, 'odd_deltas': odd[:20], 'n_odd': len(odd)}


# ---------------- C7 ----------------
def _luma_series(mp4, t0, t1, w=64, h=36):
    """luma média por frame no intervalo [t0,t1) do MP4 (downscale — só a MUDANÇA importa)."""
    import numpy as np
    raw = subprocess.run([FF, '-v', 'error', '-ss', f'{t0:.3f}', '-to', f'{t1:.3f}', '-i', str(mp4),
                          '-vf', f'scale={w}:{h},format=gray', '-f', 'rawvideo', '-'],
                         capture_output=True).stdout
    n = w * h
    return [round(float(np.frombuffer(raw[i * n:(i + 1) * n], dtype=np.uint8).mean()), 1)
            for i in range(len(raw) // n)]


def tail_scene_bleed_gate(mp4, body_end_s, tail_s=0.40, ref_s=1.5, jump=25.0, fps=30, skip_tail_frames=2, tolerate_frames=1):
    """Reprova quando os últimos frames do corpo saltam para outra cena.

    Mede a luma por frame nos `tail_s` finais do CORPO (antes do card) e compara com a mediana dos
    `ref_s` anteriores: frame com |luma − mediana| ≥ `jump` é vazamento da cena seguinte. Devolve
    quantos frames vazaram e onde — o conserto é puxar o OUT de vídeo, não mexer no áudio.

    `skip_tail_frames` descarta os últimos frames antes do card: a virada corpo→card é ela mesma uma
    troca de imagem e apareceria como vazamento em TODO short (calibração de: sem isso o
    gate reprovava o 07, cujo único frame acusado já era o card — o discriminador, não a amostragem,
    estava errado).

    `tolerate_frames=1`: a fronteira do corte cai numa grade de 33 ms e o vale de áudio que a
    autoriza pode começar no MESMO frame em que a cena vira (foi o caso do 08 deste run: fala até
    696,74 s, vale a partir de 696,76 s, cena nova em 696,77 s — não existe corte que satisfaça os
    dois com folga). Um frame é indistinguível do arredondamento; DOIS já são imagem de outra cena
    no ar (o 08 da v1 tinha três, 100 ms, e foi por isso que o 2º olhar abriu esta classe).
    """
    import statistics
    body_end_s = float(body_end_s)
    cut_at = max(0.0, body_end_s - skip_tail_frames / fps)
    ref = _luma_series(mp4, max(0.0, cut_at - ref_s - tail_s), max(0.0, cut_at - tail_s))
    tail = _luma_series(mp4, max(0.0, cut_at - tail_s), cut_at)
    if not ref or not tail:
        return {'pass': False, 'error': 'sem frames para medir', 'body_end_s': body_end_s}
    med = statistics.median(ref)
    bad = [{'i': i, 't': round(cut_at - tail_s + i / fps, 3), 'luma': v, 'delta': round(v - med, 1)}
           for i, v in enumerate(tail) if abs(v - med) >= jump]
    # só conta o RABO contíguo: um pico isolado no meio é corte de cena legítimo dentro do corpo
    run = []
    for row in reversed(bad):
        if not run or row['i'] == run[-1]['i'] - 1: run.append(row)
        else: break
    return {'pass': len(run) <= tolerate_frames, 'body_end_s': round(body_end_s, 3), 'measured_until_s': round(cut_at, 3), 'ref_median_luma': med,
            'tail_frames': len(tail), 'bleed_frames': len(run), 'bleed_ms': round(len(run) * 1000 / fps),
            'first_bleed_t': run[-1]['t'] if run else None, 'frames': list(reversed(run))[:10], 'jump_threshold': jump, 'tolerated_frames': tolerate_frames,
            'within_grid_tolerance': 0 < len(run) <= tolerate_frames}


# ---------------- C8 ----------------
def caption_blink_gate(ass_text, words_out, body_end_s, min_gap_s=0.05, max_total_ms=150, max_run_ms=150):
    """Reprova quando há FALA dentro de intervalo sem legenda.

    `words_out` são as palavras do áudio ENTREGUE (o mesmo arquivo que o realign produz). Um
    intervalo entre o fim de um evento e o início do seguinte só conta quando começa alguma palavra
    dentro dele: pausa sem fala é silêncio legítimo. O conserto barato, quando reprova, é esticar o
    fim de cada bloco até o início do próximo sempre que houver voz no meio.
    """
    ev = sorted(ass_events(ass_text), key=lambda x: x['start'])
    words = [w for w in (words_out or []) if w.get('t0') is not None]
    gaps = []
    for i, cur in enumerate(ev):
        e = cur['end']
        nxt = ev[i + 1]['start'] if i + 1 < len(ev) else float(body_end_s)
        if nxt - e <= min_gap_s:
            continue
        # tolerância de 11 ms: o .ass tem centésimos e as palavras têm milésimos — um token em
        # 60,528 s com evento em 60,53 s NÃO é fala sem legenda, é arredondamento (a3)
        inside = [w for w in words if e + 0.011 < float(w['t0']) < nxt - 0.011]
        if inside:
            gaps.append({'from': round(e, 3), 'to': round(nxt, 3), 'ms': round((nxt - e) * 1000),
                         'words': [w['w'] for w in inside][:6]})
    total = sum(g['ms'] for g in gaps)
    worst = max((g['ms'] for g in gaps), default=0)
    return {'pass': total <= max_total_ms and worst <= max_run_ms, 'gaps': len(gaps),
            'total_ms': total, 'worst_ms': worst, 'max_total_ms': max_total_ms, 'max_run_ms': max_run_ms,
            'worst_gaps': sorted(gaps, key=lambda g: -g['ms'])[:5]}
