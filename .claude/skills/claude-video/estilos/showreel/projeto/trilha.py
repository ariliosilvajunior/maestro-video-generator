#!/usr/bin/env python3
"""Trilha e efeitos do 13-showreel, sintetizados e presos às batidas do motor.js (120 BPM, batida de 0,5 s).
Introdução só com os quiques da bola; a batida entra quando CLAUDE sobe (3 s); cada golpe do motor tem o seu som;
acorde maior no fecho. Saída: assets/trilha.wav (48 kHz, estéreo), normalizada perto de -14 LUFS."""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR, DUR = 48000, 16.0
N = int(SR * DUR)
L, R = np.zeros(N), np.zeros(N)
rng = np.random.default_rng(13)


def add(sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i + len(sig) <= 0:
        return
    if i < 0:
        sig, i = sig[-i:], 0
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gain * np.cos((pan + 1) * np.pi / 4)
    R[i:i + len(sig)] += sig * gain * np.sin((pan + 1) * np.pi / 4)


def filt(x, f, kind="low", order=2):
    return sosfilt(butter(order, f, kind, fs=SR, output="sos"), x)


def tt(d):
    return np.arange(int(d * SR)) / SR


def env(n, a=0.002, d=0.2):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)


def nota(f):
    return 440.0 * 2 ** ((f - 69) / 12)


# ---------- instrumentos ----------
def bumbo(g=1.0):
    t = tt(0.32)
    f = 48 + 90 * np.exp(-t / 0.03)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.13) * g


def chimbal(d=0.03):
    n = int(0.12 * SR)
    return filt(rng.standard_normal(n), 7500, "high") * env(n, 0.0005, d)


def palma():
    n = int(0.2 * SR)
    x = filt(filt(rng.standard_normal(n), 900, "high"), 3200, "low")
    t = np.arange(n) / SR
    e = sum(np.exp(-np.maximum(t - k * 0.011, 0) / 0.006) * (t >= k * 0.011) for k in range(3)) * 0.6 + np.exp(-t / 0.07) * (t >= 0.022)
    return x * e


def baixo(f, d=0.42):
    t = tt(d)
    x = 2 * (t * f - np.floor(t * f + 0.5))  # dente de serra
    return filt(x, 900, "low", 2) * np.minimum(t / 0.004, 1) * np.exp(-t / 0.22)


def dedilhado(f, d=0.5, brilho=3200):
    """corda pinçada (Karplus-Strong simplificado)"""
    n = int(d * SR)
    p = max(2, int(SR / f))
    buf = filt(rng.standard_normal(p), brilho, "low")
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.5 * (buf[i % p] + buf[(i + 1) % p]) * 0.996
    return out * np.minimum(np.arange(n) / (0.002 * SR), 1)


def toque(f=900, d=0.08, g=1.0):
    """bloco de madeira: o quique da bola"""
    t = tt(0.25)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / d) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / (d * .4))
    return x * g


def sino(f, d=0.9):
    t = tt(d * 2.2)
    return sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t / (d / m ** .5)) for m, a in [(1, 1), (2.4, .45), (4.1, .2), (5.6, .1)])


def whoosh(dur=0.4, f0=400, f1=3500, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n)
    blocos = 20
    for b in range(blocos):
        a, z = b * n // blocos, (b + 1) * n // blocos
        f = f0 * (f1 / f0) ** (b / blocos)
        out[a:z] = filt(filt(x, min(f * 1.7, SR / 2.2), "low"), f / 1.7, "high")[a:z]
    return out * np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 2 * g


def baque(g=1.0, f=55):
    """carimbo: peça preta batendo na grade"""
    t = tt(0.4)
    corpo = np.sin(2 * np.pi * (f + 60 * np.exp(-t / 0.015)) * t) * np.exp(-t / 0.11)
    estalo = filt(rng.standard_normal(len(t)), 2500, "low") * env(len(t), 0.0005, 0.012) * 0.6
    return (corpo + estalo) * g


