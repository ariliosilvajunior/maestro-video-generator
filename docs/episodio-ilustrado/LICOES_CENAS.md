# Lições de produção — episódios ilustrados (Recursos Cognitivos)

> **HISTÓRICO.** As regras valendo estão em `MANUAL_CENAS.md` (com códigos R01–R63). Onde houver conflito, vale o manual
> (ex.: C2 "_v2" foi substituída por R50 — refazer é sempre o MESMO nome).

Regras aprendidas na produção do episódio piloto (out/2026). Valem para TODO episódio novo:
revisar cada imagem e cada prompt contra esta lista ANTES de gastar crédito de animação.

## A. Imagem da cena (antes de animar)

1. **Física e fixação dos objetos.** Todo objeto preso a algo precisa estar visivelmente preso:
   portão com dobradiças no pilar, armário pendurado na parede, porta no batente.
   Erro real (P11): portão flutuando no vão, sem dobradiça, desconectado do muro.
2. **Direção do movimento coerente com a ação.** Se o personagem vai abrir/empurrar algo, o objeto
   começa fechado ou entreaberto e o personagem segura o lado que abre.
   Erro real (P11): menino "abrindo" um portão que já estava escancarado para o lado oposto.
3. **Altura e escala realistas dos móveis.** Armário aéreo fica no alto da parede (acima de bancada),
   não perto do chão. Conferir a altura de tudo em relação ao chão e às pessoas.
   Erro real (P05): armário de potes quase encostado no chão.
4. **Usar o objeto oficial do catálogo.** Sempre anexar a ficha `obj-0X` do objeto como referência e
   conferir os marcadores contra a IMAGEM da ficha (a imagem da ficha manda sobre a descrição em texto).
5. **Enquadrar para esconder o que não precisa aparecer.** Se o chão/parede só atrapalha a leitura,
   enquadrar na altura dos olhos e cortar o chão.
6. **Personagens pelo @ do Flow + ficha.** Rosto visível e igual à ficha; nada de corpo cortado sem
   cabeça quando a cena pede a pessoa.
7. **Canto inferior direito sempre vazio** (lugar do avatar do narrador).
8. **Para consertar uma cena, EDITAR a imagem antiga, não gerar do zero.** Abrir a imagem no Flow →
   "O que você quer mudar?" → anexar a ficha do objeto → pedir só a mudança e terminar com
   "Keep everything else exactly as it is… Change nothing else." Gerar do zero sem uma imagem do
   nosso estilo como referência faz o Flow mudar o traço (virou "quadrinho/cartoon").
   Erro real (P11): imagem nova saiu em outro estilo, com o menino diferente; a edição da antiga deu certo.
9. **Tamanho do objeto x abertura.** Portão/porta tem que ter a largura do vão. Redimensionar objeto
   por edição NÃO funciona no Flow; se a proporção estiver errada, trocar de imagem ou de enquadramento.

10. **Ficha de personagem = uma pessoa só**, de frente, rosto grande e iluminado. Duas pessoas na ficha
    misturam os rostos. Criança que não fica em pé: sentada/apoiada, sozinha na imagem.
11. **Referência de estilo = uma CENA pronta do nosso estilo** (ex.: p04 + p08), nunca uma folha de modelo
    a lápis — com a folha o Flow devolveu esboço a lápis em fundo branco.
12. **Mesmo lugar = mesmo prédio.** Se a história se passa na escola já mostrada (p29), toda cena da
    escola usa essa imagem como referência de cenário. Lugares diferentes da mesma época podem mudar.
14. **Sala criada na altura de criança não serve de base para cena de adulto** (lousa e móveis ficam
    gigantes e os adultos parecem miniaturas). Cena com adultos: câmera na altura dos olhos de adulto,
    plano médio (cintura para cima). Erro real (n5-S02).
15. **No Flow, editar = clicar na imagem (abre grande) → caixa "O que você quer mudar?".** A barra
    "O que você quer criar?" da tela principal SEMPRE cria imagem nova e muda o cenário.
13. **Nomes padronizados por projeto:** f01-, f02-… para personagens, c01-… cenários, obj-0X objetos.

## B. Prompt de animação

1. **Objetos que devem ficar parados: dizer explicitamente.** Ex.: "the clothes, blanket, basin, mug
   and sandals do not move at all". Frases como "a garment settles" fazem o modelo derrubar coisas.
   Erro real (P07): roupa "caindo do teto" em cima do sofá.
