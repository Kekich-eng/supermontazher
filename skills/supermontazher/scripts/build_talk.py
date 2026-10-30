"""Черновой монтаж разговорной части: убирает паузы, дубли и оговорки.

Вход:  words.json (слова с таймкодами), full.wav (звук 44100 Гц)
Выход: cut.wav (смонтированный звук), select.txt (фильтр для видео), map.json (карта склеек)
Субтитры после этого делает subs.py.
Запуск: python build.py
"""
import json
import re
import wave

import numpy as np

FPS = 30
SR = 44100
SPF = SR // FPS            # отсчётов звука на кадр — целое, поэтому звук и видео не разъезжаются
SILENCE_DB = -45           # тише этого — пауза
MIN_SILENCE = 0.45         # паузы короче не трогаем
PAD = 0.16                 # сколько тишины оставлять по краям фразы
FADE = int(0.008 * SR)     # микрозатухание на склейке, чтобы не щёлкало

W = json.load(open("words.json", encoding="utf-8"))


def rng(a, b):
    return list(range(a, b + 1))


# --- Что вырезаем: номера слов из words.json (их печатает verify.py или transcribe.py) ---
# Примеры: rng(376, 384) — первый дубль фразы; [0] — «Привет» в начале.
REMOVE = set(
    []
)

# --- 1. Где звучит речь ------------------------------------------------------
with wave.open("full.wav") as wf:
    assert wf.getframerate() == SR
    ch = wf.getnchannels()
    audio = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32)
total = len(audio) / SR

# Тишину ищем по средней громкости (RMS) окнами по 50 мс, а не по пикам:
# щелчки и шорохи между фразами дают пики, но речью не являются.
WIN = SR // 20
mono = audio.mean(axis=1) / 32768
nwin = len(mono) // WIN
rms = 20 * np.log10(np.sqrt((mono[: nwin * WIN].reshape(nwin, WIN) ** 2).mean(axis=1)) + 1e-9)
quiet = rms < SILENCE_DB
sil = []
i = 0
while i < nwin:
    if quiet[i]:
        j = i
        while j < nwin and quiet[j]:
            j += 1
        if (j - i) * 0.05 >= MIN_SILENCE:
            sil.append((i * 0.05, j * 0.05))
        i = j
    else:
        i += 1

speech = []
cur = 0.0
for s, e in sil:
    pad = min(PAD, (e - s) / 2)
    if s + pad > cur:
        speech.append([cur, s + pad])
    cur = e - pad
if cur < total:
    speech.append([cur, total])

# --- 2. Вырезаем слова-паразиты ----------------------------------------------
cuts = []
i = 0
while i < len(W):
    if i in REMOVE:
        j = i
        while j + 1 < len(W) and j + 1 in REMOVE:
            j += 1
        end = W[j + 1]["s"] - 0.05 if j + 1 < len(W) else total  # запас, чтобы не срезать начало следующего слова
        cuts.append((W[i]["s"], end))
        i = j + 1
    else:
        i += 1


def subtract(segs, cut):
    out = []
    for a, b in segs:
        if cut[1] <= a or cut[0] >= b:
            out.append([a, b])
            continue
        if cut[0] > a:
            out.append([a, cut[0]])
        if cut[1] < b:
            out.append([cut[1], b])
    return out


# дополнительные вырезки по времени в исходнике (находит проверочная расшифровка)
EXTRA_CUTS = [
    # (начало, конец) в секундах ИСХОДНИКА. Сюда идут дубли и слова-паразиты,
    # которые нашла проверочная расшифровка: таймкоды слов из первой расшифровки
    # ошибаются до секунды, поэтому по номерам слов они вырезаются ненадёжно.
]

keep = speech
for c in cuts + EXTRA_CUTS:
    keep = subtract(keep, c)

# оставляем только куски, в которых есть хотя бы одно нужное слово (вздохи и шумы уходят)
kept_words = [w for i, w in enumerate(W) if i not in REMOVE]
# длинные куски без слов оставляем: распознавание иногда ошибается с таймкодом на секунду
keep = [k for k in keep if k[1] - k[0] >= 0.5 or any(w["s"] < k[1] and w["e"] > k[0] and min(w["e"], k[1]) - max(w["s"], k[0]) > 0.04 for w in kept_words)]

# привязка к сетке кадров
frames = []
for a, b in keep:
    fa, fb = round(a * FPS), round(b * FPS)
    if frames and fa <= frames[-1][1]:
        fa = frames[-1][1]
    if fb - fa >= 2:
        frames.append([fa, fb])

json.dump(frames, open("map.json", "w"))

# --- 3. Звук -----------------------------------------------------------------
parts = []
for fa, fb in frames:
    chunk = audio[fa * SPF: fb * SPF].copy()
    n = min(FADE, len(chunk) // 2)
    ramp = np.linspace(0, 1, n, dtype=np.float32)[:, None]
    chunk[:n] *= ramp
    chunk[-n:] *= ramp[::-1]
    parts.append(chunk)
out = np.concatenate(parts).clip(-32768, 32767).astype(np.int16)
with wave.open("cut.wav", "wb") as wf:
    wf.setnchannels(ch)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(out.tobytes())

# --- 4. Фильтр для видео -----------------------------------------------------
terms = [f"between(n,{fa},{fb - 1})" for fa, fb in frames]
# ffmpeg не переваривает сумму из сотни слагаемых подряд — группируем по 15
expr = "+".join("(" + "+".join(terms[i:i + 15]) + ")" for i in range(0, len(terms), 15))
open("select.txt", "w", encoding="utf-8").write(
    f"fps={FPS},select='{expr}',setpts=N/{FPS}/TB"
)

new_total = sum(fb - fa for fa, fb in frames) / FPS
print(f"исходник: {total:.1f} c -> монтаж: {new_total:.1f} c (убрано {total - new_total:.1f} c)")
print(f"склеек: {len(frames) - 1}, вырезано слов: {len(REMOVE)}")
