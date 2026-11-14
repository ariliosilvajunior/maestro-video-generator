# 14/11/2026 — lições dos primeiros vídeos do Ep01 (E006: a senhora "se replicou" atrás do senhor; E007: gente inventada).
# Causa: câmera que anda para o lado/para trás revela espaço novo e a IA preenche com gente duplicada ou inventada; ações
# com gente atravessando o quadro ou multidão entrando fazem o mesmo. REGRAS NOVAS DA ANIMAÇÃO:
#  1. câmera PARADA ou só um empurrão lento para frente (push-in); nunca pan, dolly lateral, recuo, grua, câmera na mão;
#  2. ninguém entra nem sai do quadro; quem está na imagem continua lá, sem duplicar; ninguém novo aparece;
#  3. no máximo UMA ação principal por personagem, pequena;
#  4. cena sem gente: "no people appear at any moment".
MOV = {
 "E006": "Dona Benedita, standing in her doorway, raises one hand in a small wave; Dr. Aurélio, standing still on the street, touches the brim of his hat. Both stay exactly where they are. A single leaf drifts down",
 "E007": "no people appear at any moment; only a soft glint of sunlight slides across the blue door and dust floats in the light",
 "E008": "Caio, already in the yard, jumps in place laughing; Marta and Rogério smile and sway gently; clothes on the line move in the breeze. Nobody leaves the frame",
 "E010": "Rogério laughs alone, shoulders shaking; Caio blinks slowly with a blank face. Nobody else appears",
 "E011": "Caio, in the center of the yard, kicks the worn football a short distance and laughs; a little dust rises. He stays in the frame",
 "E017": "her hopeful smile fades slowly into doubt",
 "E018": "Caio, crouched behind Davi, closes his hand around the green toy car and freezes with an innocent face",
 "E025": "small simultaneous movements of the people already in the frame: a laugh, a hand lifting a lid, bunting swaying. Nobody enters or leaves",
 "E026": "Marta stays still in the center, eyes moving left and right; the blurred guests behind her sway slightly in place",
 "E027": "Marta, already standing in the open doorway, leans forward a little, looking into the dark yard; a dog barks far away (no dog visible)",
 "E033": "the pen finishes a line and the old hand tears the small page from the notepad",
 "E036": "the fluorescent light flickers; Marta and Rogério stay seated, Marta lowers her head",
 "E037": "his eyes move left to right as if following poles; light flashes rhythmically across his face (no poles need to be shown)",
 "E040": "all the passengers already in the frame raise their pointing fingers at the same moment and laugh, staying in their seats",
 "E041": "the passengers already in the frame clap; Marta laughs covering her mouth; Davi keeps looking out of the window",
 "E045": "the rue sprig moves in small circles above the boy's head; two leaves fall",
 "E049": "Marta and toddler Davi take a few small steps but stay in the frame; long shadows; the camera stays still",
 "E054": "Marta squeezes Davi's hand; the children already in the frame move slightly in place behind the gate",
 "E056": "Marta slides the folder across the counter; the clerk sighs and lowers his shoulders",
 "E060": "Marta, already inside the room, lightly touches the back of a small chair and smiles",
 "E065": "Davi stays still in his corner; far away the children already in the frame move a little in place; a ball rolls a short distance",
 "E077": "no people appear at any moment; the lit windows flicker softly; the camera stays still",
 "E079": "no people appear at any moment; the golden light slowly grows; a few leaves fall",
 "E081": "Helena, standing in the doorway of the blue door, smiles as warm light grows behind her",
 "E090": "no people appear at any moment; leaves fall slowly; the fountain trickles",
 "E094": "Marta laughs and leans on Rogério's arm; both stay seated; a few leaves fall",
 "E095": "Marta and Rogério, hand in hand, take two small steps but stay in the frame; long shadows; camera still",
 "E098": "Caio and his friends, already in the yard, jump and laugh in place; dust rises. Nobody enters or leaves",
 "E107": "the crowd of children already in the frame jumps and waves happily in place; balloons bob. Nobody new appears",
 "E109": "no people appear at any moment; bunting moves in the wind; the window lights flicker warmly",
 "E114": "the small hands tighten on the wooden bars; a loose balloon string moves in the breeze",
 "E116": "no people appear at any moment; stars twinkle; the windows glow; the camera stays still",
}
ANIM = ("One single continuous shot, no cuts. Handmade stop-motion puppet animation with slightly stepped motion. Action: {mov}. "
        "CAMERA: {camera}. Never pan, never move sideways, never pull back, never reveal anything outside the start frame. "
        "Exactly the same characters as in the start frame — nobody new appears, nobody duplicates, nobody disappears, nobody "
        "leaves the frame. Gentle living details only: dust particles drifting in the light, small fabric movement, soft light "
        "flicker. Keep faces, puppets, set and colors exactly as in the start frame; no mouths talking, no text.")
def camera(cam):
    c = cam.lower()
    if any(k in c for k in ("macro", "close-up", "close up", "extreme")):
        return "static, locked-off"
    return "a very slow, gentle push-in toward the main subject (slight zoom forward only)"
