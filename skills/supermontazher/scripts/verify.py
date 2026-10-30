"""Проверка монтажа: расшифровывает готовый звук и показывает, что осталось вырезать.

Запуск: python verify.py [final16.wav]   (по умолчанию final16.wav, его пишет voice.py)
Выход:  words_final.json, transcript_final.txt — по ним потом ставятся ВСЕ времена анимации и субтитров.
Печатает текст с паузами <1.2> и номерами слов, затем кандидатов (паразиты, повторы подряд, слова нулевой
длительности) с таймкодом ИСХОДНИКА по map.json — его можно сразу вписать в REMOVE в build_voice.py.
Слово нулевой длительности на склейке — обычно выдумка распознавания, а не реальный звук.
"""
import json
import re
import sys
import textwrap

import whisper

src = sys.argv[1] if len(sys.argv) > 1 else "final16.wav"
m = whisper.load_model("medium")
r = m.transcribe(src, language="ru", condition_on_previous_text=False, word_timestamps=True,
                 initial_prompt="Ну, вот, э-э-э, короче. Claude Code, Codex, ChatGPT, Telegram, YouTube, MCP, Obsidian.")
W = [{"w": w["word"].strip(), "s": round(w["start"], 3), "e": round(w["end"], 3)} for s in r["segments"] for w in s.get("words", [])]
json.dump(W, open("words_final.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
with open("transcript_final.txt", "w", encoding="utf-8") as f:
    for seg in r["segments"]:
        f.write(f'[{seg["start"]:7.2f} - {seg["end"]:7.2f}] {seg["text"].strip()}\n')

try:
    MP = json.load(open("map.json"))
except FileNotFoundError:
    MP = []
if MP and len(MP[0]) == 2:  # формат build_talk.py: пары кадров при 30 к/с
    acc, nm = 0.0, []
    for fa, fb in MP:
        nm.append((fa / 30, fb / 30, acc))
        acc += (fb - fa) / 30
    MP = nm


def src_t(t):
    for s, e, o in MP:
        if t <= o + (e - s):
            return s + (t - o)
    return t


out, prev = [], 0
for i, w in enumerate(W):
    g = f" <{w['s'] - prev:.1f}>" if w["s"] - prev >= 0.7 else ""
    out.append(f' {g} {i}:{w["w"]}')
    prev = w["e"]
print("\n".join(textwrap.wrap("".join(out), 230)))

PARAS = {"вот", "во", "ну", "короче", "э", "ээ", "эээ", "м", "мм", "ммм", "типа", "блин"}
norm = lambda x: re.sub(r"[^а-яёa-z]", "", x.lower())
print("--- кандидаты; src = время в исходнике")
for i, w in enumerate(W):
    k = norm(w["w"])
    rep = i > 0 and k and k == norm(W[i - 1]["w"])
    zero = w["e"] - w["s"] < 0.02
    if k in PARAS or rep or zero:
        why = "паразит" if k in PARAS else "повтор" if rep else "нулевое"
        ctx = " ".join(x["w"] for x in W[max(0, i - 3):i + 4])
        print(f'{i} [{why}] «{w["w"]}» {w["s"]:.2f} | src {src_t(w["s"]):.2f}-{src_t(w["e"]):.2f} | {ctx}')
print(f"готово: words_final.json ({len(W)} слов). Вслух не проверено: я не слышу звук.")