2. **Sem panorâmica larga.** "Camera pans across the room" faz o modelo INVENTAR o que está fora do
   quadro (porta, paisagem que não existem). Preferir push-in lento (100%→104–108%) e escrever
   "No camera pan" + "do not reveal anything outside the original frame".
   Erro real (P07): a câmera andou e criou uma porta e um campo que não estavam na imagem.
3. **Partes móveis não podem esconder o assunto.** Porta de armário só balança alguns graus e
   "never covering the jars" (ou o que for o foco).
   Erro real (P05): a porta do armário fechou por cima dos potes.
4. **Nunca pedir personagem atravessando portão, porta ou objeto.** O modelo faz a pessoa passar
   "por dentro" do objeto. Preferir mostrar o antes ou o depois (ex.: portão aberto com a sandália
   largada = o menino já fugiu). Erro real (P11): menino atravessou o portão como fantasma.
5. **Um movimento principal + poeira.** Quanto menos ações, menos invenção.
6. **Duração do clipe ≈ duração da fala da cena** (4/6/8/10 s). Clipe longo demais dá tempo para o
   modelo inventar coisas; na montagem só se usa o trecho do tempo da fala.
7. **Testar em 360p** (qualidade aprovada para o estilo guache, que já é suave) e só refazer o que errar.

## C. Organização de arquivos

1. **Nomear o clipe pelo número da IMAGEM usada**, não pela ordem de geração.
   Erro real: clipes P06 e P07 enviados com os nomes trocados (panela ↔ sala) — a fala
   "ela cozinhava" saiu com a imagem do sofá. Conferir 1 quadro de cada clipe antes da montagem.
2. Um clipe por cena, nome `pNN.mp4`; refação = `pNN_v2.mp4`.

## D. Avatar do narrador

