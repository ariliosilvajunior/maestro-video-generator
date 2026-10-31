"""Envia o vídeo final de um episódio para o Painel do Dono aprovar antes do YouTube.

Uso:  python3 enviar_publicacao.py <video.mp4> <publicacao.json>
      (token em CONTENT_FACTORY_API_TOKEN; o .json traz chave, titulo, descricao, tags,
       canal_esperado e privacidade_final — ex.: ../publicacao/piloto_youtube.json)

Fluxo (31/10/2026, pedido do dono: "sempre envia o vídeo primeiro para a área do dono
para aprovação"): cria a publicação → manda o vídeo em partes de 40 MB (retomável) →
finaliza. O dono assiste em Roteiro de Vídeo → episódio → "Publicação no YouTube",
corrige o texto se quiser e aprova; só aí o Painel sobe para o YouTube.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

BASE = os.environ.get("PAINEL_URL", "https://painel.recursoscognitivos.com.br")
PARTE = 40 * 1024 * 1024


def chamar(metodo, caminho, corpo=None, tipo="application/json"):
    cab = {"Authorization": "Bearer " + os.environ["CONTENT_FACTORY_API_TOKEN"]}
    if corpo is not None:
        cab["Content-Type"] = tipo
        if tipo == "application/json":
            corpo = json.dumps(corpo).encode()
    for tentativa in range(5):
        try:
            req = urllib.request.Request(BASE + caminho, data=corpo, headers=cab, method=metodo)
            with urllib.request.urlopen(req, timeout=300) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code < 500:
                raise SystemExit(f"{metodo} {caminho}: {e.code} {e.read().decode()[:400]}")
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            print("rede:", e)
        time.sleep(2 ** (tentativa + 1))
    raise SystemExit(f"{metodo} {caminho}: falhou 5 vezes")


def main(video, meta_json):
    meta = json.load(open(meta_json, encoding="utf-8"))
    tamanho = os.path.getsize(video)
    pub = chamar("POST", "/producao-videos/publicacao/automacao", {**meta, "tamanho": tamanho})
    pid = pub["id"]
    print("publicação", pid, "—", tamanho // 1048576, "MB")
    with open(video, "rb") as f:
        while pub["recebido"] < tamanho:
            f.seek(pub["recebido"])
            bloco = f.read(PARTE)
            try:
                pub = chamar("PUT", f"/producao-videos/publicacao/{pid}/parte?offset={pub['recebido']}", bloco, "application/octet-stream")
            except SystemExit as e:  # offset fora de ordem após queda: pergunta onde parou e continua
                if "fora de ordem" not in str(e):
                    raise
                pub = next(p for p in chamar("GET", "/producao-videos/publicacao/automacao") if p["id"] == pid)
            print(f"  {pub['recebido'] // 1048576}/{tamanho // 1048576} MB")
    pub = chamar("POST", f"/producao-videos/publicacao/{pid}/finalizar")
    print("status:", pub["status"], "— aprovar no Painel: Roteiro de Vídeo →", meta["chave"])


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
