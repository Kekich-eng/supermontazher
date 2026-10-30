"""Перерасшифровка окон исходника: ловит дубли и запинки, которые общая расшифровка пропустила или склеила.

Запуск: python win.py 120-135 210.5-224 [--src full.wav]
Печатает каждое слово с таймкодом ИСХОДНИКА: слово[начало-конец]. Эти числа идут прямо в REMOVE.
"""
import subprocess
import sys

import whisper

args = sys.argv[1:]
src = "full.wav"
if "--src" in args:
    i = args.index("--src")
    src = args[i + 1]
    del args[i:i + 2]
m = whisper.load_model("medium")
for arg in args:
    a, b = map(float, arg.split("-"))
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", str(a), "-t", str(b - a), "-i", src, "-ar", "16000", "-ac", "1", "tmp_win.wav"], check=True)
    r = m.transcribe("tmp_win.wav", language="ru", word_timestamps=True, condition_on_previous_text=False)
    print(arg, "::", " ".join(f"{w['word'].strip()}[{a + w['start']:.2f}-{a + w['end']:.2f}]" for s in r["segments"] for w in s.get("words", [])))
