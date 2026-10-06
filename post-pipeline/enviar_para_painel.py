#!/usr/bin/env python3
"""
enviar_para_painel.py — manda um vídeo da fila de publicação (post-queue.jsonl)
pro Painel do Dono do projeto Recursos Cognitivos pra revisão, ANTES de
`/post-now` publicar de verdade no Instagram.

POR QUE EXISTE: pedido do dono (05/10/2026) — ele quer assistir e aprovar
cada Reel numa tela só, o Painel do Dono (painel.recursoscognitivos.com.br),
em vez de abrir o arquivo .mp4 solto. O lado que recebe (`POST
/videos-maestro`) já existe no repositório `ecossistema-ia-recursos-cognitivos`
(`agentes/content_factory/main.py` + `painel/main.py`).

ESTE SCRIPT NÃO PUBLICA NADA — só manda o vídeo pra fila de aprovação.
Fluxo recomendado (ainda manual, v1):
  1. Pipeline termina um vídeo -> fica em post-queue.jsonl (status "ready").
  2. Rode este script pra mandar ele pro Painel do Dono.
  3. O dono assiste e aprova (ou rejeita) lá.
  4. SÓ DEPOIS disso rode `/post-now` pra publicar de verdade — este script
     não confere sozinho se o dono já aprovou; isso ainda é combinado por
     fora (o dono avisa, ou quem opera confere a tela do Painel antes de
     publicar). Automatizar essa checagem fica pra uma v2.

CONFIG: `config/config.json` -> `painel.enabled` (bool) e `painel.url`
(ex.: https://painel.recursoscognitivos.com.br). Chave em `.claude/keys.md`,
seção `## Painel` (mesmo token que `CONTENT_FACTORY_API_TOKEN` no outro
repositório — pedir pro dono, não é gerado aqui).

USO:
    python3 post-pipeline/enviar_para_painel.py --run ReelDZ9
    python3 post-pipeline/enviar_para_painel.py          # pega o próximo "ready" da fila sozinho
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, REPO)
from lib import config  # noqa: E402
from lib.api_keys import resolve_key, masked  # noqa: E402

sys.path.insert(0, os.path.join(REPO, "post-queue-pipeline"))
import post_queue  # noqa: E402
import maestro_state  # noqa: E402


def _expandir(caminho: str) -> str:
    return os.path.expanduser(caminho)


def enviar(entrada: dict) -> dict:
    url_base = config.get("painel.url", "https://painel.recursoscognitivos.com.br").rstrip("/")
    token = resolve_key("painel")
    if not token:
        sys.exit(
            "ERRO: token do Painel não configurado. Preenche '## Painel' em .claude/keys.md "
            "(pede o valor de CONTENT_FACTORY_API_TOKEN pro dono)."
        )

    video_path = _expandir(entrada.get("video_path", ""))
    if not video_path or not os.path.isfile(video_path):
        sys.exit(f"ERRO: vídeo não encontrado em disco: {video_path!r}")

    with open(video_path, "rb") as f:
        video_base64 = base64.b64encode(f.read()).decode("ascii")

    cta = entrada.get("resource_cta") or {}
    corpo = {
        "tema": entrada.get("title") or entrada.get("run_name") or "Reel",
        "legenda": entrada.get("caption") or "",
        "video_base64": video_base64,
        "palavra_chave_cta": cta.get("keyword") or None,
    }

    # Se este run passou pelo gate de aprovacao de audio (Fase 2.6,
    # write-script-ptbr), o registro no Painel ja existe desde la
    # (status "audio_aprovado") — manda o MESMO video_id pra atualizar
    # esse registro em vez de criar um novo (ver agentes/content_factory
    # /main.py no ecossistema-ia-recursos-cognitivos).
    run_name = entrada.get("run_name")
    if run_name:
        estado_run = maestro_state.load(run_name)
        painel_video_id = estado_run.get("painel_video_id")
        if painel_video_id is not None:
            corpo["video_id"] = painel_video_id

    req = urllib.request.Request(
        f"{url_base}/videos-maestro",
        data=json.dumps(corpo).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", "replace")
        sys.exit(f"ERRO {erro.code} do Painel: {detalhe}")
    except urllib.error.URLError as erro:
        sys.exit(f"ERRO: não consegui falar com o Painel ({url_base}): {erro}")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--run", default="", help="run_name na fila (post-queue.jsonl); vazio = pega o próximo 'ready'")
    args = ap.parse_args()

    if not config.get("painel.enabled", False):
        print("AVISO: painel.enabled está false em config/config.json — nada enviado.")
        return 0

    if args.run:
        entrada = post_queue.get(args.run)
        if entrada is None:
            sys.exit(f"ERRO: '{args.run}' não está na fila (post-queue.jsonl).")
    else:
        entrada = post_queue.peek(as_json=True)
        if entrada is None:
            print("Fila vazia — nada pronto pra mandar pro Painel.")
            return 0

    print(f"Enviando '{entrada.get('run_name')}' pro Painel do Dono (token {masked(resolve_key('painel'))})...")
    resultado = enviar(entrada)
    print(f"Enviado — id #{resultado.get('id')}, status '{resultado.get('status')}'.")
    print("Agora é esperar o dono assistir e aprovar na tela 'Vídeos Maestro' do Painel antes de rodar /post-now.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
