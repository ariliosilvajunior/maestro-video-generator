# Referência de câmera — vídeo "Warmth and Serenity" (Gengu Art), estudado em 25/11/2026

Vídeo enviado pelo dono (pasta do Drive "Referências de câmera"), 69 min, mesmo estilo de bonecos de feltro da série.
Estudado com `scripts/estudar_referencia.py` nos primeiros 12 min: 115 cortes, folhas de quadros de cada plano.

## O que eles fazem
1. **Planos de 6 a 8 s, corte seco** entre eles (115 cortes em 12 min). Dissolve (~1 s, uma imagem passando por cima da
   outra) só ao trocar de AMBIENTE (ex.: mesa de jantar → sala do piano).
2. **Cada plano tem UM movimento de câmera forte e contínuo, do começo ao fim** — não um "push-in de 2–4%":
   - **Aproximação grande (dolly-in):** começa no plano aberto (velho e menino na banca de maçãs) e termina em
     close-up do detalhe (a maçã na mão + o rosto do menino). Em 6 s vai do geral ao detalhe.
   - **Atravessar um primeiro plano:** a câmera passa por dentro de um arco/portão desfocado na frente e entra na
     feira — o arco some pelas bordas. Dá profundidade e "entrada" no lugar.
   - **Arco lento (meia-volta curta):** em volta do violinista, de plano médio a close, girando uns 20–30°.
   - **Aproximação lenta no rosto** enquanto a expressão muda (chorando → rindo).
   - **Plano geral quase parado** só na abertura da cidade, com luz.
3. **Ritmo de montagem:** geral (lugar) → médio (personagens) → detalhe (mãos, comida, instrumento, panela com vapor)
   → volta ao geral. Os planos de detalhe de mãos e objetos aparecem a cada 3–4 planos.
4. **Fundo sempre desfocado** (profundidade de campo curta) e poucos personagens nítidos por plano (1–2).

## Como fica nos textos de animação do Flow (Omni)
Um movimento por cena, escrito assim (nunca dois juntos):
- Aproximação grande: `CAMERA: a slow, continuous dolly-in from the wide shot to a close-up of <detalhe>, ending
  framed tight on <detalhe>; the background stays softly blurred.`
- Atravessar primeiro plano: `CAMERA: the camera glides forward through the <arch/doorway> in the foreground, which
  slides out past the edges of the frame, into the <lugar>.` (a imagem de início precisa ter o arco desfocado na frente)
- Arco curto: `CAMERA: a slow 25-degree arc around <personagem> at eye level while moving slightly closer, the
  subject stays in the centre of the frame.`
- Rosto: `CAMERA: a slow push-in toward <personagem>'s face, ending in a close-up.`

## Cuidados (nossas regras continuam)
- Movimento grande aumenta o risco de deformar o boneco: conferir a **folha do movimento** (8 quadros) no Painel.
- Aproximação grande e arco funcionam melhor com 1–2 personagens. Cena com 4+ pessoas: plano geral quase parado.
- Dissolve se faz na MONTAGEM (ffmpeg), não no Flow.

## Resultado do teste (26/11/2026, dono)
- **E012 — aproximação no rosto: APROVADO ("ficou top").** Vale para o episódio.
- **E041 — meia-volta (arco): REPROVADO.** O menino estava de costas; ao girar, a IA inventou o rosto (outro menino),
  o globo saiu da mesa e o zoom ficou rápido demais em 4 s. **Regra:** nada de arco/meia-volta. Câmera nunca revela o
  lado da pessoa que não aparece na imagem de início (vídeo do Flow em "Frames" usa só a imagem de início — a ficha do
  personagem não entra). Personagem de costas: aproximação no que a mão dele faz, nunca no rosto.
- Todo texto de animação começa com `DURATION: 4 seconds` (o Omni 1.2 escolhia 7 s sozinho).
