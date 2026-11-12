#!/usr/bin/env bash
# instalar.sh: instala (ou atualiza) a skill claude-video em ~/.claude/skills/claude-video.
#
# Para a pessoa, no Terminal (Mac ou Linux) ou no Git Bash (Windows), uma linha só:
#   curl -fsSL https://raw.githubusercontent.com/Felpborges/claude-video/main/instalar.sh | bash
#
# Não precisa de sudo. Não instala Node, ffmpeg nem Python: só confere e diz o que falta, no fim.
# Rodar de novo atualiza a skill. Variáveis opcionais: CLAUDE_VIDEO_DEST (pasta de destino),
# CLAUDE_VIDEO_REPO (repositório git), CLAUDE_VIDEO_ZIP (arquivo zip, usado quando não há git).
set -eu

REPO=${CLAUDE_VIDEO_REPO:-https://github.com/Felpborges/claude-video}
ZIP=${CLAUDE_VIDEO_ZIP:-https://github.com/Felpborges/claude-video/archive/refs/heads/main.zip}
DEST=${CLAUDE_VIDEO_DEST:-$HOME/.claude/skills/claude-video}

diga() { printf '\n==> %s\n' "$*"; }

mkdir -p "$(dirname "$DEST")"

if [ -d "$DEST/.git" ] && git -C "$DEST" remote get-url origin 2>/dev/null | grep -q 'claude-video'; then
  # já instalada por git: só atualiza
  diga "Atualizando a skill que já está em $DEST"
  if ! git -C "$DEST" pull --ff-only; then
    diga "Não consegui atualizar pelo git (talvez haja mudanças locais). A versão instalada continua valendo."
  fi
else
  if [ -e "$DEST" ]; then
    BAK="$DEST.antigo-$(date +%Y%m%d-%H%M%S)"
    diga "Já existe $DEST; guardando em $BAK"
    mv "$DEST" "$BAK"
  fi
  if command -v git >/dev/null 2>&1 && git clone --quiet --depth 1 "$REPO" "$DEST"; then
    diga "Skill baixada com git em $DEST"
  else
    rm -rf "$DEST"
    diga "Baixando o ZIP (sem git)"
    TMP=$(mktemp -d)
    curl -fsSL -o "$TMP/skill.zip" "$ZIP"
    if command -v unzip >/dev/null 2>&1; then
      unzip -q "$TMP/skill.zip" -d "$TMP"
    else
      python3 -c 'import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])' "$TMP/skill.zip" "$TMP"
    fi
    mv "$TMP"/claude-video-*/ "$DEST"
    rm -rf "$TMP"
    diga "Skill baixada em $DEST"
  fi
fi

chmod +x "$DEST"/scripts/*.sh "$DEST"/instalar.sh 2>/dev/null || true
if [ ! -f "$DEST/SKILL.md" ]; then
  echo "Algo deu errado: não existe $DEST/SKILL.md. Tente de novo ou baixe o ZIP em $ZIP e descompacte em $DEST."
  exit 1
fi

diga "Conferindo o que a sua máquina já tem"
bash "$DEST/scripts/checar.sh" || true

cat <<FIM

Pronto. A skill está em $DEST
Abra uma conversa NOVA no Claude Code e diga: faz um motion graphic pra mim
Se a checagem acima apontou algo faltando, peça no Claude Code: "instala o que falta pra skill claude-video".
FIM
