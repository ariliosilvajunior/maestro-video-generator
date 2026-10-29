# Lições de produção — episódios ilustrados (Recursos Cognitivos)

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
