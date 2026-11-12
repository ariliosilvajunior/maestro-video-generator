#!/usr/bin/env bash
# baixar-midia.sh — os vídeos da galeria e as mídias grandes dos estilos (~120 MB) NÃO ficam no git do maestro.
# Baixa cada arquivo de midia-pesada.txt da versão revisada da skill (commit fixo ee3dc316759ae266effab49f55c1221c64028081,
# github.com/Felpborges/claude-video, licença MIT) para o mesmo caminho dentro desta pasta. Pula o que já existe.
set -eu
SKILL=$(cd "$(dirname "$0")" && pwd)
BASE=https://raw.githubusercontent.com/Felpborges/claude-video/ee3dc316759ae266effab49f55c1221c64028081
n=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -s "$SKILL/$f" ] && continue
  mkdir -p "$(dirname "$SKILL/$f")"
  curl -fsSL -o "$SKILL/$f" "$BASE/$f"; n=$((n+1))
done < "$SKILL/midia-pesada.txt"
echo "mídia da skill ok ($n arquivo(s) baixado(s))"
