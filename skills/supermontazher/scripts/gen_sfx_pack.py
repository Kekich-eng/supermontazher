"""Большая библиотека своих звуков (синтез, без чужих прав, можно распространять вместе с плагином).

Запуск из папки remotion: python gen_sfx_pack.py [папка]   (по умолчанию public/sfx)
Детерминированно: один и тот же файл при каждом запуске. Шесть первых звуков (pop, whoosh, ding, tick, swap, alert)
делает gen_sfx.py, здесь они не трогаются. Каталог с задачами звуков: references/sfx-library.md.
Рядом пишется sfx_demo.wav (все звуки подряд) и sfx_demo.txt (таймкоды) для прослушивания.
"""
import os
import sys
import wave

import numpy as np

SR = 48000
OUT = sys.argv[1] if len(sys.argv) > 1 else "public/sfx"
rng = np.random.default_rng(20261030)
LIB = []  # (группа, имя, что это)


def T(sec):
    return np.arange(int(sec * SR)) / SR


def noise(sec):
    return rng.standard_normal(int(sec * SR))


def band(x, lo=0.0, hi=None, order=2):
    """мягкий фильтр через спектр: срез ниже lo и выше hi"""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-6
    g = np.ones_like(f)
    if lo:
        g *= 1 / np.sqrt(1 + (lo / f) ** (2 * order))
    if hi:
        g *= 1 / np.sqrt(1 + (f / hi) ** (2 * order))
    return np.fft.irfft(X * g, len(x))


