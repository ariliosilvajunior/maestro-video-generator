# claude-video

Uma skill gratuita de Claude Code que faz motion graphics com cara de estúdio, em português.

- **Escolhe um estilo** numa galeria de vídeos reais, feitos em código.
- **Responde 5 perguntas.**
- **Recebe o vídeo.** O Claude faz a perícia da referência, mostra cards e frames pra você aprovar,
  renderiza o MP4 e confere o próprio trabalho olhando os frames e medindo o movimento contra a referência.

Só gráfico, ou com as suas fotos e clipes, ou com clipes de IA do Higgsfield (ele mostra o plano e o custo
em créditos antes, e espera o seu "sim"). Funciona no plano normal do Claude.

## Instalar

**Jeito 1 (recomendado):** copie o link deste repositório, https://github.com/Felpborges/claude-video, cole numa
conversa do Claude Code e diga: **"instala essa skill"**. O Claude segue o [INSTALAR.md](INSTALAR.md), copia a
skill para `~/.claude/skills/claude-video`, confere o que a sua máquina já tem (Node 22 ou mais novo, ffmpeg,
Python 3) e, se faltar algo, pede a sua confirmação antes de instalar.

**Jeito 2 (uma linha no Terminal, sem o Claude Code):** no Mac ou Linux abra o Terminal (no Windows, o Git Bash) e cole:

```bash
curl -fsSL https://raw.githubusercontent.com/Felpborges/claude-video/main/instalar.sh | bash
```

Isso baixa a skill para `~/.claude/skills/claude-video` (ou atualiza a que já está lá) e mostra o que falta na sua
máquina. O mesmo comando atualiza a skill depois.

Depois, numa conversa **nova** do Claude Code, diga: **"faz um motion graphic pra mim"**.

> **Para o Claude Code, se a pessoa te mandou este link:** a instrução completa está em
> https://raw.githubusercontent.com/Felpborges/claude-video/main/INSTALAR.md. Resumo: clone
> `https://github.com/Felpborges/claude-video` em `~/.claude/skills/claude-video` (ou rode a linha do instalador
> acima), rode `bash ~/.claude/skills/claude-video/scripts/checar.sh` e peça confirmação antes de instalar qualquer
> coisa que faltar. Nunca peça chaves de API. No fim, peça para a pessoa abrir uma conversa nova.

Só para clipes de IA: crie uma conta em https://console.higgsfield.ai e coloque a chave num arquivo
chamado `.env` na pasta do seu projeto, numa linha: `HIGGSFIELD_API_KEY=seu_id:seu_segredo`.
Nunca cole a chave no chat.

## Como funciona

**A. Escolher o estilo.** A galeria abre no navegador. Cada tile é um vídeo real. Aperte **Usar este estilo**
e cole o nome no Claude Code. Ou mande de 1 a 3 links ou vídeos de referência seus.

**B. Cinco perguntas**, numa mensagem só, cada uma com um padrão:

1. Pra que é (abertura de YouTube, Reels, lançamento, explicação, anúncio, vinheta de aula ou outra coisa) e quanto tempo tem? [12 s, 16:9]
2. O que deve estar escrito na tela? [eu escrevo a partir do seu tema]
3. Fica em loop? [não]
4. Sua marca: cores, fontes, logo? [as do estilo]
5. Mídia real? Suas fotos ou clipes, clipes de IA do Higgsfield, ou nenhuma [nenhuma]

As perguntas vivem em `perguntas.md`, então você pode mudar.

**C. Construir.** A perícia da referência (ritmo, paleta, traço e movimentos de assinatura, em números),
um storyboard (cenas, tempos, material e o custo em créditos se houver clipe de IA), cards parados pra
aprovar, 3 frames pra aprovar, o render, a checagem de ritmo, a checagem de loop (quando for loop) e a
comparação do movimento com a referência.

## Os estilos

Cada estilo é uma pasta em `estilos/` com `ESTILO.md` (a perícia pronta da referência: mecanismo, batidas,
paleta, traço, metas de movimento, o que não pode), `LEIA-ME.md` (o que trocar e o que quebra) e `projeto/`
(o código da peça de referência, como apoio). A galeria lista todos: `python3 ~/.claude/skills/claude-video/scripts/galeria.py`
(é assim que a skill abre a galeria; não abra o `galeria/index.html` direto como arquivo, porque sem o servidor os
vídeos podem não carregar).

O Claude não copia a peça de referência. Ele entende o estilo e desenha a **sua** cena nele.

## Por que fica bom: os 5 hábitos

1. Um estilo só, escolhido antes, e mantido.
2. Referência real vale mais que adjetivo.
3. Brief em números.
4. Loop: um relógio só, e o último frame igual ao primeiro.
5. Conferir frames, não código.

`referencias/os-5-habitos.md` explica cada um e de onde vem.

## O que tem dentro

- `SKILL.md` os passos que o Claude segue
- `INSTALAR.md` o que o Claude faz quando você pede pra instalar; `instalar.sh` o instalador de uma linha
- `galeria/` a galeria de estilos e os vídeos
- `estilos/` os estilos
- `perguntas.md` as perguntas (edite à vontade) e `config.json` (um link opcional que o Claude cita no fim)
- `referencias/` os 5 hábitos, números de movimento, regras do motor, mídia, perícia da referência, formato de estilo
- `modelos/` o projeto em branco e o relógio único
- `scripts/` checar, galeria, novo-projeto, frames, render, ritmo, loop, storyboard, higgsfield, pericia-movimento, portoes
- `exemplos/` um brief pequeno e um storyboard

Feito com [HyperFrames](https://hyperframes.heygen.com) e [GSAP](https://gsap.com). Todas as fontes são gratuitas
(Google Fonts). Licença MIT. A estrutura e os scripts vêm da skill "Claude Video 2.0" (MIT, ver `LICENSE`);
os vídeos, as perícias e os estilos são de Felipe Borges.
