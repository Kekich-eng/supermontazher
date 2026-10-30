"""Шортс-нарезка из голоса длинного ролика: SEGS -> short.wav + TS-файл для Remotion (карта кусков и слова субтитров).

Запуск из video/<ролик>/short/:  python build_short.py
Нужны ../talk/voice.wav и ../talk/words_final.json (время голоса длинного ролика).
SEGS — (начало, конец[, пауза после]) в секундах голоса длинного ролика. Выбирай законченные мысли:
хук в первые 1–2 с, по одной идее на кусок, концовка с призывом. Итог 45–60 с, максимум 90.
Границы кусков подтягиваются к словам: начало за 0.09 с до первого слова, конец через 0.16 с после последнего.
FIX — правка слов для субтитров (None = убрать слово).
Если шортс пишется по отдельному сценарию и отдельной озвучке (так лучше заходит), этот скрипт не нужен:
делай обычный build_voice.py -> voice.py -> verify.py в папке short/.
"""
import json
import wave

import numpy as np

NAME = "myShort"                    # имя TS-файла и константы: src/<NAME>Data.ts, export <NAME>_DATA
REMOTION = "../../remotion/"
SEGS = [
    # (0.0, 6.75), (10.3, 11.98), (117.12, 121.4, 2.2),
]
FIX = {"Клод": "Claude", "клоут,": "Claude,", "телеграм.": "Telegram.", "–": None}

W = json.load(open("../talk/words_final.json", encoding="utf-8"))
with wave.open("../talk/voice.wav") as wf:
    SR = wf.getframerate()
    ch = wf.getnchannels()
    a = np.frombuffer(wf.readframes(wf.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32)

pieces, mp, words, acc = [], [], [], 0
for seg in SEGS:
    s, e = seg[0], seg[1]
    pause = seg[2] if len(seg) > 2 else 0.1
    ws = [w for w in W if s - 0.06 <= w["s"] < e]
    assert ws, f"в куске {seg} нет слов"
    a0 = max(0, ws[0]["s"] - 0.09)
    nxt = [w["s"] for w in W if w["s"] > ws[-1]["s"]]
    b0 = min(ws[-1]["e"] + 0.16, (nxt[0] - 0.03) if nxt else 1e9)
    c = a[int(a0 * SR):int(b0 * SR)].copy()
    F = int(0.012 * SR)
    r = np.linspace(0, 1, F, dtype=np.float32)[:, None]
    c[:F] *= r
    c[-F:] *= r[::-1]
    d = acc / SR
    mp.append([round(a0, 3), round(b0, 3), round(d, 3)])
    for w in ws:
        t = FIX.get(w["w"], w["w"])
        if t is None:
            continue
        if t.startswith("-") and words:  # «ИИ» + «-агент» склеиваем
            words[-1]["w"] += t
            words[-1]["e"] = round(w["e"] - a0 + d, 2)
            continue
        words.append({"w": t, "s": round(w["s"] - a0 + d, 2), "e": round(w["e"] - a0 + d, 2)})
    pieces.append(c)
    acc += len(c)
    gap = np.zeros((int(pause * SR), ch), np.float32)
    pieces.append(gap)
    acc += len(gap)
pieces.append(np.zeros((SR, ch), np.float32))
acc += SR
o = np.concatenate(pieces)
with wave.open("short.wav", "wb") as wf:
    wf.setnchannels(ch)
    wf.setsampwidth(2)
    wf.setframerate(SR)
    wf.writeframes(o.clip(-32768, 32767).astype(np.int16).tobytes())
data = {"total": round(acc / SR, 2), "seg": mp, "words": words}
open(REMOTION + f"src/{NAME}Data.ts", "w", encoding="utf-8").write(
    f"// Карта кусков шортса: seg = [начало в длинном ролике, конец, место в шортсе]. Собирается build_short.py\n"
    f"export const {NAME.upper()}_DATA: {{total: number; seg: number[][]; words: {{w: string; s: number; e: number}}[]}} = "
    + json.dumps(data, ensure_ascii=False) + ";\n")
print("длина", data["total"], "с")
print(" ".join(x["w"] for x in words))
