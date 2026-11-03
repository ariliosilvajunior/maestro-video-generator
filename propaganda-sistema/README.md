# Propagandas do sistema (Remotion)

Modelo oficial desde 03/11/2026, aprovado pelo dono no teste "AlunosVisualizarEditar".
Vídeo feito em código, nítido em 1080p, sem gastar crédito.

## As 2 referências oficiais de propaganda
1. **Telas do sistema animadas.** Base: este projeto, com a técnica tirada de
   github.com/naveen-annam/creativly.ai-brand-video-remotion (licença MIT).
   Recria a tela em código, o cursor clica, a janela abre e o texto da marca entra.
   Ainda dá para aproveitar dele: transições (flip, wipe, light leak), texto palavra por palavra e digitação.
2. **Tomadas de cinema** (pessoas, ambiente, energia): skill `video-prompt-builder`,
   no formato Seedance tomada a tomada, com as imagens e vídeos gerados no Flow.

Uma propaganda pode misturar as duas: abre com uma tomada de cinema e mostra o sistema em Remotion.

## Ordem da história (referência: sales decks, contentbeta.com e moonb.io)
1. **Mudança**: o que mudou no AEE (abre com isso, não com o produto).
2. **Dor**: o problema do professor, nas palavras dele.
3. **Solução em uso**: a tela do sistema funcionando (Remotion).
4. **Prova**: depoimento real ou número real. Nunca inventar.
5. **Um único próximo passo**: o CTA.
Uma frase por tela, curta e afirmativa, com uma prova visual para cada frase.

## Regras
- Tela do sistema é recriada em código a partir do print do dono. Nunca usar o print direto.
- Dados e foto sempre fictícios (o print real tem dados de aluno, LGPD).
- Peças prontas ficam em `src/kit/kit.tsx`: `Moldura` (barra lateral + topo), `Botao`, `Cursor` (pontos e cliques), `Legenda`, `Final` (logo, frase e site), `Foto` fictícia.
- Cada propaganda nova é um arquivo em `src/videos/` mais uma linha em `src/Root.tsx`.

## Gerar
```bash
npm install
npx remotion still src/index.ts <Id> out/f.png --frame=120 --browser-executable=/opt/pw-browsers/chromium   # conferir quadros
npx remotion render src/index.ts <Id> out/<Id>.mp4 --browser-executable=/opt/pw-browsers/chromium --concurrency 3
```
