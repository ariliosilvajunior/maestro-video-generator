# Notas do dono — combinado em 05/10/2026

Registrado numa conversa separada (sessão do `ecossistema-ia-recursos-cognitivos`),
antes desta ferramenta ter sessão própria. Guardado aqui pra não se perder.

- **Cadência inicial: 1 postagem por semana**, não diária. Começar devagar,
  validar o formato antes de aumentar.
- **Publicação automática só existe pro Instagram** (via navegador). O
  dono pediu "todas as redes" — isso não é nativo da ferramenta; o mesmo
  vídeo (fica em `~/Downloads/`) precisa ser postado manualmente em
  Facebook/TikTok/YouTube Shorts, ou avaliar o Metricool (opcional, pago)
  mais pra frente.
- **Negócio:** "Recursos Cognitivos" — sistema de gestão pra AEE
  (Atendimento Educacional Especializado) / educação especial. Dono é
  professor de AEE de verdade. Contexto completo (se precisar) no
  repositório `ecossistema-ia-recursos-cognitivos`, `docs/CONTEXTO_NEGOCIO.md`
  — mas este projeto aqui é **separado** desse sistema, só usa a marca como
  nicho de conteúdo.
- **Áudio/avatar do HeyGen:** o dono mencionou que já está resolvendo isso
  por conta própria (separado desta configuração).

## Aprovação pelo Painel do Dono (combinado em 05/10/2026)

O dono quer assistir e aprovar cada Reel no **Painel do Dono**
(`painel.recursoscognitivos.com.br`, tela "Vídeos Maestro"), em vez de só
abrir o arquivo `.mp4` solto. Isso já está construído do lado de lá
(`ecossistema-ia-recursos-cognitivos`, `agentes/content_factory/main.py` +
`painel/main.py`) e do lado de cá:

- `config/config.json` -> `painel.enabled` / `painel.url` (já preenchido
  no `config.example.json` — confirma se `config.json` também tem,
  `python3 lib/config.py get painel.url`).
- `.claude/keys.md`, seção `## Painel` — precisa do token
  (`CONTENT_FACTORY_API_TOKEN` do outro repositório; pede pro dono se não
  tiver).
- `post-pipeline/enviar_para_painel.py` — manda o vídeo pronto (da fila
  `post-queue.jsonl`) pro Painel. **Não publica nada** — só coloca na fila
  de aprovação.

**Fluxo recomendado (v1, ainda manual):** depois que o pipeline principal
deixar um vídeo pronto em `post-queue.jsonl`, rodar
`python3 post-pipeline/enviar_para_painel.py` antes de `/post-now`. Esperar
o dono aprovar na tela do Painel antes de publicar de verdade. Ainda não
existe checagem automática de "o dono já aprovou?" dentro do `/post-now` —
isso é uma v2, por enquanto é combinado por fora (perguntar/confirmar com
o dono antes de publicar).