1. Foto inteira (com braços e mãos), **sem cortar**; só reduzir de tamanho.
2. Fundo verde puro (#00FF00) na foto ANTES de gerar → recorte limpo na montagem.
3. Modelo atual: fal.ai H3 Max Lip Sync 480P (mãos paradas, natural; Kling Avatar v2 mexe os dedos
   de forma estranha — descartado). Pedaços de áudio de 5 a 15 s cortados nas pausas.
4. Montagem — PADRÃO FIXO aprovado (ver Documento Mestre §8): quadro 400×400 px em 1920×1080,
   80 px da borda direita, 25 px abaixo da borda de baixo (`overlay=W-w-80:H-h+25`), braços saindo
   pela borda, "sentado". Nunca flutuando com espaço embaixo. Não mudar sem o dono pedir.
5. Observação aberta: em alguns trechos a boca exagera (estica, mostra muitos dentes). Avaliar no
   tamanho final; se incomodar, refazer só o trecho ou testar Kling Avatar v2 Pro.
6. **Entrada/saída do avatar (teste aprovado na técnica em 29/10):** Flow → Vídeo → Frames → 16:9 → Omni 1.1 Flash → 360p → 4s,
   Início = fundo verde vazio, Fim = a MESMA foto verde usada no H3 Max (`avatar_verde.png` centralizada em 1820×1024).
   Na montagem: entrada SEM recorte (scale 711×400, overlay x=1284, y=H-h+25, só até 4,0 s), entra pela borda direita da tela;
   a fala do H3 Max começa em 4,0 s (áudio com atraso de 4 s). Emenda sem pulo visível. Saída = o inverso (Início/Fim trocados).

## E. Folhas de personagem em outra idade
1. **Mesma pessoa mais nova/velha: anexar a FOLHA dela (ex.: `f02-jonas`) como referência de identidade** e listar no texto
   os traços que ficam (olhos, sobrancelhas, nariz, pele, cabelo, marcas fixas, roupa) e dizer que SÓ a idade muda.
   Erro real (30/10, `f07-jonas-2anos`): pedido só como "o mesmo menino mais novo" com o personagem do Flow anexado → saiu
   outra criança, nada a ver com o Jonas.

## F. Mesmo lugar = mesma imagem de base (30/10/2026)
1. Erro real (piloto, quintal): 4 cenas no quintal com varal, portão e paredes em posições diferentes — cada cena
   "inventava" o lugar de novo. Até a folha c02-quintal tem dois portões diferentes entre os quadros.
2. Regra: cada lugar tem um **MAPA FIXO** (o que existe e onde: parede do fundo, esquerda, direita, portão e de que
   lado abre, varal com quantos postes e quais roupas em que ordem) e um **plano fixo** `cXX-…-A` (vista principal)
   — sem -B: editar o -A no Flow mantém a câmera, o "contraplano" saía igual (erro real 30/10). Toda cena abre o -A e só acrescenta pessoas.
   Nunca CRIAR o lugar de novo numa cena. O mapa vai no fim do texto de toda cena ("PLACE LOCK").
3. Animação: partes que giram/abrem (tampa de caixa, portão, porta) ficam PARADAS no texto, a menos que a cena seja
   justamente abrir — e aí diz o lado da dobradiça. Erros reais: P04 tampa abrindo do lado errado; P28 portão trocando de
   lado; P19 terapeuta girando sem sentido; P09 menino flutuando e cadeira sem tocar o chão.

## G. Idade, roupa e época coerentes (30/10/2026)
1. Mesma pessoa em outra idade: mantém só rosto, pele, cabelo e marcas; a ROUPA é da idade (criança de 2 anos não usa a
   camiseta do menino de 6). Erro real: f07-jonas-2anos com a roupa do Jonas maior.
2. Época: cena no presente (sala do AEE de hoje, professor de hoje) não usa os personagens dos anos 80. Pais de hoje têm
   folha própria (`f08-mae-hoje`, `f09-pai-hoje`). Erro evitado: n3 punha a mãe e o pai de 1980 na sala do AEE atual.
3. Lugar novo = pintura nova; lugar velho = gasto (ver F). Cena que acontece num lugar que se repete ganha plano fixo
   próprio — corredor e sala da equipe NÃO são "a sala de aula" (erro evitado em n8 E17/E20).
4. **Nos textos do Painel, só o CÓDIGO real da imagem** (`f01-mae`, `f08-mae-hoje`, `c05-consultorio-A`), nunca um
   apelido ("Mãe", "Filho Jonas", "Professor AEE"). Apelido tem dupla interpretação. Erro real (30/10): n3-E08 e
   n3-E10 saíram com a mãe de hoje numa cena dos anos 80.

## H. Regras de trabalho do dono (31/10/2026)
1. Refazer = apagar o arquivo errado e salvar o novo com o MESMO nome. Nunca sugerir -v2 / renomear a antiga.
2. Toda cena tem sempre texto de IMAGEM e de ANIMAÇÃO (vídeo errado quase sempre pede imagem nova).
3. Erro real P16: mão do menino de 6 anos saiu com cara de mão de bebê, e ele de casaco com a mesma estampa da
   camiseta. Na folha do personagem e no texto: proporção de mão da idade; roupa = exatamente a da folha.

## I. Montagem — ERRO GRAVE (31/10/2026, piloto)
1. **Clipe do Flow tem áudio mais longo que a imagem** (ex.: p33 = 10 s de áudio e só 8 s de vídeo) e muitos
   clipes de "fim" escurecem no último segundo. A montagem media pela duração do ARQUIVO e congelou o quadro
   PRETO no fim do episódio. Regra: medir SEMPRE a trilha de VÍDEO (`ffprobe -select_streams v:0
   -show_entries stream=duration`) e nunca congelar o último quadro sem checar o brilho dele.
2. Antes de entregar qualquer vídeo: conferir quadros do começo, meio, cada troca de bloco e os ÚLTIMOS
   5 segundos (brilho/YAVG de cada cena: queda brusca = quadro escuro congelado). Só entregar depois disso.
3. **O corte no fim (`cortar_fim_clipe`) não estava sendo aplicado**: no ffmpeg o `-t` do corte vinha DEPOIS do
   `-i` e o segundo `-t` (duração da cena) o sobrescrevia — o clipe inteiro, com o fim escuro, era congelado.
   Regra: `-ss`/`-t` do corte SEMPRE antes do `-i`. Pego pela conferência de brilho (7b) antes de entregar.
4. **Avatar sumindo entre a fala e a saída** (dono, 31/10): a saída tem que começar no último quadro REAL da
   fala (trilha de vídeo do `avatar_fala.mp4`), não no fim da narração. Conferir a troca quadro a quadro.

## J. Kit completo ANTES de qualquer cena (31/10/2026, Notícias 04)
1. As cenas da n5 foram feitas antes do Kit: a sala antiga mudava de cena para cena (prateleira, quadro, mesa,
   cadeiras, rachaduras), a escola mudava de distância, o menino mudava de idade, as mãos da educadora pareciam
   de idosa. Regra: NENHUMA imagem de cena antes de TODAS as folhas e planos -A do Kit estarem prontos
   (o Painel mostra ⛔ "Kit incompleto" em cada episódio).
2. Mapa do lugar com QUANTIDADES e POSIÇÕES (1 prateleira vazia de 3 prateleiras, 1 mesa com 4 cadeiras,
   esteira com EXATAMENTE 2 almofadas, rachadura de tijolo à direita da janela, nada pendurado nas paredes).
3. Personagem com IDADE, ALTURA e condição física fixas no texto de TODA cena (menino: 3 anos, ~90 cm, magro,
   paralisia cerebral — não fica em pé). Mãos: idade da pessoa (educadora 50 anos, não idosa).
4. Cenas em sequência (S09 → S10a → S10b → S10c) abrem a anterior e repetem as constantes.
5. Realismo do lugar: turma pequena de escola especial = no máximo 2 professoras e 3 alunos.
6. As folhas do Kit também vão para o Drive (Kit de referência/02-personagens, 03-cenarios) — as da Conta B
   ficaram só no Flow.

## K. Família, época e Kit nos mínimos detalhes (31/10/2026, Notícias 02 — Conta A)
1. **Antes da narração/roteiro de cenas: avaliar se a MESMA família encaixa.** Se a notícia fala da mesma
   história (o livro da Maria Stella), usa a mesma família e os mesmos lugares. Se o assunto muda, cria
   personagens NOVOS (e pode reaproveitar o lugar). Cada cena leva a etiqueta de época na descrição:
   `[ANOS 80 · livro]` ou `[HOJE · sala do AEE]` — o dono tem que saber de qual história é a cena.
2. Personagem novo de outra época tem que ser **visualmente diferente** (cabelo, roupa, cor). A f08-mae-hoje
   parecia a f01-mae e virou "a mesma mãe com outra roupa".
3. **Idades do casal coerentes**: o pai dos anos 80 (f06) saiu com cara de 50 anos ao lado da esposa de 30 e
   mais velho que o pai de hoje. Folha de personagem diz idade e "sem cabelo branco, sem rugas fundas".
4. Toda pessoa que a narração cita entra no Kit ANTES (o irmão bebê de ~4 meses: f10-irmao-bebe). Bebê nunca
   perto do fogão; berço tem lugar próprio (c08-quarto), não a sala/cozinha.
5. **Realismo do lugar**: sala do AEE / consultório tem mesa e cadeiras de ADULTO para os responsáveis;
   adulto nunca senta em cadeira de criança. Janela de um lado só (lateral), dito no mapa: "NO window on the
   back wall".
6. Mapa conta TUDO o que se repete: nº de cadeiras e cor, nº de plantas, lado da porta e da janela, a porta
   SEMPRE no batente (fechada/entreaberta). A rua: casa por casa (cor, nº de janelas, com/sem porta).
7. Plano -A que sai em desenho limpo não pode virar base: refazer o -A no estilo p04 (sem anexar a folha em
   desenho). Toda cena herda o estilo do -A.
8. Close-up feito por EDIÇÃO muda o lugar (a edição mantém a câmera e o Flow inventa o resto). Para aproximar
   (rosto cansado, bebê no berço): **copiar a imagem e aproximar na montagem** (`"recorte"` no `episodio.json`).

## L. Identidade visual (31/10/2026)
1. Toda peça gráfica (capa do YouTube, post, banner) segue a skill `designer-recursos-cognitivos`: cores oficiais
   (azul `#2B4872`/`#3E69B7` em 80% da peça, verde-água `#56CAC9` no destaque), fonte Goodly, ícone/logo oficial.
   A 1ª capa do piloto saiu com amarelo, vermelho e fonte genérica — recusada pelo dono.

## M. Close-up: o fundo vem da IMAGEM aberta, não do mapa (31/10/2026, n3-E03)
1. A E03 (close da mãe) foi escrita como "atrás dela só a parede e o quadro" — pelo MAPA. Na n3-E02 real, atrás
   da mãe está a estante alta com caixas e a planta; o quadro azul fica atrás do pai. Resultado: a estante sumiu.
2. Regra: antes de escrever um close de uma cena que já existe, **abrir a imagem gerada** (Drive) e descrever o
   fundo de CADA pessoa como ele aparece nela (o que está atrás de quem, de que lado, a planta em cima de qual
   ombro), na mesma direção de câmera. Nunca "ONLY …" para fundo — dizer o que existe, não o que não existe.

## N. Escala e direção de quem se move (01/11/2026, n5-S04 — Conta B)
1. A S04 (comunidade construindo a escola) dizia só "three townspeople carry bricks". O Flow desenhou os
   trabalhadores pequeninos ao lado de um portão gigante, e andando para FORA do portão, não para a obra.
2. Regra R24b: lugar com portão/porta/muro em primeiro plano tem linha SCALE no PLACE LOCK (tamanho real), e toda
   pessoa que se move tem direção em relação à câmera e ao destino, mais o que não pode — na imagem e na animação.
