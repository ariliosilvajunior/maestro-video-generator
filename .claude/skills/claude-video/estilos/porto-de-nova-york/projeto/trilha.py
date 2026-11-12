#!/usr/bin/env python3
"""Som do motion, todo sintetizado em código (como na referência), preso aos tempos do motor.js.
Piano elétrico em pentatônica de Ré sobre um pad, água batendo no barco, gaivota no pôr do sol,
buzina de navio ao longe no giro, um arpejo de sininhos que sobe com as luzes e o brilho da tocha.
Gera assets/trilha.wav (48 kHz, estéreo, 30 s)."""
import os
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, fftconvolve, sawtooth

SR, DUR = 48000, 30.0
N = int(SR * DUR)
L, R = np.zeros(N), np.zeros(N)       # instrumentos (vão para o reverb)
L2, R2 = np.zeros(N), np.zeros(N)     # ambiente seco (água, cidade)
rng = np.random.default_rng(23)
T = np.arange(N) / SR

# Os mesmos tempos do motor.js
GIRO0, CHEGADA, LUZ0, TOCHA, LUZ1, FIM0 = 10.8, 19.4, 20.2, 23.0, 23.4, 28.7
GAIVOTA = (4.2, 11.2)


def filt(x, f, kind='low', order=2):
    return sosfilt(butter(order, f, kind, fs=SR, output='sos'), x, axis=0)


def add(x, t, g=1.0, pan=0.0, seco=False):
    i = int(t * SR)
    if i >= N or i + len(x) <= 0:
        return
    if i < 0:
        x, i = x[-i:], 0
    x = x[: N - i]
    a = (pan + 1) * np.pi / 4
    gl, gr = np.cos(a) * np.sqrt(2), np.sin(a) * np.sqrt(2)
    l, r = (L2, R2) if seco else (L, R)
    if x.ndim == 1:
        l[i:i + len(x)] += x * g * gl; r[i:i + len(x)] += x * g * gr
    else:
        l[i:i + len(x)] += x[:, 0] * g * gl; r[i:i + len(x)] += x[:, 1] * g * gr


NOTA = {'C': -9, 'C#': -8, 'D': -7, 'D#': -6, 'E': -5, 'F': -4, 'F#': -3, 'G': -2, 'G#': -1, 'A': 0, 'A#': 1, 'B': 2}
def hz(n):
    nome, oit = n[:-1], int(n[-1])
    return 440.0 * 2 ** ((NOTA[nome] + 12 * (oit - 4)) / 12)


def rhodes(f, dur=3.2, vel=1.0):
    """Piano elétrico em FM: o ataque com brilho que vai fechando, a 'lingueta' aguda no início."""
    t = np.arange(int(dur * SR)) / SR
    env = (1 - np.exp(-t / 0.003)) * np.exp(-t / (1.1 + 0.4 * vel))
    idx = 1.6 * vel * np.exp(-t / 0.22) + 0.25
    y = np.sin(2 * np.pi * f * t + idx * np.sin(2 * np.pi * f * t)) * env
    y += 0.12 * vel * np.sin(2 * np.pi * f * 7.0 * t) * np.exp(-t / 0.04)
    y = filt(y, min(6000, f * 9))
    trem = 0.5 + 0.5 * np.sin(2 * np.pi * 4.6 * t)          # o vaivém estéreo do piano elétrico
    return np.stack([y * (0.75 + 0.25 * trem), y * (1.0 - 0.25 * trem)], 1) * vel


def sino(f, dur=2.6, g=1.0):
    """Sininho de parciais inarmônicas (as luzes acendendo)."""
    t = np.arange(int(dur * SR)) / SR
    y = np.zeros_like(t)
    for k, a, d in [(1.0, 1.0, 1.4), (2.0, 0.45, 0.8), (2.76, 0.3, 0.5), (5.4, 0.16, 0.25)]:
        y += a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / d)
    return y * (1 - np.exp(-t / 0.002)) * g


# ── Pad: acordes que trocam com a cena ───────────────────────────
ACORDES = [(0.0, ['D3', 'F#3', 'A3', 'C#4', 'E4']),     # pôr do sol
           (GIRO0, ['B2', 'D3', 'F#3', 'A3', 'C#4']),   # o giro
           (15.0, ['G2', 'B2', 'D3', 'F#3', 'A3']),     # céu e água da mesma cor, a ilha chegando
           (LUZ0, ['D3', 'A3', 'C#4', 'E4', 'F#4'])]    # as luzes: volta para casa, mais aberto