def rabisco(d=0.26, g=1.0):
    """caneta no papel: ruído em faixa com o tremor da mão"""
    n = int(d * SR)
    t = np.arange(n) / SR
    x = filt(filt(rng.standard_normal(n), 2200, "high"), 6500, "low")
    tremor = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 13 * t + 2 * np.sin(2 * np.pi * 3.1 * t)))
    return x * tremor * np.minimum(t / 0.01, 1) * np.minimum((d - t) / 0.03, 1) * g


def suga(d=0.14, g=1.0):
    """antecipação: ruído que cresce e corta seco"""
    t = tt(d)
    return filt(rng.standard_normal(len(t)), 1800, "low") * (t / d) ** 3 * g


def pop(f0=180, f1=900, d=0.12, g=1.0):
    t = tt(d)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d * .4)) * g


def clique(g=1.0):
    n = int(0.02 * SR)
    return filt(rng.standard_normal(n), 3000, "high") * env(n, 0.0002, 0.003) * g


def acorde(notas, d, g=1.0):
    t = tt(d)
    x = sum(np.sin(2 * np.pi * nota(m) * t + 0.3 * np.sin(2 * np.pi * nota(m) * 2 * t)) for m in notas) / len(notas)
    return filt(x, 2600, "low") * np.minimum(t / 0.03, 1) * np.exp(-t / (d * .5)) * g


