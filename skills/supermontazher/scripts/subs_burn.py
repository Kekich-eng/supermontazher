"""Делает субтитры из расшифровки уже смонтированного звука.

Вход:  words_final.json (слова с таймкодами по cut.wav, его пишет check/verify.py)
Выход: subs.ass (вжигается в видео) и subs.srt (для YouTube)
Запуск: python subs.py

Чтобы поправить текст — меняй FIX: номер слова -> как должно быть написано ("" = убрать).
Номера слов печатает check/verify.py.
"""
import json

W = json.load(open("words_final.json", encoding="utf-8"))

MAX_WORDS = 3      # слов в одной строке
MAX_CHARS = 20     # и не длиннее стольких знаков

# --- Правка ошибок распознавания ----------------------------------------------
FIX = {
    # номер слова из words_final.json: "как должно быть написано" ("" — убрать слово)
}

items = []  # [текст, старт, конец, пауза перед словом, конец фразы]
prev_end = None
for i, w in enumerate(W):
    text = FIX.get(i, w["w"])
    if text == "":
        continue
    glue = text.startswith("-")
    stop = text[-1] in ".?!:"
    text = text.strip(".,;:…–")
    if not text.strip("-"):
        continue
    if glue and items:
        items[-1][0] += text
        items[-1][2] = w["e"]
        items[-1][4] = stop
    else:
        brk = prev_end is None or w["s"] - prev_end > 0.45
        items.append([text, w["s"], w["e"], brk, stop])
    prev_end = w["e"]

chunks, cur = [], []
for it in items:
    length = sum(len(x[0]) + 1 for x in cur)
    if cur and (it[3] or cur[-1][4] or len(cur) >= MAX_WORDS or length + len(it[0]) > MAX_CHARS):
        chunks.append(cur)
        cur = []
    cur.append(it)
if cur:
    chunks.append(cur)

subs = []
for n, c in enumerate(chunks):
    s, e = c[0][1], c[-1][2]
    if n + 1 < len(chunks):
        nxt = chunks[n + 1][0][1]
        e = nxt if nxt - e < 0.6 else e + 0.25   # короткие зазоры закрываем, чтобы текст не мигал
    subs.append((s, max(e, s + 0.3), " ".join(x[0] for x in c)))


def ass_t(t):
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f"{int(h)}:{int(m):02d}:{s:05.2f}"


def srt_t(t):
    ms = round(t * 1000)
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


with open("subs.ass", "w", encoding="utf-8-sig") as f:
    f.write(
        "[Script Info]\nScriptType: v4.00+\nPlayResX: 720\nPlayResY: 1280\nWrapStyle: 0\nScaledBorderAndShadow: yes\n\n"
        "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
        "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, "
        "Alignment, MarginL, MarginR, MarginV, Encoding\n"
        "Style: Main,Arial,62,&H00FFFFFF,&H00FFFFFF,&H00000000,&H96000000,-1,0,0,0,100,100,0,0,1,5,2,2,50,50,130,1\n\n"
        "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n"
    )
    for s, e, t in subs:
        f.write(f"Dialogue: 0,{ass_t(s)},{ass_t(e)},Main,,0,0,0,,{t}\n")

with open("subs.srt", "w", encoding="utf-8") as f:
    for n, (s, e, t) in enumerate(subs, 1):
        f.write(f"{n}\n{srt_t(s)} --> {srt_t(e)}\n{t}\n\n")

print(f"строк субтитров: {len(subs)}")
