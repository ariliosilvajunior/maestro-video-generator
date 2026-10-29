import json,re,urllib.request,sys
sys.path.insert(0,__import__('os').path.dirname(__file__)); from base import H,U
ROLE=("REFERENCE ROLES: the attached image ref-estilo-p04 is ONLY the painting-style reference (gouache and coloured pencil painterly realism) — "
      "copy its brushwork, texture, light and palette, never its people or place. ")
CHECK=("CHECKLIST ANTES DE CADA IMAGEM (manual completo: docs/episodio-ilustrado/MANUAL_FLOW.md)\n"
"1. Conta e projeto certos (veja 'Conta do Flow' abaixo).\n"
"2. ABRIR = clicar na imagem indicada (abre grande) → caixa 'O que você quer mudar?'. CRIAR = barra de baixo 'O que você quer criar?'.\n"
"3. SEMPRE anexar ref-estilo-p04 (+ o que a cena pedir em ANEXAR).\n"
"4. Colar o texto da cena inteiro, sem cortar.\n"
"5. Conferir antes de aceitar: guache/lápis (NÃO aquarela, NÃO contorno a tinta), mesmo lugar, mesmas pessoas, escala de adulto, canto inferior direito vazio. Errou → apagar e refazer, nunca editar em cima do erro.\n"
"6. Renomear com o código da cena (ex.: n5-S10b) e marcar 'Imagem ok' no Painel.\n\n")
eps=json.load(urllib.request.urlopen(urllib.request.Request(U,headers=H)))
for e in eps:
    if e['chave']=='piloto': continue
    for c in e['cenas']:
        img=c.get('imagem') or ''
        if not img or img=='—': continue
        if not img.startswith('REFERENCE ROLES'): c['imagem']=ROLE+img
        o=c.get('obs','')
        if 'ref-estilo-p04' not in o:
            if 'ANEXAR nada' in o: o=o.replace('ANEXAR nada','ANEXAR ref-estilo-p04')
            elif 'ANEXAR' in o: o=re.sub(r'(ANEXAR [^·]*?)(\s*·|$)',lambda m:m.group(1).rstrip()+' + ref-estilo-p04'+m.group(2),o,count=1)
            else: o=o+' · ANEXAR ref-estilo-p04'
            c['obs']=o
    notas=e['notas']
    if not notas.startswith('CHECKLIST'): notas=CHECK+notas
    r=json.load(urllib.request.urlopen(urllib.request.Request(U,data=json.dumps({"chave":e['chave'],"cenas":e['cenas'],"notas":notas}).encode(),headers=H,method='POST')))
    print(e['chave'],'ok', sum(c['situacao']!='falta' for c in r['cenas']))