# ---------- música: entra com CLAUDE (3 s), compasso de 2 s ----------
RAIZ = {1: 45, 2: 41, 3: 48, 4: 43, 5: 45, 6: 41, 7: 48, 8: 43}  # Lá menor, Fá, Dó, Sol (MIDI)
for k in range(6, 30):  # batidas de 3,0 s até 14,5 s
    tb = k * 0.5
    bar = int(tb // 2) + 1
    add(bumbo(), tb, 0.85)
    add(chimbal(), tb + 0.25, 0.16, pan=0.3)
    if k % 2 == 1:
        add(palma(), tb, 0.22, pan=-0.1)
    add(baixo(nota(RAIZ[bar])), tb, 0.22)
    if 10 <= k < 22:  # dezesseis avos no meio do filme
        add(chimbal(0.012), tb + 0.125, 0.07, pan=-0.3)
        add(chimbal(0.012), tb + 0.375, 0.07, pan=0.35)

# introdução: zumbido suave e os quiques
t0 = tt(3.0)
drone = (np.sin(2 * np.pi * nota(57) * t0) + 0.5 * np.sin(2 * np.pi * nota(64) * t0)) * np.minimum(t0 / 1.2, 1) * np.clip((3.0 - t0) / 0.3, 0, 1)
add(filt(drone, 1200), 0.0, 0.05)
for tc, f, g in [(.75, 980, .7), (1.25, 1100, .55), (1.65, 1240, .45), (1.95, 1400, .38)]:
    add(toque(f), tc, g, pan=(tc - 1.2) * .6)
add(pop(300, 1400, .2), 2.0, .25, pan=.5)          # salto para o canto
add(pop(120, 520, .25), 2.32, .45, pan=.5)         # o círculo cresce
add(suga(.15), 2.75, .35, pan=.5)                  # encolhe antes de estourar
add(sino(nota(81), .6), 2.9, .18, pan=.5)          # a faísca
add(whoosh(.35, 1500, 9000), 2.9, .25, pan=.5)

# 02 · identidade
add(whoosh(.32, 200, 2600), 2.78, .55)             # CLAUDE sobe
add(baque(.9, 48), 3.06, .8)
add(whoosh(.18, 800, 6000), 3.5, .5, pan=-.2)      # fatia
add(clique(1), 3.84, .7); add(clique(1), 3.88, .4)
add(whoosh(.3, 3000, 600), 4.55, .55, pan=-.5)     # sai para a esquerda
add(whoosh(.35, 600, 2400), 4.75, .3, pan=-.2)     # o ponto desce para a pista

# 03 · curvas
t = tt(1.0)
glide = np.sin(2 * np.pi * np.cumsum(330 + 330 * t ** 2) / SR) * np.minimum(t / .02, 1) * .5
add(filt(glide, 2500), 5.5, .1)
for k in range(1, 10):
    add(clique(.5), 5.5 + k * .1, .25, pan=-.6 + k * .12)
add(sino(nota(76), .5), 6.5, .2)
for i in range(5):
    add(toque(700 + i * 90, .05), 5.2 + [0, 2, 3, 4, 5][i] * .05, .25, pan=-.4)
add(whoosh(.3, 500, 4000), 7.2, .5, pan=.6)        # bolas disparam
add(whoosh(.2, 2500, 700), 7.25, .3)               # ponto vai ao centro

# 04 · forma
add(pop(110, 500, .3), 7.48, .5)
for tm, f in [(8.0, 72), (8.5, 76), (9.0, 79)]:
    add(suga(.14), tm - .14, .45)
    add(pop(220, 1100, .14), tm, .45)
    add(dedilhado(nota(f), .6), tm, .35)
add(whoosh(.3, 400, 5000), 9.22, .5)

# 05 · padrões: brilho que nasce do ponto e três ondas de catraca
t = tt(.6)
add(filt(rng.standard_normal(len(t)), 4000, "high") * np.sin(np.pi * t / .6) ** 2, 9.4, .12)
for w, (to, sentido) in enumerate([(9.95, 1), (10.45, 0), (10.95, -1)]):
    for k in range(14):
        add(clique(.8), to + k * .03 + .05, .3, pan=(-.8 + k * .12) * (sentido if sentido else 1))
    add(dedilhado(nota([69, 72, 76][w]), .5, 5000), to, .3)
add(whoosh(.35, 4000, 500), 11.12, .4)

# 06 · letra: a melodia das letras
add(whoosh(.3, 300, 3000), 11.4, .4)
mel0 = [64, 69, 67, 71, 62, 69]
mel1 = [72, 64, 71, 67, 69, 62]
for i in range(6):
    add(dedilhado(nota(mel0[i]), .45), 11.55 + i * .04, .3, pan=-.5 + i * .2)
    add(dedilhado(nota(mel1[i]), .45), 11.95 + i * .03, .26, pan=-.5 + i * .2)
add(acorde([57, 64, 69, 72], .8), 12.3, .35)
add(toque(1300, .06), 12.38, .5, pan=.6)            # o ponto final cai
add(whoosh(.3, 2500, 500), 12.88, .45, pan=-.4)

# 07 · fim: carimbos, deslizes e a assinatura
for i, ts in enumerate([13.0, 13.06, 13.12]):
    add(baque(.75, 50 + i * 6), ts, .75, pan=[-.4, .4, .3][i])
for tm, fim in [(13.5, 13.86), (14.0, 14.36)]:
    add(whoosh(.36, 300, 1200, .8), tm, .5)
    add(baque(.4, 70), fim, .55)
add(whoosh(.35, 3000, 400), 14.25, .55, pan=-.6)
add(sino(nota(81), .9), 14.35, .2, pan=-.6)
add(whoosh(.3, 200, 2600), 14.42, .45)
add(toque(1200, .07), 14.72, .55, pan=.4)
add(acorde([57, 61, 64, 69, 76], 2.4), 14.7, .5)    # Lá maior: resolve
for k in range(12):
    add(clique(.6), 15.0 + k * .03, .18, pan=-.3 + k * .05)

# caneta: cada anotação tem seu rabisco
for t0, d in [(.8, .26), (.95, .26), (1.45, .26), (3.98, .26), (6.55, .26), (6.86, .16), (6.78, .26), (7.0, .18), (7.8, .26), (10.05, .26), (11.95, .26), (15.15, .34)]:
    add(rabisco(d), t0, .16, pan=.2)

# ---------- mixagem ----------
fade = np.clip((DUR - np.arange(N) / SR) / 0.4, 0, 1)
L *= fade; R *= fade
mix = np.stack([L, R], 1)
mix = np.tanh(mix * 1.3) / np.tanh(1.3)            # cola suave
rms = np.sqrt(np.mean(mix[int(3 * SR):int(14.5 * SR)] ** 2))
mix *= 10 ** (-15.5 / 20) / max(rms, 1e-9)
mix *= min(1.0, 10 ** (-1 / 20) / np.max(np.abs(mix)))
os.makedirs("assets", exist_ok=True)
wavfile.write("assets/trilha.wav", SR, (mix * 32767).astype(np.int16))
print("ok assets/trilha.wav", round(float(np.max(np.abs(mix))), 3))
