#!/usr/bin/env bash
# frames.sh: hábito 5. Tira frames parados nas viradas de plano ANTES do render completo.
# uso: bash scripts/frames.sh <pasta do projeto> [tempos, separados por vírgula]   ex.: 0,3,6
# Sem tempos, pega 0, um terço, dois terços e o fim.
set -e
HF="npx --yes hyperframes@${HF_VERSION:-0.8.181}"
DIR=$(cd "${1:?uso: frames.sh <pasta> [t1,t2,t3]}" && pwd)
D=$(grep -oE 'data-duration="[0-9.]+"' "$DIR/index.html" | head -1 | grep -oE '[0-9.]+')
AT=${2:-$(python3 -c "d=$D; print(','.join(str(round(x,2)) for x in (0, d/3, 2*d/3, d-0.05)))")}
OUT="$DIR/frames"; rm -rf "$OUT"; mkdir -p "$OUT"
$HF snapshot "$DIR" --at "$AT" --no-end -o "$OUT" >/dev/null
# cópias pequenas, baratas de olhar
for f in "$OUT"/*.png; do ffmpeg -v error -y -i "$f" -vf scale=960:-2 -q:v 7 "${f%.png}.jpg"; done
# uma folha pequena com todos (leitores de imagem costumam recusar arquivos grandes)
[ -f "$OUT/contact-sheet.jpg" ] && ffmpeg -v error -y -i "$OUT/contact-sheet.jpg" -vf scale=1400:-2 -q:v 8 "$OUT/olhar.jpg"
ls "$OUT"/*.jpg
echo "Olhe cada frame. Corrija o que está errado. Só então rode o render.sh."
