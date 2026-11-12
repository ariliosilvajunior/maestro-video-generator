"""storyboard.py: mostra o plano do modo Mídia e quanto ele vai custar, antes de gastar qualquer coisa.

uso: python3 scripts/storyboard.py <storyboard.json>

storyboard.json (o Claude escreve; veja exemplos/storyboard.json):
  {"title": "...", "format": "16:9", "seconds": 12,
   "shots": [{"time": "0.0-3.0", "graphic": "o que o grafismo faz",
              "asset": {"kind": "code"}},                                   # só código, de graça
             {"time": "3.0-8.0", "graphic": "...",
              "asset": {"kind": "user_photo", "path": "media/eu.jpg"}},     # foto da pessoa, de graça
             {"time": "...", "graphic": "...",
              "asset": {"kind": "user_clip", "path": "media/demo.mp4"}},    # clipe da pessoa, de graça
             {"time": "...", "graphic": "...",
              "asset": {"kind": "generate", "from": "media/eu.jpg", "model": "seedance-2.0",
                        "prompt": "...", "duration": 5, "resolution": "720p"}}]}   # gasta créditos
Imprime uma tabela, a estimativa de créditos de cada plano 'generate' e o total. Grava storyboard.md.
Nunca gera nada."""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sb = json.load(open(sys.argv[1]))
root = os.path.dirname(os.path.abspath(sys.argv[1]))
rows, total, unknown, sources, missing = [], 0.0, 0, set(), []
for n, s in enumerate(sb['shots'], 1):
    a = s.get('asset', {'kind': 'code'})
    kind = a.get('kind', 'code')
    cost = '0'
    if kind in ('user_photo', 'user_clip'):
        p = a.get('path', '')
        if not os.path.exists(os.path.join(root, p)) and not os.path.exists(p):
            missing.append(p)
        what = f"{'sua foto' if kind == 'user_photo' else 'seu clipe'}: {os.path.basename(p)}"
    elif kind == 'generate':
        frm = a.get('from')
        what = (f"clipe Higgsfield {a.get('model', 'seedance-2.0')} "
                + (f"a partir de {os.path.basename(frm)}" if frm else 'a partir de texto') + f", {a.get('duration', 5)} s, "
                f"{a.get('resolution', '720p')}. Prompt: \"{a.get('prompt', '')}\"")
        cmd = [sys.executable, os.path.join(HERE, 'higgsfield.py'), 'estimate', '--model', a.get('model', 'seedance-2.0'),
               '--duration', str(a.get('duration', 5)), '--resolution', a.get('resolution', '720p'),
               '--prompt', a.get('prompt', '')]
        if not frm:
            cmd.append('--text')
        r = subprocess.run(cmd, capture_output=True, text=True, cwd=root)
        try:
            est = json.loads(r.stdout.strip().splitlines()[-1])
        except Exception:
            est = {'credits': None, 'source': (r.stderr or r.stdout)[-200:]}
        sources.add(est['source'])
        if est['credits'] is None:
            cost, unknown = '?', unknown + 1
        else:
            cost = f"{est['credits']:g}"
            total += est['credits']
    else:
        what = 'só código (sem mídia)'
    rows.append((n, s.get('time', ''), s.get('graphic', ''), what, cost))

gen = sum(1 for s in sb['shots'] if s.get('asset', {}).get('kind') == 'generate')
lines = [f"# Storyboard: {sb.get('title', 'sem título')}", '',
         f"{sb.get('format', '16:9')}, {sb.get('seconds', '?')} s. Nada foi gerado nem gasto ainda.", '',
         '| Plano | Tempo (s) | O que o grafismo faz | Asset | Créditos |', '|---|---|---|---|---|']
lines += [f'| {n} | {t} | {g} | {w} | {c} |' for n, t, g, w, c in rows]
lines.append('')
if gen:
    tot = f'{total:g}' + (f' + {unknown} sem estimativa' if unknown else '')
    lines.append(f"Total para gerar {gen} clipe{'s' if gen > 1 else ''}: cerca de {tot} créditos "
                 f"({'; '.join(sorted(sources))}). Jobs que falham não são cobrados.")
    lines.append('')
    lines.append('Responda "sim" para gerar. Qualquer outra coisa e eu mudo o plano antes.')
else:
    lines.append('Nenhum clipe de IA neste plano, então custa 0 créditos.')
if missing:
    lines.append('')
    lines.append('Arquivos que faltam: ' + ', '.join(missing))
md = '\n'.join(lines)
open(os.path.join(root, 'storyboard.md'), 'w').write(md + '\n')
print(md)
