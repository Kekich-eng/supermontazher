// Набор кирпичиков тёмного динамичного моушен-дизайна канала (собран 18.10.2026 из Boj.tsx и BotShort.tsx).
// Скопируй в src/ общего проекта (video/remotion) или импортируй оттуда: import {...} from './kit'.
// Все времена — секунды ЛОКАЛЬНОГО времени (внутри <Scene> отсчёт идёт от её начала).
// Звуки берутся из public/sfx/<имя>.wav (их делает scripts/gen_sfx.py): pop, whoosh, ding, tick, swap, alert.
import React from 'react';
import {AbsoluteFill, Audio, Easing, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {DISPLAY, FONT} from './ui';

export const MONO = "Consolas, 'Cascadia Mono', monospace";
export const RUB = "'Segoe UI', Arial, sans-serif";   // в Manrope/Unbounded нет знака ₽
export const K = {
  ink: '#080B0D', text: '#EEF2EF', muted: '#8FA3A1',
  lime: '#C6FF3D', cyan: '#3DE8FF', teal: '#3FC7C0', coral: '#E08A66', gold: '#FFC94D', red: '#FF5A5A', pink: '#FF2E6A',
};
export const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const SOFT = {damping: 14, stiffness: 170, mass: 0.7};
export const HARD = {damping: 8, stiffness: 210, mass: 0.6};
export type SfxName = 'pop' | 'whoosh' | 'ding' | 'tick' | 'swap' | 'alert' | 'hit_sub' | 'hit_hard' | 'hit_metal' | 'hit_soft' | 'hit_snare' | 'stamp' | 'chord_hit' | 'whoosh_fast' | 'whoosh_mid' | 'whoosh_long' | 'whoosh_deep' | 'swish' | 'swish_pan' | 'whoosh_in' | 'riser_short' | 'riser_long' | 'reverse_hit' | 'downlifter' | 'sub_drop' | 'tape_stop' | 'drone_low' | 'click_soft' | 'click_hard' | 'toggle' | 'hover' | 'key' | 'typing' | 'enter' | 'notify' | 'success' | 'error' | 'counter' | 'glitch_short' | 'glitch_long' | 'static' | 'data' | 'powerup' | 'powerdown' | 'shimmer' | 'sparkle_up' | 'bell_soft' | 'scissors' | 'paper' | 'shutter' | 'lock_in' | 'snap';
// длинные звуки библиотеки (секунды): остальным хватает 1,5 с
const SFX_LEN: Partial<Record<SfxName, number>> = {hit_sub: 3, hit_metal: 3.5, chord_hit: 2.9, riser_short: 2, riser_long: 4.1, reverse_hit: 2.3, sub_drop: 2.3, drone_low: 4, success: 1.8, shimmer: 2.6, sparkle_up: 2.5, bell_soft: 3.8};

export const useSec = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};
export const useSpringAt = (at: number, cfg = SOFT) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - Math.round(at * fps), fps, config: cfg});
};
export const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
export const abs = (x: number, y: number, w?: number): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w});
export const fmtNum = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// звук в момент at
export const Sfx: React.FC<{name: SfxName; at: number; vol?: number}> = ({name, at, vol = 0.22}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={Math.round((SFX_LEN[name] ?? 1.5) * fps)} layout="none">
      <Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} />
    </Sequence>
  );
};
// звук из скачанной библиотеки public/sfx/lib: file как в video/sfx-library/catalog.md, играет до своего конца
export const SfxFile: React.FC<{file: string; at: number; vol?: number}> = ({file, at, vol = 0.22}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.max(0, Math.round(at * fps))} layout="none">
      <Audio src={staticFile(`sfx/${file}`)} volume={vol} />
    </Sequence>
  );
};
// список звуков [время, звук, громкость] — удобно держать отдельно от сцен
export const Pings: React.FC<{list: [number, SfxName, number?][]}> = ({list}) => (
  <>{list.map(([at, n, v], i) => <Sfx key={i} name={n} at={at} vol={v ?? 0.3} />)}</>
);

