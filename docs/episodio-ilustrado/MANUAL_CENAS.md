# MANUAL DAS CENAS — episódios ilustrados (fonte única, obrigatória)

> Pedido do dono (31/10/2026): "fazer um manual para não cometer mais este tipo de erro… se não consegue,
> cria um especialista que consiga". Este manual junta as lições A–M (`LICOES_CENAS.md`, que vira histórico)
> num só lugar, por ETAPA, com um código por regra. Quem escreve texto de cena segue isto; o verificador
> automático (`scripts/validar_cenas.py`) e o especialista revisor (`.claude/agents/revisor-cenas.md`)
> barram o que não segue. **Nenhum texto vai para o Painel sem passar pelos dois.**
>
> Ordem fixa: **0 Família/época → 1 Kit → 2 Cenas largas → 3 Closes → 4 Animação → 5 Verificação → 6 Painel.**

---

## ★ Método: BÍBLIA + BLOCOS FIXOS (dono, 01/11 — "padrão descritivo e não no achômetro", modelo video-prompt-builder)
- Cada conta tem uma **Bíblia** (`scripts/prompts/biblia_conta<X>.py`): UM texto fixo para cada LUGAR (mapa do -A real), PESSOA
  (idade, rosto, roupa fixa), ROUPA A/B, OBJETO, CÂMERA do lugar e ESTADO (portão aberto/fechado).
- Cada cena é só uma linha de dados: base (abre o -A / abre outra cena / close com o fundo de outra / cópia), PLANO (geral,
  médio, close, insert), pessoas (código + roupa + ONDE), objetos, estado, AÇÃO e ação da animação. O texto do Flow é
  MONTADO pelo gerador copiando os blocos palavra por palavra — ninguém reescreve lugar/pessoa à mão.
- A câmera do close/insert/médio muda só o enquadramento; luz e paleta são sempre as do lugar.
- O gerador escreve nas notas o INVENTÁRIO MESTRE (quem/o quê aparece em quais cenas + plano de cada cena).
- Fluxo: gerador → validar_cenas.py → revisor-cenas (com as imagens reais) → Painel. Sem pular.

