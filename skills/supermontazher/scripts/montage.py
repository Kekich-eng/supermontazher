"""Монтажный движок: сцены привязаны к словам озвучки, а не к секундам.

Запуск из папки ролика (обычно через make.py рядом с edit.json):
  python make.py            сборка + черновой рендер 540×960/30 + копия для телефона + лист кадров по сценам
  python make.py --build    только сборка (секунды): голос, паузы, музыка, слова, раскладка
  python make.py --audio    сборка + только звук ролика (review/audio_mix.wav), когда правка лишь в звуке
  python make.py --full     сборка + финальный рендер в render.out (занятое имя не перезапишет без --force)
  python make.py --animatic сборка + аниматик (render.animatic): сцены-заглушки с задачей, словами и событиями,
                            чтобы проверить ритм всего ролика до того, как нарисованы сцены (~1 мин)
  python make.py --sample=63-86  сборка + кусок финальной композиции (секунды ролика) -> review/sample.mp4 и копия для телефона
  python make.py --scene s3 сборка + лист одной сцены: 9 кадров финальной композиции от начала до конца
                            (можно несколько: --scene s3,s4) -> review/scene_s3.jpg
  --no-voice                не пересобирать голос (правил только якоря)
Итог каждой сборки дописывается в блок «Последняя сборка» в STATE.md ролика.
Что делает сборка:
  1. голос: talk/build_voice.py (REMOVE) -> voice.py -> verify.py (Whisper). Расшифровка кэшируется по хэшу
     final16.wav в talk/.words_cache/, поэтому без правок REMOVE шаг занимает секунды. --no-voice пропускает шаг.
  2. слова: правки написания (fix), склейка «HTML» + «-страница».
  3. паузы под картинку (якорями) вставляются в голос -> voice_video.wav.
  4. слова во времени ролика -> <remotion>/src/<name>Words.json (субтитры).
  5. раскладка: якоря сцен, событий, кусков записей и окон громкости -> секунды -> <remotion>/src/<name>Edit.json.
  6. музыка: повтор тактов, чтобы трек закрыл весь голос + хвост -> music_video.wav. Длина ролика T = длина музыки.
Композиция Remotion читает только <name>Edit.json и <name>Words.json.

ЯКОРЬ — строка:
  "Раунд первый"            начало первого слова фразы (фраза ищется по словам без регистра, «ё»=«е», без знаков)
  "она *взрывается"         звёздочка — целевое слово внутри фразы (фраза нужна только чтобы найти место)
  "она взрывается]"         ] — конец целевого слова (без звёздочки — конец последнего слова фразы)
  "Раунд первый -0.09"      сдвиг в секундах последним словом (+0.2 / -0.1)
  "Одно задание#2"          второе вхождение (лучше удлинить фразу, чтобы она была одна)
  "@s2", "@s2.end", "@hook.boom", "@boom" (событие своей сцены), "@pause3", "@pause3.end", "@T"
  число                     абсолютные секунды ролика; в "ev" сцены число = секунды от начала сцены
Фраза не нашлась дословно -> ищется похожая (Whisper мог написать иначе), с предупреждением. Несколько вхождений
без #n -> ошибка со списком, где они.

edit.json:
  name, remotion (путь к проекту), public (папка в public/), talk (папка озвучки, по умолчанию talk)
  fix {слово: замена}                      правки написания в субтитрах
  fix_phrases [["как в расшифровке", "как надо"], ...]  правки на несколько слов
  pauses [{after: якорь-фраза, dur, why}]  пауза посередине тишины после фразы (или {at: якорь, dur})
  music {src, from, join, bpm, bars: [..], xfade, min_tail}   (необязательно: без него длина = голос + tail, по умолчанию 2 с)
      трек играет с from до join, потом прыгает назад на N тактов (N из bars, при нехватке повторяется) и
      доигрывает до конца файла. Берётся самый короткий вариант, где музыка >= конец голоса + min_tail.
      exact {"10": 36.64} — точная точка повтора для N тактов, если подбирали на слух (иначе по сетке bpm).
      trim: true — трек длиннее ролика: обрезать по концу голоса + min_tail.
  clips {имя: длина_с}                     длины записей для проверки кусков
  scenes [{id, at, end?, kind?, ev: {имя: якорь}, pieces: [...], ...любые поля для композиции}]
      сцены идут подряд: конец = начало следующей (последняя до T), если не задан end.
      pieces — куски записи: {from, to?, rate?, until?}; until — якорь, где кусок кончается.
        from+to+until -> скорость подбирается; from+until -> to считается; последний кусок без until
        тянется до конца сцены. В выход идут [from, to, rate].
  windows {имя: [[якорь, якорь], ...]}     окна (громче музыка, тише голос)
  render {comp, draft, out}                композиция финала, черновика (540×960, 30 к/с) и имя готового файла
  title                                    название ролика (для STATE.md)
"""
import difflib
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import wave