def moving(x, fc, q=1.5):
    """полосовой фильтр с бегущей частотой: fc — кривая частоты длиной с x (вжухи и подъёмы)"""
    N, hop = 2048, 512
    out = np.zeros(len(x) + N)
    win = np.hanning(N)
    f = np.fft.rfftfreq(N, 1 / SR) + 1e-6
    for i in range(0, len(x) - N, hop):
        c = fc[min(i + N // 2, len(fc) - 1)]
        g = np.exp(-(np.log(f / c) * q) ** 2)
        out[i:i + N] += np.fft.irfft(np.fft.rfft(x[i:i + N] * win) * g, N) * win
    return out[:len(x)]


def sweep(f0, f1, sec, curve=1.0):
    x = T(sec) / sec
    f = f0 * (f1 / f0) ** (x ** curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def saw(fr, x):
    p = (np.cumsum(fr) / SR) % 1 if np.ndim(fr) else (x * fr) % 1
    return band(2 * p - 1, 0, 6000)


def conv(a, b):
    n = len(a) + len(b) - 1
    return np.fft.irfft(np.fft.rfft(a, n) * np.fft.rfft(b, n), n)


def verb(x, sec=1.2, mix=0.25, hi=5000, lo=150):
    """простая реверберация: затухающий шум, разный на левый и правый канал -> стерео"""
    if x.ndim > 1:
        x = x.mean(axis=1)
    t = T(sec)
    out = []
    for _ in range(2):
        ir = band(rng.standard_normal(len(t)), lo, hi) * np.exp(-t * 6.9 / sec)
        ir /= np.sqrt((ir ** 2).sum()) + 1e-9
        out.append(conv(x, ir))
    wet = np.stack(out, 1)
    wet /= np.abs(wet).max() + 1e-9
    dry = np.zeros_like(wet)
    dry[:len(x), 0] = dry[:len(x), 1] = x / (np.abs(x).max() + 1e-9)
    return dry * (1 - mix) + wet * mix


def pan(x, a, b):
    """проход слева направо: a, b от -1 до 1"""
    if x.ndim > 1:
        x = x.mean(axis=1)
    p = np.linspace(a, b, len(x))
    return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], 1)


def add(group, name, what, x, peak=0.6):
    x = np.asarray(x, np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    x = x / (np.abs(x).max() + 1e-9) * peak
    f = min(int(0.003 * SR), len(x) // 4)
    x[:f] *= np.linspace(0, 1, f)[:, None]
    f = min(int(0.012 * SR), len(x) // 4)
    x[-f:] *= np.linspace(1, 0, f)[:, None]
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    LIB.append((group, name, what, x))


def layer(*items):
    n = max(len(a) for a in items)
    out = np.zeros(n)
    for a in items:
        out[:len(a)] += a
    return out


def at(x, sec, total):
    out = np.zeros(int(total * SR))
    i = int(sec * SR)
    n = min(len(x), len(out) - i)
    out[i:i + n] = x[:n]
    return out


# ── удары ───────────────────────────────────────────────────────────────
G = "удары"
x = T(1.6)
sub = sweep(130, 34, 1.6, 0.35) * np.exp(-x * 3.2)
click = band(noise(0.03), 0, 2500) * np.exp(-T(0.03) * 120)
add(G, "hit_sub", "глубокий кинематографичный удар: главные моменты", verb(layer(sub, click * 0.5), 1.4, 0.22, 2500), 0.75)

x = T(0.9)
body = sweep(170, 48, 0.9, 0.3) * np.exp(-x * 7)
crack = band(noise(0.12), 700, 6000) * np.exp(-T(0.12) * 38)
add(G, "hit_hard", "жёсткий удар с треском: штамп, вылет заголовка", verb(layer(body, crack * 0.8), 0.7, 0.18), 0.75)

x = T(2.0)
partials = sum(np.sin(2 * np.pi * f * x) * np.exp(-x * d) * g for f, d, g in
               [(311, 3, 1), (523, 4, .8), (887, 5, .6), (1413, 7, .45), (2210, 9, .3), (3187, 12, .2)])
add(G, "hit_metal", "металлический удар со звоном: щелчок замка, важная цифра", verb(layer(partials * 0.5, sweep(120, 45, 0.4) * np.exp(-T(0.4) * 12)), 1.5, 0.3), 0.6)

x = T(0.35)
add(G, "hit_soft", "мягкий глухой толчок: приземление карточки", band(sweep(120, 55, 0.35, 0.4) * np.exp(-x * 16), 0, 700), 0.65)

x = T(0.3)
add(G, "hit_snare", "сухой щелчок-малый барабан: ритмичные появления", layer(np.sin(2 * np.pi * 190 * x) * np.exp(-x * 26) * 0.7, band(noise(0.3), 1400, 9000) * np.exp(-x * 22)), 0.6)

x = T(0.45)
add(G, "stamp", "штамп по бумаге: «ТАК СЕБЕ», «БЕСПЛАТНО»", layer(np.sin(2 * np.pi * 72 * x) * np.exp(-x * 13), band(noise(0.45), 200, 1400) * np.exp(-x * 30) * 0.8, band(noise(0.45), 2500, 9000) * np.exp(-x * 45) * 0.25), 0.7)

x = T(1.5)
chord = sum(np.sin(2 * np.pi * f * x + i) for i, f in enumerate([110, 165, 220, 277.2, 330]))
add(G, "chord_hit", "тёплый аккорд-удар: открытие, вдохновляющий момент", verb(band(chord, 0, 1800) * np.exp(-x * 2.6), 1.4, 0.35, 3000), 0.55)

# ── вжухи ───────────────────────────────────────────────────────────────
G = "вжухи"


def whoosh(sec, f0, f1, q=1.4, hard=0.5):
    x = T(sec) / sec
    fc = f0 * (f1 / f0) ** np.sin(np.pi * x)
    env = np.sin(np.pi * x ** hard) ** 2
    return moving(noise(sec + 0.1), np.concatenate([fc, np.full(int(0.1 * SR), f0)]), q)[:len(x)] * env


add(G, "whoosh_fast", "короткий резкий: быстрая смена сцены", whoosh(0.26, 500, 3500), 0.5)
add(G, "whoosh_mid", "средний: вылет окна", pan(whoosh(0.55, 350, 2600), -0.5, 0.5), 0.5)
add(G, "whoosh_long", "длинный пролёт камеры", pan(whoosh(1.1, 220, 1800, 1.2, 0.8), -0.8, 0.8), 0.5)
add(G, "whoosh_deep", "низкий тяжёлый: крупный объект пролетает мимо", band(whoosh(0.8, 90, 600, 1.0), 0, 1200), 0.6)
add(G, "swish", "тонкий воздушный взмах: линии, нити, подписи", band(whoosh(0.3, 2500, 8000, 1.8), 1500), 0.32)
add(G, "swish_pan", "взмах слева направо: шторка", pan(band(whoosh(0.4, 1500, 6000, 1.6), 800), -1, 1), 0.4)
x = T(0.8) / 0.8
add(G, "whoosh_in", "нарастающий вжух, обрывается на ударе: вход перед ударом", moving(noise(0.9), 200 * (6000 / 200) ** (x ** 2.2), 1.3)[:len(x)] * x ** 2.5, 0.55)

# ── подъёмы и спады ─────────────────────────────────────────────────────
G = "подъёмы"


def riser(sec):
    x = T(sec) / sec
    nz = moving(noise(sec + 0.1), np.concatenate([300 * (9000 / 300) ** (x ** 1.8), np.full(int(0.1 * SR), 9000)]), 1.2)[:len(x)]
    fr = 90 * (720 / 90) ** (x ** 1.6)
    tone = saw(fr, x) * (0.6 + 0.4 * np.sin(2 * np.pi * np.cumsum(3 + 26 * x ** 2) / SR))
    return (nz * 0.7 + tone * 0.35) * x ** 1.8


add(G, "riser_short", "подъём 1,5 с: перед ударом", verb(riser(1.5), 0.5, 0.15), 0.55)
add(G, "riser_long", "подъём 3,5 с: разгон к кульминации", verb(riser(3.5), 0.6, 0.15), 0.55)
x = T(1.2)
add(G, "reverse_hit", "обратный удар: втягивание в следующую сцену", verb(partials[:len(x)] * np.exp(-x * 1.5), 1.1, 0.5)[::-1], 0.55)
x = T(1.5)
add(G, "downlifter", "спад 1,5 с: после удара, сцена гаснет", moving(noise(1.6), np.concatenate([5000 * (160 / 5000) ** (x / 1.5), np.full(int(0.1 * SR), 160)]), 1.2)[:len(x)] * np.exp(-x * 2.4), 0.5)
add(G, "sub_drop", "падение баса: провал перед кульминацией", verb(sweep(95, 26, 1.5, 0.7) * np.exp(-x * 1.6), 0.8, 0.12, 900), 0.75)
x = T(1.0)
fall = 240 * (28 / 240) ** (x ** 1.5)
add(G, "tape_stop", "торможение плёнки: «стоп», всё останавливается", band(saw(fall, x) + 0.6 * saw(fall * 1.5, x), 0, 2400) * (1 - x) ** 0.7, 0.5)
x = T(4.0)
pad = sum(np.sin(2 * np.pi * f * x + 2 * np.sin(2 * np.pi * r * x)) for f, r in [(55, .1), (82.4, .13), (110, .07), (164.8, .17)])
add(G, "drone_low", "низкий гул 4 с: тишина перед главным", band(pad, 0, 500) * np.minimum(x / 1.2, 1) * np.minimum((4 - x) / 1.2, 1), 0.45)

# ── интерфейс ───────────────────────────────────────────────────────────
G = "интерфейс"
x = T(0.05)
add(G, "click_soft", "мягкий клик: кнопка", np.sin(2 * np.pi * 900 * x) * np.exp(-x * 150), 0.32)
x = T(0.04)
add(G, "click_hard", "твёрдый клик мышью: курсор нажал", layer(band(noise(0.04), 1500, 8000) * np.exp(-x * 260), np.sin(2 * np.pi * 2300 * x) * np.exp(-x * 200) * 0.5), 0.45)
x = T(0.12)
add(G, "toggle", "переключатель: включилось", layer(at(np.sin(2 * np.pi * 800 * x[:1800]) * np.exp(-x[:1800] * 120), 0, 0.12), at(np.sin(2 * np.pi * 1300 * x[:1800]) * np.exp(-x[:1800] * 120), 0.05, 0.12)), 0.35)
x = T(0.07)
add(G, "hover", "лёгкое наведение: подсветка строки", sweep(1300, 1700, 0.07) * np.sin(np.pi * x / 0.07) ** 2, 0.18)


def key(seed_gain=1.0):
    x = T(0.05)
    return layer(band(noise(0.05), 900, 5000) * np.exp(-x * 210), np.sin(2 * np.pi * rng.uniform(230, 320) * x) * np.exp(-x * 120) * 0.6) * seed_gain


add(G, "key", "одна клавиша", key(), 0.4)
tt, seq = 0.0, np.zeros(int(1.4 * SR))
while tt < 1.3:
    seq += at(key(rng.uniform(0.6, 1)), tt, 1.4)
    tt += rng.uniform(0.07, 0.15)
add(G, "typing", "печать 1,4 с: команда в терминале", seq, 0.42)
add(G, "enter", "Enter: команда запущена", verb(layer(key(1.2), np.sin(2 * np.pi * 140 * T(0.09)) * np.exp(-T(0.09) * 50)), 0.3, 0.12), 0.5)
x = T(0.9)
add(G, "notify", "уведомление: два мягких тона", verb(layer(at(np.sin(2 * np.pi * 880 * x[:9000]) * np.exp(-x[:9000] * 11), 0, 0.9), at(np.sin(2 * np.pi * 1318.5 * x[:16000]) * np.exp(-x[:16000] * 7), 0.11, 0.9)), 0.6, 0.25), 0.4)
notes = [523.25, 659.25, 783.99, 1046.5]
add(G, "success", "успех: восходящая фраза, галочка", verb(sum(at(np.sin(2 * np.pi * f * T(0.5)) * np.exp(-T(0.5) * 8), i * 0.075, 1.0) for i, f in enumerate(notes)), 0.8, 0.28), 0.42)
x = T(0.34)
buzz = np.sign(np.sin(2 * np.pi * 110 * x)) * 0.5 + np.sin(2 * np.pi * 116 * x)
add(G, "error", "ошибка: глухой отказ", band(buzz, 0, 1400) * (np.sin(2 * np.pi * 6 * x) > -0.4) * np.exp(-x * 4), 0.42)
gaps = 0.14 * 0.91 ** np.arange(28)
tt, seq = 0.0, np.zeros(int(1.5 * SR))
for i, g in enumerate(gaps):
    if tt > 1.4:
        break
    y = T(0.03)
    seq += at(np.sin(2 * np.pi * (1500 + i * 30) * y) * np.exp(-y * 180), tt, 1.5)
    tt += g
add(G, "counter", "счётчик набегает и ускоряется 1,5 с", seq, 0.32)

# ── глитч и цифра ───────────────────────────────────────────────────────
G = "глитч"


def gl(sec, step, tones):
    out = []
    while sum(len(o) for o in out) < sec * SR:
        n = int(rng.uniform(*step) * SR)
        y = np.arange(n) / SR
        kind = rng.integers(3)
        if kind == 0:
            c = np.sign(np.sin(2 * np.pi * rng.choice(tones) * y))
        elif kind == 1:
            c = rng.standard_normal(n)
        else:
            c = np.round(np.sin(2 * np.pi * rng.choice(tones) * y) * 3) / 3
        out.append(c * rng.uniform(0.3, 1) * (rng.random() > 0.2))
    return np.concatenate(out)


add(G, "glitch_short", "короткий сбой 0,25 с: глитч-заголовок", band(gl(0.25, (0.008, 0.03), [220, 440, 880, 1760, 3520]), 80, 9000), 0.42)
add(G, "glitch_long", "длинный сбой 0,8 с: разрыв, ошибка таймлайна", band(gl(0.8, (0.01, 0.06), [110, 330, 660, 1320, 2640]), 80, 9000), 0.42)
x = T(0.4)
add(G, "static", "помехи: экран моргнул", band(noise(0.4), 600, 9000) * (rng.random(len(x)) > 0.25) * np.exp(-x * 7), 0.3)
n, seq = 0, []
while n < 0.9 * SR:
    k = int(rng.uniform(0.03, 0.07) * SR)
    seq.append(np.sign(np.sin(2 * np.pi * rng.choice([1200, 1600, 2000, 2400, 3200]) * np.arange(k) / SR)) * np.sin(np.pi * np.arange(k) / k))
    n += k
add(G, "data", "данные бегут 0,9 с: компьютер думает", band(np.concatenate(seq), 0, 7000), 0.2)
x = T(0.9)
add(G, "powerup", "включение: система ожила", verb(sweep(70, 1400, 0.9, 1.6) * np.minimum(x * 8, 1) * (0.7 + 0.3 * np.sin(2 * np.pi * 34 * x)), 0.5, 0.2), 0.42)
add(G, "powerdown", "выключение: всё гаснет", verb(sweep(1100, 40, 0.9, 0.6) * (1 - x / 0.9) ** 1.2, 0.4, 0.2), 0.42)

# ── искры и вещи ────────────────────────────────────────────────────────
G = "искры и вещи"
x = T(1.6)
sh = np.zeros(len(x))
for _ in range(70):
    f, st = rng.uniform(2500, 9000), rng.uniform(0, 1.1)
    y = T(0.45)
    sh += at(np.sin(2 * np.pi * f * y) * np.exp(-y * 14) * rng.uniform(0.2, 1), st, 1.6)
add(G, "shimmer", "мерцание 1,6 с: волшебство, появление героя", verb(sh * np.minimum(x * 3, 1), 1.0, 0.45, 9000, 1500), 0.28)
sh = np.zeros(len(x))
for i in range(36):
    f = 1600 * 2 ** (i / 12)
    y = T(0.3)
    sh += at(np.sin(2 * np.pi * f * y) * np.exp(-y * 18), i * 0.03, 1.6)
add(G, "sparkle_up", "искры вверх: что-то стало лучше", verb(sh, 0.9, 0.35, 10000, 1200), 0.3)
x = T(2.2)
add(G, "bell_soft", "мягкий колокол: тихий важный момент", verb(sum(np.sin(2 * np.pi * f * x) * np.exp(-x * d) * g for f, d, g in [(659.25, 2.2, 1), (1318.5, 3.4, .35), (1977, 5, .15), (2637, 7, .08)]), 1.6, 0.35), 0.38)
snip = lambda: layer(band(noise(0.07), 2500, 9000) * np.exp(-T(0.07) * 70), np.sin(2 * np.pi * 3400 * T(0.05)) * np.exp(-T(0.05) * 130) * 0.5)
add(G, "scissors", "ножницы: вырезали кусок", layer(at(snip(), 0, 0.35), at(snip(), 0.15, 0.35)), 0.42)
x = T(0.5)
add(G, "paper", "лист бумаги: страница журнала", band(noise(0.5), 800, 7000) * np.sin(np.pi * x / 0.5) ** 3 * (0.6 + 0.4 * np.sin(2 * np.pi * 21 * x)), 0.3)
sh1 = layer(band(noise(0.05), 1200, 7000) * np.exp(-T(0.05) * 150), np.sin(2 * np.pi * 180 * T(0.05)) * np.exp(-T(0.05) * 80) * 0.7)
add(G, "shutter", "затвор камеры: снят кадр", layer(at(sh1, 0, 0.25), at(sh1 * 0.7, 0.085, 0.25)), 0.45)
y = T(0.09)
add(G, "lock_in", "защёлка: сцена встала на место", verb(layer(at(band(noise(0.015), 2000, 9000) * np.exp(-T(0.015) * 400), 0, 0.2),
                                                             at(layer(np.sin(2 * np.pi * 95 * y) * np.exp(-y * 40), band(noise(0.09), 700, 4000) * np.exp(-y * 120) * 0.8), 0.028, 0.2)), 0.25, 0.1), 0.6)
y = T(0.06)
add(G, "snap", "короткий сухой щелчок: нить натянулась", layer(band(noise(0.06), 3000, 11000) * np.exp(-y * 300), np.sin(2 * np.pi * 1900 * y) * np.exp(-y * 240) * 0.4), 0.42)

# ── демо для прослушивания ──────────────────────────────────────────────
gap = np.zeros((int(0.7 * SR), 2))
parts, lines, tt = [], [], 0.0
group = None
for g, name, what, x in LIB:
    if g != group:
        group = g
        lines.append(f"\n{g.upper()}")
    lines.append(f"{int(tt // 60)}:{tt % 60:05.2f}  {name}  {what}")
    parts += [x, gap]
    tt += (len(x) + len(gap)) / SR
demo = np.concatenate(parts)
with wave.open(os.path.join(OUT, "..", "sfx_demo.wav"), "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(demo, -1, 1) * 32767).astype(np.int16).tobytes())
open(os.path.join(OUT, "..", "sfx_demo.txt"), "w", encoding="utf-8").write("\n".join(lines).strip() + "\n")
print(len(LIB), "звуков,", round(tt), "с демо")
