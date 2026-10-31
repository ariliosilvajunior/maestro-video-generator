# MANUAL DAS CENAS — episódios ilustrados (fonte única, obrigatória)

> Pedido do dono (31/10/2026): "fazer um manual para não cometer mais este tipo de erro… se não consegue,
> cria um especialista que consiga". Este manual junta as lições A–M (`LICOES_CENAS.md`, que vira histórico)
> num só lugar, por ETAPA, com um código por regra. Quem escreve texto de cena segue isto; o verificador
> automático (`scripts/validar_cenas.py`) e o especialista revisor (`.claude/agents/revisor-cenas.md`)
> barram o que não segue. **Nenhum texto vai para o Painel sem passar pelos dois.**
>
> Ordem fixa: **0 Família/época → 1 Kit → 2 Cenas largas → 3 Closes → 4 Animação → 5 Verificação → 6 Painel.**

---

## 0. Antes de tudo: família, época, personagens
- **R01** A notícia é a MESMA história de um episódio já feito? → mesma família, mesmos lugares, mesmas folhas.
  Assunto diferente → personagens NOVOS (pode reaproveitar lugar).
- **R02** Toda cena tem etiqueta de época na descrição: `[ANOS 80 · livro]`, `[HOJE · sala do AEE]`, etc.
- **R03** Cena de uma época só usa personagens daquela época. Personagem de outra época/família tem que ser
  **visualmente diferente** (cabelo, roupa, cor) — senão o dono lê como a mesma pessoa.
- **R04** Toda pessoa citada na narração (bebê, irmão, médico, avó) tem folha no Kit antes da 1ª cena.
- **R05** Idades coerentes entre si (casal, pais × filhos, hoje × antes). Folha diz idade e "sem cabelo branco /
  sem rugas fundas" quando é jovem.

## 1. Kit (nada de cena antes do Kit inteiro pronto e salvo no Drive)
- **R10** Folha de personagem = UMA pessoa, idade, altura, condição física, roupa exata, close das MÃOS da idade.
  Mesma pessoa em outra idade: anexar a folha original como identidade; muda só idade e roupa da idade.
- **R11** Lugar que se repete = MAPA FIXO contado: cada móvel com quantidade, cor e posição (parede do fundo /
  esquerda / direita), lado da porta e da janela ("NO window on the back wall"), porta SEMPRE no batente,
  nº de plantas, nº e cor de cadeiras. Rua: casa por casa.
- **R12** Cada lugar tem UM plano `cXX-…-A`, estilo p04 (nunca desenho limpo). Sem plano -B.
- **R13** Realismo: sala do AEE/consultório com mesa e cadeiras de ADULTO para os pais; adulto nunca em
  cadeira de criança; bebê nunca perto do fogão; turma especial pequena (≤ 2 professoras, ≤ 3 alunos).
- **R14** Estado do lugar explícito: novo/de hoje = pintura lisa; velho = gasto.
- **R15** O mapa descreve a IMAGEM -A que existe (abrir e conferir), não o que eu imaginei.
- **R16** **Ficha de OBJETO** para todo objeto que aparece em 2+ cenas (livro, berço, lamparina, brinquedo, ficha):
  `obj-NN-nome`, layout de painéis (frente, lado, trás, close, de cima com régua, detalhes, paleta) — o mesmo do
  `obj-08-portao`. A ficha descreve o objeto COMO ELE JÁ APARECE nas imagens existentes (R15 — abrir e olhar).
  ANEXAR a ficha só na cena em que o objeto ENTRA; se ele já está na imagem aberta, o texto diz "the same … already
  in <imagem>" e NÃO anexa (anexar de novo faz o Flow redesenhar/duplicar). Objeto que já existe só nas imagens
  (berço do c08-quarto-A, lamparina da n3-E13) não precisa de ficha nova. (O piloto tinha fichas; os episódios
  novos ficaram sem — dono, 31/10.)
- **R17** **Ficha de ROUPAS** (`fNN-…-roupas`) para todo personagem que aparece em DIAS diferentes: roupa A = em
  casa, B = sair (médico, rua, escola), C… se a história pedir. Cada cena diz qual (bloco `OUTFITS`) e anexa a ficha
  de roupas no lugar da folha base. Mesmo dia = mesma roupa em todas as cenas desse dia. Personagem de um dia só
  usa a roupa da folha.
- **R18** Tabela "roupa por cena" no topo das notas do episódio, para o dono conferir de uma vez.
- **R19** Cena que o dono já aprovou (imagem_ok / video_ok) NUNCA é alterada por correção em massa.
- **R26** Linha **CAMERA & COLOR** em toda cena nova, tirada das fichas ShotDeck da pasta `05-referencia cores-lentes`
  (frame size, lente, composição, luz, paleta — nunca nome de filme), escolhida por grupo de cenas (rua de dia, casa de
  noite, casa de dia, clínica, sala de hoje). Ver `scripts/prompts/n3_camera.py`.
- **R27** A linha CAMERA & COLOR nunca briga com a imagem que a cena ABRE: o tamanho do quadro, o lado e a temperatura
  da luz vêm do `-A`/cena aberta (ex.: rua do -A é sol baixo dourado da direita, não "sol duro"; corredor é perspectiva
  aberta, não "plano médio"). A ficha ShotDeck dá lente, textura e paleta; a imagem aberta manda no resto.
