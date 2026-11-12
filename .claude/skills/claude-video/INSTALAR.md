# Instalar a skill claude-video

> **Para a pessoa:** copie o link deste repositório, https://github.com/Felpborges/claude-video, cole numa
> conversa do Claude Code e diga "instala essa skill". O resto é com o Claude. Ao terminar, abra uma conversa
> nova para a skill carregar.
>
> **Plano B, sem o Claude Code:** no Terminal (Mac ou Linux) ou no Git Bash (Windows), cole esta linha:
> `curl -fsSL https://raw.githubusercontent.com/Felpborges/claude-video/main/instalar.sh | bash`
> Ela baixa a skill para `~/.claude/skills/claude-video` (ou atualiza a que já está lá) e diz o que falta na máquina.

## Instrução para o Claude Code

Instale esta skill na máquina da pessoa. Faça exatamente isto, nesta ordem, falando em português simples e dizendo
o que está fazendo. Não instale nada que a checagem não pediu, nunca use `sudo`, e nunca peça, imprima nem registre
chaves de API.

1. **Onde:** `~/.claude/skills/claude-video` (as skills do usuário valem em qualquer pasta). Só instale em
   `.claude/skills/` de um projeto se a pessoa pedir isso.
2. **Já existe?** Se `~/.claude/skills/claude-video/.git` existe e
   `git -C ~/.claude/skills/claude-video remote get-url origin` aponta para `claude-video`, é esta mesma skill:
   rode `git -C ~/.claude/skills/claude-video pull --ff-only` e pule para o passo 5. Se existe outra coisa com esse
   nome, pergunte se pode guardar de lado (`mv` para `~/.claude/skills/claude-video.antigo-<data>`); só siga com um sim.
3. **Baixar.** O mais simples é o instalador, que faz os passos 3 e 4 sozinho e não precisa de confirmação:
   `curl -fsSL https://raw.githubusercontent.com/Felpborges/claude-video/main/instalar.sh | bash`
   Se preferir à mão: `git clone --depth 1 https://github.com/Felpborges/claude-video ~/.claude/skills/claude-video`.
   - No Mac, se o `git` abrir uma janela pedindo para instalar as "ferramentas de linha de comando" (Xcode Command
     Line Tools), diga à pessoa para aceitar, esperar terminar e avisar; depois rode o comando de novo.
   - Sem `git`: baixe o ZIP `https://github.com/Felpborges/claude-video/archive/refs/heads/main.zip` (`curl -L -o`),
     descompacte (`unzip`; no PowerShell, `Expand-Archive`) e mova a pasta `claude-video-main` para
     `~/.claude/skills/claude-video`.
   - Se o seu ambiente não deixar escrever em `~/.claude/skills` (sandbox), dê à pessoa a linha do instalador para
     colar no Terminal dela e espere ela dizer que terminou.
   No fim, o arquivo `~/.claude/skills/claude-video/SKILL.md` precisa existir.
4. `chmod +x ~/.claude/skills/claude-video/scripts/*.sh`
5. `bash ~/.claude/skills/claude-video/scripts/checar.sh`. Para cada item que faltar, diga em uma linha o que é e o
   comando que vai rodar, e **peça confirmação antes de instalar**. Só instale depois do sim. Os itens possíveis:
   Node 22 ou mais novo (https://nodejs.org, ou `brew install node` no Mac), ffmpeg com ffprobe (`brew install ffmpeg`
   no Mac; no Linux, o gerenciador de pacotes; no Windows, https://ffmpeg.org) e Python 3. O HyperFrames é baixado
   sozinho na primeira renderização (`npx hyperframes@0.8.181`); avise que a primeira execução demora alguns minutos
   e precisa de internet.
6. Rode a checagem de novo até ela dizer "pronto".
7. Diga à pessoa que a instalação terminou e que ela precisa abrir uma conversa nova e dizer
   "faz um motion graphic pra mim". Para atualizar depois: o instalador de novo, ou
   `git -C ~/.claude/skills/claude-video pull`.

A chave do Higgsfield é opcional (só para clipes de IA) e vai num arquivo `.env` na pasta do projeto da pessoa, que
ela mesma cria. Nunca cole chaves no chat.

## Requisitos

- macOS ou Linux (testado no macOS). No Windows, use o Git Bash para os scripts `.sh`; ainda não testado de ponta a ponta.
- Node 22 ou mais novo (https://nodejs.org), ffmpeg com ffprobe (`brew install ffmpeg`), Python 3.
- Internet na primeira renderização (download do HyperFrames e das fontes).

## Se a galeria abrir vazia

A galeria é servida pelo script `scripts/galeria.py` (é o que a skill faz na Etapa A). Nunca abra o
`galeria/index.html` direto como arquivo. Se ela abrir sem vídeos ou com um aviso amarelo no topo, diga no Claude
Code "abre a galeria de estilos" e recarregue a página no endereço que ele imprimir. Ela desliga sozinha depois de
4 horas; é só pedir de novo.
