#!/usr/bin/env python3
"""Gate de MONEY-CLAIMS — reprova copy/legenda/DM que prometa dinheiro/renda ou vista o
formato de golpe. Sai != 0 se reprovar (para poder travar um pipeline como o copy_gates.py).

**NÃO é uma régua nova inventada.** É a codificação automatizada de uma diretiva que já existe
há tempo, mas hoje só como INSTRUÇÃO ao modelo, sem verificação de código:

  - `PIPELINE_DIRECTIVES.md` §11 (content-safety gate)
  - `how-to-generate-video-scripts.md` regra 12

O §11 lista as "FORBIDDEN framings" (renda garantida, ganhe R$X/mês, fique rico, dinheiro fácil,
lucro garantido, método secreto, cupom fabricado, milagre de saúde…). Até nada
CONFERIA o texto final publicado — se o modelo desobedecesse o §11, nada pegava. Este gate fecha
esse buraco: roda sobre a legenda/DM finalizada, antes de agendar/enfileirar.

**Reuso, não reinvenção:** o motor de casamento é o mesmo usado noutras réguas de copy —
`fold()` (normaliza acento/caixa) + match por radical (`palavra*`) COM limite de palavra. O que
muda é a dimensão verificada (promessa de dinheiro, não colisão de keyword de DM) e o fato de
casar FRASES (duas/três palavras) além de tokens soltos.

Duas severidades (como a "lista dura" vs. o resto no copy_gates):
  - BLOCK  → promessa de dinheiro/golpe inequívoca. REPROVA o gate (exit 1).
  - REVIEW → palavra ambígua isolada (ex.: "garantido", "rico") que sozinha pode ser legítima
             ("acesso garantido", "conteúdo rico"). NÃO reprova; sai marcada para olho humano.
             Só vira BLOCK quando aparece na frase-de-dinheiro certa (que já está na lista BLOCK).

Uso:
  python3 money_claims_gate.py --text "Ganhe R$5 mil por mês com IA"     # testa uma string
  python3 money_claims_gate.py --files a-copy.md b-copy.md               # arquivos avulsos
  python3 money_claims_gate.py --all-copies --run <dir>                  # todo *-copy.md do run
  python3 money_claims_gate.py --selftest                                # prova viva do gate

Importável:  from money_claims_gate import find_money_claims, scan_text
             hits = find_money_claims(caption)   # [] = limpo ; senão lista de achados BLOCK
"""
import os
import re
import sys
import glob
import unicodedata


def fold(s):
    """Idêntico ao copy_gates.py: minúsculas + remove diacríticos (NFD, dropa 'Mn')."""
    return "".join(c for c in unicodedata.normalize("NFD", str(s).lower())
                   if unicodedata.category(c) != "Mn")


# ---------------------------------------------------------------------------------------------
# REGRAS — codificação do §11 (house rule).
#
# Calibrado contra copies REAIS para não dar falso-positivo:
#   - "GASTANDO 10 mil reais por dia" (custo, não ganho) NÃO pode bloquear.
#   - "o agente ENRIQUECE os dados" (data enrichment) NÃO pode bloquear.
# Por isso os padrões numéricos de dinheiro-por-tempo são "contextuais": só reprovam se houver
# um VERBO DE GANHO no texto e o trecho NÃO estiver governado por um verbo de GASTO.
#
# HARD  = inequívoco → BLOCK sempre.   CTX = só BLOCK se contexto de ganho.   REVIEW = só marca.
# ---------------------------------------------------------------------------------------------
BLOCK_PHRASES_HARD = [
    ("renda garantida",              "renda garantida"),
    ("renda extra garantida",        "renda extra garantida"),
    ("lucro garantido",              "lucro garantido"),
    ("ganho garantido",              "ganho garantido"),
    ("ganhos garantidos",            "ganhos garantidos"),
    ("retorno garantido",            "retorno garantido"),
    ("resultado garantido",          "resultado garantido"),
    ("resultados garantidos",        "resultados garantidos"),
    ("renda passiva",                "renda passiva"),
    ("dinheiro facil",               "dinheiro fácil"),
    ("dinheiro rapido",              "dinheiro rápido"),
    ("dinheiro sem sair de casa",    "dinheiro sem sair de casa"),
    ("ganhe dinheiro sem",           "ganhe dinheiro sem (esforço/trabalhar)"),
    ("ganhar dinheiro sem",          "ganhar dinheiro sem (esforço/trabalhar)"),
    ("fique rico",                   "fique rico"),
    ("ficar rico",                   "ficar rico"),
    ("fica rico",                    "fica rico"),
    ("largue* * emprego",            "largue seu emprego"),
    ("largar o emprego",             "largar o emprego"),
    ("largar seu emprego",           "largar seu emprego"),
    ("demita* * chefe",              "demita o chefe"),
    ("viva de renda",                "viva de renda"),
    ("viva de dividendos",           "viva de dividendos"),
    ("viver de renda",               "viver de renda"),
    # golpe/segredo
    ("metodo secreto",               "método secreto"),
    ("metodo infalivel",             "método infalível"),
    ("formula secreta",              "fórmula secreta"),
    ("segredo que ninguem",          "segredo que ninguém conta"),
    ("hack que os bancos",           "hack que os bancos escondem"),
    ("que os bancos escondem",       "que os bancos escondem"),
    ("que os gurus escondem",        "que os gurus escondem"),
    ("cupom secreto",                "cupom secreto (fabricado)"),
    ("codigo secreto de desconto",   "código secreto de desconto"),
    # investimento sem risco
    ("investimento sem risco",       "investimento sem risco"),
    ("lucro certo",                  "lucro certo"),
    ("ganho certo",                  "ganho certo"),
    ("multiplicar seu dinheiro",     "multiplicar seu dinheiro"),
    ("multiplique seu dinheiro",     "multiplique seu dinheiro"),
    # milagre
    ("cura milagrosa",               "cura milagrosa"),
    ("emagreca sem",                 "emagreça sem (milagre)"),
    ("perca * quilos em",            "perca X quilos em (milagre)"),
]

