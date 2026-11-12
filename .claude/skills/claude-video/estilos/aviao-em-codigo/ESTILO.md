# Avião em código
id: aviao-em-codigo
Melhor para: objeto 3D feito só com código (produto, carro, avião, prédio) apresentado num painel de controles, "cada peça se move" e troca de pintura em um clique, passagem do 3D para a ilustração chapada, decolagem ou saída de cena com física real, cartão final com frase
Formato: 1920×1080 (16:9), 22 s, sem som
Vídeo na galeria: galeria/videos/aviao-em-codigo.mp4
Peça de partida: projeto/index.html

## Como usar esta referência
1. O Claude lê esta ficha inteira antes de abrir qualquer arquivo de `projeto/`.
2. Parte dos cards (o que acontece em cada batida), não do código: a peça nova nasce em cards estáticos, batida a batida, aprovados antes de animar.
3. Mantém o mecanismo, a paleta e o ritmo medidos aqui (amplitude, quase-parada, picos, cortes).
4. Troca o assunto, os textos e as cores de acento para o pedido da pessoa; o que é só desta peça (tema, desenhos, frases) não se copia.
5. O código em `projeto/` é apoio para ver como um truque foi feito, não molde para preencher.

---

# Perícia: avião em código que vira ilustração e decola (A-29 Super Tucano)

*Validado pelo Felipe em 3 de novembro de 2026 (a versão com foto real foi retirada da galeria em 4 de novembro, a pedido dele; fica só a versão desenhada). Referência de partida: vídeo "Three.js Skyraider aircraft model", de @BuildFastWithAI, em prompt-motion.com (39 s), analisado pelos quadros no navegador; o arquivo não foi baixado, então não há comparação de ritmo direta com ele.*

## Mecanismo em uma frase

Um cursor mexe num painel e um avião feito só com código responde; um controle chamado Estilo troca o 3D pela ilustração chapada, e o avião decola todo desenhado.

## Batidas

| Tempo | O que acontece |
|---|---|
| 0 a 8,4 s | A-29 em 3D no hangar de código: hélice, capota, flaps, comandos e troca de pintura (Fumaça para Operacional), com a câmera em órbitas; legendas "Um avião inteiro, só com código", "Cada peça se move", "Pintura nova em um clique" |
| 8,4 a 11,5 s | Pausa, depois o controle Estilo: a ilustração entra por baixo do 3D, do desfoque para o foco, com a câmera avançando e uma faixa de luz no avião; legenda "Agora, pronto para decolar" |
| 11,5 a 13 s | A interface sai; o motor acelera e o anel amarelo da hélice aparece |
| 13 a 20,1 s | Decolagem desenhada, com física: corrida acelerando com a câmera acompanhando, nariz sobe em torno das rodas principais, só depois as rodas saem do chão, subida rasa com o chão à vista |
| 20,1 a 22 s | Cartão final "Do código ao céu", "Desenhado em código, do hangar ao voo", com o crédito da foto de origem no rodapé |

## Como foi feito

- **3D:** Three.js com geometria própria do A-29 (`plane.js`), sem modelo baixado.
- **Ilustração:** camadas chapadas em verde (corpo, asa de perto, pás, fundo e sombra) em `assets/reais/des-*`, tiradas de uma foto CC BY do A-29B da FAB; por isso a ilustração ocupa exatamente o lugar que a foto ocuparia. Hélice, rodas e borrão de velocidade são feitos em código (`real.js`).
- **Sem imagem gerada por IA.**
- `motor.js` ainda sabe fazer a versão com foto (atributo `data-variante`), mas as camadas da foto real não estão neste projeto: só a ilustração renderiza.

## Resultado medido

22 s, 1920 × 1080, 30 fps, sem áudio. Variação de ritmo (pico ÷ mediana) 3,1x; 13 % do tempo em quase-parada; nenhum corte duro. A decolagem é movimento contínuo, por isso a amplitude é mais baixa que a de peças com paradas longas: o que soca aqui é a troca de pintura, a virada para ilustração e a saída da interface.

## Permitido e proibido

- O 3D é geometria em código, nunca modelo baixado; o painel é interface de verdade (botões, controles, cursor), não enfeite.
- A passagem do 3D para a ilustração entra por baixo, do desfoque ao foco; nunca por corte seco.
- A decolagem obedece à física: corrida, rotação no eixo das rodas principais, depois o solo.
- Uma cor de acento (o amarelo do anel da hélice e do cartão final).
- **Proibido:** foto real dentro da peça, modelo 3D baixado, trocar o desenho num corte seco, tirar o cartão final com o crédito.

## Para renderizar de novo

Dentro de `projeto/`: `npx hyperframes@0.8.181 render . -o final.mp4 -q high`.

## Pontos em aberto

- **Crédito obrigatório:** a ilustração foi feita a partir de uma foto CC BY 2.0 (ver `CREDITOS.md`); o crédito fica no cartão final.
- **Marcas:** aparecem a FAB e o nome Embraer; não apresentar como material apoiado por elas.
