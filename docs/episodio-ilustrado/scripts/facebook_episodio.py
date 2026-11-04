"""Versão do Facebook (1920x1080) a partir do vertical do episódio: o vertical inteiro no centro e as laterais com o
próprio vídeo desfocado — nunca faixa preta (dono, 04/11/2026: "isso que você fez não é profissional").
Uso: python3 facebook_episodio.py <vertical.mp4> <saida.mp4>
"""
import subprocess
import sys

ENT, SAI = sys.argv[1], sys.argv[2]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", ENT, "-filter_complex",
                "[0:v]split[a][b];[a]scale=480:270:force_original_aspect_ratio=increase,crop=480:270,boxblur=12:2,"
                "eq=brightness=-0.06:saturation=0.9,scale=1920:1080[bg];[b]scale=-2:1080[fg];[bg][fg]overlay=(W-w)/2:0[o]",
                "-map", "[o]", "-map", "0:a", "-c:v", "libx264", "-crf", "21", "-preset", "veryfast", "-pix_fmt", "yuv420p",
                "-r", "30", "-c:a", "copy", "-movflags", "+faststart", SAI], check=True)
print("ok", SAI)
