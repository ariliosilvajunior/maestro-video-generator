---
name: propaganda-rc
description: Vídeos de MARKETING DO SISTEMA Recursos Cognitivos (propaganda, anúncio, tutorial do sistema, review/depoimento, comercial de 15–30 s, Reels/YouTube do produto). Escolhe o formato (Tutorial, Review, Comercial), escreve o roteiro tomada a tomada com a ordem mudança → dor → solução → prova → CTA, diz de onde vem cada tomada (tela em Remotion, cena no Flow, avatar) e entrega o pacote (título, capa, legenda, cortes curtos). Use quando o dono pedir propaganda, anúncio, vídeo do sistema, "Pedir roteiro" no Estúdio RC, ou um vídeo de marketing do produto. Não use para os episódios ilustrados das notícias (skill roteiro-ilustrado).
---

# Propaganda RC — vídeos de marketing do sistema

> Dono, 04/11/2026: "isso ajuda a criarmos nossos vídeos para marketing do sistema? … bora". Método adaptado do
> pacote "Marketing Studio Skills Bank" (marketing-studio-director, higgsfield-content-factory, higgsfield-explainer),
> sem o Higgsfield (pago por crédito): as tomadas saem das NOSSAS ferramentas.
> Antes de começar: `docs/GUIA_REEL_LAB.md` (guia de partida) e, se a ideia estiver vaga, a skill `intention-builder` (QUICK).

## Onde roda
- Pedido do dono no **Estúdio RC → Propaganda do sistema** (funcionalidade, público, **tipo de anúncio**, duração,
  formato, tom, CTA). A sessão lê `GET /estudio/automacao` (peças `tipo=propaganda` com `dados.tomadas` vazio), escreve
  o roteiro e grava `dados.tomadas` + `dados.atos` com `POST /estudio/automacao` (ver `docs/ESTUDIO_RC.md`).
- Vídeo de tela: `maestro-video-generator/propaganda-sistema/` (Remotion, kit `src/kit/kit.tsx`, README).

## 1. Escolher o formato (um por vídeo; girar os três na semana — nunca o mesmo duas vezes seguidas)
| Tipo | Para quê | Estrutura (30 s) | De onde vêm as tomadas |
|---|---|---|---|
| **Tutorial** | mostrar uma tarefa resolvida no sistema | gancho com a tarefa (0–3 s) → 3 a 5 passos na tela, cursor clicando (3–24 s) → resultado pronto + CTA (24–30 s) | **Remotion** (tela recriada a partir do print do dono, dados fictícios) |
| **Review** | prova social: o antes e o depois de um professor | "eu perdia X horas com…" (0–4 s) → o problema concreto (4–10 s) → o sistema na tela (10–22 s) → resultado em número real + CTA | **avatar do Prof. Arilio** ou depoimento real (Painel → Depoimentos) + **Remotion** |
| **Comercial** | marca e desejo | mudança no AEE (0–3 s) → dor do professor (3–10 s) → o sistema resolvendo (10–22 s) → prova + CTA (22–30 s) | **cenas no Flow** (pessoas, escola) + **Remotion** (telas) + logo |

Regras: 15 s = corta os passos do meio; 9:16 para Reels, 16:9 para YouTube/Facebook (Facebook com laterais
desfocadas se o original for vertical); 1 frase curta por tela com uma prova visual; nunca prometer resultado que não
é fato (`docs/CONTEXTO_NEGOCIO.md`); número só se for real.

## 2. Roteiro tomada a tomada (formato gravado no Estúdio)
Cada tomada: `nome`, `tempo` (ex.: "0–3 s"), `origem` ("Remotion — tela X" / "Flow — cena" / "Avatar"), `descricao`
(o que se vê), `camera` (frase exata de `docs/MOVIMENTOS_CAMERA.md`; tela = parada ou zoom leve), `transicao`, `prompt`
(para o Flow/Remotion, em inglês quando for imagem) e `pronta: false`. `atos` = 3 blocos com `nome` e `peso`
(gancho+dor / sistema resolvendo / prova+CTA).

## 2b. Estilo de edição: o apresentador muda de posição ao longo do vídeo (dono, 09/11/2026)
> "no mesmo vídeo ele fica em várias posições diferentes — isso traz uma dinâmica bem legal de retenção". Referência:
> Reels de design de sistema que o dono mandou (5 prints: comentário na tela, rosto cheio, tela em cima/rosto embaixo,
> rosto pequeno sobre a tela, só a tela com setas). Vale para TODO vídeo de propaganda vertical (Tutorial, Review e
> Comercial com avatar).

