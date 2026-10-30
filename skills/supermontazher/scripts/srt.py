"""Субтитры .srt для YouTube из расшифровки ГОТОВОГО звука (не исходника, иначе съедут).

Запуск: python srt.py words_final.json "Субтитры - <Название ролика>.srt" [сдвиг_с]
  сдвиг — если голос в ролике начинается не с нуля (заставка) или в него вставлены паузы,
  проще прогнать по words_final.json уже пересчитанным во время ролика.
Строка до 40 знаков, разрыв на паузе > 0.6 с и на конце предложения.
FIX — правки распознавания регулярками (названия, имена, ошибки Whisper). Пополняй под ролик.
Файл кладётся в youtube-ai/.
"""
import json
import re
import sys

src = sys.argv[1] if len(sys.argv) > 1 else "words_final.json"
name = sys.argv[2] if len(sys.argv) > 2 else "subs.srt"
shift = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
MAXLEN, GAP = 40, 0.6

FIX = {
    r"\bCote\b": "Code", r"Чаджи\w*": "ChatGPT", r"[Кк]лоу?т\b": "Claude", r"[Кк]лауд": "Claude",
    r"\bкодекс": "Codex", r"телеграм\b": "Telegram", r"ютуб\b": "YouTube", r"\bэмсипи\b": "MCP",
    r"\bпром\b": "промпт", r"обсидиан": "Obsidian",
}


def fix(t):
    for a, b in FIX.items():
        t = re.sub(a, b, t)
    return re.sub(r"\s+", " ", t).replace(" ,", ",").strip()


W = [w for w in json.load(open(src, encoding="utf-8")) if w["w"].strip()]
lines, cur = [], []
for w in W:
    ln = sum(len(x["w"]) + 1 for x in cur)
    if cur and (ln + len(w["w"]) > MAXLEN or w["s"] - cur[-1]["e"] > GAP):
        lines.append(cur)
        cur = []
    cur.append(w)
    if w["w"][-1] in ".?!":
        lines.append(cur)
        cur = []
if cur:
    lines.append(cur)


def ts(t):
    ms = max(0, round(t * 1000))
    return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"


out = []
for i, l in enumerate(lines):
    a, b = l[0]["s"] + shift, l[-1]["e"] + 0.3 + shift
    if i < len(lines) - 1:
        b = min(b, lines[i + 1][0]["s"] + shift - 0.02)
    t = fix(" ".join(x["w"] for x in l))
    if not t:
        continue
    if not out or out[-1].rstrip()[-1] in ".?!":
        t = t[0].upper() + t[1:]
    out.append(f"{len(out) + 1}\n{ts(a)} --> {ts(b)}\n{t}\n")
open(name, "w", encoding="utf-8").write("\n".join(out))
print(name, "строк:", len(out))
