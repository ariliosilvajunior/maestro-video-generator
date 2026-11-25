"""Estuda um vídeo de referência (transições e movimento de câmera) para o Claude olhar.

    python3 estudar_referencia.py <video> <pasta_saida> [--limiar 0.3]

Gera: cortes.txt (segundo de cada corte detectado pelo ffmpeg) e, para cada corte, uma folha
corte_NN.jpg com 12 quadros (de 1 s antes a 1 s depois, ~6 por segundo) — é ali que se vê o
movimento da câmera entrando e saindo da troca de cena. Também folha_geral.jpg (1 quadro a cada
2 s do vídeo inteiro).
"""
import os, re, subprocess, sys

def rodar(*a):
    return subprocess.run(list(a), capture_output=True, text=True)

def main(video, saida, limiar=0.3):
    os.makedirs(saida, exist_ok=True)
    r = rodar("ffmpeg", "-i", video, "-vf", f"select='gt(scene,{limiar})',showinfo", "-f", "null", "-")
    cortes = [float(t) for t in re.findall(r"pts_time:([\d.]+)", r.stderr)]
    open(os.path.join(saida, "cortes.txt"), "w").write("\n".join(f"{t:.2f}" for t in cortes))
    rodar("ffmpeg", "-y", "-v", "error", "-i", video, "-vf", "fps=1/2,scale=320:-2,tile=8x8:padding=3:color=white",
          "-frames:v", "1", os.path.join(saida, "folha_geral.jpg"))
    for i, t in enumerate(cortes, 1):
        rodar("ffmpeg", "-y", "-v", "error", "-ss", f"{max(t - 1, 0):.2f}", "-t", "2", "-i", video, "-vf",
              "fps=6,scale=400:-2,tile=6x2:padding=3:color=white", "-frames:v", "1", os.path.join(saida, f"corte_{i:02d}.jpg"))
    print(len(cortes), "cortes:", ", ".join(f"{t:.1f}s" for t in cortes))

if __name__ == "__main__":
    lim = float(sys.argv[sys.argv.index("--limiar") + 1]) if "--limiar" in sys.argv else 0.3
    main(sys.argv[1], sys.argv[2], lim)