# Frases que só são promessa em contexto de ganho ("aprenda sem esforço" é legítimo).
BLOCK_PHRASES_CTX = [
    ("sem esforco",                  "sem esforço (promessa de renda)"),
    ("sem trabalhar",                "sem trabalhar (promessa de renda)"),
]

# Regex com verbo de ganho embutido → sempre BLOCK.
BLOCK_REGEX_HARD = [
    (r"\bganh\w*\s+(ate\s+)?r\$?\s*\d",                 "ganhe R$X"),
    (r"\bganh\w*\s+\d+\s*(mil|reais|k)\b",              "ganhe N mil/reais"),
    (r"\bfatur\w*\s+(ate\s+)?r?\$?\s*\d",               "fature R$X"),
    (r"\bfatur\w*\s+(6|seis|7|sete)\s+digitos\b",       "fature 6/7 dígitos"),
    (r"\bfac\w*\s+r\$\s*\d",                            "faça R$X"),
]

# Regex de VALOR sem verbo embutido → contextual (só BLOCK com verbo de ganho e sem gasto).
BLOCK_REGEX_CTX = [
    (r"\br\$\s*\d[\d.\s]*\s*(mil|milho|por\s+(dia|mes|semana)|\/\s*(dia|mes|semana)|ao\s+(dia|mes))", "R$X por dia/mês"),
    (r"\b\d+\s*(mil|k)\s*(reais\s*)?(por|ao|\/)\s*(dia|mes|semana)", "X mil por dia/mês"),
    (r"\b\d{1,3}\s*%\s*(ao|por|\/)\s*(dia|mes|semana)", "X% ao mês/dia"),
    (r"\br\$\s*\d[\d.\s]*\s*em\s+\d+\s*(dias|semanas|meses)", "R$X em N dias"),
    (r"\b(6|seis|7|sete)\s+digitos\b",                  "6/7 dígitos (faturamento)"),
]

# REVIEW: token isolado ambíguo. Só marca (não reprova). O caso perigoso REAL já está em BLOCK.
REVIEW_PHRASES = [
    ("garantid*",   "garantido/garantida (isolado — ver se é promessa de resultado)"),
    ("rico",        "rico (isolado)"),
    ("milionari*",  "milionário (isolado)"),
    ("passiv*",     "passiva/passivo (isolado — ver 'renda passiva')"),
    ("secreto",     "secreto (isolado)"),
    ("secreta",     "secreta (isolada)"),
]

# Sinais de contexto para os padrões contextuais.
EARNING_CUE = re.compile(r"\b(ganh\w*|fatur\w*|faturamento|lucr\w*|receb\w*|embols\w*|"
                         r"rend[ae]\w*|render\w*|renda|salari\w*|comiss\w*|monetiz\w*|"
                         r"fique\s+rico|ficar\s+rico|enriquec\w*)\b")
SPENDING_CUE = re.compile(r"\b(gast\w*|perd\w*|perc\w*a|custa\w*|custo\w*|custar\w*|custou|"
                          r"prejuiz\w*|divida\w*|desperdic\w*|economiz\w*|paga\w*|pagar\w*)\b")


def _phrase_pat(folded_phrase):
    """Frase folded -> regex. Token 'x*' casa por radical; tokens ligados por \\s+; limite de palavra."""
    toks = folded_phrase.split()
    parts = []
    for t in toks:
        if t.endswith("*"):
            parts.append(re.escape(t[:-1]) + r"\w*")
        else:
            parts.append(re.escape(t) + r"\b")
    return r"\b" + r"\s+".join(parts)


_HARD = ([(lab, re.compile(_phrase_pat(fold(p)))) for p, lab in BLOCK_PHRASES_HARD]
         + [(lab, re.compile(rx)) for rx, lab in BLOCK_REGEX_HARD])
_CTX = ([(lab, re.compile(_phrase_pat(fold(p)))) for p, lab in BLOCK_PHRASES_CTX]
        + [(lab, re.compile(rx)) for rx, lab in BLOCK_REGEX_CTX])
_COMPILED_REVIEW = [(lab, re.compile(_phrase_pat(fold(p)))) for p, lab in REVIEW_PHRASES]


