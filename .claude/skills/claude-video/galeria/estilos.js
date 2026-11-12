// Todos os estilos da galeria. id = a pasta em estilos/. familia agrupa os tiles. media = tem vídeo "com mídia real".
// Cada vídeo fica em galeria/videos/<id>.mp4 (cópia leve do original, que vive em estilos/<id>/).
window.ESTILOS = [
  // Apps com cursor de IA
  { id: 'editor-ia',           nome: 'Editor com cursor de IA',        familia: 'Apps com cursor de IA',  chamada: 'Uma IA edita o vídeo dentro do editor e o vídeo toma a tela', duracao: 18,   formato: '16:9', media: false },
  { id: 'app-de-design',       nome: 'App de design com cursor de IA', familia: 'Apps com cursor de IA',  chamada: 'O cursor monta uma thumbnail num app de design',            duracao: 15,   formato: '16:9', media: false },
  { id: 'app-de-motion',       nome: 'App de motion com cursor de IA', familia: 'Apps com cursor de IA',  chamada: 'Curvas e keyframes mexidos por uma IA',                      duracao: 16,   formato: '16:9', media: false },
  // Cenas e paisagens
  { id: 'aviao-em-codigo',     nome: 'Avião em código',                familia: 'Cenas e paisagens',      chamada: 'Um avião 3D feito só com código vira ilustração e decola',  duracao: 22,   formato: '16:9', media: false },
  { id: 'festival-da-lua',     nome: 'Festival da lua',                familia: 'Cenas e paisagens',      chamada: 'Nanquim e pincel seco; o desenho vira foto e anoitece',       duracao: 28,   formato: '16:9', media: false },
  { id: 'porto-de-nova-york',  nome: 'Porto de Nova York',             familia: 'Cenas e paisagens',      chamada: 'Pôr do sol, barco e as luzes acendendo de baixo pra cima',   duracao: 30,   formato: '16:9', media: false },
  { id: 'barco-e-montanha',    nome: 'Barco e montanha',               familia: 'Cenas e paisagens',      chamada: 'Camadas de papel, barco e montanha, versão premium',         duracao: 16,   formato: '16:9', media: false },
  // Lápis, giz e caneta
  { id: 'dirigivel-a-lapis',   nome: 'Dirigível a lápis',              familia: 'Lápis, giz e caneta',    chamada: 'Mascote em expedição a lápis que vira pintura de pôr do sol', duracao: 28.6, formato: '1:1',  media: false },
  { id: 'giz-de-cera',         nome: 'Giz de cera',                    familia: 'Lápis, giz e caneta',    chamada: 'Giz e canetinha no papel-cartão',                            duracao: 5,    formato: '16:9', media: false, loop: true },
  { id: 'rabisco-de-caneta',   nome: 'Rabisco de caneta',              familia: 'Lápis, giz e caneta',    chamada: 'Rabiscos de esferográfica na margem do caderno',             duracao: 5,    formato: '16:9', media: false, loop: true },
  { id: 'sessao-na-mesa',      nome: 'Sessão na mesa',                 familia: 'Lápis, giz e caneta',    chamada: 'O dia com o agente, em papel e aquarela',                    duracao: 58.7, formato: '16:9', media: false },
  // Tipografia e filme
  { id: 'showreel',            nome: 'Showreel em fundo claro',        familia: 'Tipografia e filme',     chamada: 'Pôster suíço que dança no compasso, sete capítulos',         duracao: 16,   formato: '16:9', media: false },
  { id: 'documento-vira-video',nome: 'Documento vira vídeo',           familia: 'Tipografia e filme',     chamada: 'O ponto final é um portal; a volta é vídeo',                 duracao: 32,   formato: '16:9', media: false },
  // Pôster e papel
  { id: 'poster-suico', nome: 'Pôster suíço em grade', familia: 'Pôster e papel', chamada: 'Pôster branco e preto; a palavra troca como esteira e o ponto vermelho salta', duracao: 9, formato: '16:9', media: false, loop: true },
  { id: 'grafico-de-jornal', nome: 'Gráfico de jornal', familia: 'Pôster e papel', chamada: 'Papel salmão; uma barra fica azul, dispara e sobe pro 1º lugar', duracao: 10, formato: '16:9', media: false, loop: true },
  // Interface e diagrama
  { id: 'diagrama-azul-marinho', nome: 'Diagrama azul-marinho', familia: 'Interface e diagrama', chamada: 'Fluxo de 5 nós que se constrói com um pulso azul percorrendo os fios', duracao: 12, formato: '16:9', media: false, loop: true },
  { id: 'folha-de-projeto', nome: 'Folha de projeto', familia: 'Interface e diagrama', chamada: 'Desenho técnico que se traça, explode em peças e pinta a que importa de amarelo', duracao: 12, formato: '16:9', media: false, loop: true },
  { id: 'interface-escura-3d', nome: 'Interface escura em 3D', familia: 'Interface e diagrama', chamada: 'App escuro visto por uma câmera 3D lenta; cursor verde risca a fila da semana', duracao: 12, formato: '16:9', media: false, loop: true },
  // Pôster e papel
  { id: 'livro-pop-up', nome: 'Livro pop-up de papel', familia: 'Pôster e papel', chamada: 'Folhas de papel recortado pousam uma a uma; a pilha respira e se desmonta', duracao: 12, formato: '16:9', media: false, loop: true },
  { id: 'cartaz-risografia', nome: 'Cartazes em risografia', familia: 'Pôster e papel', chamada: 'Duas tintas fora de registro carimbando no compasso de 120 BPM', duracao: 12, formato: '16:9', media: false, loop: true },
  { id: 'cartaz-gritado', nome: 'Cartaz gritado', familia: 'Pôster e papel', chamada: 'Amarelo e preto; uma palavra gigante por batida, cortes secos, contagem 3 2 1', duracao: 12, formato: '16:9', media: false, loop: true },
];
