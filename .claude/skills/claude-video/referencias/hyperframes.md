# HyperFrames: as regras que importam

O HyperFrames transforma uma página HTML com uma timeline GSAP pausada num MP4, frame a frame.
Documentação: https://hyperframes.heygen.com , ou no terminal: `npx hyperframes docs gsap`,
`npx hyperframes docs compositions`, `npx hyperframes docs data-attributes`.
Os scripts fixam a versão 0.8.181 (`HF_VERSION` troca). Precisa de Node 22+ e ffmpeg.

## O contrato
- Um elemento raiz: `<div id="root" data-composition-id="main" data-start="0" data-duration="9" data-width="1920" data-height="1080">`.
- Uma timeline pausada registrada como `window.__timelines["main"] = tl`. O `STUDIO.play()` faz isso por você.
- Mídia com tempo leva `class="clip"` mais `data-start` e `data-duration`.
  Vídeo: `<video class="clip" src="media/x.mp4" muted playsinline data-start="2" data-duration="4" data-media-start="0.5">`.
- Render: `npx hyperframes render <pasta> -o saida.mp4 -q draft` (rápido) ou `-q high` (final).
- Frames: `npx hyperframes snapshot <pasta> --at 0,3,6 --no-end -o frames/`.
- Lint: `npx hyperframes lint <pasta>`.

## Regras obrigatórias (ou o render tremula ou sai diferente)
- Mesmo tempo entrando, mesma imagem saindo. Sem `Math.random` (use `STUDIO.rng(seed)`), sem `Date.now`, sem timers, sem loops de `requestAnimationFrame`.
- Texto que muda ao longo do tempo muda dentro da função render ou no onUpdate de um tween, nunca com gsap.set no innerHTML.
- Canvas: desenhe o frame inteiro a partir de t em render(t).
- Carregue mídia da pasta do projeto (`media/`). Mantenha os nomes de arquivo simples.

## Fontes
- Use só fontes gratuitas: Google Fonts, ou fontes do Fontshare carregadas pelo link do próprio Fontshare na hora do render
  (por exemplo Switzer: `https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700,800&display=swap`).
  Nunca copie arquivos de fonte para dentro de um projeto. Nunca use fonte paga.
- Carregue cada fonte com um `<link>` no `<head>`. Se adicionar QUALQUER link de fonte, linke TODAS as fontes que a página usa:
  o HyperFrames então pula o carregamento de fontes dele, e uma fonte sem link cai para Times.
- Nomes de fontes do sistema são trocados pelo HyperFrames: "Helvetica Neue", "Avenir", "SF Pro" viram Inter e
  "Futura" vira Montserrat. Escolha uma Google Font de propósito (Inter, Jost, Bodoni Moda, Playfair Display...).
- Texto medido em código (canvas, offsetWidth) precisa ser medido de novo depois que as fontes carregam
  (`document.fonts.ready.then(redraw)`). O `studio.js` faz isso por você.
- Renderizar precisa de internet para o GSAP e as fontes (os dois vêm de CDNs públicas).

## Formatos
- 16:9 é 1920 x 1080. 9:16 é 1080 x 1920. Refaça o layout da cena para cada um; nunca só recorte.
- Overlay transparente para editores: `--format mov` com fundo transparente.