O apresentador é o avatar do Prof. Arilio em **fundo verde** (H3 Max ou gravação do dono em fundo verde) — recortado
(chroma key) e posto por cima da tela no Remotion. **Nunca o mesmo layout por mais de ~4–5 s; nunca dois seguidos
iguais.** Cada tomada do roteiro diz o seu `layout`:

| Layout | Como fica (9:16) | Quando usar |
|---|---|---|
| **L1 Comentário** | cartão de comentário/pergunta de um professor (branco, nome + texto curto) no meio, tela do sistema atrás desfocada, apresentador recortado entrando por baixo | gancho (0–3 s): "Um professor perguntou: …" — pergunta real ou genérica, nunca nome de aluno |
| **L2 Rosto cheio** | apresentador ocupando a tela toda, fundo do estúdio/escritório desfocado | a frase de impacto, a dor, a opinião (2–4 s) |
| **L3 Tela em cima / rosto embaixo** | metade de cima = tela do sistema (Remotion), metade de baixo = apresentador do peito para cima | explicando o que aparece na tela |
| **L4 Rosto pequeno** | tela do sistema cheia; apresentador recortado pequeno num canto de baixo (cabeça e ombros, ~30% da largura), sem caixa | mostrando um passo, o cursor clicando |
| **L5 Só a tela** | só a tela/gráfico, setas e rótulos ("Conceito → Layout → Resultado"), sem apresentador | o "antes e depois", o resultado pronto |

- Legenda: palavra-chave grande no meio (1–2 palavras por vez, branca com sombra), na altura que não cobre o rosto;
  some quando o layout é L5 com texto próprio.
- Sequência típica de 30 s: L1 → L2 → L3 → L4 → L2 → L5 → L4/L2 com o CTA. Transição seca (corte) na batida da fala;
  zoom leve (105%) na tela em L4.
- O roteiro grava o layout em cada tomada (`descricao` começa com "L3 —" etc.) e a montagem no Remotion
  (`propaganda-sistema/src/kit/`) monta as cinco posições com o mesmo recorte do avatar.
- 16:9 (YouTube/Facebook): L3 vira tela à esquerda / apresentador à direita; L4 igual (canto de baixo à direita).

### Regras fixas do dono (09/11/2026, depois do 1º teste)
- **Sem siglas na fala:** sempre por extenso — "Atendimento Educacional Especializado" (não AEE), "Plano Educacional
  Individualizado" (não PEI). Na legenda também. Rótulo real do sistema na tela pode ficar como está.
- **Cores e formatos dos botões do sistema NUNCA mudam** na tela recriada ("mantenha as mesmas cores e formatos dos
  botões do sistema original, não altere isso nunca"). Cores medidas nos prints estão em `propaganda-sistema/src/kit/kit.tsx`
  (`C`). Para destacar algo: anel/seta/brilho POR FORA do botão, nunca recolorir.
- **Avatar só se a boca bater com a fala.** Trecho antigo do avatar (boca fora de sincronia) não serve nem para teste —
  sem avatar sincronizado, a dinâmica vem da TELA mudando de posição, inclinação e tamanho a cada 3–5 s + motion
  graphics (1º teste aprovado assim). Os layouts L1–L4 acima valem quando houver avatar gerado com a fala da peça.

## 3. Antes de gerar (antes de qualquer crédito)
- Pesquisa rápida do que está funcionando no nicho (Reels/YouTube de professores de AEE, educação inclusiva): ganchos
  e formatos que repetem. Ferramentas em Painel → Ferramentas e referências → "Estudar concorrência".
- Telas: pasta do Drive **"Telas do sistema"** (dono, 04/11/2026) com um print de cada tela, nome
  `TLnn-nome-da-tela.png` (estados: `TL03a-…`, `TL03b-…`). O roteiro cita a tela pelo código (ex.: "Remotion — TL03").
  Recriar em código com dados fictícios (LGPD — nunca dado real de aluno).

## 4. Pacote de entrega (todo vídeo sai com)
- **Som padrão da marca** (dono, 07/11/2026): voz do dono já tratada (narração do podcast ou gravação aprovada, nunca
  voz nova) + trilha `painel/static/musicas/padrao.mp3` a 0,06 por baixo da voz (0,25 sem voz) — igual ao Reels e ao
  videocast. Detalhe em `ecossistema-ia-recursos-cognitivos/docs/ESTUDIO_RC.md`.
- Título (≤ 100, sem `<` `>`), legenda com gancho < 125 caracteres + CTA + até 5 hashtags, capa pela skill
  `designer-recursos-cognitivos` (azul, verde-água no destaque, Goodly, foto do professor).
- Corte curto 9:16 de 15 s quando o vídeo for maior.
- **Revisor obrigatório** (`revisor-montagem`) antes de enviar ao Painel; publicação pelo Calendário (1 por rede por
  dia, Buffer 2 dias antes).
