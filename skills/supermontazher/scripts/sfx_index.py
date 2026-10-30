"""Собирает скачанные звуки в каталог: video/sfx-library -> public/sfx/lib (жёсткие ссылки), index.json, catalog.md, демо.

Запуск: python sfx_index.py <папка sfx-library> <папка public/sfx/lib>
Источники: kenney/<пак>/*.ogg (CC0, можно распространять), mixkit/<категория>_<id>.mp3 (только в роликах).
Подписи Mixkit берутся из titles.json ({id: название}), если он есть.
"""
import hashlib
import json
import os
import re
import subprocess
import sys

SRC, DST = sys.argv[1], sys.argv[2]
os.makedirs(DST, exist_ok=True)
titles = {}
tp = os.path.join(SRC, "titles.json")
if os.path.exists(tp):
    titles = json.load(open(tp, encoding="utf-8"))


def info(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p], capture_output=True, text=True)
    return round(float(r.stdout.strip() or 0), 2)


items, seen = [], set()
for pack in sorted(os.listdir(os.path.join(SRC, "kenney"))):
    d = os.path.join(SRC, "kenney", pack)
    for f in sorted(os.listdir(d)):
        if not f.lower().endswith(".ogg") or f.lower() == "preview.ogg":
            continue
        p = os.path.join(d, f)
        h = hashlib.sha1(open(p, "rb").read()).hexdigest()
        if h in seen:
            continue
        seen.add(h)
        items.append({"file": f"lib/k_{pack}_{f}", "src": p, "group": pack, "title": re.sub(r"[_]+", " ", f[:-4]), "license": "CC0"})
d = os.path.join(SRC, "mixkit")
for f in sorted(os.listdir(d)):
    if not f.endswith(".mp3"):
        continue
    cat, sid = f[:-4].split("_", 1)
    p = os.path.join(d, f)
    h = hashlib.sha1(open(p, "rb").read()).hexdigest()
    if h in seen:
        os.remove(p)
        continue
    seen.add(h)
    items.append({"file": f"lib/m_{cat}_{sid}.mp3", "src": p, "group": cat, "title": titles.get(sid, f"{cat} {sid}"), "license": "Mixkit"})

for it in items:
    dst = os.path.join(DST, os.path.basename(it["file"]))
    if not os.path.exists(dst):
        os.link(it["src"], dst)
    it["dur"] = info(dst)
    del it["src"]
json.dump(items, open(os.path.join(SRC, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)

lines = ["# Скачанные звуки", "",
         f"Всего {len(items)}. Вызов: `<SfxFile file=\"lib/m_impact_123.mp3\" at={{ev.boom}} vol={{0.3}} />` (`kit.tsx`).", "",
         "- CC0 (Kenney): можно использовать и распространять, упоминание автора не обязательно.",
         "- Mixkit: только внутри роликов, в плагин и на GitHub не кладём.", ""]
groups = {}
for it in items:
    groups.setdefault((it["license"], it["group"]), []).append(it)
for (lic, g), lst in sorted(groups.items()):
    lines += [f"## {g} ({lic}, {len(lst)})", ""]
    lines += [f"- `{it['file']}` {it['dur']} с, {it['title']}" for it in lst] + [""]
open(os.path.join(SRC, "catalog.md"), "w", encoding="utf-8").write("\n".join(lines))
print(len(items), "звуков;", {f"{k[0]}/{k[1]}": len(v) for k, v in sorted(groups.items())})