## ★ Ofício do prompt (dono, 03/11 — guia reel-lab.com/craft, aprovado: "pode sim")
- **R56** **Luz com fonte e lado.** Toda cena diz de onde vem a luz e de que lado da câmera ("luz da janela à
  esquerda, quente, fim de tarde"). Nunca "luz bonita"/"cinematic lighting".
- **R57** **Lugar da pessoa no quadro.** Toda pessoa tem posição no quadro (terço esquerdo/direito, primeiro plano,
  fundo). Sem isso o Flow põe no meio.
- **R58** **Nomes e coisas físicas, não adjetivos.** "Cortina amarela parada, mesa de madeira gasta" — nunca
  "ambiente aconchegante", "clima acolhedor". Adjetivo de sentimento sai do texto.
- **R59** **Grão leve de filme na montagem** (junto com a cor do episódio, ficha ShotDeck). Imagem limpa demais tem
  cara de IA. No texto de imagem não: o estilo é o ES01 ilustrado.
- **R46** **Saiu errado: gere de novo antes de reescrever.** Mesmo texto, 1 nova tentativa. Errou de novo: reescreve
  UMA vez, firme, no ponto que errou.
- **R47** **Uma mudança por correção.** Ao refazer, muda só o que errou e mantém o resto do texto igual, palavra por
  palavra — assim se sabe o que resolveu.

- **R25** **No máximo 3 pessoas descritas por cena** (reel-lab #scene, 03/11). Passou de 3, o Flow troca rosto e
  roupa entre elas. As outras ficam genéricas e sem nome ("outros alunos ao fundo, de costas"). Turma grande = 3 em
  destaque + grupo genérico.
- **R29** **Espelho não carrega a cena.** Nunca filmar dentro do espelho; se houver, fica de lado, em ângulo raso.
- **R36** **Lados repetidos a cada cena.** Depois de cada corte, o texto diz de novo quem está à esquerda/direita da
  câmera e para onde olha. A câmera fica sempre do mesmo lado da conversa (não cruzar o eixo).
- **R37** **Emoção é corpo, não rótulo.** Nada de "triste", "preocupada": "ombros caídos, olhar no chão, mãos
  apertadas no colo". (Complementa R58.)
- **R38** **Sem letreiro gerado.** O Flow erra texto escrito. Se precisar de texto, o prompt reserva um espaço limpo
  ("o terço direito fica livre, parede lisa") e o texto entra na montagem.
- **R49** **Continuidade entre cenas seguidas no MESMO lugar e ângulo** (Notícias 04, 04/11: 3 alunos e uma
  professora "somem do nada" entre S06b→S07a e S09→S10a). Quem estava na cena anterior continua na seguinte (mesmo
  lugar, roupa e rosto) ou a seguinte troca de ângulo/plano (close, insert) — nunca o mesmo ângulo com gente a menos.
- **R48** **Animação: quem sai do quadro sumiu.** Ninguém sai e volta no mesmo vídeo. O que se mexe = 1 ação e
  1 movimento por vídeo, sem redescrever o lugar (a imagem já diz). O bloco fixo de integridade (R44) continua.

- **R00** **Ordem do Reel Lab (#order), sem pular passo** — cada passo custa ~10× o anterior: 1 história numa frase →
  2 visual (ES01 + ficha) → 3 Kit → 4 explorar 3×3 → 5 imagens das cenas → 6 animação → 7 finalização.
- **R01b** **História numa frase** no topo de cada episódio (o que muda, para quem), antes do roteiro de cenas. Sem
  ela, o episódio não começa. Trava com a skill `intention-builder` (modo QUICK).
- **R13b** **Explorar antes de gerar:** cena nova ou que errou 2 vezes → primeiro UMA imagem com grade 3×3 de ângulos
  daquela cena (mesmo Kit anexado). O dono escolhe o quadro; só ele vira a imagem de verdade. Não vale para cena
  que só copia outra.
- **R64** **Finalização na montagem:** igualar a luz entre as cenas, UMA cor para o episódio inteiro, grão leve
  (R59) e som. Nunca corrigir cena por cena na cor.

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
- **R11b** No plano `-A`, porta e portão ficam **FECHADOS** (estado neutro). Só a cena que precisa abre, e diz isso no
  texto ("the gate is open, both leaves swung inward"). Erro do 01/11: o plano da fachada copiou o portão aberto da
  imagem de origem.
- **R12** Cada lugar tem UM plano fixo `CEnn` (antes `cNN-…-A`; "plano -A" neste manual = esse `CEnn`), estilo ES01 (nunca desenho limpo). Sem plano -B.
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
- **R20** Só NOMES DE IMAGENS QUE EXISTEM no Drive DAQUELA CONTA nos ABRIR/ANEXAR (`PE08`, `CE04`,
  `n3-E02`). Nunca apelido ("Mãe", "Professor") e nunca nome inventado de referência (`ref-layout-personagem`,
  `ref-layout-cenario`, `ref-escola-nova-p29` — erro grave repetido, dono 01/11). Formato de folha se DESCREVE no texto
  ("laid out as follows: …"), não se anexa. A imagem de estilo fica em `Kit › 01-estilo` de cada conta
  (`ES01` em todas as contas, ver R55). O verificador barra qualquer nome que não exista.
  **Existir no Drive não basta: tem que existir no FLOW daquela conta** (dono, 01/11: "vc pede para abrir no flow
  p29-portao-escola, mas isso não existe" — foi gerada no Flow da Conta A). Imagem que veio de outra conta ou de fora
  (cópia no Drive, foto, ficha ShotDeck) leva no obs o passo "SUBIR no Flow: baixar do Drive (link) → + / Enviar imagem →
  conferir o nome" ANTES do ABRIR/ANEXAR.
- **R21** Cena de lugar fixo ABRE o -A e termina com o PLACE LOCK (mapa). Nunca CRIAR o lugar de novo.
- **R22** Cada personagem citado com idade e roupa no texto ("about 38 years old", "exactly 2 years old").
- **R23** Diz onde cada pessoa está (qual cadeira, de que lado), e o que NÃO pode acontecer ("nobody on the
  children's chairs").
- **R24** Canto inferior direito vazio (avatar). Escala de adulto.
- **R24b** **Escala e direção de quem se move** (erro grave, dono 01/11, n5-S04: "os funcionários da obra parecem
  pequeninos e o portão parece de gigante… e em vez de irem para o lado da construção estão vindo para fora do
  portão"). (1) Todo lugar com portão/porta/muro em primeiro plano tem no PLACE LOCK uma linha **SCALE** com tamanho real
  MEDIDA NO `-A` REAL (onde fica a travessa em relação à altura dos olhos da câmera, onde o portão termina; ex. c04 da
  Conta B: portão de 2 m, travessa na cintura do adulto). Se o `-A` tem portão/porta fora de escala humana ("portão de
  gigante"), o erro está no `-A`: corrigir o PLANO primeiro (R43), nunca compensar no texto da cena, criança em relação ao adulto, adulto junto ao
  prédio da altura das portas; mais longe = menor só pela distância. Nunca número genérico que contradiz a imagem (R15). (2) Pessoa que anda/carrega/corre leva
  **DIREÇÃO em relação à câmera e ao destino** ("walking AWAY from the camera toward the building, seen from behind") e
  o que NÃO pode ("nobody walks toward the gate"), na imagem E na animação. Nunca "carry bricks a few steps" sem direção.

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
- **R45** **Vídeo em 720p daqui para frente** (dono, 03/11): o 720p gasta ~2x crédito (720p 10 s = 15 créditos), mas uma
  conta faz ~1 episódio por semana e as 4 contas fazem 4 — a meta é 1 por semana. Piloto, Notícias 02 e Notícias 04
  terminam em 360p (já estavam quase prontos; não misturar dentro do episódio). Não usar IA de ampliar (Real-ESRGAN
  deformou e deixou com cara de desenho no teste da n5-S07a). Refazer em 720p = animar de novo a MESMA imagem.
  **Onde publica** (dono, 03/11): os episódios em 360p (Notícias 02 e Notícias 04) vão SÓ para Instagram/Facebook, no
  vertical com o vídeo 16:9 inteiro no meio e a marca em volta (nunca cortar para tela cheia). O YouTube começa com os
  episódios em 720p.
- **R40** Toda cena tem os DOIS textos (imagem e animação). Cena sem imagem nova diz de onde copiar.
- **R41** Formato: bloco fixo + CAMERA (uma só, parada ou push-in 2–4%) + ACTION (início → ação → pose final) +
  ACTING (1–2 sinais físicos) + LIGHT + INTEGRITY (rosto, 5 dedos, objetos que NÃO se mexem).
- **R42** Nada de pan, ninguém atravessa porta/portão/objeto, porta/portão parados salvo se a cena é abrir.
- **R43** Problema que já está na IMAGEM não se conserta na animação: refazer a imagem primeiro.
- **R44** Animação sempre trava IDADE, rosto, cor e penteado do cabelo e óculos de cada pessoa do 1º ao último quadro
  (n5-S05, 02/11: a educadora ficou de cabelo branco no fim). E nunca pede objeto que não está na imagem (n5-S08a: o
  texto pedia ursinho que a imagem não tinha e ele apareceu do nada) — a ação usa só o que já está no 1º quadro.

## 5. Arquivos e nomes
- **R55** **Códigos por categoria** (dono, 02/11: "um cód para cada coisa ... fica fácil de saber quando está em um
  lugar errado"). Nome do arquivo = código, igual no Drive e no Flow da conta: `AV01…` avatar (00-avatar-narrador),
  `ES01` estilo (01-estilo), `PE04` personagem e `PE04-R` roupas (02-personagens), `CE03` plano fixo do lugar e
  `CE03-F` folha-base (03-cenarios), `OB15` objeto (04-objetos), `CL01…` cores e lentes (05-referencia cores-lentes).
  Cenas: `n5-S08b`, `n3-E04`. Código fora da pasta da sua categoria = lugar errado; o que não tem código = lixo.
  O número é por conta (PE01 da Conta A é outra pessoa que PE01 da Conta B). Os textos citam o código, e a
  descrição da pessoa vem no próprio texto ("THE LITTLE BOY (PE04): …").
- **R50** Refazer = apagar o errado e salvar o novo com o MESMO nome. Nunca -v2, nunca "renomear a antiga".
- **R51** Cada item diz onde salvar (conta › pasta) com o nome = código.
- **R53** A linha de instrução da cena (obs) é CURTA e só diz o que o dono faz (dono, 02/11: "só o que é para ser
  feito"): `ABRIR x · ANEXAR y + z`, `CRIAR (Imagem · 16:9) · ANEXAR …`, `NÃO GERAR IMAGEM · copiar x · animar`, e
  `(SOMENTE depois de x)` quando depende. Nada de explicação, motivo, recorte de montagem ou "salvar como" (o Painel já
  mostra onde salvar).
- **R54** Criança em cena (o Flow bloqueia "conteúdo prejudicial a menores", dono 02/11, n5-S08a): nunca
  "malnutrition", "very thin", "thin legs", "barefoot" com camisola, criança deitada sem roupa dita. Dizer o
  cuidado ("rests peacefully, tucked under the sheet up to his chest, calm and safe"), roupa completa (pijama de manga
  longa) e adulto ao lado de forma cuidadora. Se bloquear: trocar as palavras de corpo/doença por cuidado e roupa. Bloqueou de novo com criança DEITADA sozinha na
  cama + "cerebral palsy": criança SENTADA, segurando um brinquedo, olhando a janela; sem nome de doença no texto.
  **Animação também é bloqueada** (dono, 02/11, n5-S08a): com criança deitada ou em cama de hospital, o texto do VÍDEO
  não descreve corpo, rosto nem gesto da criança (piscar, virar a cabeça, mãos, peito). Só movimento do AMBIENTE:
  cortina, luz, poeira no sol; "everything else stays calm and still".
  **Animação de cena com criança (deitada, hospital, cuidado) — o que o Flow aceita** (dono via ChatGPT, 02/11, n5-S08a
  e n5-S08b; os meus textos foram recusados 4 vezes). Meus ERROS: texto longo; citar qualquer pessoa (até o adulto:
  "the man in the white coat turns a page" foi recusado); dizer o lugar ("hospital", "bed", "room"); lista de
  proibições ("Do not…", "No…", "nobody grows older", faces, hands, age); bloco fixo de integridade. O que PASSA:
  UM parágrafo curto (~70 palavras), "peaceful interior scene" sem dizer que lugar é, ZERO pessoas, só cortina + luz
  + partículas, frases suaves e positivas, "The camera stays fixed", termina em "ending in a peaceful still frame".
  Texto exato em `scripts/prompts/anim_ambiente.txt` — usar como está, sem acrescentar o bloco fixo. Só se esse
  também falhar: sem vídeo no Flow (`sem_video_flow`) e zoom lento na montagem.
- **R52** Quando o dono avisa que uma cena saiu errada (dono, 01/11: "é só excluir a errada e colocar em refazer que o
  restante eu faço"): Claude (1) olha a imagem no Drive para confirmar que é a errada, (2) manda o arquivo errado para a
  lixeira do Drive (imagem e vídeo daquela cena), (3) põe a cena em **refazer** no Painel, (4) corrige o texto se o erro
  for de texto (revisor + verificador antes de gravar). Resposta ao dono em UMA linha: "apagada e em refazer".

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
| 9 | Luz com fonte e lado, pessoa com lugar no quadro, sem adjetivo de sentimento? Refazer mudou só o que errou? | R56 R57 R58 R46 R47 |
| 0 | O episódio tem a frase da história? Cena nova/difícil passou pela grade 3×3? | R01b R13b |
| 10b | Cena seguinte no mesmo lugar e ângulo mantém as mesmas pessoas (ou muda o plano)? | R49 |
| 10 | No máximo 3 pessoas descritas, lados ditos de novo, emoção em corpo, sem letreiro, ninguém sai e volta? | R25 R36 R37 R38 R48 |