// ── фоны ─────────────────────────────────────────────────────────────────
// горизонтальный: два плавающих пятна света, бегущая сетка, частицы, виньетка
export const Backdrop: React.FC<{a?: string; b?: string; base?: string}> = ({a = K.coral, b = K.teal, base = K.ink}) => {
  const t = useSec();
  const {width, height} = useVideoConfig();
  const x1 = 30 + 12 * Math.sin(t * 0.13), y1 = 30 + 10 * Math.cos(t * 0.11);
  const x2 = 70 + 12 * Math.cos(t * 0.12), y2 = 70 + 10 * Math.sin(t * 0.1);
  return (
    <AbsoluteFill style={{background: base}}>
      <AbsoluteFill style={{background: `radial-gradient(circle at ${x1}% ${y1}%, ${a}4D, transparent 42%), radial-gradient(circle at ${x2}% ${y2}%, ${b}42, transparent 44%)`}} />
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '80px 80px', backgroundPosition: `0 ${(t * 12) % 80}px`}} />
      {new Array(28).fill(0).map((_, i) => {
        const x = random('px' + i) * width, sp = 8 + random('ps' + i) * 22, y = height - ((random('py' + i) * height + t * sp) % (height + 100));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3, height: 3, borderRadius: 2, background: i % 2 ? a : b, opacity: 0.35 + 0.3 * Math.sin(t + i)}} />;
      })}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};

