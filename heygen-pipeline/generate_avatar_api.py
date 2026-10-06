#!/usr/bin/env python3
"""
generate_avatar_api.py — Phase 3 via the HeyGen REST API (06/10/2026).

Replaces the browser path (`generate-avatar-heygen` / Playwright) — HeyGen's login
consistently returns "flagged for suspicious activity" (Cloudflare anti-bot) for this
automated browser, confirmed as a real, non-retry-fixable block. The API sidesteps it
entirely: no browser, no login, just an authenticated HTTPS call, so Cloudflare never
sees it.

Mirrors the already-working implementation in the sibling project
`ecossistema-ia-recursos-cognitivos` (`shared/heygen.py`, used live by its `video_factory`
agent, SAME HeyGen account + SAME avatar `config.avatar.heygen_avatar_id` — "Bem-vindo,
Professor Arilio"). That implementation upload the audio and lip-syncs to it (`POST
/v3/videos`, `scenes[].input.audio_asset_id`) instead of text+voice_id, because their
avatar's engine (Avatar V) rejects text+voice_id generation with a cloned ElevenLabs
voice ("Voice validation failed", seen in practice). This script does the SAME —
reuses the ALREADY-APPROVED Phase 2.6 ElevenLabs narration (`<Name>_draft_narration.mp3`)
as the lip-sync source, so the narration is generated exactly once, not twice.

INPUT: the Phase 2.6-approved draft narration audio (same file the owner already heard
and approved — the HeyGen avatar must say EXACTLY that, word for word).
OUTPUT: `<downloads>/<Name>_avatar_1080p.mp4` (1080x1920, h264+aac) — written directly
to the per-run canonical path (QCR-180 — no shared intermediate file to contaminate).

USAGE:
    python3 heygen-pipeline/generate_avatar_api.py --run <Name> \
        --audio <scratch>/<Name>_draft_narration.mp3
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, REPO)
from lib import config  # noqa: E402
from lib.api_keys import resolve_key  # noqa: E402
from lib.paths import downloads  # noqa: E402
from lib.ffmpeg import find_ffmpeg, find_ffprobe  # noqa: E402

import maestro_state  # noqa: E402

_BASE_URL = "https://api.heygen.com"
_ENGINE = "avatar_v"  # same engine the avatar_id was created with (see shared/heygen.py note)


def _key() -> str:
    key = resolve_key("heygen")
    if not key:
        sys.exit("ERRO: HEYGEN_API_KEY nao configurada. Preenche '## HeyGen' em .claude/keys.md.")
    return key


def _avatar_id() -> str:
    avatar_id = config.get("avatar.heygen_avatar_id")
    if not avatar_id:
        sys.exit("ERRO: config.avatar.heygen_avatar_id nao configurado em config/config.json.")
    return avatar_id


def _request(method: str, path: str, headers: dict, data: bytes | None = None, timeout: int = 60) -> dict:
    req = urllib.request.Request(f"{_BASE_URL}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as erro:
        detalhe = erro.read().decode("utf-8", "replace")
        sys.exit(f"ERRO {erro.code} da HeyGen ({path}): {detalhe}")
    except urllib.error.URLError as erro:
        sys.exit(f"ERRO: nao consegui falar com a HeyGen ({path}): {erro}")


def upload_audio(audio_path: str) -> str:
    """POST /v3/assets (multipart) -> asset_id."""
    boundary = "----maestroHeygenBoundary"
    with open(audio_path, "rb") as f:
        audio_bytes = f.read()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="narracao.mp3"\r\n'
        f"Content-Type: audio/mpeg\r\n\r\n"
    ).encode("utf-8") + audio_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")
    headers = {"X-Api-Key": _key(), "Content-Type": f"multipart/form-data; boundary={boundary}"}
    resultado = _request("POST", "/v3/assets", headers, data=body, timeout=90)
    dados = resultado["data"]
    return dados.get("asset_id") or dados["id"]


def gerar_video(asset_id: str) -> str:
    """POST /v3/videos (type=studio, one avatar_video scene lip-synced to the uploaded audio) -> video_id."""
    payload = {
        "type": "studio",
        "aspect_ratio": "9:16",
        "resolution": "1080p",
        "scenes": [
            {
                "type": "avatar_video",
                "input": {
                    "type": "avatar",
                    "avatar_id": _avatar_id(),
                    "audio_asset_id": asset_id,
                    "engine": {"type": _ENGINE},
                },
            }
        ],
    }
    headers = {"X-Api-Key": _key(), "Content-Type": "application/json"}
    resultado = _request("POST", "/v3/videos", headers, data=json.dumps(payload).encode("utf-8"))
    dados = resultado["data"]
    return dados.get("id") or dados["video_id"]


def consultar_status(video_id: str) -> dict:
    headers = {"X-Api-Key": _key()}
    resultado = _request("GET", f"/v3/videos/{video_id}", headers, timeout=30)
    return resultado["data"]


def aguardar_video_pronto(video_id: str, tempo_maximo_s: int = 1800, intervalo_s: int = 20) -> str:
    decorrido = 0
    while decorrido < tempo_maximo_s:
        dados = consultar_status(video_id)
        status = dados.get("status")
        print(f"[heygen_api] status={status} ({decorrido}s)", file=sys.stderr)
        if status == "completed":
            return dados["video_url"]
        if status == "failed":
            erro = dados.get("failure_message") or dados.get("error")
            sys.exit(f"ERRO: a HeyGen falhou ao gerar o video: {erro}")
        time.sleep(intervalo_s)
        decorrido += intervalo_s
    sys.exit(f"ERRO: a HeyGen nao terminou de renderizar {video_id} em {tempo_maximo_s}s")


def baixar(video_url: str, destino: str) -> None:
    req = urllib.request.Request(video_url)
    with urllib.request.urlopen(req, timeout=300) as resp, open(destino, "wb") as f:
        f.write(resp.read())


def evidence_gate(video_path: str) -> dict:
    fp = find_ffprobe()
    out = os.popen(
        f'"{fp}" -v error -select_streams v -show_entries stream=codec_name,width,height '
        f'-show_entries format=duration -of json "{video_path}"'
    ).read()
    info = json.loads(out)
    stream = (info.get("streams") or [{}])[0]
    duration = float((info.get("format") or {}).get("duration") or 0)
    if stream.get("codec_name") != "h264" or not duration:
        sys.exit(f"ERRO: evidence gate falhou — {info}")
    return {"width": stream.get("width"), "height": stream.get("height"), "duration": duration}


def pad_if_needed(video_path: str) -> None:
    gate = evidence_gate(video_path)
    if gate["width"] == 1080 and gate["height"] == 1920:
        return
    ff = find_ffmpeg()
    padded = video_path + ".padded.mp4"
    os.system(
        f'"{ff}" -y -i "{video_path}" -vf "scale=1080:-2,pad=1080:1920:0:(1920-ih)/2:black" '
        f'-c:v libx264 -crf 16 -pix_fmt yuv420p -c:a copy "{padded}"'
    )
    os.replace(padded, video_path)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[1])
    ap.add_argument("--run", required=True)
    ap.add_argument("--audio", required=True, help="Phase 2.6-approved draft narration mp3")
    args = ap.parse_args()

    if not os.path.isfile(args.audio):
        sys.exit(f"ERRO: audio nao encontrado: {args.audio!r}")

    print("[heygen_api] subindo o audio aprovado como asset...", file=sys.stderr)
    asset_id = upload_audio(args.audio)

    print(f"[heygen_api] gerando video (avatar {_avatar_id()}, engine {_ENGINE})...", file=sys.stderr)
    video_id = gerar_video(asset_id)
    maestro_state.update(args.run, lambda d: {**d, "heygen_api_video_id": video_id})

    print(f"[heygen_api] esperando renderizar (video_id={video_id})...", file=sys.stderr)
    video_url = aguardar_video_pronto(video_id)

    destino = os.path.join(downloads(), f"{args.run}_avatar_1080p.mp4")
    print(f"[heygen_api] baixando pra {destino}...", file=sys.stderr)
    baixar(video_url, destino)

    pad_if_needed(destino)
    gate = evidence_gate(destino)
    print(f"[heygen_api] pronto: {destino} ({gate['width']}x{gate['height']}, {gate['duration']:.1f}s)", file=sys.stderr)

    maestro_state.update(
        args.run,
        lambda d: {**d, "heygen_api_video_url": video_url, "avatar_video_path": destino, "avatar_gate": gate},
    )
    print(destino)
    return 0


if __name__ == "__main__":
    sys.exit(main())
