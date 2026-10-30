import sys,json,urllib.request,urllib.error; sys.path.insert(0,__import__('os').path.dirname(__file__))
from base import H,U
UC=U.replace('/automacao','/contas/automacao')
def ep(chave,nome,prefixo,pasta,p05,p06): return {"chave":chave,"nome":nome,"prefixo":prefixo,"pasta_id":pasta,"pastas":{"05-episodios":p05,"06-audio":p06}}
def kit(a,b,c,d,e): return {"00-avatar-narrador":a,"01-estilo":b,"02-personagens":c,"03-cenarios":d,"04-objetos":e}
CONTAS=[
 {"letra":"A","email":"professorsaladerecursos@gmail.com","pasta_id":"1UPHx6D6eTfo69IATAqpHsxpyLfyTWTY_","kit_chave":"kit-piloto",
  "pastas":kit("1CdgQcnilSXuC7U63e5YW2nf9WeL_0Xks","1IQEGwothY6aFgQm3jpXdfodlrs-Skp8O","1cqyL_MgdvZ21vbOO-1_uq_wycJ4qhb5_","1aiS_jfvnyI3le04w6ojnKyxo8iSLtHUM","1oVU3AODzXUyl-_WGuwRpfkdRDIrSE90H"),
  "episodios":[ep("piloto",'RC – Notícias 01 - "Não havia pediatra na cidade"',"","1F-RJ4a9njcYnXguVUPeO2XNcKim-azgy","1D2uDIx1re_feBv4dmWMRrGL2ElCcNGbc","1Gh7HRzEjppWGSyJMqu6276l66VMWy3pm"),
               ep("noticia-3",'RC – Notícias 02 - "A busca de uma mãe por um diagnóstico"',"n3-","1N3bnmjiXcxEyZ7xAQPLYcHJro6nfWaBs","1gl6ivXPcCQxZaWz4U-J9FU3jbDAYcXfH","1lCaUkQ5ony1Oneq4UtqvBD6HkKeGWU48"),
               ep("noticia-4",'RC – Notícias 03 - "Quando o casal também precisa de cuidado"',"n4-","1gXPEzXJl8pW56oHQWfvDb6FEBASpNm-O","1qrGhcBXgjPgsKloP8GzhH_OXvZumgWlz","1MpWqK0-oeC04kUfBdfPNGhhukoazAHaS")]},
 {"letra":"B","email":"ututorarilio@gmail.com","pasta_id":"1sbFbB4ufh_isNlw5ohGDzdeF6Fx99nhm","kit_chave":"kit-tutor",
  "pastas":kit("14jG_GssZpEzRDb2A7KTBfB_4mDgymp3e","1wSMNR6JFF1No93ju84W0Rv9HfKZPmL1Q","1082mh0JiuKbs4NbomQCjiDCPxQo5-DGP","1T__3qatJzBu9r4KjS8z-IB0N1m-2iUJK","15DD7LvZM20qGPCSxKheZNmFpsV9g1Z8A"),
  "episodios":[ep("noticia-5",'RC – Notícias 04 - "O diagnóstico não é sentença"',"n5-","1K75AJfToP_Q1rAdrfVdde-fnSqMx-Mol","1Wv_b-gLBtCHOYbaX59XZrGPobuF-xuWo","1GZ0m9wwhmW8csvSLysL82gWmYql_st3o"),
               ep("noticia-8",'RC – Notícias 05 - "Eu não sou doente"',"n8-","1RUkLqrn4FyQEPzZeWhrDOD4LSzw6px1D","13dIDMn33bOL_KzpSzjSFXYDDSkCH26rq","1Kr9k8TZWe5kjRQj9fEINYM32urDPxm4I")]},
 {"letra":"C","email":"arilioinstrutor@gmail.com","pasta_id":"1lQlD6Bhbl7hXtKPS6cGEQ7GUjAP7C6HM","kit_chave":"kit-conta-c",
  "pastas":kit("1h_M7UyDDNJOI01rfGHdvdnGX8OznPcF_","1Y6mgIz_pZsRIfv9i7BeyATnuhzyC1Fqj","1155CTL4WKSNPWEnHtarf5m7z3bfbBK5Q","138_Ox3F7kYUX3ZYxrLsv2qZDHMCCXpQW","1BZV8yEi5qQdmbpndt11rsSpz4o9vsEQX"),
  "episodios":[ep("noticia-1",'RC – Notícias 06 - "O papel do professor diante da criança autista na educação infantil"',"n1-","1tO_Jtq8ceHTN98i7hFaYoKCqn_VQX1C7","14Y_59zZywB_33ulzZc88LL71CKyUBidy","1nBLe1-Hg9zI2mLXTmJsn94X1wEbrnrWw"),
               ep("noticia-6",'RC – Notícias 07 - "Ele não sabe brincar"',"n6-","1z2rsxkMED89KPlGUJOs_YJxvgc92Af3p","1YV5kOj3iMOGhuIojDRj5E46XQno15rAH","12whhVq1zuExWkOUpeWKsSYatJpVbic0y")]},
 {"letra":"D","email":"recursoscognitivos.app@gmail.com","pasta_id":"1Yd3gBIBbUjyONaJmjM_sY-KeTJkajrW0","kit_chave":"kit-conta-d",
  "pastas":kit("1BV_ZbCeISAI4RN4F6vINYbQ9KI5_7Lun","1DxFe1PouZ7VNjrxf3qoGRHe0efKULiWy","1kvG337YULNVJqsYDi01ja_D6imhPwR_T","1oruQYAuk_lLm_AP9hRJ2_t-ceOsuIvIw","1-pZn9RREHh-eihEpZHV1pFb4LXkU6cSH"),
  "episodios":[ep("noticia-2",'RC – Notícias 08 - "Mundo Singular"',"n2-","1ykZKeoY5Y1bVcY_WKsJ1ZgouNJUY7Dtv","1Npx4Q6hRtQaxQ0j0AY96BJ2G51ulWJXW","1D0myBLNYoTunTDP7dVTN-NMq2g7AtnZO"),
               ep("noticia-7",'RC – Notícias 09 - "Todo autista é um gênio?"',"n7-","1G32o2YbCOrN4TLFlT7VUzPksrnM7ppaW","1SFofBgUiRRfc5cR0XGupeU-1thaQbm5U","17qlQGydhLZlU583XaJKWv9EsPYeHxWe3")]},
]
post=lambda url,b: json.load(urllib.request.urlopen(urllib.request.Request(url,data=json.dumps(b).encode(),headers=H,method='POST')))
ordem=0
for c in CONTAS:
    conta=f"Conta {c['letra']} — {c['email']}"
    post(U,{"chave":c["kit_chave"],"titulo":f"Kit de referência — Conta {c['letra']}","conta_flow":conta,"ordem":ordem}); ordem+=1
    for e in c["episodios"]:
        post(U,{"chave":e["chave"],"conta_flow":conta,"ordem":ordem}); ordem+=1
print("episódios atualizados")
try:
    for c in CONTAS: print(post(UC,c)["letra"],"ok")
except urllib.error.HTTPError as e: print("contas: rota ainda não existe (falta deploy)",e.code)
