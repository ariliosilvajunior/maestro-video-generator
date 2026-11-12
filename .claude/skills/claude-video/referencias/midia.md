# Modo Mídia: grafismo mais fotos, clipes e clipes de IA reais

O modo Mídia é o modo Motion com imagens reais dentro. O grafismo continua liderando; a mídia fica dentro dele.

## Três tipos de mídia (do mais barato para o mais caro)
1. As fotos da própria pessoa. De graça. O código dá vida a uma foto: um push-in lento, paralaxe
   entre um recorte e o fundo, uma varredura de luz, um reveal com máscara.
2. Os clipes da própria pessoa (gravações de tela, tomadas de produto, talking head). De graça.
3. Clipes de IA da Higgsfield. Gastam créditos. Melhor para transformar UMA foto parada num plano
   em movimento de 4 a 8 s (imagem para vídeo), ou para B-roll que ninguém filmou (texto para vídeo).

## A chave (nunca no chat)
- A pessoa define `HIGGSFIELD_API_KEY=key_id:key_secret` no shell dela, ou num arquivo `.env`
  na pasta do projeto. As chaves vêm de https://console.higgsfield.ai .
- `python3 scripts/higgsfield.py check` diz sim ou não. Nunca imprime a chave.
- Nunca peça para a pessoa colar uma chave. Nunca a exiba, registre em log ou commite. `.env` está no `.gitignore`.

## A API (o que o script faz)
- Base: `https://platform.higgsfield.ai` (defina `HIGGSFIELD_API_BASE` para trocar; a documentação mostra `https://api.higgsfield.ai`).
- Cabeçalho: `Authorization: Key <key_id>:<key_secret>`.
- Subir uma foto: `POST /files/generate-upload-url` com `{"content_type": "image/jpeg"}`, depois PUT do arquivo
  em `upload_url` com os cabeçalhos devolvidos. Use `public_url` como `image_url`.
- Cotação, de graça: `POST /estimate/<endpoint>` com o mesmo corpo. Devolve `credits`.
- Enviar: `POST /<endpoint>` com um cabeçalho `Idempotency-Key`. Devolve `status_url`.
- Consulte `status_url` (2 s, crescendo até 10 s) até `completed`, `failed`, `nsfw` ou `canceled`.
  O clipe está em `video.url`. Baixe; os links duram uns 7 dias. Jobs que falham não são cobrados.
- Documentação: https://docs.higgsfield.ai

| Nome nesta skill | Endpoint | Bom para | Duração |
|---|---|---|---|
| seedance-2.0 (padrão) | `bytedance/seedance-2.0/image-to-video` e `/text-to-video` | foto para clipe, qualquer movimento sério, frame inicial + final | 4 a 15 s |
| seedance-2.5 | `bytedance/seedance-2.5/image-to-video` e `/text-to-video` | planos únicos mais longos | 4 a 30 s |
| kling-3-turbo | `kling-video/v3.0-turbo/image-to-video` | movimentos simples e baratos | 3 a 15 s |

O script desliga o som gerado (`generate_audio: false`). Som é coisa da edição.

## O portão do storyboard (sempre)
Antes de qualquer gasto:
1. Escreva o `storyboard.json` (veja `exemplos/storyboard.json`): cada plano, o tempo dele, o que o grafismo
   faz e qual asset ele usa: `code`, `user_photo`, `user_clip` ou `generate` (com modelo, prompt,
   duração, resolução).
2. Rode `python3 scripts/storyboard.py storyboard.json`. Ele imprime a tabela e a estimativa de créditos.
3. Mostre essa tabela para a pessoa. Espere um "sim" claro. Qualquer mudança: atualize e mostre de novo.
4. Só então rode `scripts/higgsfield.py generate ... --yes`, um plano por vez, e confira cada clipe
   (capture 3 frames) antes de usar.

## Prompts que funcionam para foto para clipe
- Descreva a CÂMERA e UMA ação: "push-in lento, ela ergue os olhos do notebook e sorri, luz suave de janela".
- Mantenha o enquadramento perto da foto. Mudanças grandes de enquadramento fazem o modelo cortar no meio do clipe.
- Para loop, passe a mesma foto como imagem final (seedance) para o clipe terminar onde começou.
- Nunca peça texto dentro do clipe. Texto é sempre código, por cima.

## Colocando mídia na composição
- Copie os arquivos para a pasta `media/` do projeto.
- Clipes são `<video class="clip" muted playsinline data-start=".." data-duration=".." data-media-start="..">`.
- Coloque a mídia DENTRO de um grafismo (uma máscara, um card, uma forma) para ler como um design só, não como slideshow.
- Nunca desenhe por cima de um rosto. Nunca recorte um clipe 16:9 num formato estranho sem avisar.
- Case as cores: amostre o clipe e puxe o fundo do estilo na direção dele, ou trate o clipe com um
  filtro CSS para os dois parecerem um mundo só.
