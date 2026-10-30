"""Переносит слова готового голоса в Remotion: words_final.json -> src/<name>Words.ts (для субтитров и привязки сцен).

Запуск: python words_to_ts.py words_final.json ../../remotion/src/myWords.ts [FIX как json]
Пример FIX: '{"Клод": "Claude", "3": "три"}'  (значение null убирает слово)
"""
import json
import sys

src, dst = sys.argv[1], sys.argv[2]
fix = json.loads(sys.argv[3]) if len(sys.argv) > 3 else {}
W = []
for w in json.load(open(src, encoding="utf-8")):
    t = fix.get(w["w"], w["w"])
    if t is None or not t.strip():
        continue
    if t.startswith("-") and W:
        W[-1]["w"] += t
        W[-1]["e"] = w["e"]
        continue
    W.append({"w": t, "s": round(w["s"], 2), "e": round(w["e"], 2)})
open(dst, "w", encoding="utf-8").write(
    "// Слова готового голоса с таймкодами (секунды). Собрано words_to_ts.py\n"
    "export const WORDS: {w: string; s: number; e: number}[] = " + json.dumps(W, ensure_ascii=False) + ";\n")
print(dst, len(W), "слов")
