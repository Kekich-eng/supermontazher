"""Обзорный лист кадров с таймкодами — главный способ «посмотреть» ролик (движение я не вижу, только кадры).

Видео:    python contact_sheet.py video.mp4 sheet.jpg [шаг_с=10] [колонок=4]
Remotion: python contact_sheet.py --remotion <Композиция> sheet.jpg 1.5,4,12.3,30 [колонок=4]
          (запускать из папки remotion; кадры через stills.mjs одним бандлом, ширина 540)
Для видео ищи: ключи и пароли, чужие окна, уведомления, пустые окна, съехавшие обводки, обрезанный текст.
Для Remotion: 15–20 точек — начало каждой сцены + 0.6 с (после влёта) и середины сложных сцен.
"""
import os
import subprocess
import sys
import tempfile

from PIL import Image, ImageDraw, ImageFont

args = sys.argv[1:]
tmp = tempfile.mkdtemp(prefix="sheet_")
frames = []  # (путь, подпись)


def mmss(t):
    return f"{int(t // 60)}:{t % 60:05.2f}"


if args[0] == "--remotion":
    comp, out, times = args[1], args[2], [float(x) for x in args[3].split(",")]
    cols = int(args[4]) if len(args) > 4 else 4
    # один бандл на все кадры (stills.mjs): в 3-4 раза быстрее, чем npx remotion still на каждый кадр
    here = os.path.dirname(os.path.abspath(__file__))
    subprocess.run(["node", os.path.join(here, "stills.mjs"), os.getcwd(), comp, tmp, ",".join(str(t) for t in times)], check=True)
    for i, t in enumerate(times):
        frames.append((os.path.join(tmp, f"{i:03}.png"), mmss(t)))
else:
    src, out = args[0], args[1]
    step = float(args[2]) if len(args) > 2 else 10
    cols = int(args[3]) if len(args) > 3 else 4
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src], capture_output=True, text=True).stdout.strip())
    t = 0.5
    while t < dur:
        f = os.path.join(tmp, f"{len(frames):03}.jpg")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", src, "-frames:v", "1", "-vf", "scale=480:-2", f], check=True)
        frames.append((f, mmss(t)))
        t += step

ims = [Image.open(f).convert("RGB") for f, _ in frames]
w = 480
ims = [im.resize((w, round(im.height * w / im.width))) for im in ims]
h = max(im.height for im in ims)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * (w + 6) + 6, rows * (h + 34) + 6), (18, 18, 18))
d = ImageDraw.Draw(sheet)
try:
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)
except OSError:
    font = ImageFont.load_default()
for i, (im, (_, cap)) in enumerate(zip(ims, frames)):
    x, y = 6 + (i % cols) * (w + 6), 6 + (i // cols) * (h + 34)
    sheet.paste(im, (x, y + 28))
    d.text((x + 4, y + 4), cap, fill=(198, 255, 61), font=font)
sheet.save(out, quality=88)
print(out, len(ims), "кадров")
