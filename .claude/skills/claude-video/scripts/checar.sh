#!/usr/bin/env bash
# checar.sh: confere as ferramentas que esta skill precisa. Imprime um comando de correção por item que falta.
# uso: bash scripts/checar.sh [motion|media]
MODE=${1:-motion}
ok=1
say() { printf '%-10s %s\n' "$1" "$2"; }

if command -v node >/dev/null; then
  v=$(node -p 'process.versions.node.split(".")[0]')
  if [ "$v" -ge 22 ]; then say node "ok ($(node -v))"; else say node "Versão antiga ($(node -v)). Falta Node 22 ou mais novo. Rode: instale em https://nodejs.org"; ok=0; fi
else say node "Falta Node 22 ou mais novo. Rode: instale em https://nodejs.org"; ok=0; fi

for t in ffmpeg ffprobe; do
  if command -v $t >/dev/null; then say $t ok; else say $t "Falta $t. Rode: brew install ffmpeg"; ok=0; fi
done

if command -v python3 >/dev/null; then say python3 "ok"; else say python3 "Falta python3. Rode: brew install python"; ok=0; fi

if [ "$MODE" = media ]; then
  if [ -n "$HIGGSFIELD_API_KEY" ] || [ -n "$HF_API_KEY_ID" ] || grep -qs '^HIGGSFIELD_API_KEY=' .env; then
    say higgsfield "chave encontrada (não exibida)"
  else
    say higgsfield "Falta a chave. Rode: crie um arquivo .env nesta pasta com uma linha: HIGGSFIELD_API_KEY=seu_key_id:seu_key_secret (pegue em https://console.higgsfield.ai). Nunca cole a chave no chat."
  fi
fi

[ $ok = 1 ] && echo "pronto" || { echo "corrija as linhas acima e rode de novo"; exit 1; }