BAIXO = [(0.0, 'D2'), (GIRO0, 'B1'), (15.0, 'G1'), (LUZ0, 'D2')]
pad = np.zeros((N, 2))
for i, (t0, notas) in enumerate(ACORDES):
    t1 = ACORDES[i + 1][0] if i + 1 < len(ACORDES) else DUR
    w = np.clip((T - (t0 - 0.8)) / 1.6, 0, 1) * np.clip(((t1 + 0.8) - T) / 1.6, 0, 1)
    for j, n in enumerate(notas):
        f = hz(n)
        for c, det in enumerate((-0.11, 0.11)):
            ph = rng.random() * 6.28
            pad[:, c] += sawtooth(2 * np.pi * f * (1 + det / 100 * (j + 1)) * T + ph) * w * 0.05
for i, (t0, n) in enumerate(BAIXO):
    t1 = BAIXO[i + 1][0] if i + 1 < len(BAIXO) else DUR
    w = np.clip((T - (t0 - 0.6)) / 1.2, 0, 1) * np.clip(((t1 + 0.6) - T) / 1.2, 0, 1)
    b = (np.sin(2 * np.pi * hz(n) * T) + 0.25 * np.sin(4 * np.pi * hz(n) * T)) * w * 0.16
    pad += b[:, None]
pad = filt(pad, 900, order=4)
pad *= (0.75 + 0.25 * np.sin(2 * np.pi * T / 7.0))[:, None]          # respira devagar
pad *= (1 + 0.35 * np.clip((T - CHEGADA + 0.5) / 1.5, 0, 1) * np.clip((LUZ0 + 0.6 - T) / 1.0, 0, 1))[:, None]  # sobe na chegada
add(pad, 0, 1.0)

# ── A melodia (pentatônica de Ré), poucas notas, como as cordas pinçadas da referência ──
MELODIA = [(1.7, 'A4', .8), (2.5, 'F#4', .6), (3.3, 'E4', .6), (4.6, 'D5', .8), (5.4, 'B4', .6), (6.2, 'A4', .6),
           (7.4, 'F#5', .75), (8.0, 'E5', .55), (8.6, 'D5', .6), (9.6, 'A4', .7),
           (11.0, 'B4', .7), (11.8, 'D5', .6), (12.6, 'F#5', .75), (13.8, 'E5', .55), (14.6, 'D5', .6),
           (15.6, 'B4', .6), (16.4, 'D5', .6), (17.2, 'A5', .7), (18.4, 'F#5', .6),
           (19.4, 'D4', .9), (19.42, 'A4', .6), (19.44, 'F#5', .5),                       # a chegada na Estátua
           (24.6, 'F#5', .6), (25.6, 'E5', .5), (26.4, 'A4', .6), (27.6, 'D5', .6), (28.5, 'D4', .7)]
for k, (t0, n, v) in enumerate(MELODIA):
    add(rhodes(hz(n), vel=v), t0, 0.42, pan=0.25 * np.sin(k * 1.7))

# ── As luzes acendem de baixo para cima: arpejo de sininhos que sobe ──
ARP = ['D5', 'F#5', 'A5', 'C#6', 'E6', 'F#6', 'A6', 'C#7']
for k, n in enumerate(ARP):
    t0 = LUZ0 + 0.15 + k * (TOCHA - LUZ0 - 0.25) / (len(ARP) - 1)
    add(sino(hz(n), g=0.55 - 0.03 * k), t0, 0.16, pan=-0.5 + k / (len(ARP) - 1))
# A tocha: brilho quente que abre
t = np.arange(int(3.2 * SR)) / SR
brilho = np.zeros_like(t)
for n, a in [('D6', 1), ('A6', .7), ('E7', .4), ('F#7', .3)]:
    brilho += a * np.sin(2 * np.pi * hz(n) * t * (1 + 0.002 * np.sin(2 * np.pi * 5 * t)))
brilho *= np.clip(t / 0.35, 0, 1) * np.exp(-np.maximum(t - 0.35, 0) / 1.0)
add(brilho, TOCHA + 0.05, 0.07)
add(sino(hz('D6'), 3.0, 0.8), TOCHA + 0.05, 0.13)

# ── Gaivota: dois gritos enquanto passa pelo sol (vai da direita para a esquerda) ──
def grito(dur=0.42, f0=1450, f1=2050, f2=1250):
    t = np.arange(int(dur * SR)) / SR; u = t / dur
    f = np.where(u < 0.3, f0 + (f1 - f0) * u / 0.3, f1 + (f2 - f1) * (u - 0.3) / 0.7)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
    y *= np.sin(np.pi * u) ** 0.6 * (1 + 0.3 * np.sin(2 * np.pi * 38 * t))
    return filt(filt(y, 900, 'high'), 4200)
for tg, d, g in [(5.5, 0.42, 1), (5.98, 0.18, .7), (8.3, 0.46, .9), (8.82, 0.16, .6)]:
    pan = 0.45 - 0.9 * (tg - GAIVOTA[0]) / (GAIVOTA[1] - GAIVOTA[0])
    add(grito(d), tg, 0.05 * g, pan=pan)

