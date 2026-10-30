"""Обработка голоса по умолчанию — почти без обработки.

Цепочка: highpass 70 Гц (гул) -> постоянное усиление до цели (по умолчанию −15.5 LUFS, как в одобренных
роликах «Бой», «Сравнение», «Агент») -> только если пики выше −1 дБ, мягкий alimiter с level=disabled
(срезает лишь редкие пики и НЕ поднимает громкость сам).
Почему так: 10.10.2026 автор услышал «сильный дисторшн» — его давал alimiter с авто-подъёмом громкости
(по умолчанию level=enabled), он дотягивал весь звук до максимума. Второе шумоподавление (afftdn), atempo,
сильный компрессор и подъём верхов тоже нельзя: «голос как у ИИ».

Запуск: python voice.py cut.wav voice.wav [цель_LUFS]
Пишет ещё final16.wav (16 кГц моно) для verify.py.
"""
import re
import subprocess
import sys

src, dst = sys.argv[1], sys.argv[2]
target = float(sys.argv[3]) if len(sys.argv) > 3 else -15.5
hp = "highpass=f=70"


def measure(path, af):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", af + ",ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True, encoding="utf-8", errors="ignore")
    s = r.stderr[r.stderr.rfind("Summary:"):]
    return float(re.search(r"I:\s+(-?[\d.]+) LUFS", s).group(1)), float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", s).group(1))


lufs, peak = measure(src, hp)
gain = target - lufs
chain = f"{hp},volume={gain:.2f}dB"
if peak + gain > -1.0:
    chain += ",alimiter=limit=0.89:attack=5:release=60:level=disabled"
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-af", chain, "-ar", "44100", "-c:a", "pcm_s16le", dst], check=True)
l2, p2 = measure(dst, "anull")
print(f"было {lufs:.1f} LUFS / пик {peak:.1f} -> стало {l2:.1f} LUFS / пик {p2:.1f} dBFS")
print("цепочка:", chain)
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", dst, "-ac", "1", "-ar", "16000", "final16.wav"], check=True)
print(dst, "и final16.wav готовы. На слух не проверено: если сомневаешься, пришли автору два образца по 15 с.")
