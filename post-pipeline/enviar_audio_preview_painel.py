#!/usr/bin/env python3
"""
enviar_audio_preview_painel.py — Fase 2.6 (gate obrigatorio de aprovacao do
audio-rascunho ANTES da HeyGen), manda o audio barato (ElevenLabs) pro
Painel do Dono em vez de (ou alem de) so entregar o arquivo no chat.

POR QUE EXISTE: pedido do dono (06/10/2026) — a aprovacao da Fase 2.6 tem
que aparecer na mesma tela "Preview de audio esperando aprovacao" que ja
existe pro Canal AEE (video_factory), nao so como arquivo solto no chat.
O lado que recebe (`POST /videos-maestro/audio-preview` +
`GET/POST /videos-maestro/{id}/...`) foi construido no repositorio
`ecossistema-ia-recursos-cognitivos` (branch
`claude/ecossistema-ia-agentes-retry-oso16t`, commit e31d200) — ver
`agentes/content_factory/main.py` + `painel/main.py` la.

CONFIG: config/config.json -> painel.enabled (bool) e painel.url. Chave em
.claude/keys.md, secao '## Painel' (mesmo token que CONTENT_FACTORY_API_TOKEN
no outro repositorio).

USO:
    # Fase 2.6 — manda o audio, guarda o id no estado do run:
    python3 post-pipeline/enviar_audio_preview_painel.py enviar --run <Name> \
        --audio <scratch>/<Name>_draft_narration.mp3 --tema "<topico/gancho>"

    # Fase 2.6 — espera a aprovacao (poll, chamar de novo ate sair do loop):
    python3 post-pipeline/enviar_audio_preview_painel.py status --run <Name>
    # imprime: aguardando_aprovacao_audio | audio_aprovado | rejeitado | <outro>
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

import maestro_state  # noqa: E402


def _state_set(run_name: str, **campos) -> None:
    maestro_state.update(run_name, lambda d: {**d, **campos})


def _url_base() -> str:
    return config.get("painel.url", "https://painel.recursoscognitivos.com.br").rstrip("/")


def _token() -> str:
    token = resolve_key("painel")
    if not token:
        sys.exit(
            "ERRO: token do Painel nao configurado. Preenche '## Painel' em .claude/keys.md "
            "(pede o valor de CONTENT_FACTORY_API_TOKEN pro dono)."
        )
    return token


def enviar(run_name: str, audio_path: str, tema: str, keyword: str | None) -> dict:
    audio_path = os.path.expanduser(audio_path)
    if not os.path.isfile(audio_path):
        sys.exit(f"ERRO: audio nao encontrado em disco: {audio_path!r}")

    with open(audio_path, "rb") as f:
        audio_base64 = base64.b64encode(f.read()).decode("ascii")

    corpo = {"tema": tema, "audio_base64": audio_base64, "palavra_chave_cta": keyword}

    req = urllib.request.Request(
        f"{_url_base()}/videos-maestro/audio-preview",
        data=json.dumps(corpo).encode("utf-8"),
        method="POST",
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {_token()}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            resultado = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", "replace")
        sys.exit(f"ERRO {erro.code} do Painel: {detalhe}")
    except urllib.error.URLError as erro:
        sys.exit(f"ERRO: nao consegui falar com o Painel ({_url_base()}): {erro}")

    _state_set(run_name, painel_video_id=resultado["id"], draft_narration_status=resultado["status"])
    return resultado


def status(run_name: str) -> dict:
    estado = maestro_state.load(run_name)
    video_id = estado.get("painel_video_id")
    if video_id is None:
        sys.exit(f"ERRO: run '{run_name}' nao tem painel_video_id no estado — rode 'enviar' primeiro.")

    req = urllib.request.Request(
        f"{_url_base()}/videos-maestro",
        headers={"Authorization": f"Bearer {_token()}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            videos = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", "replace")
        sys.exit(f"ERRO {erro.code} do Painel: {detalhe}")
    except urllib.error.URLError as erro:
        sys.exit(f"ERRO: nao consegui falar com o Painel ({_url_base()}): {erro}")

    encontrado = next((v for v in videos if v["id"] == video_id), None)
    if encontrado is None:
        sys.exit(f"ERRO: video #{video_id} nao encontrado no Painel (foi apagado?).")

    _state_set(run_name, draft_narration_status=encontrado["status"])
    return encontrado


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    sub = ap.add_subparsers(dest="acao", required=True)

    p_enviar = sub.add_parser("enviar")
    p_enviar.add_argument("--run", required=True)
    p_enviar.add_argument("--audio", required=True)
    p_enviar.add_argument("--tema", required=True)
    p_enviar.add_argument("--keyword", default=None)

    p_status = sub.add_parser("status")
    p_status.add_argument("--run", required=True)

    args = ap.parse_args()

    if not config.get("painel.enabled", False):
        sys.exit("ERRO: painel.enabled esta false em config/config.json — nada enviado. Habilita antes de usar este script.")

    if args.acao == "enviar":
        resultado = enviar(args.run, args.audio, args.tema, args.keyword)
        print(f"Enviado pro Painel do Dono — id #{resultado['id']}, status '{resultado['status']}' (token {masked(resolve_key('painel'))}).")
        print("Agora e esperar o dono ouvir e aprovar na tela 'Preview de audio esperando aprovacao — Videos Maestro' do Painel.")
    else:
        resultado = status(args.run)
        print(resultado["status"])

    return 0


if __name__ == "__main__":
    sys.exit(main())