import numpy as np

SK = os.path.dirname(os.path.abspath(__file__))
args = [a for i, a in enumerate(sys.argv[1:], 1) if not a.startswith("--") and sys.argv[i - 1] != "--scene"]
CFG_PATH = os.path.abspath(args[0] if args else "edit.json")
ROOT = os.path.dirname(CFG_PATH)
CFG = json.load(open(CFG_PATH, encoding="utf-8"))
TALK = os.path.join(ROOT, CFG.get("talk", "talk"))
REM = os.path.join(ROOT, CFG["remotion"])
NAME = CFG["name"]
WARN = []


def warn(msg):
    WARN.append(msg)
    print("  ВНИМАНИЕ:", msg)


def run(cmd, cwd):
    env = dict(os.environ, PYTHONUTF8="1")
    r = subprocess.run(cmd, cwd=cwd, env=env, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode:
        print(r.stdout, r.stderr)
        sys.exit(f"ошибка в {' '.join(cmd)}")
    return r.stdout


# ── 1. голос ────────────────────────────────────────────────────────────
def build_voice():
    print("1. голос: build_voice.py -> voice.py")
    out = run([sys.executable, "build_voice.py"], TALK)
    print("  " + out.strip().splitlines()[0])
    for line in out.splitlines():
        if line.startswith("оставлено без слова") and not line.rstrip().endswith("[]"):
            warn(line)
    run([sys.executable, os.path.join(SK, "voice.py"), "cut.wav", "voice.wav"], TALK)
    h = hashlib.sha1(open(os.path.join(TALK, "final16.wav"), "rb").read()).hexdigest()[:16]
    cache = os.path.join(TALK, ".words_cache", h + ".json")
    if os.path.exists(cache):
        print(f"  расшифровка из кэша ({h}): звук не менялся")
        shutil.copyfile(cache, os.path.join(TALK, "words_final.json"))
    else:
        print("  звук изменился: Whisper расшифровывает заново (около минуты)")
        out = run([sys.executable, os.path.join(SK, "verify.py")], TALK)
        cand = out[out.find("--- кандидаты"):].strip().splitlines()[1:-1]
        if cand:
            print("  кандидаты на вырезку (verify.py):\n    " + "\n    ".join(cand))
        os.makedirs(os.path.dirname(cache), exist_ok=True)
        shutil.copyfile(os.path.join(TALK, "words_final.json"), cache)


# ── 2. слова ────────────────────────────────────────────────────────────
def norm(x):
    return re.sub(r"[^0-9a-zа-я]", "", x.lower().replace("ё", "е"))


def load_words():
    fix = CFG.get("fix", {})
    out = []
    for w in json.load(open(os.path.join(TALK, "words_final.json"), encoding="utf-8")):
        t = w["w"]
        if t in ("—", "-", "–"):
            continue
        if t.startswith("-") and out:
            out[-1]["w"] += t
            out[-1]["e"] = w["e"]
            continue
        out.append({"w": fix.get(t, t), "s": w["s"], "e": w["e"]})
    # правки на несколько слов: Whisper разбил или склеил не так («встроенные и агенты» -> «встроенные ИИ-агенты»)
    for pair in CFG.get("fix_phrases", []):
        src, dst = pair[0].split(), pair[1].split()
        for i in range(len(out) - len(src) + 1):
            if [w["w"] for w in out[i:i + len(src)]] == src:
                s0, e0 = out[i]["s"], out[i + len(src) - 1]["e"]
                step = (e0 - s0) / len(dst)
                out[i:i + len(src)] = [{"w": d, "s": round(s0 + k * step, 3), "e": round(s0 + (k + 1) * step, 3)} for k, d in enumerate(dst)]
                break
        else:
            warn(f"fix_phrases: «{pair[0]}» не нашлось в расшифровке")
    for w in out:
        w["k"] = norm(w["w"])
    return out


# ── якоря ───────────────────────────────────────────────────────────────
OFS = re.compile(r"^[+-]\d+(\.\d+)?$")


def ctx(W, i, n):
    return " ".join(w["w"] for w in W[max(0, i - 2):i + n + 2])


def find_phrase(W, phrase, label):
    """-> (индекс первого слова, длина фразы, номер целевого слова в фразе или None)"""
    occ = 1
    m = re.search(r"#(\d+)$", phrase)
    if m:
        occ, phrase = int(m.group(1)), phrase[:m.start()]
    toks = phrase.split()
    star = next((i for i, t in enumerate(toks) if t.startswith("*")), None)
    key = [norm(t) for t in toks]
    key = [k for k in key if k] or key
    n = len(key)
    hits = [i for i in range(len(W) - n + 1) if [w["k"] for w in W[i:i + n]] == key]
    if not hits:
        # похожая фраза: Whisper мог написать слово иначе
        target = " ".join(key)
        best = max(range(len(W) - n + 1), key=lambda i: difflib.SequenceMatcher(None, " ".join(w["k"] for w in W[i:i + n]), target).ratio())
        r = difflib.SequenceMatcher(None, " ".join(w["k"] for w in W[best:best + n]), target).ratio()
        if r < 0.75 or m:
            sys.exit(f"[{label}] фраза «{phrase}» не найдена в озвучке (ближе всего: «{ctx(W, best, n)}»)")
        warn(f"[{label}] «{phrase}» дословно нет, взята похожая «{' '.join(w['w'] for w in W[best:best + n])}»")
        hits = [best]
    if len(hits) > 1 and not m:
        where = "; ".join(f"#{j + 1}: …{ctx(W, i, n)}… ({W[i]['s']:.2f} с)" for j, i in enumerate(hits))
        sys.exit(f"[{label}] фраза «{phrase}» встречается {len(hits)} раза, удлини её или добавь #n: {where}")
    if occ > len(hits):
        sys.exit(f"[{label}] у фразы «{phrase}» нет вхождения #{occ}")
    return hits[occ - 1], n, star


class Resolver:
    def __init__(self, W, refs):
        self.W, self.refs = W, refs

    def __call__(self, a, label, local_scene=None):
        """якорь -> (абсолютные секунды, описание для таблицы)"""
        if isinstance(a, (int, float)):
            return float(a), ""
        parts = a.split()
        ofs = 0.0
        while parts and OFS.match(parts[-1]):
            ofs += float(parts.pop())
        body = " ".join(parts)
        if body.startswith("@"):
            name = body[1:]
            if local_scene and f"{local_scene}.{name}" in self.refs:
                name = f"{local_scene}.{name}"
            if name not in self.refs:
                sys.exit(f"[{label}] нет ссылки «@{name}» (есть: {', '.join(sorted(self.refs))})")
            return self.refs[name] + ofs, ""
        end = body.endswith("]")
        if end:
            body = body[:-1].strip()
        i, n, star = find_phrase(self.W, body, label)
        j = i + (star if star is not None else (n - 1 if end else 0))
        w = self.W[j]
        return (w["e"] if end else w["s"]) + ofs, f"«{w['w']}»" + (" конец" if end else "")


# ── 3. паузы ────────────────────────────────────────────────────────────
def read_wav(p):
    with wave.open(p) as w:
        sr, ch = w.getframerate(), w.getnchannels()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).reshape(-1, ch).astype(np.float32)
    return sr, a


