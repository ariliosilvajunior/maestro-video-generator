"""higgsfield.py: fala com a API da Higgsfield no modo Mídia. Só biblioteca padrão.

Sua chave nunca vai pro chat. Coloque no seu shell (export HIGGSFIELD_API_KEY=...) ou num arquivo
chamado .env na pasta do projeto:  HIGGSFIELD_API_KEY=seu_key_id:seu_key_secret
Pegue uma em https://console.higgsfield.ai . Este script nunca imprime a chave.

uso:
  python3 scripts/higgsfield.py check                         tem chave configurada? (só imprime sim/não)
  python3 scripts/higgsfield.py estimate --model seedance-2.0 --duration 5 --resolution 720p [--text]
  python3 scripts/higgsfield.py generate --model seedance-2.0 --image foto.jpg --prompt "..." \\
          --duration 5 --resolution 720p --out media/plano2.mp4 --yes
'generate' GASTA CRÉDITOS. Ele se recusa a rodar sem --yes. Só passe --yes depois que a pessoa disser sim
ao storyboard e ao custo dele.
URL base: HIGGSFIELD_API_BASE (padrão https://platform.higgsfield.ai; a documentação também mostra https://api.higgsfield.ai)."""
import argparse, json, mimetypes, os, shutil, subprocess, sys, time, uuid, urllib.request, urllib.error

BASE = os.environ.get('HIGGSFIELD_API_BASE', 'https://platform.higgsfield.ai').rstrip('/')
MODELS = {
    # nome: endpoint imagem-para-vídeo, endpoint texto-para-vídeo, tipo de job da CLI (para checar preço de graça), limites
    'seedance-2.0': {'i2v': 'bytedance/seedance-2.0/image-to-video', 't2v': 'bytedance/seedance-2.0/text-to-video',
                     'cli': 'seedance_2_0', 'dur': (4, 15), 'res': ['480p', '720p', '1080p', '4k'], 'audio': True,
                     'end_image': True},
    'seedance-2.5': {'i2v': 'bytedance/seedance-2.5/image-to-video', 't2v': 'bytedance/seedance-2.5/text-to-video',
                     'cli': 'seedance_2_5', 'dur': (4, 30), 'res': ['480p', '720p', '1080p'], 'audio': True,
                     'end_image': True},
    'kling-3-turbo': {'i2v': 'kling-video/v3.0-turbo/image-to-video', 't2v': None, 'cli': 'kling3_0_turbo',
                      'dur': (3, 15), 'res': ['720p', '1080p'], 'audio': False, 'end_image': False},
}


def load_key():
    k = os.environ.get('HIGGSFIELD_API_KEY')
    if not k and os.environ.get('HF_API_KEY_ID') and os.environ.get('HF_API_KEY_SECRET'):
        k = os.environ['HF_API_KEY_ID'] + ':' + os.environ['HF_API_KEY_SECRET']
    if not k:
        for d in (os.getcwd(), os.path.dirname(os.getcwd())):
            p = os.path.join(d, '.env')
            if os.path.exists(p):
                for line in open(p):
                    if line.strip().startswith('HIGGSFIELD_API_KEY='):
                        k = line.split('=', 1)[1].strip().strip('"').strip("'")
    return k or None


def call(method, url, body=None, key=None, headers=None, raw=None):
    h = {'Content-Type': 'application/json'}
    if key:
        h['Authorization'] = 'Key ' + key
    h.update(headers or {})
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            txt = r.read().decode() or '{}'
            return r.status, (json.loads(txt) if txt.strip().startswith(('{', '[')) else {})
    except urllib.error.HTTPError as e:
        txt = e.read().decode(errors='replace')
        try:
            return e.code, json.loads(txt)
        except Exception:
            return e.code, {'detail': txt[:300]}


def payload(m, a, image_url=None, end_url=None):
    body = {'duration': int(a.duration), 'resolution': a.resolution}
    if a.prompt:
        body['prompt'] = a.prompt
    if image_url:
        body['image_url'] = image_url
    if end_url and MODELS[m]['end_image']:
        body['end_image_url'] = end_url
    if MODELS[m]['audio']:
        body['generate_audio'] = False      # o som entra na edição, não fica gravado em cada clipe
    if not image_url and getattr(a, 'aspect', None):
        body['aspect_ratio'] = a.aspect
    return body


def endpoint(m, text):
    ep = MODELS[m]['t2v' if text else 'i2v']
    if not ep:
        sys.exit(f'{m} não tem texto-para-vídeo. Use seedance-2.0 para clipes sem foto.')
    return ep


