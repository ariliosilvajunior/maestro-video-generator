# Custos — Episódio Piloto (Recursos Cognitivos)

Câmbio usado: US$ 1 ≈ R$ 5,20 (cartão internacional + IOF ≈ 4% a mais).
"Real" = custo calculado pelo preço por segundo/unidade do modelo. Conferir com fal.ai → Billing.

## 1. O que já gastamos

| Data | Etapa | Ferramenta | Quantidade | US$ | R$ |
|---|---|---|---|---|---|
| 25/10 | Vistas de perfil e costas da folha do avatar | fal.ai — Nano Banana Pro | 2 imagens | ~0,30 (estimado) | ~1,60 |
| 25/10 | Transcrição palavra por palavra da narração (para cortar o áudio) | fal.ai — Whisper | 3:16 de áudio | ~0,05 (estimado) | ~0,30 |
| 27/10 | Animação das cenas P01–P07 | Google Flow — Omni 1.1 Flash 360p | 7 clipes, 49 créditos | 0 (créditos grátis do dia) | 0 |
| 27/10 | Teste avatar — Kling AI Avatar v2 | fal.ai | 8,5 s | 0,48 | 2,50 |
| 27/10 | Teste avatar — H3 Max 480P | fal.ai | 8,4 s | 0,42 | 2,20 |
| 27/10 | Fundo verde na foto do avatar | fal.ai — BiRefNet | 1 imagem | ~0,01 | ~0,05 |
| 27/10 | Avatar falando o episódio inteiro | fal.ai — H3 Max 480P | 196 s (16 pedaços) | 9,80 | 51,00 |
| | **Total até agora** | | | **~11,06** | **~57,50** |

Ainda falta: cenas P08–P33 (Flow) e montagem (feita aqui, R$ 0).

## 2. Custo de 1 episódio daqui pra frente (sem testes de ferramenta)

| Parte | Como | US$ | R$ |
|---|---|---|---|
| Avatar falando (~3 min) | fal.ai H3 Max 480P, US$ 0,05/s | ~9,80 | ~51 |
| Cenas animadas (~36 clipes) | Google Flow, créditos do plano/grátis | 0 extra | 0 extra |
| Montagem (cenas + avatar + narração) | ffmpeg aqui no Maestro | 0 | 0 |
| **Por episódio** | | **~9,80** | **~51** |

## 3. Média mensal com 4 episódios

| Item | US$/mês | R$/mês |
|---|---|---|
| Google AI Pro (Flow: 1.000 créditos/mês + 50/dia ≈ cenas de 4 episódios) | 19,99 (preço EUA; no Brasil conferir) | ~104 |
| Avatar H3 Max, 4 × 196 s | ~39,20 | ~204 |
| **Total estimado** | **~59** | **~308** |

Opção sem assinatura: cenas só com os 50 créditos grátis/dia (≈ 7 clipes/dia → 1 episódio a cada ~5 dias, ~4–6 por mês) → total ~US$ 39/mês (~R$ 204).

## 4. Automação (como dá para deixar automático)

| Etapa | Hoje | Automatizado |
|---|---|---|
| Roteiro e narração | você grava | você grava (é a sua voz; nada muda) |
| Corte do áudio por cena | automático (Whisper + script) | igual |
| Avatar falando | automático (H3 Max via API, eu rodo) | igual |
| Imagens das cenas | feitas à mão | Nano Banana via API (~US$ 0,04–0,15 por imagem → ~US$ 1,50–5 por episódio) |
| Animação das cenas | Flow à mão (cliques) | Omni Flash via API do Google: ~US$ 0,10/s em 720p → ~US$ 24 por episódio (sem créditos grátis) |
| Montagem final | automática aqui | igual |

Custo de 1 episódio 100% automático: ~US$ 35–40 (~R$ 185–210); 4 por mês ≈ US$ 140–160 (~R$ 730–830).
Meio-termo recomendado: tudo automático menos a animação das cenas, que fica no Flow com o plano (mais barato).
