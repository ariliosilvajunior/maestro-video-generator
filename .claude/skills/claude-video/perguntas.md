# As perguntas (etapa B)

O Claude envia o bloco abaixo como UMA mensagem, palavra por palavra, depois que a pessoa escolheu um estilo.
Edite este arquivo para mudar as perguntas. Mantenha numerado, uma linha por pergunta, padrões entre colchetes.
Se a pessoa já respondeu algo, o Claude pula aquela pergunta e mantém o resto.

---

Agora me responde 5 coisas. Cada uma já tem um padrão entre colchetes; se estiver bom, nem precisa responder.

1. **Pra que é?** Abertura de vídeo do YouTube, Reels ou Short, lançamento de produto, explicação de algo, anúncio, vinheta de aula ou outra coisa. E quanto tempo tem? [12 s, horizontal 16:9]
2. **O que deve estar escrito na tela?** As palavras exatas, se já souber. [eu escrevo a partir do seu tema]
3. **Fica em loop?** Ou seja, termina do jeito que começou, pra rodar sem emenda. [não]
4. **Sua marca:** cores, fontes, logo. Pode colar as cores em hex, mandar o logo ou um sistema de design que você já tenha. [uso as do estilo escolhido]
5. **Mídia real?** Suas fotos ou clipes, clipes gerados por IA no Higgsfield, ou nenhuma, só gráfico. [nenhuma]

Responde só os números que quer mudar, tipo "1: Reels, 8 s. 5: minhas fotos". Ou diz **"vai"** pra aceitar tudo.

---

## Acompanhamento (só quando precisar)

- Se a 5 for "minhas fotos ou clipes": "Arrasta os arquivos aqui, ou me dá o caminho da pasta."
- Se a 5 for "clipes de IA": rode `python3 scripts/higgsfield.py check`. Se não houver chave, diga:
  "Coloca a sua chave do Higgsfield num arquivo chamado .env nesta pasta, numa linha só:
  HIGGSFIELD_API_KEY=seu_id:seu_segredo (pega em https://console.higgsfield.ai). Nunca cola a chave aqui no chat. Me avisa quando estiver pronto."