def write_wav(p, sr, a):
    # пишем в тот же файл (не через переименование): жёсткие ссылки в public/ остаются живыми
    with wave.open(p, "wb") as w:
        w.setnchannels(a.shape[1])
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(np.clip(a, -32768, 32767).astype(np.int16).tobytes())


def link_public(src, dst_name):
    dst = os.path.join(REM, "public", CFG["public"], dst_name)
    if os.path.exists(dst) and os.path.samefile(src, dst):
        return
    if os.path.exists(dst):
        os.remove(dst)
    os.link(src, dst)
    print(f"  {dst_name} в public/{CFG['public']} заново привязан жёсткой ссылкой")


def music_track(VW, refs):
    m = CFG["music"]
    msr, mu = read_wav(os.path.join(ROOT, m["src"]))
    bar = 240 / m["bpm"]
    need = VW[-1]["e"] + m.get("min_tail", 2.0)
    raw = len(mu) / msr
    base = (m["join"] - m["from"]) + (raw - m["join"])
    options = []
    for b in m["bars"]:
        reps = 0
        while base + reps * b * bar < need:
            reps += 1
        options.append((base + reps * b * bar, b, reps))
    total, b, reps = min(options)
    x = int(m.get("xfade", 0.025) * msr)
    seg = lambda s, e: mu[int(s * msr):int(e * msr)]
    pieces = [seg(m["from"], m["join"] + m.get("xfade", 0.025) if reps else raw)]
    for r in range(reps):
        st = m.get("exact", {}).get(str(b), m["join"] - b * bar)  # exact: точка повтора, подобранная на слух
        pieces.append(seg(st, (m["join"] + m.get("xfade", 0.025)) if r < reps - 1 else raw))
    music = pieces[0]
    fo = np.linspace(1, 0, x)[:, None]
    for p in pieces[1:]:
        music = np.concatenate([music[:-x], music[-x:] * fo + p[:x] * (1 - fo), p[x:]])
    if m.get("trim") and len(music) / msr > need:
        # трек длиннее голоса: режем по голосу + min_tail, уход делает композиция
        music = music[:int(need * msr)]
    mpath = os.path.join(ROOT, "music_video.wav")
    write_wav(mpath, msr, music)
    link_public(mpath, m.get("public_name", "music.wav"))
    T = round(len(music) / msr, 3)
    refs["T"] = T
    print(f"4. музыка: повтор {b} тактов ×{reps}, {T:.2f} с (голос до {VW[-1]['e']:.2f} с, хвост {T - VW[-1]['e']:.2f} с)")
    return T