# ── Buzina de navio ao longe, no giro (em Ré, para soar junto com a música) ──
def buzina(f, dur, g=1.0):
    t = np.arange(int(dur * SR)) / SR
    y = sum((1 / k) * np.sin(2 * np.pi * f * k * t * (1 + 0.003 * np.sin(2 * np.pi * 0.8 * t))) for k in range(1, 9))
    y *= np.clip(t / 0.35, 0, 1) * np.clip((dur - t) / 0.9, 0, 1)
    return filt(y, 650, order=3) * g
add(buzina(hz('D2'), 2.6), 12.6, 0.11, pan=-0.35)
add(buzina(hz('A2'), 1.1), 24.3, 0.05, pan=0.6)                   # a balsa, curtinha, à direita

# ── Sino da boia, de leve, na noite ──
def sino_boia(f=hz('A5')):
    t = np.arange(int(2.4 * SR)) / SR
    y = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t / d) for k, a, d in [(1, 1, .9), (2.4, .5, .5), (3.9, .3, .3), (5.2, .2, .2)])
    return y * (1 - np.exp(-t / 0.001))
add(sino_boia(), 25.3, 0.035, pan=-0.4); add(sino_boia(hz('E5')), 27.1, 0.03, pan=0.3)

# ── Ambiente seco: água batendo no casco e, de noite, a cidade ao longe ──
def ruido():
    return rng.standard_normal(N)
agua = filt(filt(ruido(), 260, 'high'), 1500)
lap = np.clip(0.5 + 0.28 * np.sin(2 * np.pi * 0.43 * T + 1) + 0.18 * np.sin(2 * np.pi * 0.91 * T) + 0.12 * np.sin(2 * np.pi * 1.7 * T + 2), 0.05, 1) ** 1.6
agua2 = filt(filt(ruido(), 260, 'high'), 1500)
lap2 = np.clip(0.5 + 0.28 * np.sin(2 * np.pi * 0.37 * T + 2.4) + 0.18 * np.sin(2 * np.pi * 1.07 * T + 1) + 0.12 * np.sin(2 * np.pi * 1.9 * T), 0.05, 1) ** 1.6
L2 += agua * lap * 0.03; R2 += agua2 * lap2 * 0.03
chiado = filt(ruido(), 3000, 'high') * 0.0035
L2 += chiado; R2 += np.roll(chiado, 997)
for tp in np.sort(rng.uniform(0.5, 29.5, 26)):                    # gotas e marolas pequenas
    d = 0.06 + 0.05 * rng.random(); t = np.arange(int(d * SR)) / SR
    f = (900 + 700 * rng.random()) * (1 - 0.45 * t / d)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / (d * 0.35))
    add(y, tp, 0.012, pan=rng.uniform(-0.7, 0.7), seco=True)
cidade = filt(ruido(), 220, order=3) * np.clip((T - LUZ0) / 4.0, 0, 1) * 0.05
L2 += cidade; R2 += np.roll(cidade, 2400)

# ── Reverb: sala grande ao ar livre (ruído que decai), só nos instrumentos ──
ir_t = np.arange(int(2.8 * SR)) / SR
ir = [filt(rng.standard_normal(len(ir_t)), 5000) * np.exp(-ir_t / 0.75) for _ in range(2)]
for x in ir:
    x[: int(0.02 * SR)] = 0; x /= np.sqrt((x ** 2).sum())
rms = lambda x: np.sqrt((x ** 2).mean())
dry = np.stack([L, R], 1)
wet = np.stack([fftconvolve(L, ir[0])[:N], fftconvolve(R, ir[1])[:N]], 1)
wet *= rms(dry) / rms(wet) * 10 ** (-6 / 20)                 # reverb 6 dB abaixo do som direto
amb = np.stack([L2, R2], 1)
amb *= rms(dry) / rms(amb) * 10 ** (-13 / 20)                # água e cidade 13 dB abaixo da música
mix = dry + wet + amb

# ── Mixagem: entra com o véu, sai com o véu ──
mix = filt(mix, 35, 'high')
env = np.clip(T / 3.0, 0, 1) ** 1.5 * np.clip((DUR - T) / (DUR - FIM0), 0, 1) ** 1.2
mix *= env[:, None]
mix *= 10 ** (-16.5 / 20) / rms(mix[int(3 * SR):int(28 * SR)])   # o mesmo volume médio da referência
mix = np.tanh(mix * 1.6) / 1.6
mix *= min(1.0, 0.89 / np.max(np.abs(mix)))
os.makedirs('assets', exist_ok=True)
wavfile.write('assets/trilha.wav', SR, (mix * 32767).astype(np.int16))
print('ok', mix.shape[0] / SR, 's')
