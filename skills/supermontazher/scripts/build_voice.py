"""Черновой монтаж ОЗВУЧКИ (ролик без лица): full.wav + words.json -> cut.wav + map.json.

Как работает:
1. Речь ищется по средней громкости окнами 20 мс (порог SPEECH_DB), а не по пикам: щелчки ломают поиск по пикам.
2. Кусок звука остаётся, только если на него попадает слово из words.json: так уходят вздохи и шорохи.
3. REMOVE — что вырезать, интервалами в секундах ИСХОДНИКА (дубли, оговорки, «Алиса, стоп», хвост).
   Таймкоды бери из transcript.txt и уточняй через win.py: у общей расшифровки они ошибаются до секунды.
4. map.json: [[начало в исходнике, конец, место в cut.wav], ...] — по ней verify.py переводит время обратно.

Запуск: python build_voice.py, затем python voice.py cut.wav voice.wav, затем python verify.py
"""
import json
import wave

import numpy as np

# (начало, конец) в секундах исходника, в комментарии — что это
REMOVE = [
    # (0, 4.0),        # «ммм» в начале
    # (526.0, 9999),   # хвост после последней фразы
]
SPEECH_DB = -46   # громче этого — речь (для телефона −42)
LOUD_DB = -28     # кусок без слова, но с пиком громче этого, всё равно речь (проверь окном win.py)
JOIN = 0.34       # паузы короче склеиваются в одну фразу
PAD = 0.14        # тишина по краям фразы
TAIL = 1.2        # тишина в конце файла

W = json.load(open("words.json", encoding="utf-8"))
with wave.open("full.wav") as wf:
    SR = wf.getframerate()
    ch = wf.getnchannels()
    a = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32)

m = a.mean(axis=1) / 32768
WIN = SR // 50
n = len(m) // WIN
r = 20 * np.log10(np.sqrt((m[:n * WIN].reshape(n, WIN) ** 2).mean(axis=1)) + 1e-9)
sp = r >= SPEECH_DB
segs, cur = [], None
for k in range(n):
    if sp[k] and cur is None:
        cur = k
    if not sp[k] and cur is not None:
        segs.append([cur / 50, k / 50])
        cur = None
if cur is not None:
    segs.append([cur / 50, n / 50])
mg = []
for s in segs:
    if mg and s[0] - mg[-1][1] < 0.10:
        mg[-1][1] = s[1]
    else:
        mg.append(s)


def has_word(s, e):
    return any(s - 0.03 <= (w["s"] + w["e"]) / 2 <= e + 0.03
               or (w["s"] + 0.05 < e and w["e"] - 0.05 > s and min(e, w["e"]) - max(s, w["s"]) > 0.12) for w in W)


def peak(s, e):
    return float(r[int(s * 50):max(int(e * 50), int(s * 50) + 1)].max())


# Громкий кусок без слова — почти всегда короткое слово, которому расшифровка сдвинула время
# (так 18.10 чуть не пропало «Курьер.»): оставляем и печатаем на проверку. Вздохи и шорохи тише.
loud = [(round(s, 2), round(e, 2), round(peak(s, e), 1)) for s, e in mg if not has_word(s, e) and e - s >= 0.2 and peak(s, e) > LOUD_DB]
dropped = [(round(s, 2), round(e, 2), round(peak(s, e), 1)) for s, e in mg if not has_word(s, e) and e - s > 0.08 and not (e - s >= 0.2 and peak(s, e) > LOUD_DB)]
mg = [s for s in mg if has_word(*s) or (s[1] - s[0] >= 0.2 and peak(*s) > LOUD_DB)]
m2 = []
for s in mg:
    if m2 and s[0] - m2[-1][1] < JOIN:
        m2[-1][1] = s[1]
    else:
        m2.append(list(s))
keep = [[max(0, s - PAD), e + PAD] for s, e in m2 if e - s > 0.10]
out = []
for s, e in keep:
    for a0, b0 in REMOVE:
        if a0 <= s and e <= b0:
            s = e
        elif a0 <= s < b0:
            s = b0
        elif a0 < e <= b0:
            e = a0
        elif s < a0 and b0 < e:
            out.append([s, a0])
            s = b0
    if e - s > 0.12:
        out.append([s, e])

F = int(0.01 * SR)
parts, mp, acc = [], [], 0
for s, e in out:
    c = a[int(s * SR):int(e * SR)].copy()
    rmp = np.linspace(0, 1, F, dtype=np.float32)[:, None]
    c[:F] *= rmp
    c[-F:] *= rmp[::-1]
    parts.append(c)
    mp.append((round(s, 2), round(e, 2), round(acc / SR, 2)))
    acc += len(c)
parts.append(np.zeros((int(TAIL * SR), ch), np.float32))
o = np.concatenate(parts)
with wave.open("cut.wav", "wb") as wf:
    wf.setnchannels(ch)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(o.clip(-32768, 32767).astype(np.int16).tobytes())
json.dump(mp, open("map.json", "w"))
print(f"исходник {len(a) / SR:.1f} с -> cut.wav {len(o) / SR:.2f} с, кусков {len(mp)}")
print("выброшено как шум (без слов) [начало, конец, пик дБ]:", dropped)
print("оставлено без слова, ПРОВЕРЬ окном win.py:", loud)
