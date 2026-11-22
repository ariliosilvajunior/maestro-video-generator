"""Sobe um arquivo grande (episódio montado) para uma pasta do Drive do dono, em pedaços, sem limite de tamanho.

  python3 enviar_drive_grande.py <arquivo> <pasta_id> [nome_no_drive]

O Painel abre a sessão de envio (POST /producao-videos/drive/envio-grande) e o arquivo vai direto para o Google
em pedaços de 32 MB; se a conexão cair, continua de onde parou. Token: CONTENT_FACTORY_API_TOKEN (nunca imprimir).
"""
import json, mimetypes, os, sys, time, urllib.error, urllib.request

PAINEL = "https://painel.recursoscognitivos.com.br"
PEDACO = 32 * 1024 * 1024


def abrir_sessao(pasta, nome, mime, tamanho):
    tok = os.environ["CONTENT_FACTORY_API_TOKEN"]
    corpo = json.dumps({"pasta": pasta, "nome": nome, "mime": mime, "tamanho": tamanho}).encode()
    req = urllib.request.Request(PAINEL + "/producao-videos/drive/envio-grande", data=corpo, method="POST",
                                 headers={"Authorization": "Bearer " + tok, "Content-Type": "application/json"})
    return json.load(urllib.request.urlopen(req, timeout=60))["url"]


def ja_recebido(url, tamanho):
    req = urllib.request.Request(url, data=b"", method="PUT", headers={"Content-Range": f"bytes */{tamanho}"})
    try:
        r = urllib.request.urlopen(req, timeout=60)
        return tamanho, json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 308:
            faixa = e.headers.get("Range")
            return (int(faixa.split("-")[1]) + 1 if faixa else 0), None
        raise


def enviar(arquivo, pasta, nome=None):
    nome = nome or os.path.basename(arquivo)
    tamanho = os.path.getsize(arquivo)
    mime = mimetypes.guess_type(nome)[0] or "application/octet-stream"
    url = abrir_sessao(pasta, nome, mime, tamanho)
    pos, feito = 0, None
    with open(arquivo, "rb") as f:
        while pos < tamanho:
            f.seek(pos)
            dados = f.read(PEDACO)
            fim = pos + len(dados) - 1
            req = urllib.request.Request(url, data=dados, method="PUT",
                                         headers={"Content-Length": str(len(dados)), "Content-Range": f"bytes {pos}-{fim}/{tamanho}"})
            for tentativa in range(5):
                try:
                    r = urllib.request.urlopen(req, timeout=300)
                    feito = json.load(r); pos = tamanho
                    break
                except urllib.error.HTTPError as e:
                    if e.code == 308:
                        faixa = e.headers.get("Range"); pos = int(faixa.split("-")[1]) + 1 if faixa else 0
                        break
                    if e.code < 500:
                        raise
                except (urllib.error.URLError, TimeoutError, ConnectionError):
                    pass
                time.sleep(2 ** tentativa)
                pos, feito = ja_recebido(url, tamanho)
                if feito:
                    break
            else:
                raise SystemExit("envio parou depois de 5 tentativas")
            print(f"{min(pos, tamanho) * 100 // tamanho}%", flush=True)
    return feito


if __name__ == "__main__":
    r = enviar(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)
    print(json.dumps(r, ensure_ascii=False))