def build():
    if "--no-voice" not in sys.argv:
        build_voice()
    W = load_words()
    print(f"2. слова: {len(W)}")

    # паузы во времени голоса
    rv = Resolver(W, {})
    pauses = []
    for k, p in enumerate(CFG.get("pauses", [])):
        lab = f"пауза {k + 1}"
        if "after" in p:
            body = p["after"].rstrip("]").strip()
            i, n, _ = find_phrase(W, body, lab)
            last = i + n - 1
            at = (W[last]["e"] + W[last + 1]["s"]) / 2 if last + 1 < len(W) else W[last]["e"]
            desc = f"после «{W[last]['w']}»"
        else:
            at, desc = rv(p["at"], lab)
        pauses.append((round(at, 3), float(p["dur"]), desc, p.get("why", "")))
    pauses.sort()

    def V(v, is_end=False):
        # слово, которое кончается ровно в точке паузы, кончается до паузы
        return v + sum(d for at, d, *_ in pauses if (v > at if is_end else v >= at))

    sr, a = read_wav(os.path.join(TALK, "voice.wav"))
    parts, last = [], 0
    for at, d, *_ in pauses:
        i = int(at * sr)
        parts += [a[last:i], np.zeros((int(d * sr), a.shape[1]), np.float32)]
        last = i
    parts.append(a[last:])
    voice = np.concatenate(parts)
    vpath = os.path.join(ROOT, "voice_video.wav")
    write_wav(vpath, sr, voice)
    link_public(vpath, "voice.wav")
    print(f"3. паузы: {len(pauses)}, голос {len(voice) / sr:.2f} с")

    # слова во времени ролика
    VW = [{"w": w["w"], "s": round(V(w["s"]), 3), "e": round(V(w["e"], True), 3), "k": w["k"]} for w in W]
    json.dump([{k: w[k] for k in ("w", "s", "e")} for w in VW], open(os.path.join(REM, "src", f"{NAME}Words.json"), "w", encoding="utf-8"), ensure_ascii=False)
    refs = {}
    for k, (at, d, *_) in enumerate(pauses):
        refs[f"pause{k + 1}"] = round(V(at) - d, 3)
        refs[f"pause{k + 1}.end"] = round(V(at), 3)

    # музыка: длина ролика (без "music" в edit.json: голос + tail, музыку выберем позже)
    if "music" not in CFG:
        T = round(VW[-1]["e"] + CFG.get("tail", 2.0), 3)
        refs["T"] = T
        print(f"4. музыки нет: длина {T:.2f} с (голос до {VW[-1]['e']:.2f} с)")
    else:
        T = music_track(VW, refs)

    # ── 5. раскладка ────────────────────────────────────────────────────
    R = Resolver(VW, refs)
    scenes = CFG["scenes"]
    rows = []
    out = {}
    for sc in scenes:
        at, desc = R(sc.get("at", 0), sc["id"])
        refs[sc["id"]] = round(at, 3)
        out[sc["id"]] = {"at": round(at, 3)}
        rows.append((at, sc["id"], "начало", sc.get("at", 0), desc))
    for k, sc in enumerate(scenes):
        o = out[sc["id"]]
        if "end" in sc:
            end, _ = R(sc["end"], sc["id"])
        else:
            end = out[scenes[k + 1]["id"]]["at"] if k + 1 < len(scenes) else T
        o["dur"] = round(end - o["at"], 3)
        refs[sc["id"] + ".end"] = round(end, 3)
        if o["dur"] < 0.5:
            warn(f"сцена {sc['id']} короче 0,5 с ({o['dur']:.2f} с): якорь съехал?")
    for sc in scenes:
        o, sid = out[sc["id"]], sc["id"]
        o["ev"] = {}
        for name, a in sc.get("ev", {}).items():
            if isinstance(a, (int, float)):
                t, desc = o["at"] + a, ""
            else:
                t, desc = R(a, f"{sid}.{name}", sid)
            refs[f"{sid}.{name}"] = round(t, 3)
            o["ev"][name] = round(t - o["at"], 3)
            rows.append((t, sid, name, a, desc))
            if not -0.01 <= t - o["at"] <= o["dur"] + 0.01:
                warn(f"{sid}.{name} = {t:.2f} с вне своей сцены ({o['at']:.2f}–{o['at'] + o['dur']:.2f})")
        if "pieces" in sc:
            o["pieces"], st = [], 0.0
            for j, pc in enumerate(sc["pieces"]):
                lab = f"{sid} кусок {j + 1}"
                fr = pc["from"]
                if "until" in pc:
                    u, desc = R(pc["until"], lab, sid)
                    u -= o["at"]
                    rows.append((o["at"] + u, sid, f"кусок {j + 1} до", pc["until"], desc))
                elif j == len(sc["pieces"]) - 1 and not ("to" in pc and "rate" in pc):
                    u = o["dur"]
                else:
                    u = st + (pc["to"] - fr) / pc.get("rate", 1)
                if "to" in pc and ("until" in pc or j == len(sc["pieces"]) - 1) and "rate" not in pc:
                    to, rate = pc["to"], (pc["to"] - fr) / (u - st)
                else:
                    rate = pc.get("rate", 1)
                    to = fr + (u - st) * rate
                o["pieces"].append([round(fr, 3), round(to, 3), round(rate, 4)])
                if not 0.3 <= rate <= 2:
                    warn(f"{lab}: скорость {rate:.2f}, проверь")
                ln = CFG.get("clips", {}).get(sc.get("who", ""))
                if ln and to > ln:
                    warn(f"{lab}: кусок до {to:.2f} с, а запись всего {ln} с")
                st = u
            if abs(st - o["dur"]) > 1 / 60:
                warn(f"{sid}: куски длятся {st:.2f} с, а сцена {o['dur']:.2f} с")
        for k2, v in sc.items():
            if k2 not in ("id", "at", "end", "ev", "pieces"):
                o[k2] = v
    wins = {}
    for name, lst in CFG.get("windows", {}).items():
        wins[name] = []
        for a, b2 in lst:
            ta, da = R(a, f"окно {name}")
            tb, db = R(b2, f"окно {name}")
            wins[name].append([round(ta, 3), round(tb, 3)])
            rows.append((ta, f"окно {name}", f"до {tb:.2f}", a, da))
    order = [sc["id"] for sc in scenes]
    edit = {"T": T, "order": order, "scenes": out, "windows": wins,
            "audio": {"voice": f"{CFG['public']}/voice.wav", "music": f"{CFG['public']}/{CFG['music'].get('public_name', 'music.wav')}"},
            "pauses": [[refs[f"pause{k + 1}"], d] for k, (at, d, *_) in enumerate(pauses)]}
    epath = os.path.join(REM, "src", f"{NAME}Edit.json")
    json.dump(edit, open(epath, "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # таблица для глаз
    lines = [f"# Раскладка {NAME}: вычислено {os.path.basename(CFG_PATH)} -> src/{NAME}Edit.json, T = {T:.2f} с", "",
             "| время | сцена | что | якорь | слово |", "|---|---|---|---|---|"]
    mm = lambda t: f"{int(t // 60)}:{t % 60:05.2f}"
    for t, sid, what, a, desc in sorted(rows, key=lambda r: r[0]):
        lines.append(f"| {mm(t)} | {sid} | {what} | {a} | {desc} |")
    lines += ["", "Паузы в голосе:"] + [f"- {mm(refs[f'pause{k + 1}'])} {d} с {desc} {why}" for k, (at, d, desc, why) in enumerate(pauses)]
    if WARN:
        lines += ["", "Предупреждения:"] + ["- " + w for w in WARN]
    open(os.path.join(ROOT, "edit_resolved.md"), "w", encoding="utf-8").write("\n".join(lines) + "\n")
    print(f"5. раскладка: {len(order)} сцен -> {epath}")
    for sid in order:
        o = out[sid]
        print(f"   {mm(o['at'])}  {sid:<6} {o['dur']:6.2f} с  " + " ".join(f"{k}={v}" for k, v in o["ev"].items()))
    print(f"таблица со словами: edit_resolved.md; предупреждений: {len(WARN)}")
    return edit


# ── рендеры ─────────────────────────────────────────────────────────────
REVIEW = os.path.join(ROOT, "review")
LOG = []  # строки для STATE.md


def render(comp, out, extra=()):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    t0 = time.time()
    cmd = f'npx remotion render src/index.ts {comp} "{out}" ' + " ".join(extra)
    print(f"   {cmd}")
    r = subprocess.run(cmd, cwd=REM, shell=True)
    if r.returncode:
        sys.exit(f"рендер {comp} упал (код {r.returncode})")
    dt = time.time() - t0
    mb = os.path.getsize(out) / 2 ** 20
    print(f"   готово за {dt / 60:.1f} мин, {mb:.0f} МБ: {out}")
    return dt


def phone_copy(src, dst):
    # Remote Control не пропускает файлы тяжелее 30 МБ
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", src, "-vf", "scale='if(gt(iw,ih),960,540)':-2", "-r", "30", "-c:v", "libx264", "-crf", "30",
                    "-preset", "fast", "-maxrate", "900k", "-bufsize", "1800k", "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", dst], check=True)
    return os.path.getsize(dst) / 2 ** 20