def _spending_governed(f, start):
    """True se houver verbo de gasto nos ~35 chars ANTES do trecho (ex.: 'gastando 10 mil/dia')."""
    return SPENDING_CUE.search(f[max(0, start - 35):start]) is not None


def scan_text(text):
    """Devolve (blocks, reviews). Cada item: {'label','match'}. blocks!=[] => reprova.

    HARD: sempre bloqueia. CTX: só bloqueia se há verbo de ganho no texto e o trecho não está
    governado por verbo de gasto imediatamente antes (mata 'gastando 10 mil por dia')."""
    f = fold(text)
    has_earn = EARNING_CUE.search(f) is not None
    blocks, reviews = [], []
    for lab, rx in _HARD:
        m = rx.search(f)
        if m:
            blocks.append({"label": lab, "match": m.group(0).strip()})
    for lab, rx in _CTX:
        m = rx.search(f)
        if m and has_earn and not _spending_governed(f, m.start()):
            blocks.append({"label": lab, "match": m.group(0).strip()})
    for lab, rx in _COMPILED_REVIEW:
        m = rx.search(f)
        if m:
            reviews.append({"label": lab, "match": m.group(0).strip()})
    return blocks, reviews


def find_money_claims(text):
    """Atalho: só os BLOCK (o que reprova). [] = limpo."""
    return scan_text(text)[0]


# ---------------------------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------------------------
def _read_caption_or_all(path):
    """Lê a legenda de um *-copy.md: usa a seção '## Legenda Instagram' se existir; senão o texto todo."""
    t = open(path, encoding="utf-8").read()
    m = re.search(r'## Legenda Instagram.*?\n(.*?)(\n## |\Z)', t, re.S)
    return m.group(1) if m else t


def _selftest():
    should_block = [
        "Ganhe R$5 mil por mês com IA sem sair de casa",
        "renda garantida trabalhando 1h por dia",
        "fique rico com esse método secreto",
        "lucro garantido de 20% ao mês no cripto",
        "dinheiro fácil com esse hack que os bancos escondem",
        "largue seu emprego e viva de renda passiva",
        "use o cupom secreto pra 90% off",
        "faça R$ 10.000 em 30 dias",
        "fature 6 dígitos com IA",
    ]
    should_pass = [
        "essa IA cria um app funcional em 10 minutos",
        "acesso garantido à comunidade por 12 meses",
        "resultado comprovado por pesquisa da universidade",
        "aprenda IA do zero sem complicação",
        "esse agente automatiza seu atendimento no WhatsApp",
        "conteúdo rico e prático toda semana",
        "vaga garantida na próxima turma",
    ]
    ok = True
    print("== SELFTEST money_claims_gate ==")
    print("-- DEVE BLOQUEAR --")
    for s in should_block:
        b, _ = scan_text(s)
        hit = bool(b)
        ok &= hit
        print(f"  [{'OK ' if hit else 'MISS'}] block={[x['label'] for x in b] or '—'} :: {s}")
    print("-- DEVE PASSAR (sem BLOCK) --")
    for s in should_pass:
        b, r = scan_text(s)
        clean = not b
        ok &= clean
        tag = f" (review: {[x['label'] for x in r]})" if r else ""
        print(f"  [{'OK ' if clean else 'FALSE-POSITIVE'}] block={[x['label'] for x in b] or '—'}{tag} :: {s}")
    print("RESULT:", "SELFTEST PASSOU" if ok else "SELFTEST FALHOU")
    return 0 if ok else 1


def _arg(flag):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else None


def main():
    if "--selftest" in sys.argv:
        return _selftest()

    items = []  # (rótulo, texto)
    if "--text" in sys.argv:
        items.append(("--text", _arg("--text") or ""))
    elif "--all-copies" in sys.argv:
        rdir = _arg("--run")
        if not rdir:
            raise SystemExit("--all-copies precisa de --run <dir>")
        for p in sorted(glob.glob(os.path.join(os.path.expanduser(rdir), "*-copy.md"))):
            items.append((os.path.basename(p), _read_caption_or_all(p)))
        if not items:
            raise SystemExit("nenhum *-copy.md encontrado no run")
    elif "--files" in sys.argv:
        i = sys.argv.index("--files")
        files = [x for x in sys.argv[i + 1:] if not x.startswith("--")]
        for p in files:
            items.append((os.path.basename(p), _read_caption_or_all(p)))
    else:
        raise SystemExit(__doc__)

    ok = True
    print("== gate de money-claims (codifica §11) ==")
    for lab, text in items:
        blocks, reviews = scan_text(text)
        good = not blocks
        ok &= good
        rv = " · review=" + str([x["match"] for x in reviews]) if reviews else ""
        shown = [x["label"] + "<" + x["match"] + ">" for x in blocks] or "—"
        print(f"  [{'PASS' if good else 'BLOCK'}] {lab}: money_claim={shown}{rv}")
    print("RESULT:", "GATE DE MONEY-CLAIMS PASSOU" if ok else "GATE DE MONEY-CLAIMS REPROVOU — NAO PUBLIQUE")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
