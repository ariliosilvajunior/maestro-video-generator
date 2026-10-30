# Ficha de câmera por cena (referência ShotDeck) — combinado com o dono em 30/10/2026

**Quando vale:**
- **Próximos episódios:** em tudo — imagem (plano, composição, lente, luz, hora, época, paleta) e animação.
- **Os 2 episódios em produção agora:** as IMAGENS ficam como estão (sem ficha); a ficha entra na parte de
  MOVIMENTO e na MONTAGEM quando a sessão do Claude gerar o vídeo inteiro (ver "Nos 2 vídeos em produção").

**O que é:** a ficha técnica que o ShotDeck mostra em cada quadro, usada como REFERÊNCIA ESCRITA (não a imagem).
O dono escolhe no ShotDeck (conta dele, logado no navegador) os quadros de referência de cada episódio e cola a
ficha; a sessão do Claude transforma cada ficha em linhas fixas no texto das cenas.

## Campos que usamos (e como viram texto da cena)
| Campo do ShotDeck | Exemplo (O Brutalista, 2024) | Vira no texto da cena |
|---|---|---|
| Tags | sentada à mesa, garrafa de cerveja, melancólica, vestido, papel de parede texturizado | objetos e clima da cena |
| Período de tempo | Década de 1940 | época de roupas, objetos e lugar |
| Cor | Quente, saturado, vermelho (+ as 7 faixas de cor) | paleta do episódio (cores fixas em todas as cenas) |
| Tamanho do quadro | Plano Médio Fechado | "medium close-up" etc. |
| Tamanho da lente / Lente | Médio / Cooke S4/i | "50mm-like lens, natural perspective" |
| Composição | Pesado à esquerda, lado curto | "subject on the left third, looking toward the short side" |
| Iluminação / Tipo | Luz lateral / Luz artificial | "side light from a practical lamp" |
| Horário do dia | Noite | hora do dia da cena |
| Interior/Exterior + Conjunto | Interior · Casa > Cozinha | qual lugar fixo (plano -A) |
| Formato / Película | Filme 35mm · Vision3 250D/500T | grão e textura de filme 35mm |
| Proporção | 1.66 | (nosso vídeo é sempre 16:9; só referência) |

Campos que NÃO usamos: diretor, atores, local de filmagem, câmera/marca — não mudam a imagem e citar ator/filme
no texto pode fazer o Flow copiar rosto ou cena protegida.

## Regras
1. Cada episódio: uma paleta (cores do campo "Cor") + 5–10 fichas de referência guardadas em
   `Kit de referência/01-estilo` (texto da ficha, não print do filme).
2. Cada cena ganha a linha **CÂMERA:** tamanho do quadro · composição · lente · luz (de onde vem) · hora.
3. Decupagem: abrir o lugar em plano geral, depois médio, close nos momentos de emoção, fechar em geral.
4. A luz sempre vem de uma fonte que existe no lugar (janela, lâmpada, sol) — a mesma do plano fixo -A.

## Nos 2 vídeos em produção (só movimento e montagem — combinado com o dono 30/10/2026)
A imagem já está feita, então quadro, composição e lente já estão decididos. O que a ficha ainda melhora:
1. **Texto de animação de cada cena:** movimento de câmera coerente com o tamanho do quadro (plano geral = quase
   parado; médio = push-in lento de 2–4%; close = parado, só respiração/olhar), e luz motivada se mexendo de leve
   (cortina na janela, chama, sombra de folha) — sempre da mesma fonte que aparece na imagem.
2. **Montagem (ffmpeg, feita pelo Claude):** correção de cor do episódio inteiro com a paleta tirada da ficha
   (ex.: quente/saturado = curvas puxando para âmbar e vermelho), grão de filme 35mm leve igual em todas as cenas,
   vinheta suave; ritmo de cortes seguindo a decupagem (geral → médio → close na emoção → geral no fim).
3. O dono escolhe no ShotDeck as fichas que combinam com cada um desses 2 episódios e cola o texto; sem ficha,
   a montagem usa a paleta quente padrão do piloto.