def scene_sheet(video, edit, out, cols=7):
    """кадры черновика: начало каждой сцены + 0,6 с (после влёта), подпись — время и сцена"""
    from PIL import Image, ImageDraw, ImageFont
    pts = [(edit["scenes"][sid]["at"] + min(0.6, edit["scenes"][sid]["dur"] / 2), sid) for sid in edit["order"]]
    ims = []
    for t, sid in pts:
        f = os.path.join(REVIEW, f"_sheet_{sid}.jpg")
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-ss", f"{t:.3f}", "-i", video, "-frames:v", "1", "-vf", "scale=300:-2", f], check=True)
        ims.append((Image.open(f).convert("RGB"), f"{int(t // 60)}:{t % 60:05.2f} {sid}"))
        os.remove(f)
    w, h = ims[0][0].size
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (w + 6) + 6, rows * (h + 30) + 6), (18, 18, 18))
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    for i, (im, cap) in enumerate(ims):
        x, y = 6 + (i % cols) * (w + 6), 6 + (i // cols) * (h + 30)
        sheet.paste(im, (x, y + 26))
        d.text((x + 3, y + 4), cap, fill=(198, 255, 61), font=font)
    sheet.save(out, quality=86)


STATE_HEAD = """# {title}: состояние ролика

Новая сессия читает этот файл первым. Пишется коротко: что готово, что решено и почему, что дальше.

## Где остановились

## Что готово (файлы)

## Решения автора

## Следующий шаг

"""


def state(edit, mode):
    """блок «Последняя сборка» в STATE.md; остальное в файле пишут люди и сессии"""
    p = os.path.join(ROOT, "STATE.md")
    s = open(p, encoding="utf-8").read() if os.path.exists(p) else STATE_HEAD.format(title=CFG.get("title", NAME))
    a, b = "<!-- make.py: начало, правится автоматически -->", "<!-- make.py: конец -->"
    block = [a, "## Последняя сборка (make.py)", "",
             f"- {time.strftime('%d.%m %H:%M')}, режим `{mode}`: длина {edit['T']:.2f} с, сцен {len(edit['order'])}, предупреждений {len(WARN)}"]
    block += [f"  - {w}" for w in WARN] + [f"- {x}" for x in LOG] + [b]
    if a in s:
        s = s[:s.index(a)] + "\n".join(block) + s[s.index(b) + len(b):]
    else:
        s = s.rstrip("\n") + "\n\n" + "\n".join(block) + "\n"
    open(p, "w", encoding="utf-8").write(s)


def scene_option():
    """--scene s3,s4 или --scene=s3,s4"""
    for i, a in enumerate(sys.argv):
        if a.startswith("--scene="):
            return a.split("=", 1)[1]
        if a == "--scene" and i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return None


def scene_frames(edit, ids, comp, n=9):
    """лист одной сцены: n кадров финальной композиции от начала до конца сцены; подпись — время ролика,
    время в сцене и события, которые случились с прошлого кадра"""
    from PIL import Image, ImageDraw, ImageFont
    font = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 20)
    small = ImageFont.truetype("C:/Windows/Fonts/arial.ttf", 18)
    for sid in ids:
        if sid not in edit["scenes"]:
            sys.exit(f"нет сцены {sid} (есть: {', '.join(edit['order'])})")
        sc = edit["scenes"][sid]
        loc = [0.05 + (sc["dur"] - 0.1) * k / (n - 1) for k in range(n)]
        tmp = os.path.join(REVIEW, f"_scene_{sid}")
        os.makedirs(tmp, exist_ok=True)
        r = subprocess.run(["node", os.path.join(SK, "stills.mjs"), REM, comp, tmp, ",".join(f"{sc['at'] + t:.3f}" for t in loc)])
        if r.returncode:
            sys.exit("кадры не снялись")
        ims = [Image.open(os.path.join(tmp, f"{k:03}.png")).convert("RGB") for k in range(n)]
        w, h = 300, round(ims[0].height * 300 / ims[0].width)
        cols = 9 if h > w else 3
        rows = (n + cols - 1) // cols
        sheet = Image.new("RGB", (cols * (w + 6) + 6, rows * (h + 54) + 46), (18, 18, 18))
        d = ImageDraw.Draw(sheet)
        d.text((8, 10), f"{sid}: {sc['at']:.2f}–{sc['at'] + sc['dur']:.2f} с ({sc['dur']:.2f} с)  " + "  ".join(f"{k}={v}" for k, v in sc["ev"].items()), fill=(255, 255, 255), font=font)
        prev = -1
        for k, (im, t) in enumerate(zip(ims, loc)):
            x, y = 6 + (k % cols) * (w + 6), 46 + (k // cols) * (h + 54)
            sheet.paste(im.resize((w, h)), (x, y + 50))
            T = sc["at"] + t
            d.text((x + 3, y + 2), f"{int(T // 60)}:{T % 60:05.2f}  +{t:.2f}", fill=(198, 255, 61), font=font)
            fired = [e for e, v in sc["ev"].items() if prev < v <= t]
            d.text((x + 3, y + 26), ("▲ " + ", ".join(fired)) if fired else "", fill=(255, 140, 90), font=small)
            prev = t
        out = os.path.join(REVIEW, f"scene_{sid}.jpg")
        sheet.save(out, quality=86)
        shutil.rmtree(tmp, ignore_errors=True)
        print(f"   лист сцены {sid}: review/scene_{sid}.jpg")
        LOG.append(f"лист сцены {sid} ({n} кадров): `review/scene_{sid}.jpg`")


def main():
    scenes = scene_option()
    sample = next((x.split("=", 1)[1] for x in sys.argv if x.startswith("--sample=")), None)
    mode = "sample" if sample else "scene" if scenes else next((m for m in ("--build", "--audio", "--full", "--animatic") if m in sys.argv), "--draft")[2:]
    t0 = time.time()
    edit = build()
    LOG.append(f"сборка за {time.time() - t0:.0f} с, раскладка со словами: `edit_resolved.md`")
    rc = CFG.get("render", {})
    if mode == "scene":
        print(f"6. лист сцены {scenes}: 9 кадров финальной композиции")
        scene_frames(edit, scenes.split(","), rc["comp"])
    elif mode == "sample":
        a_, b_ = [float(x) for x in sample.split("-")]
        fps = rc.get("fps", 60)
        print(f"6. образец {a_}–{b_} с финальной композиции")
        out = os.path.join(REVIEW, "sample.mp4")
        dt = render(rc["comp"], out, [f"--frames={round(a_ * fps)}-{round(b_ * fps)}", "--log=error"])
        mb = phone_copy(out, os.path.join(REVIEW, "sample_phone.mp4"))
        LOG.append(f"образец {a_}–{b_} с за {dt / 60:.1f} мин: `review/sample.mp4`, телефон `review/sample_phone.mp4` ({mb:.0f} МБ)")
    elif mode == "animatic":
        print(f"6. аниматик {rc['animatic']}: заглушки сцен, слова, события, звук")
        out = os.path.join(REVIEW, "animatic.mp4")
        dt = render(rc["animatic"], out, ["--log=error"])
        mb = phone_copy(out, os.path.join(REVIEW, "animatic_phone.mp4"))
        scene_sheet(out, edit, os.path.join(REVIEW, "animatic_sheet.jpg"))
        print(f"   копия для телефона {mb:.0f} МБ: review/animatic_phone.mp4; лист: review/animatic_sheet.jpg")
        LOG.append(f"аниматик за {dt / 60:.1f} мин: `review/animatic.mp4`, телефон `review/animatic_phone.mp4` ({mb:.0f} МБ)")
    elif mode == "audio":
        print("6. только звук (картинка не рендерится)")
        dt = render(rc.get("audio", rc["comp"]), os.path.join(REVIEW, "audio_mix.wav"), ["--codec=wav", "--log=error"])
        LOG.append(f"звук ролика за {dt:.0f} с: `review/audio_mix.wav`")
    elif mode == "draft":
        print(f"6. черновой рендер {rc['draft']} (540×960, 30 к/с)")
        out = os.path.join(REVIEW, "draft.mp4")
        dt = render(rc["draft"], out, ["--log=error"])
        mb = phone_copy(out, os.path.join(REVIEW, "draft_phone.mp4"))
        scene_sheet(out, edit, os.path.join(REVIEW, "draft_sheet.jpg"))
        print(f"   копия для телефона {mb:.0f} МБ: review/draft_phone.mp4; лист кадров по сценам: review/draft_sheet.jpg")
        LOG.append(f"черновик за {dt / 60:.1f} мин: `review/draft.mp4`, телефон `review/draft_phone.mp4` ({mb:.0f} МБ), лист `review/draft_sheet.jpg`")
    elif mode == "full":
        out = os.path.join(ROOT, rc["out"])
        if os.path.exists(out) and "--force" not in sys.argv:
            out = os.path.join(ROOT, os.path.splitext(rc["out"])[0] + " (новый).mp4")
            print(f"   {rc['out']} уже есть, пишу рядом: {os.path.basename(out)} (--force перезапишет)")
        print(f"6. финальный рендер {rc['comp']}")
        dt = render(rc["comp"], out)
        mb = phone_copy(out, os.path.join(ROOT, "preview.mp4"))
        LOG.append(f"финал за {dt / 60:.1f} мин: `{os.path.basename(out)}`, телефон `preview.mp4` ({mb:.0f} МБ)")
    state(edit, mode)
    print(f"всё за {(time.time() - t0) / 60:.1f} мин; STATE.md обновлён")


main()