def estimate(m, a, key):
    """Devolve (créditos ou None, de onde o número veio). Nunca gasta nada."""
    text = getattr(a, 'text', False)
    if key:
        body = payload(m, a, None if text else 'https://example.com/placeholder.jpg')
        code, r = call('POST', f'{BASE}/estimate/{endpoint(m, text)}', body, key)
        if code == 200 and 'credits' in r:
            return float(r['credits']), 'estimativa da API da Higgsfield'
        if code == 401:
            return None, 'a chave foi recusada (401). Confira em https://console.higgsfield.ai'
    if shutil.which('higgsfield'):
        # a CLI da Higgsfield também cota um job de graça; mandamos só as configurações, sem imagens
        cmd = ['higgsfield', 'generate', 'cost', MODELS[m]['cli'], '--prompt', a.prompt or 'camera move',
               '--duration', str(a.duration), '--resolution', a.resolution, '--json']
        r = subprocess.run(cmd, capture_output=True, text=True, stdin=subprocess.DEVNULL, timeout=60)
        try:
            return float(json.loads(r.stdout)['credits']), 'cotação da CLI da Higgsfield'
        except Exception:
            pass
    return None, 'desconhecido até configurar uma chave'


def upload(path, key):
    ctype = mimetypes.guess_type(path)[0] or 'image/jpeg'
    code, r = call('POST', f'{BASE}/files/generate-upload-url', {'content_type': ctype}, key)
    if code != 200:
        sys.exit(f'falhou ao pedir a URL de upload ({code}): {r.get("detail")}')
    hdrs = dict(r.get('upload_headers') or {'Content-Type': ctype})
    req = urllib.request.Request(r['upload_url'], data=open(path, 'rb').read(), method='PUT', headers=hdrs)
    with urllib.request.urlopen(req, timeout=300):
        pass
    return r['public_url']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('cmd', choices=['check', 'estimate', 'generate'])
    ap.add_argument('--model', default='seedance-2.0', choices=sorted(MODELS))
    ap.add_argument('--image')
    ap.add_argument('--end-image')
    ap.add_argument('--prompt', default='')
    ap.add_argument('--duration', type=int, default=5)
    ap.add_argument('--resolution', default='720p')
    ap.add_argument('--aspect', default='16:9')
    ap.add_argument('--text', action='store_true', help='texto para vídeo (sem foto)')
    ap.add_argument('--out')
    ap.add_argument('--yes', action='store_true', help='tenho aprovação para gastar créditos')
    a = ap.parse_args()
    key = load_key()
    if a.cmd == 'check':
        print('chave: sim (oculta)' if key else 'chave: não. Adicione HIGGSFIELD_API_KEY ao seu shell ou a um arquivo .env. Nunca cole a chave no chat.')
        return
    m = a.model
    lo, hi = MODELS[m]['dur']
    if not lo <= a.duration <= hi or a.resolution not in MODELS[m]['res']:
        sys.exit(f'{m} aceita de {lo} a {hi} s e {", ".join(MODELS[m]["res"])}.')
    if a.cmd == 'estimate':
        c, src = estimate(m, a, key)
        print(json.dumps({'model': m, 'duration': a.duration, 'resolution': a.resolution,
                          'credits': c, 'source': src}, ensure_ascii=False))
        return
    # generate: gasta créditos
    if not a.yes:
        sys.exit('Não vou gerar: isso gasta créditos. Mostre o storyboard e o custo, receba um sim e então adicione --yes.')
    if not key:
        sys.exit('Sem chave. Adicione HIGGSFIELD_API_KEY ao seu shell ou a um arquivo .env (nunca no chat).')
    if not a.out:
        sys.exit('Falta --out caminho/do/clipe.mp4')
    text = a.text or not a.image
    image_url = None if text else upload(a.image, key)
    end_url = upload(a.end_image, key) if a.end_image else None
    body = payload(m, a, image_url, end_url)
    code, r = call('POST', f'{BASE}/{endpoint(m, text)}', body, key, {'Idempotency-Key': str(uuid.uuid4())})
    if code not in (200, 201, 202) or 'status_url' not in r:
        sys.exit(f'envio falhou ({code}): {r.get("detail", r)}')
    print(f'enviado, requisição {r["request_id"]}. Aguardando (normalmente de 1 a 4 minutos)...', flush=True)
    delay, t0 = 2.0, time.time()
    while True:
        code, s = call('GET', r['status_url'], None, key)
        if code == 200 and s.get('status') in ('completed', 'failed', 'nsfw', 'canceled'):
            break
        if code in (401, 404):
            sys.exit(f'consulta de status falhou ({code}): {s.get("detail")}')
        if time.time() - t0 > 1200:
            sys.exit(f'ainda rodando depois de 20 minutos. Id da requisição: {r["request_id"]}')
        time.sleep(delay)
        delay = min(delay * 1.5, 10.0)
    if s['status'] != 'completed':
        sys.exit(f'geração {s["status"]}: {s.get("error") or ""} (jobs que falham não são cobrados)')
    url = (s.get('video') or {}).get('url')
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    urllib.request.urlretrieve(url, a.out)
    print(f'salvo em {a.out}')


if __name__ == '__main__':
    main()
