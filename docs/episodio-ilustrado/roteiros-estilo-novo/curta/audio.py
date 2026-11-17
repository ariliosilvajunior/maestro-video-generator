# Curta de teste: narração do dono (v3 + troca de voz) + falas dos personagens + efeitos sonoros com pausas para eles aparecerem.
import json, os, sys, uuid, subprocess, urllib.request
sys.path.insert(0, '/tmp/claude-0/-home-user/be8c2ca8-b73c-5f63-95ff-7e1938a7ecc2/scratchpad/intro'); import el
D = os.path.dirname(os.path.abspath(__file__)) + '/'
K = el.chave(); DONO = '7E34QW8YpZNX1CILBhmz'
V = json.load(open('/home/user/maestro-video-generator/docs/episodio-ilustrado/roteiros-estilo-novo/vozes_personagens.json'))
# (tipo, conteúdo, cenas)  tipo: N = narrador, P:<personagem> = fala, S:<efeito>:<seg> = efeito em destaque (pausa), G:<seg> = respiro
B = [
 ('S:festa:2.6', None, [24]),
 ('N', '[excited] Até que veio a festa. Aniversário da avó. Casa cheia, música alta, tio falando alto, prima rindo alto, panela batendo… tudo alto.', [24, 25]),
 ('N', '[nervous] A Marta olha em volta. Cadê o Davi? Na sala, não. No quintal, não. No quarto, não.', [26, 27]),
 ('P:Marta', '[whispers] Rogério… cadê o Davi?', [27]),
 ('G:1.6', None, [27]),
 ('N', '[whispers] Acharam ele embaixo da mesa da cozinha. Com as mãos nos ouvidos. Balançando. A Marta se abaixou, levantou a toalha de plástico… e não disse nada. Só estendeu a mão. E esperou.', [28, 29]),
 ('S:relogio:2.2', None, [30]),
 ('N', '[serious] No dia seguinte, no consultório do doutor Aurélio, o pediatra da cidade, a Marta segurou a bolsa no colo com as duas mãos. E disse em voz alta a palavra que até então só morava no pensamento dela:', [30]),
 ('P:Marta', '[softly] Autismo.', [31]),
 ('G:1.4', None, [31]),
 ('N', '[serious] O doutor Aurélio tirou os óculos. Limpou devagar com um paninho. Pôs de novo.', [32]),
 ('S:oculos:1.2', None, [32]),
 ('P:Aurelio', '[sighs] Minha filha… aqui, eu não tenho o que fazer por ele.', [32]),
 ('N', 'E escreveu um nome num pedaço de papel.', [33]),
 ('S:caneta:2.0', None, [33]),
 ('P:Aurelio', '[sad] Procura esse médico. Na cidade grande. Boa sorte.', [34]),
 ('S:onibus:3.0', None, [35]),
 ('N', '[tired] E assim começou o que a Marta chamaria, anos depois, de "a maratona".', [35]),
 ('N', '[tired] Ônibus de madrugada. Quatro horas de estrada. Corredor de hospital com cadeira de plástico. Exame que não dava em nada. Médico que dizia uma coisa, médico que dizia outra.', [35, 36]),
 ('G:1.0', None, [37]),
 ('N', '[amused] Numa dessas viagens, o Davi descobriu os postes. Começou a contar. "Um. Dois. Três…" Em voz alta. Muito alta.', [37, 38]),
 ('N', '[laughs] No poste cento e doze, o motorista já estava contando junto. No poste duzentos, o ônibus inteiro.', [39, 40]),
 ('N', 'Quando chegaram na cidade grande, foram aplaudidos.', [41]),
 ('S:aplausos:2.6', None, [41]),
 ('N', '[laughs] O Davi nem olhou. Ainda faltava contar o poste da rodoviária.', [41]),
]
SFX = {'festa': ('Muffled lively Brazilian family birthday party inside a small house: many relatives chatting and laughing, music playing, plates and pot lids clinking', 6),
       'relogio': ('Quiet old doctor office: a wall clock ticking slowly, distant street sounds through a window', 6),
       'oculos': ('Taking off small metal eyeglasses and rubbing the lenses with a cloth, close and quiet', 2),
       'caneta': ('Old pen scribbling quickly on a small paper notepad, then a page being torn off', 3),
       'onibus': ('Old diesel intercity bus engine starting and driving away on a countryside road at dawn', 5),
       'onibus_amb': ('Inside an old intercity bus driving on a country road: engine rumble, rattling windows, steady', 20),
       'aplausos': ('Passengers inside a bus cheering and applauding happily, laughter', 3)}
