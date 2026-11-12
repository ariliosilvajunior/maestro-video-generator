#!/usr/bin/env bash
# render.sh: renderiza um projeto em MP4.
# uso: bash scripts/render.sh <pasta do projeto> <saida.mp4> [draft|high] [composicao.html]   (HF_WORKERS=2 limita o uso de CPU)
set -e
HF="npx --yes hyperframes@${HF_VERSION:-0.8.181}"
DIR=$(cd "${1:?uso: render.sh <pasta> <saida.mp4> [draft|high]}" && pwd)
OUT=${2:?falta o caminho de saída}; Q=${3:-draft}; C=${4:-}
case "$OUT" in /*) ;; *) OUT="$PWD/$OUT";; esac
mkdir -p "$(dirname "$OUT")"
ARGS=(render "$DIR" -o "$OUT" -q "$Q" -w "${HF_WORKERS:-auto}" --quiet)
[ -n "$C" ] && ARGS+=(-c "$C")
$HF "${ARGS[@]}"
ffprobe -v error -show_entries format=duration:stream=width,height -of compact=p=0 "$OUT" | tr '\n' ' '; echo
echo "renderizado: $OUT ($(python3 -c "import os;print(round(os.path.getsize('$OUT')/1e6,1))") MB)"