// вертикальный неоновый: пол-сетка в перспективе бежит на зрителя, частицы вверх, строки развёртки.
// alarm — отрезки [с, по], когда всё краснеет
export const NeonFloor: React.FC<{color?: string; alarm?: [number, number][]}> = ({color = '198,255,61', alarm = []}) => {
  const t = useSec();
  const {width, height} = useVideoConfig();
  let al = 0;
  for (const [s, e] of alarm) al = Math.max(al, interpolate(t, [s, s + 0.25, e - 0.35, e], [0, 1, 1, 0], clamp));
  const col = al > 0.5 ? '255,70,70' : color;
  const mask = 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 45%)';
  return (
    <AbsoluteFill style={{background: '#05070A'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 30%, rgba(${col},0.22) 0%, rgba(${col},0.05) 38%, rgba(0,0,0,0) 65%)`}} />
      <div style={{position: 'absolute', left: -width / 2, top: height * 0.61, width: width * 2, height: height * 0.73, transform: 'perspective(900px) rotateX(64deg)', transformOrigin: '50% 0%', backgroundImage: `linear-gradient(rgba(${col},0.55) 3px, transparent 3px), linear-gradient(90deg, rgba(${col},0.55) 3px, transparent 3px)`, backgroundSize: '120px 120px', backgroundPosition: `0 ${(t * 160) % 120}px`, maskImage: mask, WebkitMaskImage: mask, opacity: 0.6}} />
      {Array.from({length: 46}).map((_, i) => {
        const x = random(`x${i}`) * width, sp = 60 + random(`s${i}`) * 220, sz = 3 + random(`z${i}`) * 7;
        const y = height - ((t * sp + random(`o${i}`) * height) % (height + 80));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: sz, background: `rgba(${col},${0.25 + random(`a${i}`) * 0.5})`, boxShadow: `0 0 ${sz * 3}px rgba(${col},0.8)`}} />;
      })}
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, transparent 2px, transparent 6px)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};

// ── сцены ────────────────────────────────────────────────────────────────
// кусок ролика от a до b. 'slide' — влёт справа с размытием (длинные ролики), 'zoom' — наезд из глубины
// и пролёт сквозь кадр на выходе (шортсы). На входе вжух, если не quiet.
export const Scene: React.FC<{a: number; b: number; mode?: 'slide' | 'zoom'; quiet?: boolean; children?: React.ReactNode}> = ({a, b, mode = 'slide', quiet, children}) => {
  const {fps} = useVideoConfig();
  const from = Math.round(a * fps), dur = Math.max(1, Math.round((b - a) * fps));
  return (
    <Sequence from={from} durationInFrames={dur} layout="none">
      <SceneBody dur={dur / fps} mode={mode}>{children}</SceneBody>
      {quiet ? null : <Sfx name="whoosh" at={0} vol={0.16} />}
    </Sequence>
  );
};
const SceneBody: React.FC<{dur: number; mode: 'slide' | 'zoom'; children?: React.ReactNode}> = ({dur, mode, children}) => {
  const t = useSec();
  if (mode === 'zoom') {
    const i = ramp(t, 0, 0.28), o = ramp(t, dur - 0.2, dur);
    return <AbsoluteFill style={{opacity: Math.min(i * 1.4, 1) * (1 - o), transform: `scale(${0.7 + 0.3 * (1 - Math.pow(1 - i, 3)) + o * o * 0.9})`, filter: `blur(${(1 - i) * 14 + o * 10}px)`}}>{children}</AbsoluteFill>;
  }
  const k = ease(ramp(t, 0, 0.4)), out = 1 - ramp(t, dur - 0.18, dur);
  return <AbsoluteFill style={{opacity: Math.min(1, k * 1.4) * out, transform: `translateX(${(1 - k) * 90}px) scale(${1.03 - 0.03 * k})`, filter: k < 1 ? `blur(${(1 - k) * 10}px)` : undefined}}>{children}</AbsoluteFill>;
};

// ── появления ────────────────────────────────────────────────────────────
// любой блок: пружиной в момент at, мягко гаснет к out
export const Rise: React.FC<{at: number; out?: number; from?: 'up' | 'down' | 'left' | 'right' | 'scale'; hard?: boolean; style?: React.CSSProperties; children: React.ReactNode}> = ({at, out, from = 'up', hard, style, children}) => {
  const t = useSec();
  const s = useSpringAt(at, hard ? HARD : SOFT);
  if (t < at) return null;
  const ko = out === undefined ? 1 : 1 - ramp(t, out - 0.25, out);
  if (ko <= 0) return null;
  const d = (1 - s) * 90;
  const tr = from === 'up' ? `translateY(${d}px)` : from === 'down' ? `translateY(${-d}px)` : from === 'left' ? `translateX(${-d}px)` : from === 'right' ? `translateX(${d}px)` : `scale(${0.3 + 0.7 * s})`;
  return <div style={{opacity: Math.min(1, s * 1.5) * ko, transform: tr, ...style}}>{children}</div>;
};

// стеклянная карточка
export const Glass: React.FC<{accent?: string; style?: React.CSSProperties; children: React.ReactNode}> = ({accent, style, children}) => (
  <div style={{padding: '26px 38px', borderRadius: 26, background: 'linear-gradient(135deg, rgba(14,18,20,0.78), rgba(14,18,20,0.55))', border: `1px solid ${accent ? accent + '88' : 'rgba(255,255,255,0.16)'}`, boxShadow: `0 20px 60px rgba(0,0,0,0.55)${accent ? `, 0 0 40px ${accent}33` : ''}`, backdropFilter: 'blur(8px)', color: K.text, fontFamily: FONT, ...style}}>{children}</div>
);
// неоновая рамка (шортсы)
export const neon = (c: string): React.CSSProperties => ({border: `4px solid ${c}`, boxShadow: `0 0 34px ${c}99, inset 0 0 26px ${c}33`, background: 'rgba(5,7,10,0.82)'});
// плашка-таблетка моноширинным шрифтом: «ШАГ 3», «РАУНД 1», «×4»
export const Chip: React.FC<{color?: string; size?: number; children: React.ReactNode}> = ({color = K.lime, size = 26, children}) => (
  <span style={{display: 'inline-block', padding: '8px 18px', borderRadius: 999, border: `1.5px solid ${color}`, background: 'rgba(8,11,13,0.7)', color, fontFamily: MONO, fontWeight: 700, fontSize: size, letterSpacing: 3, textTransform: 'uppercase'}}>{children}</span>
);
// штамп: падает с размаху и чуть повёрнут — «БЕСПЛАТНО», «ОПАСНО», «K.O.»
export const Stamp: React.FC<{at: number; text: string; color?: string; size?: number; rot?: number; style?: React.CSSProperties}> = ({at, text, color = K.red, size = 70, rot = -7, style}) => {
  const t = useSec();
  const s = useSpringAt(at, HARD);
  const snd = <Sfx name="alert" at={at} vol={0.3} />;
  if (t < at) return snd;
  return (
    <>{snd}<div style={{opacity: Math.min(1, s * 2.5), transform: `rotate(${rot}deg) scale(${3 - 2 * s})`, ...style}}>
      <div style={{display: 'inline-block', fontFamily: DISPLAY, fontWeight: 900, fontSize: size, color, border: `8px solid ${color}`, borderRadius: 18, padding: '8px 28px', background: 'rgba(6,10,12,0.88)', letterSpacing: 2, whiteSpace: 'nowrap', boxShadow: '0 16px 44px rgba(0,0,0,0.55)'}}>{text}</div>
    </div></>
  );
};
// заголовок с глитчем: цветные двойники дёргаются первые 0,45 с
export const Glitch: React.FC<{at: number; size?: number; color?: string; style?: React.CSSProperties; children: React.ReactNode}> = ({at, size = 120, color = '#fff', style, children}) => {
  const t = useSec();
  const f = useCurrentFrame();
  const s = useSpringAt(at, HARD);
  if (t < at) return null;
  const g = Math.max(0, 1 - (t - at) / 0.45);
  const dx = (random(`g${f}`) - 0.5) * 46 * g, dy = (random(`h${f}`) - 0.5) * 16 * g;
  const base: React.CSSProperties = {fontFamily: DISPLAY, fontWeight: 900, fontSize: size, lineHeight: 1.02, textAlign: 'center'};
  return (
    <div style={{position: 'relative', opacity: Math.min(1, s * 3), transform: `scale(${2.6 - 1.6 * s})`, ...style}}>
      <div style={{...base, position: 'absolute', inset: 0, color: K.cyan, transform: `translate(${dx}px, ${dy}px)`, opacity: g, mixBlendMode: 'screen'}}>{children}</div>
      <div style={{...base, position: 'absolute', inset: 0, color: K.pink, transform: `translate(${-dx}px, ${-dy}px)`, opacity: g, mixBlendMode: 'screen'}}>{children}</div>
      <div style={{...base, color, textShadow: `0 0 40px ${color}88, 0 10px 30px rgba(0,0,0,0.8)`}}>{children}</div>
    </div>
  );
};
// счётчик: число отсчитывается от 0 до to за dur секунд
export const Count: React.FC<{at: number; to: number; dur?: number; fmt?: (n: number) => string; style?: React.CSSProperties}> = ({at, to, dur = 1.1, fmt = fmtNum, style}) => {
  const t = useSec();
  const n = to * ease(ramp(t, at, at + dur));
  return <span style={{fontFamily: DISPLAY, fontWeight: 900, fontVariantNumeric: 'tabular-nums', ...style}}>{fmt(n)}</span>;
};
// искры из точки в момент at (удар, «щёлк», открытие)
export const Burst: React.FC<{at: number; x: number; y: number; color?: string; n?: number; r?: number}> = ({at, x, y, color = K.lime, n = 18, r = 220}) => {
  const t = useSec();
  const p = ramp(t, at, at + 0.6);
  if (p <= 0 || p >= 1) return null;
  return <>{Array.from({length: n}).map((_, i) => {
    const ang = (i / n) * Math.PI * 2 + random(`ba${i}${at}`) * 0.5, d = r * ease(p) * (0.6 + random(`bd${i}${at}`) * 0.6);
    return <div key={i} style={{position: 'absolute', left: x + Math.cos(ang) * d, top: y + Math.sin(ang) * d, width: 8, height: 8, borderRadius: 4, background: color, boxShadow: `0 0 16px ${color}`, opacity: 1 - p}} />;
  })}</>;
};
// белая вспышка на весь кадр (смена плана, удар)
export const Flash: React.FC<{at: number; dur?: number; color?: string}> = ({at, dur = 0.25, color = '#fff'}) => {
  const t = useSec();
  const o = interpolate(t, [at, at + 0.03, at + dur], [0, 0.7, 0], clamp);
  return o > 0 ? <AbsoluteFill style={{background: color, opacity: o, pointerEvents: 'none'}} /> : null;
};

// ── камера ───────────────────────────────────────────────────────────────
// тряска на ударах hits (секунды) — оборачивает всю картинку
export const Shake: React.FC<{hits: number[]; power?: number; children: React.ReactNode}> = ({hits, power = 1, children}) => {
  const t = useSec();
  const f = useCurrentFrame();
  let k = 0;
  for (const h of hits) if (t >= h && t < h + 0.32) k = Math.max(k, 1 - (t - h) / 0.32);
  k *= power;
  return <AbsoluteFill style={{transform: `translate(${Math.sin(f * 2.9) * 16 * k}px, ${Math.cos(f * 3.7) * 12 * k}px) scale(${1 + 0.035 * k})`}}>{children}</AbsoluteFill>;
};
// медленный наезд камеры (Кен Бёрнс) на время from..to
export const Drift: React.FC<{from: number; to: number; zoom?: number; children: React.ReactNode}> = ({from, to, zoom = 0.06, children}) => {
  const t = useSec();
  return <AbsoluteFill style={{transform: `scale(${1 + zoom * ramp(t, from, to)})`}}>{children}</AbsoluteFill>;
};

// ── шортсы: субтитры и прогресс ──────────────────────────────────────────
type W = {w: string; s: number; e: number};
export const makeChunks = (words: W[], maxWords = 3, maxChars = 20) => {
  const out: {s: number; e: number; words: W[]}[] = [];
  let cur: W[] = [];
  words.forEach((w, i) => {
    cur.push(w);
    const nxt = words[i + 1];
    const len = cur.map((x) => x.w).join(' ').length;
    if (!nxt || /[.?!,:]$/.test(w.w) || cur.length >= maxWords || len + nxt.w.length > maxChars || nxt.s - w.e > 0.35) {
      out.push({s: cur[0].s, e: nxt ? Math.min(nxt.s, w.e + 0.5) : w.e + 0.6, words: cur});
      cur = [];
    }
  });
  return out;
};
// субтитры по 2–3 слова, текущее слово подсвечено. top 1470 — ниже интерфейс Shorts закрывает кадр.
export const Captions: React.FC<{chunks: ReturnType<typeof makeChunks>; top?: number; hi?: string}> = ({chunks, top = 1470, hi = K.lime}) => {
  const {fps} = useVideoConfig();
  const f = useCurrentFrame();
  const t = f / fps;
  const c = chunks.find((x) => t >= x.s - 0.02 && t < x.e);
  if (!c) return null;
  const pop = spring({frame: f - Math.round(c.s * fps), fps, config: {damping: 12, mass: 0.4, stiffness: 240}});
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top, display: 'flex', justifyContent: 'center', transform: `scale(${0.86 + 0.14 * pop})`}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 66, lineHeight: 1.15, textAlign: 'center', textTransform: 'uppercase', WebkitTextStroke: '10px #05070A', paintOrder: 'stroke fill', textShadow: '0 6px 0 #05070A'}}>
        {c.words.map((w, i) => {
          const on = t >= w.s - 0.02 && t < w.e + 0.08;
          return <span key={i} style={{color: on ? hi : '#fff', marginRight: 16, display: 'inline-block', transform: on ? 'translateY(-4px) scale(1.06)' : 'none'}}>{w.w.replace(/[.,:!]$/g, '')}</span>;
        })}
      </div>
    </div>
  );
};
export const Progress: React.FC<{total: number; color?: string}> = ({total, color = K.lime}) => {
  const t = useSec();
  const {width} = useVideoConfig();
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width, height: 10, background: 'rgba(255,255,255,0.08)'}}>
      <div style={{width: `${Math.min(1, t / total) * 100}%`, height: '100%', background: color, boxShadow: `0 0 20px ${color}`}} />
    </div>
  );
};

// ── время с паузами ──────────────────────────────────────────────────────
// В голос вставлены паузы (бой, живая реакция)? Пиши все времена в секундах голоса, а этот перевод
// превратит их во время ролика: const V = voiceToVideo([[215.1, 12], [229.9, 16]]);
export const voiceToVideo = (pauses: [number, number][]) => (v: number) => v + pauses.filter(([at]) => v >= at).reduce((s, [, d]) => s + d, 0);
