"""ritmo.py: hábito 5, parte dois. Mede o ritmo a partir dos pixels de um vídeo renderizado.

uso: python3 scripts/ritmo.py <video.mp4> [--loop] [--max-gap 1.0] [--min-hold 0.3] [--end-hold 0]

Checa:
  1. Nenhum buraco morto: algo muda visivelmente pelo menos a cada --max-gap segundos.
     Uma 'mudança' é um passo de 0,1 s em que mais de 0,4% dos pixels se movem mais de 14 níveis.
  2. Nada pisca: nenhum plano mais curto que --min-hold segundos entre dois cortes secos,
     e nenhum elemento que entra e sai de novo dentro de --min-hold segundos.
Grava <video>-contact.jpg (um frame por segundo a partir de 0 s, da esquerda pra direita) e <video>-pacing.json.
O que conta como mudança: coisas grandes se movendo. Um rótulo pequeno deslizando, ou um fade lento de cor, pode não contar,
então perto da emenda do loop mantenha um movimento grande acontecendo a cada segundo. Tremulação mais rápida que ~3 por segundo conta como piscada.
Código de saída 0 = passou, 1 = falhou."""
import argparse, json, os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _midia import probe, gray_frames, diff_stats

ap = argparse.ArgumentParser()
ap.add_argument('video')
ap.add_argument('--max-gap', type=float, default=1.0)
ap.add_argument('--min-hold', type=float, default=0.3)
ap.add_argument('--end-hold', type=float, default=0.0, help='permite uma pausa final com esta duração')
ap.add_argument('--loop', action='store_true', help='o vídeo faz loop: mede também o buraco através da emenda')
a = ap.parse_args()
info = probe(a.video)
dur = info['dur']

# 1. buracos mortos, a 10 passos por segundo
f10, w, h = gray_frames(a.video, 10, 240)
events = []
for i in range(1, len(f10)):
    _, moved = diff_stats(f10[i - 1], f10[i])
    if moved > 0.004:
        events.append(round(i / 10, 2))
pts = [0.0] + events + [round(dur, 2)]
gaps = [(pts[i], pts[i + 1], round(pts[i + 1] - pts[i], 2)) for i in range(len(pts) - 1)]
if a.loop and len(pts) > 2:   # o tempo parado do fim emenda direto no tempo parado do começo
    wrap = round((pts[-1] - pts[-2]) + (pts[1] - pts[0]), 2)
    gaps.append((pts[-2], pts[1], wrap))
dead = [g for g in gaps if g[2] > a.max_gap + 0.05]
if a.end_hold:
    dead = [g for g in dead if not (g[1] >= dur - 0.05 and g[2] <= a.end_hold + 0.05)]

# 2. piscadas, a 30 passos por segundo
f30, _, _ = gray_frames(a.video, 30, 160)
k = max(1, int(round(a.min_hold / 2 * 30)))   # olha esta quantidade de frames para cada lado
cuts, flashes = [], []
for i in range(1, len(f30)):
    _, moved = diff_stats(f30[i - 1], f30[i], 30)
    if moved > 0.35:
        cuts.append(i / 30)
for i in range(k, len(f30) - k, 2):
    _, ac = diff_stats(f30[i - k], f30[i], 30)
    _, ab = diff_stats(f30[i - k], f30[i + k], 30)
    if ac > 0.01 and ab < 0.25 * ac:
        flashes.append(round(i / 30, 2))
shots = [0.0] + cuts + [dur]
short_shots = [(round(shots[i], 2), round(shots[i + 1], 2)) for i in range(len(shots) - 1)
               if shots[i + 1] - shots[i] < a.min_hold - 0.01]
# junta frames de piscada que ficam colados
merged = []
for t in flashes:
    if merged and t - merged[-1][1] <= 0.1:
        merged[-1][1] = t
    else:
        merged.append([t, t])

# folha de contato, um frame por segundo
base = os.path.splitext(a.video)[0]
cols = 6 if info['w'] >= info['h'] else 8
rows = max(1, int((dur + cols - 1) // cols))
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-vf',
                f'fps=1:round=down,scale={320 if info["w"] >= info["h"] else 180}:-2,tile={cols}x{rows}:padding=8:margin=8:color=white',
                '-frames:v', '1', '-q:v', '4', base + '-contact.jpg'], check=False)

rep = {'video': a.video, 'duration': round(dur, 2), 'change_steps': len(events),
       'longest_gap_s': max(g[2] for g in gaps), 'dead_gaps': dead,
       'hard_cuts': [round(c, 2) for c in cuts], 'too_short_shots': short_shots,
       'flashes': [m for m in merged], 'pass': not dead and not short_shots and not merged}
json.dump(rep, open(base + '-pacing.json', 'w'), indent=1)
print(f"ritmo: maior buraco {rep['longest_gap_s']} s (limite {a.max_gap}), {len(events)} passos com mudança, "
      f"{len(cuts)} cortes secos")
for g in dead:
    print(f"  FALHOU buraco morto de {g[0]} a {g[1]} s ({g[2]} s sem nada se mexendo)")
for s in short_shots:
    print(f"  FALHOU plano de {s[0]} a {s[1]} s é mais curto que {a.min_hold} s")
for m in merged:
    print(f"  FALHOU algo entra e sai por volta de {m[0]} a {m[1]} s (na tela por menos de {a.min_hold} s)")
print('PASSOU' if rep['pass'] else 'FALHOU', '| folha de contato:', base + '-contact.jpg')
sys.exit(0 if rep['pass'] else 1)
