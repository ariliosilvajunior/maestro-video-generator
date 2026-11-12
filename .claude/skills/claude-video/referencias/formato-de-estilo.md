# Como um estilo é escrito

Todo visual da galeria é uma pasta em `estilos/<id>/`:

- `ESTILO.md` a ficha (sempre). O formato está abaixo. Mantenha em até uns 80 linhas.
- `projeto/index.html` uma peça completa e funcional nesse visual (quando existe), com os arquivos dela ao lado. Copie a pasta `projeto/` inteira como ponto de partida.
- `projeto/studio.js` só se essa peça usa o ajudante de relógio único.

Um estilo novo feito a partir das referências de alguém usa o mesmo formato. Salve como `estilos/<novo-id>/ESTILO.md`.

## Formato do ESTILO.md

```
# <Nome de exibição>

id: <id>
Bom para: <3 a 6 tipos de vídeo>
Clima: <uma frase>
Peça de partida: estilos/<id>/projeto/index.html (<duração> s, <faz loop ou não>)   ou   nenhuma, só a ficha
Vídeo da galeria: galeria/videos/<id>.mp4

## Paleta (hex)
- fundo: #......
- tinta: #......
- ... (nomeie cada cor; marque a ÚNICA cor de destaque)

## Tipografia
- Display: <fonte> <peso>, tracking <em>, entrelinha <n>
- Rótulos: <fonte> <peso>, <px>
- Links de fonte (cole no <head>; todas as fontes são gratuitas):
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=...&display=swap">

## Easing (números)
- pousar: <ease>, <s>
- sair: <ease>, <s>
- mover: <ease>, <s>
- escalonamento: <s>

## Regras de movimento
- <4 a 8 regras que fazem o movimento parecer este visual>

## Movimentos de assinatura
- <os 2 a 4 movimentos que tornam o visual reconhecível>

## Composição
- <grade, margens, onde o herói fica, quão cheio é o frame>

## Com mídia
- <como fotos ou clipes reais ficam neste visual: máscaras, tratamento de cor, enquadramento>

## Lista de proibições
- <coisas que quebram este visual>
```

## Regras de fonte (todos os estilos)
- Só fontes gratuitas: Google Fonts, ou Fontshare carregado pelo link do próprio Fontshare na hora do render.
- Se adicionar qualquer `<link>` de fonte, linke TODAS as fontes que a peça usa (o HyperFrames então pula o carregamento de fontes dele).
- Nunca distribua arquivos de fonte. Nunca use fonte paga.