- **R28** Decupagem: o episódio alterna plano geral → médio → close/insert na emoção. Close barato = recorte na
  montagem (anotar nas notas do episódio: "RECORTES NA MONTAGEM"). Animação nunca faz fade para preto (é na montagem).

## 2. Cena larga (ABRIR o plano -A ou a cena anterior)
- **R20** Só CÓDIGOS reais nos ABRIR/ANEXAR (`f08-mae-hoje`, `c04-sala-aee-A`, `n3-E02`), que EXISTEM no Drive.
  Nunca apelido ("Mãe", "Professor").
- **R21** Cena de lugar fixo ABRE o -A e termina com o PLACE LOCK (mapa). Nunca CRIAR o lugar de novo.
- **R22** Cada personagem citado com idade e roupa no texto ("about 38 years old", "exactly 2 years old").
- **R23** Diz onde cada pessoa está (qual cadeira, de que lado), e o que NÃO pode acontecer ("nobody on the
  children's chairs").
- **R24** Canto inferior direito vazio (avatar). Escala de adulto.

## 3. Close-up / detalhe (o erro da n3-E03)
- **R30** Close de cena que já existe: **abrir a imagem larga GERADA** e escrever `BACKGROUND EXACTLY AS IN <código>`
  descrevendo o que está atrás de CADA pessoa como aparece nela (o quê, de que lado, acima de qual ombro).
- **R31** Proibido descrever fundo por exclusão ("only the wall", "nothing behind") — dizer o que existe.
- **R32** Se dá para aproximar sem gerar (rosto, bebê no berço): copiar a imagem e usar `"recorte"` na montagem.
- **R33** Objetos repetidos (livro, ficha) ficam no MESMO lugar da cena larga ("exactly where it is in n3-E02").
- **R34** Ordem de geração: cena que ABRE outra cena (`ABRIR n3-E04`) só é gerada DEPOIS que essa outra estiver refeita
  e aprovada — senão herda o erro da antiga. O obs diz isso ("SOMENTE depois que a nova n3-E04…").
- **R35** Lado sempre do ponto de vista da CÂMERA: "camera-left / camera-right". Nunca "ombro direito dela" (pessoa de
  frente inverte o lado — erro da 1ª correção da n3-E03).

## 4. Animação (Omni 1.1 Flash, Frames, 360p)
- **R40** Toda cena tem os DOIS textos (imagem e animação). Cena sem imagem nova diz de onde copiar.
- **R41** Formato: bloco fixo + CAMERA (uma só, parada ou push-in 2–4%) + ACTION (início → ação → pose final) +
  ACTING (1–2 sinais físicos) + LIGHT + INTEGRITY (rosto, 5 dedos, objetos que NÃO se mexem).
- **R42** Nada de pan, ninguém atravessa porta/portão/objeto, porta/portão parados salvo se a cena é abrir.
- **R43** Problema que já está na IMAGEM não se conserta na animação: refazer a imagem primeiro.

## 5. Arquivos e nomes
- **R50** Refazer = apagar o errado e salvar o novo com o MESMO nome. Nunca -v2, nunca "renomear a antiga".
- **R51** Cada item diz onde salvar (conta › pasta) com o nome = código.

## 6. Montagem e publicação (resumo — detalhes em `ROTEIRO_MONTAGEM_EPISODIO.md`)
- **R60** Duração do clipe pela trilha de VÍDEO; corte do fim com `-ss/-t` antes do `-i`; conferir brilho dos últimos 5 s.
- **R61** Saída do avatar começa no último quadro real da fala; conferir a troca quadro a quadro.
- **R62** Vídeo e capa passam pela aprovação do dono no Painel antes do YouTube.
- **R63** Capa e qualquer peça gráfica: skill `designer-recursos-cognitivos` (azul 80%, verde-água, Goodly, ícone).

---

## Checklist por cena (o especialista preenche antes de liberar)
| # | Pergunta | Regra |
|---|---|---|
| 1 | A etiqueta de época está na descrição e os personagens são dessa época? | R02 R03 |
| 2 | Todo código do ABRIR/ANEXAR existe no Drive? | R20 |
| 3 | Lugar fixo: abre o -A e tem PLACE LOCK? | R21 |
| 4 | Cada pessoa tem idade e roupa no texto, e lugar exato na cena? A roupa é a do dia (A casa / B sair)? | R17 R22 R23 |
| 4b | Todo objeto que se repete anexa a ficha obj-NN? | R16 |
| 5 | Close: abri a imagem larga e o fundo de cada pessoa está descrito como NELA (lado pela câmera)? | R30 R31 R33 R35 |
| 5b | A cena que ela abre já foi refeita/aprovada? | R34 |
| 6 | O que o texto afirma sobre a imagem aberta bate com a imagem (olhei)? | R15 R30 |
| 7 | Tem os dois textos, animação no formato, sem pan, sem atravessar? | R40 R41 R42 |
| 8 | Diz onde salvar com o mesmo nome? | R50 R51 |
