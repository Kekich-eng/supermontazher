"""Расшифровка звука с таймкодами каждого слова (Whisper, видеокарта).

Запуск: python transcribe.py [вход.wav] [префикс] [модель]
  python transcribe.py                         -> audio.wav -> words.json, transcript.txt
  python transcribe.py final16.wav words_final -> words_final.json, words_final.txt
Перед запуском в PowerShell: $env:PYTHONUTF8 = '1'
Вход лучше 16 кГц моно: ffmpeg -y -i X -vn -ac 1 -ar 16000 audio.wav
"""
import json
import sys

import whisper

src = sys.argv[1] if len(sys.argv) > 1 else "audio.wav"
prefix = sys.argv[2] if len(sys.argv) > 2 else "words"
model_name = sys.argv[3] if len(sys.argv) > 3 else "medium"
txt = "transcript.txt" if prefix == "words" else prefix + ".txt"

model = whisper.load_model(model_name)
result = model.transcribe(
    src,
    language="ru",
    word_timestamps=True,
    condition_on_previous_text=False,
    # подсказка: модель записывает слова-паразиты, а не выкидывает их, и правильно пишет названия
    initial_prompt="Ну, вот, э-э-э, как бы, короче, типа, в общем, значит, м-м-м. Claude Code, Codex, ChatGPT, Telegram, YouTube, MCP, Obsidian.",
)

words = []
for seg in result["segments"]:
    for w in seg.get("words", []):
        words.append({"w": w["word"].strip(), "s": round(w["start"], 3), "e": round(w["end"], 3)})

json.dump(words, open(prefix + ".json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
with open(txt, "w", encoding="utf-8") as f:
    for seg in result["segments"]:
        f.write(f'[{seg["start"]:7.2f} - {seg["end"]:7.2f}] {seg["text"].strip()}\n')
print(f"{src}: слов {len(words)}, сегментов {len(result['segments'])} -> {prefix}.json, {txt}")