H = {'xi-api-key': K, 'Content-Type': 'application/json'}
def post(url, body, out):
    if os.path.exists(out): return
    r = urllib.request.urlopen(urllib.request.Request(url, data=json.dumps(body).encode(), headers=H, method='POST'), timeout=300); open(out, 'wb').write(r.read())
def sts(fi, fo):
    if os.path.exists(fo): return
    b = '----' + uuid.uuid4().hex; data = open(fi, 'rb').read()
    c = lambda n, v: f'--{b}\r\nContent-Disposition: form-data; name="{n}"\r\n\r\n{v}\r\n'
    body = (c('model_id', 'eleven_multilingual_sts_v2') + c('voice_settings', json.dumps({"stability": 0.4, "similarity_boost": 0.95, "style": 0.0, "use_speaker_boost": True})) +
            f'--{b}\r\nContent-Disposition: form-data; name="audio"; filename="a.mp3"\r\nContent-Type: audio/mpeg\r\n\r\n').encode() + data + f'\r\n--{b}--\r\n'.encode()
    r = urllib.request.urlopen(urllib.request.Request(f'https://api.elevenlabs.io/v1/speech-to-speech/{DONO}?output_format=mp3_44100_192', data=body, headers={'xi-api-key': K, 'Content-Type': 'multipart/form-data; boundary=' + b}, method='POST'), timeout=600)
    open(fo, 'wb').write(r.read())
for n, (t, d) in SFX.items():
    post('https://api.elevenlabs.io/v1/sound-generation', {"text": t, "duration_seconds": d, "prompt_influence": 0.5}, D + f'a/sfx_{n}.mp3')
for i, (tp, txt, _) in enumerate(B):
    if tp == 'N':
        post(f'https://api.elevenlabs.io/v1/text-to-speech/{DONO}?output_format=mp3_44100_192', {'text': txt, 'model_id': 'eleven_v3', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8}}, D + f'a/v{i:02d}.mp3')
        sts(D + f'a/v{i:02d}.mp3', D + f'a/b{i:02d}.mp3')
    elif tp.startswith('P:'):
        post(f"https://api.elevenlabs.io/v1/text-to-speech/{V[tp[2:]]['voice_id']}?output_format=mp3_44100_192", {'text': txt, 'model_id': 'eleven_v3', 'voice_settings': {'stability': 0.5, 'similarity_boost': 0.8}}, D + f'a/b{i:02d}.mp3')
# linha do tempo
dur = lambda f: float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode())
T = []; t = 0.6
for i, (tp, txt, cenas) in enumerate(B):
    if tp in ('N',) or tp.startswith('P:'):
        f = D + f'a/b{i:02d}.mp3'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse', '-ar', '44100', '-ac', '1', D + f'a/c{i:02d}.wav'], check=True)
        d = dur(D + f'a/c{i:02d}.wav'); T.append({'i': i, 'tipo': tp, 'ini': t, 'dur': d, 'cenas': cenas}); t += d + (0.55 if tp == 'N' else 0.7)
    elif tp.startswith('S:'):
        _, n, d = tp.split(':'); d = float(d); T.append({'i': i, 'tipo': tp, 'sfx': n, 'ini': t, 'dur': d, 'cenas': cenas}); t += d
    else:
        d = float(tp[2:]); T.append({'i': i, 'tipo': tp, 'ini': t, 'dur': d, 'cenas': cenas}); t += d
json.dump({'blocos': T, 'fim': t + 2.0}, open(D + 'timeline.json', 'w'), indent=1)
print('duração', round(t + 2, 1))
