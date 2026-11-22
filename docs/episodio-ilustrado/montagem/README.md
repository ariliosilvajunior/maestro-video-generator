# Montagem automática dos episódios ilustrados

Combinado com o dono (22/11/2026): **o fluxo é automático, o dono só aprova**. Nada de editor manual.

Formato aprovado no Ep01 v2: narração do dono + falas dos personagens (vozes em
`../roteiros-estilo-novo/vozes_personagens.json`) + efeitos sonoros nas pausas + cenas do Flow no tempo
do áudio + motion (título, cartão com rosto, frases em destaque, luz quente, poeira dourada).

## Passo a passo (cada episódio)

1. **Roteiro de áudio** — o Claude escreve `<chave>.json` (modelo: `rp-ep01.json`): blocos `N` (narração),
   `P:<personagem>` (fala), `S:<efeito>:<seg>` (efeito em destaque), `G:<seg>` (respiro); cada bloco lista as
   cenas do Painel que aparecem nele. Motion, luz e música ficam ancorados em `{bloco, pos}`.
2. `python3 montar_episodio.py audio <chave>.json` — gera falas/efeitos (ElevenLabs) e a mixagem.
3. `python3 montar_episodio.py previa <chave>.json` — manda os 3 primeiros minutos para o Painel
   (**Preview de áudio**). 🛑 Espera o dono: `status` precisa dizer `audio_aprovado`.
4. `python3 montar_episodio.py video <chave>.json` — baixa as cenas do Drive, monta, gera 1080p + 720p e a
   `conferencia.jpg` (um quadro de cada cena). O Claude olha a folha antes de seguir.
5. `python3 montar_episodio.py entregar <chave>.json` — sobe os dois arquivos na pasta do episódio no Drive
   (envio grande pelo Painel, sem limite de tamanho).
6. Publicação: o vídeo vai para a aprovação de Publicação do Painel (assistir → aprovar/rejeitar com nota).

Ajuste pedido pelo dono = editar só o bloco/cena no JSON e rodar de novo (o que já existe é reaproveitado).

Chaves: `ELEVENLABS_API_KEY` e `CONTENT_FACTORY_API_TOKEN` no ambiente (nunca imprimir).
