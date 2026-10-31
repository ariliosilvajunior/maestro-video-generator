"""31/10/2026, dono: toda cena tem SEMPRE os dois textos (imagem e vídeo) — quando o vídeo dá
errado, quase sempre é preciso refazer a imagem. Arquivo novo SEMPRE com o mesmo nome (apaga o
errado e salva o novo com o mesmo nome): nunca sugerir -v2/renomear antiga."""
import sys, json, re, urllib.request
sys.path.insert(0, __import__('os').path.dirname(__file__))
from base import H, U, BLOCO
DOC = "/home/user/maestro-video-generator/docs/episodio-ilustrado/DOCUMENTO_MESTRE_EPISODIO_PILOTO.md"
IMG = {f"P{int(m.group(1)):02d}": m.group(0).rsplit('.', 1)[0] for m in re.finditer(r"p(\d\d)-[^'\",\]]+?\.(?:png|jpg)",
      "p01-estrada-alvorecer.png p02-mae-crianca-rua.png p03-posto-saude-fechado.png p04-caixas-mudanca.png p05-armario-potes.png p06-panela-fogo.png p07-sala-baguncada.png p08-dois-filhos-bagunca-sala.png p09-menino-correndo-derruba cadeira.png p10-telhado-escada.png p11-portao-aberto-menino.jpg p12-estrada-dia-menino-corre.png p13-porta-vizinho-menino-entrando.png p14-mao-desconhecido.png p15-carro-noite.png p16-maos-dentro-carro.png p17-quintal-fila-objetos.png p18-professor-sala-recursos.png p19-terapeuta-portao.png p20-menino-cria-vinculo.png p21-maos-blocos.png p22-mao-na-palma.png p23-cadeira-vazia.png p24-mae-sozinha-blocos.png p25-menino-a-parte.png p26-menino-incluido.png p27-quintal-cheio.png p28-criancas-brincando-em-casa.png p29-portao-escola.jpg p30-professor-aluno-vista-alta.png p31-maos-cartoes.png p32-caminho-dividido.png p33-estrada-alvorecer-final.png".replace(" ", "|"))}
QUEM = {"f01-mae": "P02 P04 P08 P16 P24 P28 P29", "f02-jonas": "P02 P08 P09 P10 P11 P12 P13 P14 P16 P20 P21 P22 P25 P26 P27 P28 P29 P30",
        "f03-filha": "P02 P08 P27 P28", "f04-terapeuta": "P19 P20 P21 P22", "f05-professor-aee": "P18 P30 P31"}
FIX = {
 "P09": "the wooden chair lies FALLEN flat on the floor, on its back, already knocked over (not tilted in the air); the boy runs toward the sofa with his LEFT foot flat on the floor and his right foot lifted behind him, his shadow touching his foot",
 "P16": "the boy's small hand must be the hand of a 6-year-old child (slim fingers, child proportions — NOT a chubby baby hand), naturally holding his mother's hand; the boy wears ONLY his faded terracotta-and-beige striped t-shirt from f02-jonas — remove any jacket or coat (there is no jacket with the same stripes)",
}
ESTILO = (" STYLE: same painting as the opened image (pilot style, like p04-caixas-mudanca): cinematic painterly realism, natural film grain, realistic faces and hands with five fingers, 1980s clothes.")

def anim_doc():
    t = open(DOC).read(); out = {}
    for m in re.finditer(r"\*\*(P\d\d) ·[^\n]*\n(?:.*\n)*?Animação: `([^`]+)`", t):
        a = m.group(2)
        a = re.sub(r"[^.]*\b(pans?|travels slowly sideways)\b[^.]*\.\s*", "", a)  # sem panorâmica (lição B2)
        out[m.group(1)] = a.strip() + " Static camera unless a slow push-in is stated."
    return out

if __name__ == "__main__":
    eps = json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H)))
    json.dump(eps, open(__import__('os').path.dirname(__file__) + "/../eps_antes_piloto.json", "w"), ensure_ascii=False)
    pil = next(e for e in eps if e["chave"] == "piloto"); doc = anim_doc()
    for c in pil["cenas"]:
        cod = c["codigo"]; img = IMG.get(cod)
        if not img: continue
        quem = [f for f, cs in QUEM.items() if cod in cs.split()]
        anexos = " + ".join(quem + ["p04-caixas-mudanca"]) if cod != "P04" else " + ".join(quem)
        c["obs"] = f"ABRIR {img} · ANEXAR {anexos} · se refizer: apague a errada e salve a nova com o MESMO nome ({img})"
        pedido = FIX.get(cod, "[ESCREVA AQUI O QUE CORRIGIR — ex.: a mão está deformada; a roupa está errada]")
        c["imagem"] = (f"Keep this exact image: the same place, camera, framing, light and painting style, and the same people with the same faces and clothes"
                       f"{(' (attached references: ' + ', '.join(quem) + ')') if quem else ''}. Change ONLY this: {pedido}. Change nothing else." + ESTILO)
        if not c.get("animacao") and cod in doc:
            c["animacao"] = BLOCO + doc[cod]
        if cod in ("P05",) and c.get("animacao") and "never covering" not in c["animacao"]:
            c["animacao"] = c["animacao"].replace("swings slowly and gently back and forth a few degrees.", "swings only a few degrees, never covering the jars.")
    # nunca mais sugerir -v2 / renomear a antiga
    for e in eps:
        for c in e["cenas"]:
            o = c.get("obs") or ""
            o2 = re.sub(r" \(renomear a antiga para [^)]*\)", "", o)
            o2 = o2.replace(" · salvar também como c03-sala-nova", "")
            if o2 != o: c["obs"] = o2
    for e in eps:
        r = json.load(urllib.request.urlopen(urllib.request.Request(U, data=json.dumps({"chave": e["chave"], "cenas": e["cenas"]}).encode(), headers=H, method="POST")))
    pil = next(e for e in json.load(urllib.request.urlopen(urllib.request.Request(U, headers=H))) if e["chave"] == "piloto")
    print("sem imagem:", [c["codigo"] for c in pil["cenas"] if not c.get("imagem")], "sem animação:", [c["codigo"] for c in pil["cenas"] if not c.get("animacao")])
    c = next(c for c in pil["cenas"] if c["codigo"] == "P16"); print(c["obs"]); print(c["imagem"])
