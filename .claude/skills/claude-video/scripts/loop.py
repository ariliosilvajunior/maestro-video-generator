"""loop.py: hábito 4. Prova que um loop é sem emenda.

uso: python3 scripts/loop.py <video.mp4> [--project <pasta>]

Teste A (com --project): renderiza o frame em t = 0 e o frame em t = fim com o HyperFrames
  e compara pixel a pixel. Precisam ser a mesma imagem.
Teste B (sempre): compara o último frame do vídeo com o primeiro. Esse salto não pode ser maior
  que um passo normal entre dois frames, para a emenda ficar invisível quando o vídeo repete.
Código de saída 0 = passou, 1 = falhou."""
import argparse, os, re, shutil, subprocess, sys, tempfile, statistics
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _midia import probe, gray_frames, diff_stats

ap = argparse.ArgumentParser()
ap.add_argument('video')
ap.add_argument('--project')
a = ap.parse_args()
ok = True

if a.project:
    html = open(os.path.join(a.project, 'index.html')).read()
    D = float(re.search(r'data-duration="([\d.]+)"', html).group(1))
    tmp = tempfile.mkdtemp()
    # testa uma cópia com o wrap do relógio único desligado, para o frame do fim ser desenhado de fato em t = fim
    proj = os.path.join(tmp, 'proj')
    shutil.copytree(a.project, proj, ignore=shutil.ignore_patterns('*.mp4', 'frames', '.hyperframes', 'out'))
    page = open(os.path.join(proj, 'index.html')).read()
    page = page.replace('<head>', '<head>\n<script>window.STUDIO_NO_WRAP = true;</script>', 1)
    open(os.path.join(proj, 'index.html'), 'w').write(page)
    hf = ['npx', '--yes', 'hyperframes@' + os.environ.get('HF_VERSION', '0.8.181')]
    subprocess.run(hf + ['snapshot', proj, '--at', f'0,{D}', '--no-end', '-o', tmp],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    pngs = sorted(f for f in os.listdir(tmp) if f.startswith('frame') and f.endswith('.png'))
    if len(pngs) < 2:
        print('FALHOU não consegui capturar os dois frames das pontas:', pngs); sys.exit(1)
    first, last = os.path.join(tmp, pngs[0]), os.path.join(tmp, pngs[-1])
    fa, w, h = gray_frames(first, None, 640)
    fb, _, _ = gray_frames(last, None, 640)
    mean, moved = diff_stats(fa[0], fb[0], 8)
    same = moved < 0.0005
    ok &= same
    print(f"A. frame em 0 s vs frame em {D} s: {moved * 100:.3f}% dos pixels diferem "
          f"(média {mean:.2f} níveis) -> {'PASSOU, mesma imagem' if same else 'FALHOU, o loop não fecha'}")

info = probe(a.video)
frames, w, h = gray_frames(a.video, None, 320)
steps = [diff_stats(frames[i - 1], frames[i])[0] for i in range(1, len(frames))]
seam = diff_stats(frames[-1], frames[0])[0]
typical = statistics.median(steps) if steps else 0
p90 = sorted(steps)[int(0.9 * (len(steps) - 1))] if steps else 0
limit = max(2.5 * typical, p90, 0.6)
seam_ok = seam <= limit
ok &= seam_ok
print(f"B. salto na emenda (último frame para o primeiro) {seam:.2f} níveis; passo normal {typical:.2f}, "
      f"limite {limit:.2f} -> {'PASSOU, sem emenda' if seam_ok else 'FALHOU, vai dar um pulo quando repetir'}")
print('PASSOU' if ok else 'FALHOU')
sys.exit(0 if ok else 1)
