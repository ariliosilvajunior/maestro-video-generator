#!/usr/bin/env bash
# novo-projeto.sh: cria um projeto HyperFrames do zero.
# uso: bash scripts/novo-projeto.sh <pasta> [16x9|9x16] [segundos] [id do estilo]
# Com um id de estilo que tem peça de partida (estilos/<id>/projeto/index.html), o projeto começa como uma
# cópia dessa peça (a pasta projeto/ inteira), e você troca palavras, cores e tempos em vez de partir do nada.
set -e
HERE=$(cd "$(dirname "$0")/.." && pwd)
DIR=${1:?uso: novo-projeto.sh <pasta> [16x9|9x16] [segundos]}
FMT=${2:-16x9}; SEC=${3:-9}; STYLE=${4:-}
if [ -e "$DIR/index.html" ]; then echo "$DIR já tem um index.html. Escolha uma pasta nova."; exit 1; fi
mkdir -p "$DIR/media"
cp "$HERE/modelos/motion/"{index.html,studio.js,hyperframes.json,meta.json} "$DIR/"
if [ -n "$STYLE" ]; then
  [ -f "$HERE/estilos/$STYLE/ESTILO.md" ] || { echo "Não existe estilo chamado $STYLE. Veja em $HERE/estilos/"; exit 1; }
  cp "$HERE/estilos/$STYLE/ESTILO.md" "$DIR/ESTILO.md"
  if [ -f "$HERE/estilos/$STYLE/projeto/index.html" ]; then
    # copia a pasta projeto/ inteira (index.html e os arquivos ao lado dele)
    cp -R "$HERE/estilos/$STYLE/projeto/." "$DIR/"
    if [ -f "$HERE/estilos/$STYLE/projeto/studio.js" ]; then :
    elif ! grep -q 'studio.js' "$DIR/index.html"; then rm -f "$DIR/studio.js"; fi
    PW=$(grep -oE 'data-width="[0-9]+"' "$DIR/index.html" | head -1 | grep -oE '[0-9]+')
    PH=$(grep -oE 'data-height="[0-9]+"' "$DIR/index.html" | head -1 | grep -oE '[0-9]+')
    PD=$(grep -oE 'data-duration="[0-9.]+"' "$DIR/index.html" | head -1 | grep -oE '[0-9.]+')
    if [ "$FMT" = 9x16 ]; then WW=1080; WH=1920; else WW=1920; WH=1080; fi
    echo "projeto novo: $DIR, partindo da peça de partida do estilo $STYLE (${PW} x ${PH}, ${PD} s)."
    if [ "$PW" != "$WW" ] || [ "$PH" != "$WH" ]; then
      echo "ATENÇÃO: você pediu $WW x $WH, mas esta peça é $PW x $PH. Refaça o layout da cena para $WW x $WH"
      echo "         (troque data-width/data-height, o viewport e o tamanho da página, depois reposicione tudo). Nunca só recorte."
    fi
    if [ "$PD" != "$SEC" ] && [ "$PD" != "$SEC.0" ]; then
      echo "ATENÇÃO: você pediu $SEC s, mas esta peça tem $PD s. Troque o data-duration e redistribua os beats no tempo."
    fi
    exit 0
  fi
fi
if [ "$FMT" = 9x16 ]; then W=1080; H=1920; else W=1920; H=1080; fi
# ajusta tamanho e duração no modelo
sed -i.bak -e "s/width=1920, height=1080/width=$W, height=$H/" \
  -e "s/width: 1920px; height: 1080px/width: ${W}px; height: ${H}px/g" \
  -e "s/data-duration=\"9\"/data-duration=\"$SEC\"/" \
  -e "s/data-width=\"1920\" data-height=\"1080\"/data-width=\"$W\" data-height=\"$H\"/" "$DIR/index.html"
rm -f "$DIR/index.html.bak"
echo "projeto novo: $DIR ($W x $H, $SEC s). Edite $DIR/index.html e depois rode: bash $HERE/scripts/frames.sh $DIR"
