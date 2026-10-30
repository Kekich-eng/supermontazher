// Ролик «Я заставил Claude Code и Codex драться друг с другом». 1920×1080, без лица.
// Вторая версия оформления (17.10.2026): тёмный динамичный моушен-дизайн вместо светлого минимализма (не понравился автору:
// «слишком пусто, белый фон режет глаза»). Фон с плавающими пятнами света двух цветов, стеклянные карточки, пружинные
// появления, счётчики, вжухи на сменах сцен. Бой по настоящей записи boj/match.json.
// Голос public/boj/voice.wav (300 с). В голос вставлены две паузы под бой: 12 с после v=215.1 и 16 с после v=229.9.
// Все времена ниже в секундах голоса, V() переводит их во время ролика.
import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {loadFont as loadGolos} from '@remotion/google-fonts/GolosText';
import {loadFont as loadMono} from '@remotion/google-fonts/IBMPlexMono';
import MATCH from './bojMatch.json';

const golos = loadGolos('normal', {weights: ['400', '500', '700', '800'], subsets: ['cyrillic', 'latin']});
const mono = loadMono('normal', {weights: ['400', '600'], subsets: ['cyrillic', 'latin']});
export const SANS = golos.fontFamily, MONO = mono.fontFamily;

const PAPER = 'transparent';
export const INK = '#EEF2EF', MUTED = '#8FA3A1', CL = '#E08A66', CX = '#3FC7C0';
const P1 = 215.1, D1 = 12, P2 = 229.9, D2 = 16;
const V = (v: number) => (v < P1 ? v : v < P2 ? v + D1 : v + D1 + D2);
export const BOJ_SECONDS = 300 + D1 + D2 + 0.5;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const f = (p: string) => staticFile('boj/' + p);

// ── кирпичики ───────────────────────────────────────────────────────────
const useSec = () => { const fr = useCurrentFrame(); const {fps} = useVideoConfig(); return fr / fps; };
export const Sfx: React.FC<{name: string; at: number; vol?: number}> = ({name, at, vol = 0.22}) => {
  const {fps} = useVideoConfig();
  return <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={45} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>;
};

// живой тёмный фон: два пятна света цветов бойцов, тонкая сетка, медленные частицы
export const Backdrop: React.FC = () => {
  const t = useSec();
  const ax1 = 30 + 12 * Math.sin(t * 0.13), ay1 = 30 + 10 * Math.cos(t * 0.11);
  const ax2 = 70 + 12 * Math.cos(t * 0.12), ay2 = 70 + 10 * Math.sin(t * 0.1);
  return <AbsoluteFill style={{background: '#080B0D'}}>
    <AbsoluteFill style={{background: `radial-gradient(circle at ${ax1}% ${ay1}%, rgba(224,138,102,0.30), transparent 42%), radial-gradient(circle at ${ax2}% ${ay2}%, rgba(63,199,192,0.26), transparent 44%)`}} />
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)', backgroundSize: '80px 80px', backgroundPosition: `0 ${(t * 12) % 80}px`}} />
    {new Array(28).fill(0).map((_, i) => {
      const x = random('px' + i) * 1920, sp = 8 + random('ps' + i) * 22, y = 1080 - ((random('py' + i) * 1080 + t * sp) % 1180);
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 3, height: 3, borderRadius: 2, background: i % 2 ? CL : CX, opacity: 0.35 + 0.3 * Math.sin(t + i)}} />;
    })}
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
  </AbsoluteFill>;
};

// кусок ролика от a до b (время голоса): влетает справа с размытием, на входе вжух
const Scene: React.FC<{a: number; b: number; bg?: string; fade?: number; children?: React.ReactNode; quiet?: boolean}> = ({a, b, bg, children, quiet}) => {
  const {fps} = useVideoConfig();
  const from = Math.round(V(a) * fps), dur = Math.max(1, Math.round((V(b) - V(a)) * fps));
  return <Sequence from={from} durationInFrames={dur} layout="none"><SceneBody dur={dur / fps} bg={bg}>{children}</SceneBody>{quiet ? null : <Sfx name="whoosh" at={0} vol={0.16} />}</Sequence>;
};
const SceneBody: React.FC<{dur: number; bg?: string; children?: React.ReactNode}> = ({dur, bg, children}) => {
  const t = useSec();
  const k = ease(interpolate(t, [0, 0.4], [0, 1], clamp)), out = interpolate(t, [dur - 0.18, dur], [1, 0], clamp);
  return <AbsoluteFill style={{background: bg, opacity: Math.min(1, k * 1.4) * out, transform: `translateX(${(1 - k) * 90}px) scale(${1.03 - 0.03 * k})`, filter: k < 1 ? `blur(${(1 - k) * 10}px)` : undefined}}>{children}</AbsoluteFill>;
};

// текст: пружинное появление; card — стеклянная карточка; подписи моноширинным шрифтом с разрядкой становятся плашками
const Txt: React.FC<{at: number; out?: number; x?: number; y?: number; w?: number; size?: number; color?: string; weight?: number; font?: string; align?: 'left' | 'center' | 'right'; children: React.ReactNode; base: number; ls?: number; card?: boolean}> = ({at, out, x = 160, y = 480, w = 1600, size = 52, color = INK, weight = 500, font = SANS, align = 'left', children, base, ls = 0, card}) => {
  const {fps} = useVideoConfig();
  const t = useSec() + V(base);
  const a = V(at), o = out !== undefined ? V(out) : 1e9;
  const big = size >= 56 && weight >= 700;
  const chip = font === MONO && ls > 0;
  const sp = spring({frame: Math.round((t - a) * fps), fps, config: {damping: 14, stiffness: 170, mass: 0.7}});
  const ko = interpolate(t, [o - 0.25, o], [1, 0], clamp);
  const sound = <Sfx name={big ? 'pop' : 'tick'} at={a - V(base)} vol={big ? 0.2 : 0.07} />;
  if (t < a || t > o) return sound;
  const inner = chip
    ? <span style={{display: 'inline-block', padding: '8px 18px', borderRadius: 999, border: `1.5px solid ${color === MUTED ? 'rgba(255,255,255,0.25)' : color}`, background: 'rgba(8,11,13,0.7)', color: color === MUTED ? '#C9D6D4' : color}}>{children}</span>
    : card ? <span style={{display: 'inline-block', padding: '26px 38px', borderRadius: 26, background: 'linear-gradient(135deg, rgba(14,18,20,0.78), rgba(14,18,20,0.55))', border: '1px solid rgba(255,255,255,0.16)', boxShadow: '0 20px 60px rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)'}}>{children}</span> : children;
  return <>{sound}<div style={{position: 'absolute', left: x, top: y, width: w, textAlign: align, fontFamily: font, fontSize: chip ? Math.max(24, size * 0.85) : size, fontWeight: weight, color, lineHeight: 1.16, letterSpacing: ls, opacity: Math.min(1, sp * 1.3) * ko, transform: `translateY(${(1 - sp) * 34}px) scale(${0.92 + 0.08 * sp})`, transformOrigin: align === 'center' ? '50% 50%' : '0 50%', textShadow: card || chip ? undefined : '0 3px 18px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)'}}>{inner}</div></>;
};

// число отсчитывается вверх
const Num: React.FC<{base: number; at: number; out?: number; to: number; fmt: (n: number) => string; x?: number; y: number; w?: number; size: number; color?: string; align?: 'left' | 'center'}> = ({base, at, out, to, fmt, x = 0, y, w = 1920, size, color = INK, align = 'center'}) => {
  const t = useSec() + V(base);
  const n = Math.round(to * ease(interpolate(t, [V(at), V(at) + 1.1], [0, 1], clamp)));
  return <Txt base={base} at={at} out={out} x={x} y={y} w={w} align={align} size={size} font={MONO} weight={700} color={color}>{fmt(n)}</Txt>;
};

// картинка бойца: выпрыгивает пружиной, светится цветом своего бойца, дышит
const Fig: React.FC<{src: string; x: number; bottom?: number; h: number; at?: number; base: number; gray?: boolean; style?: React.CSSProperties; out?: number}> = ({src, x, bottom = 90, h, at, base, gray, style, out}) => {
  const {fps} = useVideoConfig();
  const t = useSec() + V(base);
  const a = at !== undefined ? V(at) : V(base);
  const o = out !== undefined ? V(out) : 1e9;
  const snd = <Sfx name="swap" at={a - V(base)} vol={0.12} />;
  if (t < a || t > o) return snd;
  const sp = spring({frame: Math.round((t - a) * fps), fps, config: {damping: 13, stiffness: 120}});
  const breathe = 1 + 0.01 * Math.sin(t * 1.8);
  const glow = src.startsWith('claude') ? 'rgba(224,138,102,0.55)' : 'rgba(63,199,192,0.5)';
  return <>{snd}<Img src={f(src)} style={{position: 'absolute', left: x, bottom, height: h, transform: `translate(-50%, ${(1 - sp) * 80}px) scale(${(0.85 + 0.15 * sp) * breathe})`, transformOrigin: '50% 100%', opacity: Math.min(1, sp * 1.5) * interpolate(t, [o - 0.25, o], [1, 0], clamp), filter: gray ? 'grayscale(1) brightness(0.6) opacity(0.45)' : `drop-shadow(0 0 40px ${glow})`, ...style}} /></>;
};

// ролик Kling на весь кадр: влетает с наездом и вспышкой, потом медленный наезд
const Kl: React.FC<{src: string; a: number; dur?: number; children?: React.ReactNode}> = ({src, a, dur = 5, children}) => {
  const {fps} = useVideoConfig();
  return <Sequence from={Math.round(V(a) * fps)} durationInFrames={Math.round(dur * fps)} layout="none"><KlBody src={src} dur={dur}>{children}</KlBody><Sfx name="whoosh" at={0} vol={0.2} /></Sequence>;
};
const KlBody: React.FC<{src: string; dur: number; children?: React.ReactNode}> = ({src, dur, children}) => {
  const t = useSec();
  const k = ease(interpolate(t, [0, 0.5], [0, 1], clamp));
  const flash = interpolate(t, [0, 0.08, 0.35], [0.7, 0.35, 0], clamp);
  return <AbsoluteFill style={{background: '#000'}}>
    <OffthreadVideo src={f(src)} muted style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.14 - 0.14 * k + 0.05 * t / dur})`}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)'}} />
    <AbsoluteFill style={{background: `rgba(255,255,255,${flash})`}} />
    {children}
  </AbsoluteFill>;
};


// фон разговорных сцен: ролики Kling друг за другом, замедленные, с медленным наездом; сверху затемнение, чтобы читался текст
const Reel: React.FC<{base: number; b: number; clips: [string, number][]}> = ({base, b, clips}) => {
  const {fps} = useVideoConfig();
  const total = V(b) - V(base), seg = total / clips.length;
  return <>
    {clips.map(([src, off], i) => {
      const rate = Math.max(0.45, Math.min(1, (5.0 - off) / seg));
      return <Sequence key={i} from={Math.round(i * seg * fps)} durationInFrames={Math.round(seg * fps) + 8} layout="none"><ReelClip src={src} off={off} rate={rate} seg={seg} i={i} /></Sequence>;
    })}
    <AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(5,8,10,0.72) 0%, rgba(5,8,10,0.45) 45%, rgba(5,8,10,0.55) 100%)'}} />
    <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.6) 100%)'}} />
  </>;
};
const ReelClip: React.FC<{src: string; off: number; rate: number; seg: number; i: number}> = ({src, off, rate, seg, i}) => {
  const {fps} = useVideoConfig();
  const t = useSec();
  const o = interpolate(t, [0, 0.3], [0, 1], clamp);
  const z = 1.06 + 0.1 * (t / seg);
  return <AbsoluteFill style={{opacity: o}}>
    <OffthreadVideo src={f(src)} muted playbackRate={rate} startFrom={Math.round(off * fps)} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${z})`, transformOrigin: i % 2 ? '35% 45%' : '65% 45%'}} />
  </AbsoluteFill>;
};


// «никто не применил ультимейт»: оба ульта выпрыгивают по бокам, на слове «ультимейт» штамп «НЕ ПРИМЕНИЛ» и картинки гаснут
const UltShow: React.FC<{base: number; at: number; stamp: number; out: number}> = ({base, at, stamp, out}) => {
  const {fps} = useVideoConfig();
  const t = useSec() + V(base);
  const items: {src: string; x: number; name: string; col: string; delay: number}[] = [
    {src: 'codex_ult.png', x: 470, name: 'Рабочая сборка', col: CX, delay: 0},
    {src: 'claude_ult.png', x: 1450, name: 'Режим /goal', col: CL, delay: 0.25},
  ];
  const sounds = <>
    <Sfx name="whoosh" at={V(at) - V(base)} vol={0.3} />
    <Sfx name="whoosh" at={V(at) + 0.25 - V(base)} vol={0.25} />
    <Sfx name="alert" at={V(stamp) - V(base)} vol={0.3} />
    <Sfx name="alert" at={V(stamp) + 0.3 - V(base)} vol={0.25} />
  </>;
  if (t < V(at) || t > V(out)) return sounds;
  const ko = interpolate(t, [V(out) - 0.25, V(out)], [1, 0], clamp);
  return <>{sounds}{items.map((it, i) => {
    const sp = spring({frame: Math.round((t - V(at) - it.delay) * fps), fps, config: {damping: 12, stiffness: 140}});
    const st = t - V(stamp) - i * 0.3;
    const sk = st > 0 ? ease(interpolate(st, [0, 0.18], [0, 1], clamp)) : 0;
    const dead = st > 0 ? interpolate(st, [0.05, 0.5], [0, 1], clamp) : 0;
    const glow = it.col === CL ? 'rgba(224,138,102,0.75)' : 'rgba(63,199,192,0.75)';
    return <div key={i} style={{position: 'absolute', left: it.x, top: 470, width: 0, height: 0, opacity: ko}}>
      <Img src={f(it.src)} style={{position: 'absolute', left: 0, top: 0, height: 540, transform: `translate(-50%, ${(1 - sp) * 120}px) scale(${0.7 + 0.3 * sp})`, opacity: Math.min(1, sp * 1.5),
        filter: `grayscale(${dead * 0.85}) brightness(${1 - dead * 0.4}) drop-shadow(0 0 ${50 * (1 - dead)}px ${glow})`}} />
      <div style={{position: 'absolute', left: 0, top: 560, transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 800, fontSize: 40, color: it.col, opacity: Math.min(1, sp * 1.5) * (1 - dead * 0.5), textShadow: '0 3px 16px rgba(0,0,0,0.9)'}}>{it.name}</div>
      {sk > 0 ? <div style={{position: 'absolute', left: 0, top: 230, transform: `translate(-50%, -50%) rotate(-12deg) scale(${2.2 - 1.2 * sk})`, opacity: sk, whiteSpace: 'nowrap', fontFamily: SANS, fontWeight: 800, fontSize: 64, letterSpacing: 4, color: '#FF5A5A', border: '6px solid #FF5A5A', borderRadius: 12, padding: '6px 26px', background: 'rgba(20,6,6,0.55)', boxShadow: '0 0 40px rgba(255,90,90,0.45)'}}>НЕ ПРИМЕНИЛ</div> : null}
    </div>;
  })}</>;
};

const Line: React.FC<{x: number; y: number; w: number; at: number; base: number; color?: string; h?: number}> = ({x, y, w, at, base, color = 'rgba(255,255,255,0.6)', h = 3}) => {
  const t = useSec() + V(base);
  const k = ease(interpolate(t, [V(at), V(at) + 0.6], [0, 1], clamp));
  return <div style={{position: 'absolute', left: x, top: y, width: w * k, height: h, background: color, boxShadow: '0 0 18px rgba(255,255,255,0.35)'}} />;
};

// ── бой по записи ───────────────────────────────────────────────────────
// Вторая версия (17.10.2026): яркая арена, камера следит за бойцами и приближается, удары с искрами и цифрами урона,
// шестиугольный щит рассыпается под захватом, страницы Клода и послеобразы рывка Кодекса, интерфейс как в файтингах.
type Ev = {tick: number; who: string; type: string; move?: string; dmg?: number; crit?: boolean; grab?: boolean};
type Rnd = {result: string; hp: {claude: number; codex: number}; events: Ev[]; f: (number | string)[][]};
export const R = MATCH as unknown as Rnd[];
const SPR: Record<string, {stance: [number, number]; attack: [number, number]; ult: [number, number]; hit: [number, number]}> = {
  claude: {stance: [600, 0.5], attack: [560, 0.72], ult: [680, 0.52], hit: [585, 0.66]},
  codex: {stance: [600, 0.5], attack: [600, 0.42], ult: [570, 0.3], hit: [600, 0.5]},
};
const ax = (x: number) => 420 + (x - 60) * (1080 / 880);   // координата арены → мир
const FLOOR = 950;
const OFF = 140;
// у Клода картинка атаки это вихрь страниц: только для «Миллиона токенов»; захват он делает выпадом из стойки
const pose = (who: string, a: string, ph: string, st: number) => (st > 0 ? 'hit' : a === 'ult' ? (ph === 'startup' ? 'stance' : 'ult') : (who === 'claude' ? a === 'm2' : ['m1', 'm2', 'm3', 'grab'].includes(a)) && ph !== 'recovery' ? 'attack' : 'stance');
export const kf = (t: number, keys: [number, number][]) => { const xs = keys.map((k) => k[0]), ys = keys.map((k) => k[1]); return interpolate(t, xs, ys, clamp); };
const bodyX = (who: 'claude' | 'codex', x: number) => ax(x) - (who === 'codex' ? 1 : -1) * OFF;

const Sprite: React.FC<{who: 'claude' | 'codex'; a: string; ph: string; st: number; base: number; flash?: number; ghost?: number}> = ({who, a, ph, st, base, flash = 0, ghost}) => {
  const key = pose(who, a, ph, st), [h, cx] = SPR[who][key];
  const glow = who === 'claude' ? 'rgba(224,138,102,0.55)' : 'rgba(63,199,192,0.55)';
  return <Img src={f(`${who}_${key}.png`)} style={{position: 'absolute', left: base, top: FLOOR - h, height: h, transform: `translateX(-${cx * 100}%)`,
    opacity: ghost ?? 1, filter: ghost !== undefined ? `brightness(1.6) saturate(0) drop-shadow(0 0 20px ${glow})` : `drop-shadow(0 0 26px ${glow})${flash > 0.02 ? ` brightness(${1 + flash * 1.2})` : ''}`}} />;
};

const Fighter: React.FC<{who: 'claude' | 'codex'; fr: (number | string)[]; recoil: number; flash: number}> = ({who, fr, recoil, flash}) => {
  const o = who === 'claude' ? 0 : 8;
  const x = fr[o] as number, a = fr[o + 3] as string, ph = fr[o + 4] as string, st = fr[o + 6] as number;
  const dir = who === 'codex' ? 1 : -1;
  const lunge = ['m1', 'm3', 'grab', 'm2'].includes(a) && ph === 'active' ? 55 : ['m1', 'm3', 'grab'].includes(a) && ph === 'startup' ? -18 : 0;
  const base = bodyX(who, x) + dir * lunge - dir * recoil;
  return <>
    <div style={{position: 'absolute', left: base - 130, top: FLOOR - 14, width: 260, height: 30, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', filter: 'blur(10px)'}} />
    <Sprite who={who} a={a} ph={ph} st={st} base={base} flash={flash} />
  </>;
};

// шестиугольный щит перед Кодексом; при захвате разлетается осколками
const Hex: React.FC<{x: number; on: number; shatter: number}> = ({x, on, shatter}) => {
  const pts = (r: number) => new Array(6).fill(0).map((_, i) => `${Math.cos(Math.PI / 3 * i + Math.PI / 6) * r},${Math.sin(Math.PI / 3 * i + Math.PI / 6) * r * 1.5}`).join(' ');
  if (shatter > 0) return <>{new Array(9).fill(0).map((_, i) => {
    const ang = (i / 9) * Math.PI * 2, d = (1 - shatter) * 260;
    return <div key={i} style={{position: 'absolute', left: x + Math.cos(ang) * d, top: FLOOR - 340 + Math.sin(ang) * d, width: 34, height: 22, background: CX, opacity: shatter, transform: `rotate(${ang * 90}deg)`, clipPath: 'polygon(0 0, 100% 30%, 60% 100%)', boxShadow: `0 0 18px ${CX}`}} />;
  })}</>;
  if (on <= 0) return null;
  return <svg style={{position: 'absolute', left: x - 160, top: FLOOR - 340 - 240, overflow: 'visible', opacity: on}} width={320} height={480}>
    <g transform="translate(160,240)">
      <polygon points={pts(150)} fill="rgba(63,199,192,0.16)" stroke={CX} strokeWidth={6} style={{filter: `drop-shadow(0 0 22px ${CX})`}} />
      <polygon points={pts(105)} fill="none" stroke="rgba(63,199,192,0.55)" strokeWidth={3} />
    </g>
  </svg>;
};

const Fight: React.FC<{ri: number; a: number; b: number; keys: [number, number][]; label: string; sound?: boolean}> = ({ri, a, b, keys, label, sound = true}) => {
  const {fps} = useVideoConfig();
  const r = R[ri], dur = V(b) - V(a);
  // обратная раскладка: тик → секунда; повторяющиеся тики (стоп-кадр) убираем, иначе interpolate падает
  const inv = keys.filter((k, i) => i === keys.length - 1 || keys[i + 1][1] > k[1]);
  const tOf = (tick: number) => interpolate(tick, inv.map((k) => k[1]), inv.map((k) => k[0]), clamp);
  const lo = keys[0][1], hi = keys[keys.length - 1][1];
  let last = -1;
  const hits = sound ? r.events.filter((e) => (e.type === 'hit' || e.type === 'blocked') && e.tick >= lo && e.tick <= hi).map((e) => ({t: tOf(e.tick), big: !!e.grab || (e.dmg || 0) >= 70, blk: e.type === 'blocked'})).filter((h) => { if (h.t - last < 0.12) return false; last = h.t; return h.t < dur; }) : [];
  const shields = sound ? r.events.filter((e) => e.type === 'predict' && e.tick >= lo && e.tick <= hi).map((e) => tOf(e.tick)) : [];
  const koT = tOf(r.f.length - 1);
  return <Sequence from={Math.round(V(a) * fps)} durationInFrames={Math.round(dur * fps)} layout="none"><FightBody ri={ri} keys={keys} label={label} />
    {hits.map((h, i) => <Sfx key={i} name={h.blk ? 'tick' : 'pop'} at={h.t} vol={h.blk ? 0.2 : h.big ? 0.42 : 0.28} />)}
    {shields.map((s, i) => <Sfx key={'s' + i} name="swap" at={s} vol={0.2} />)}
    {sound && label !== 'запись боя' ? <><Sfx name="alert" at={0.05} vol={0.22} /><Sfx name="whoosh" at={0.5} vol={0.3} /></> : null}
    {sound && koT < dur ? <><Sfx name="ding" at={koT} vol={0.45} /><Sfx name="whoosh" at={koT} vol={0.35} /></> : null}
  </Sequence>;
};

export const FightBody: React.FC<{ri: number; keys: [number, number][]; label: string; hud?: boolean}> = ({ri, keys, label, hud = true}) => {
  const t = useSec(), r = R[ri], N = r.f.length;
  const tk = Math.min(N - 1, kf(t, keys));
  const slow = kf(t + 0.1, keys) - tk < 1.6 && tk > 0 && tk < N - 1;   // эпизод в замедлении
  const i = Math.floor(tk), fr0 = r.f[i], fr1 = r.f[Math.min(N - 1, i + 1)], k = tk - i;
  const fr = fr0.map((v, j) => (j === 0 || j === 8) && typeof v === 'number' ? v + ((fr1[j] as number) - v) * k : v);
  const ev = r.events.filter((e) => e.tick <= tk);
  const lastOf = (pred: (e: Ev) => boolean) => { for (let j = ev.length - 1; j >= 0; j--) if (pred(ev[j])) return ev[j]; return undefined; };
  const age = (e?: Ev) => (e ? tk - e.tick : 1e9);
  const hitC = lastOf((e) => e.who === 'claude' && e.type === 'hit'), hitX = lastOf((e) => e.who === 'codex' && e.type === 'hit');
  const onCodex = Math.max(0, 1 - age(hitC) / 12), onClaude = Math.max(0, 1 - age(hitX) / 12);
  const predict = lastOf((e) => e.type === 'predict');
  const grabC = lastOf((e) => e.who === 'claude' && e.type === 'hit' && !!e.grab);
  const broke = predict && grabC && grabC.tick >= predict.tick && grabC.tick - predict.tick < 20;
  const shieldOn = predict && age(predict) < 20 && !broke ? Math.min(1, age(predict) / 2 + 0.3) : 0;
  const shatter = broke ? Math.max(0, 1 - age(grabC) / 14) : 0;
  const x15 = broke ? Math.max(0, 1 - age(grabC) / 26) : 0;
  const shields = ev.filter((e) => e.type === 'predict').length;
  const hpC = fr[1] as number, hpX = fr[9] as number;
  const back = r.f[Math.max(0, i - 14)];
  const trailC = back[1] as number, trailX = back[9] as number;
  const sec = Math.floor(tk / 30), ko = tk >= N - 1;
  const koAt = (keys.find((kk) => kk[1] >= N - 1) || keys[keys.length - 1])[0];
  const hitAmt = Math.max(onCodex, onClaude);
  // камера: середина между бойцами, ближе бой — крупнее, на ударе толчок
  const cxX = bodyX('codex', fr[8] as number), cxC = bodyX('claude', fr[0] as number);
  const mid = (cxX + cxC) / 2, dist = cxC - cxX;
  const z = Math.max(1.06, Math.min(1.34, 1.5 - dist / 1500)) + 0.07 * hitAmt + (slow ? 0.1 : 0);
  const tx = Math.max(1920 - 1920 * z, Math.min(0, 960 - mid * z));
  const ty = (FLOOR - 380) * (1 - z) + 40 * (z - 1);
  const sh = {x: (random('sx' + Math.floor(tk * 2)) - 0.5) * 26 * hitAmt, y: (random('sy' + Math.floor(tk * 2)) - 0.5) * 18 * hitAmt};
  const ca = fr[3] as string, cph = fr[4] as string, xa = fr[11] as string, xph = fr[12] as string;
  const intro = interpolate(t, [0, 0.4], [0, 1], clamp);
  // послеобразы рывка Кодекса
  const ghosts = xa === 'm3' && xph !== 'recovery' ? [3, 6, 9].map((d) => r.f[Math.max(0, i - d)][8] as number) : [];
  const contact = (mid);
  const hitLast = age(hitC) <= age(hitX) ? hitC : hitX;
  const sparkAmt = Math.max(0, 1 - age(hitLast) / 8);
  const sparkCol = hitLast && hitLast.who === 'claude' ? '#FFD9A8' : '#B9FFF8';
  const dmgFloat = (e: Ev | undefined, x: number, col: string) => {
    if (!e || age(e) > 22) return null;
    const kk = age(e) / 22, big = (e.dmg || 0) >= 80 || e.crit;
    return <div style={{position: 'absolute', left: x, top: FLOOR - 600 - kk * 60, transform: `translateX(-50%) scale(${age(e) < 3 ? 1.5 - age(e) * 0.17 : 1})`, fontFamily: SANS, fontWeight: 800, fontSize: big ? 78 : 60, color: e.crit ? '#FFD36B' : col, opacity: 1 - kk * kk, textShadow: '0 4px 0 rgba(0,0,0,0.6), 0 0 30px rgba(0,0,0,0.5)', WebkitTextStroke: '2px rgba(0,0,0,0.5)'}}>-{e.dmg}{e.crit ? '!' : ''}</div>;
  };
  return <AbsoluteFill style={{background: '#000', overflow: 'hidden'}}>
    {/* мир: арена, бойцы, эффекты */}
    <AbsoluteFill style={{transformOrigin: '0 0', transform: `translate(${tx + sh.x}px, ${ty + sh.y}px) scale(${z})`}}>
      <Img src={f('arena.jpg')} style={{position: 'absolute', left: -60, top: -40, width: 2040, height: 1160, objectFit: 'cover', filter: 'brightness(0.92) saturate(1.08)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: FLOOR - 4, height: 130, background: 'linear-gradient(rgba(0,0,0,0.0), rgba(0,0,0,0.35))'}} />
      {ghosts.map((gx, j) => <Sprite key={j} who="codex" a="m3" ph="startup" st={0} base={bodyX('codex', gx)} ghost={0.4 - j * 0.12} />)}
      {/* страницы «Миллиона токенов» */}
      {ca === 'm2' && cph !== 'recovery' ? new Array(16).fill(0).map((_, j) => {
        const p = ((fr[5] as number) / 14 + j / 16) % 1, sx = cxC - 80, ex = cxX + 40;
        return <div key={j} style={{position: 'absolute', left: sx + (ex - sx) * p, top: FLOOR - 260 - Math.sin(p * Math.PI + j) * 160 - (j % 4) * 40, width: 38, height: 50, background: '#F6EBD4', border: '1px solid #D7B98C', boxShadow: '0 0 16px rgba(255,200,140,0.8)', transform: `rotate(${j * 37 + p * 360}deg)`, opacity: 0.95}} />;
      }) : null}
      <Fighter who="codex" fr={fr} recoil={onCodex * 40} flash={onCodex} />
      <Fighter who="claude" fr={fr} recoil={onClaude * 40} flash={onClaude} />
      {/* линии скорости тычка */}
      {xa === 'm1' && xph === 'active' ? new Array(5).fill(0).map((_, j) => <div key={j} style={{position: 'absolute', left: cxX + 120, top: FLOOR - 400 + j * 22, width: 140 + j * 20, height: 4, background: CX, opacity: 0.8, boxShadow: `0 0 12px ${CX}`}} />) : null}
      <Hex x={cxX + 150} on={shieldOn} shatter={shatter} />
      {/* искры удара */}
      {sparkAmt > 0 ? <>
        <div style={{position: 'absolute', left: contact - 120 * (1.6 - sparkAmt), top: FLOOR - 360 - 120 * (1.6 - sparkAmt), width: 240 * (1.6 - sparkAmt), height: 240 * (1.6 - sparkAmt), borderRadius: '50%', background: `radial-gradient(circle, rgba(255,255,255,${sparkAmt}) 0%, ${sparkCol} 30%, transparent 70%)`}} />
        {new Array(12).fill(0).map((_, j) => {
          const ang = (j / 12) * Math.PI * 2 + (hitLast ? hitLast.tick : 0), len = 60 + 180 * (1 - sparkAmt);
          return <div key={j} style={{position: 'absolute', left: contact + Math.cos(ang) * len * 0.6, top: FLOOR - 360 + Math.sin(ang) * len * 0.6, width: 46 * sparkAmt + 6, height: 5, background: sparkCol, transform: `rotate(${ang}rad)`, opacity: sparkAmt, boxShadow: `0 0 10px ${sparkCol}`}} />;
        })}
      </> : null}
      {dmgFloat(hitC, cxX, '#FFFFFF')}
      {dmgFloat(hitX, cxC, '#FFFFFF')}
      {x15 > 0 ? <div style={{position: 'absolute', left: cxX - 40, top: FLOOR - 720, transform: `translateX(-50%) scale(${age(grabC) < 4 ? 1.9 - age(grabC) * 0.22 : 1}) rotate(-6deg)`, fontFamily: SANS, fontWeight: 800, fontSize: 104, color: '#FFD36B', opacity: Math.min(1, x15 * 2.2), textShadow: '0 6px 0 #7A3B12, 0 0 40px rgba(255,180,80,0.8)'}}>×1,5</div> : null}
    </AbsoluteFill>
    {/* кинополосы на замедлении */}
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: slow ? 70 : 0, background: '#000'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: slow ? 70 : 0, background: '#000'}} />
    {shields === 1 && predict && age(predict) < 60 && label !== 'запись боя' ? <div style={{position: 'absolute', left: 0, right: 0, top: 830, textAlign: 'center'}}>
      <span style={{display: 'inline-block', padding: '14px 34px', background: CX, color: '#05211F', fontFamily: SANS, fontWeight: 800, fontSize: 48, letterSpacing: 3, transform: `skewX(-10deg) scale(${age(predict) < 4 ? 1.4 - age(predict) * 0.1 : 1})`, boxShadow: '0 10px 40px rgba(0,0,0,0.5)'}}>ЩИТ ПО ПРИВЫЧКЕ</span>
    </div> : null}
    {/* интерфейс файтинга */}
    <div style={{position: 'absolute', left: 60, right: 60, top: slow ? 92 : 46, opacity: hud ? intro : 0, color: '#fff', fontFamily: SANS}}>
      {[['codex', hpX, trailX, CX, 'КОДЕКС', fr[10] as number], ['claude', hpC, trailC, CL, 'КЛОД', fr[2] as number]].map(([who, hp, tr, col, name, en]) => {
        const left = who === 'codex';
        const W = 720;
        return <div key={who as string} style={{position: 'absolute', [left ? 'left' : 'right']: 0, top: 0, width: W}}>
          <div style={{display: 'flex', flexDirection: left ? 'row' : 'row-reverse', alignItems: 'center', gap: 14, marginBottom: 10}}>
            <div style={{width: 64, height: 64, borderRadius: 14, overflow: 'hidden', border: `3px solid ${col}`, background: '#111'}}><Img src={f(`${who}_stance.png`)} style={{width: 64, height: 140, objectFit: 'cover', objectPosition: '50% 0%'}} /></div>
            <div style={{fontWeight: 800, fontSize: 34, letterSpacing: 2}}>{name as string}</div>
            <div style={{fontFamily: MONO, fontSize: 28, color: col as string}}>{Math.round(hp as number)}</div>
          </div>
          <div style={{position: 'relative', height: 30, background: 'rgba(0,0,0,0.6)', border: '2px solid rgba(255,255,255,0.35)', transform: `skewX(${left ? -18 : 18}deg)`, overflow: 'hidden'}}>
            <div style={{position: 'absolute', [left ? 'right' : 'left']: 0, top: 0, bottom: 0, width: `${100 * (tr as number) / 1500}%`, background: '#fff', opacity: 0.85}} />
            <div style={{position: 'absolute', [left ? 'right' : 'left']: 0, top: 0, bottom: 0, width: `${100 * (hp as number) / 1500}%`, background: `linear-gradient(${col}, ${col}CC)`, boxShadow: `0 0 20px ${col}`}} />
          </div>
          <div style={{position: 'relative', height: 8, marginTop: 8, width: '60%', [left ? 'marginRight' : 'marginLeft']: 'auto', background: 'rgba(255,255,255,0.15)', transform: `skewX(${left ? -18 : 18}deg)`}}>
            <div style={{position: 'absolute', [left ? 'right' : 'left']: 0, top: 0, bottom: 0, width: `${en as number}%`, background: '#FFD36B'}} />
          </div>
        </div>;
      })}
      <div style={{position: 'absolute', left: '50%', top: -6, transform: 'translateX(-50%)', textAlign: 'center'}}>
        <div style={{fontFamily: MONO, fontSize: 22, letterSpacing: 4, color: '#C9D6D4'}}>{label}</div>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 64, lineHeight: 1}}>{String(Math.max(0, 60 - sec)).padStart(2, '0')}</div>
      </div>
      {shields > 0 && label !== 'запись боя' ? <div style={{position: 'absolute', left: 0, top: 150, fontFamily: SANS, fontWeight: 800, fontSize: 30, color: '#05211F', background: CX, padding: '6px 18px', transform: 'skewX(-12deg)'}}>ЩИТ ПО ПРИВЫЧКЕ ×{String(shields).padStart(2, '0')}</div> : null}
    </div>
    {/* «РАУНД N / БОЙ!» */}
    {label !== 'запись боя' && t < 1.4 ? <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: `rgba(0,0,0,${0.45 * interpolate(t, [1.0, 1.4], [1, 0], clamp)})`}}>
      {t < 0.55 ? <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 130, color: '#fff', letterSpacing: 6, transform: `scale(${1.6 - 0.6 * ease(interpolate(t, [0, 0.25], [0, 1], clamp))})`, textShadow: '0 8px 0 rgba(0,0,0,0.5)'}}>{label}</div>
        : <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 210, color: '#FFD36B', transform: `scale(${2.2 - 1.2 * ease(interpolate(t, [0.55, 0.75], [0, 1], clamp))}) rotate(-4deg)`, opacity: interpolate(t, [1.1, 1.4], [1, 0], clamp), textShadow: '0 10px 0 #7A3B12, 0 0 60px rgba(255,180,80,0.7)'}}>БОЙ!</div>}
    </AbsoluteFill> : null}
    {/* K.O. */}
    {ko ? <KoSplash hp={Math.round(hpC)} t={t - koAt} /> : null}
  </AbsoluteFill>;
};
const KoSplash: React.FC<{hp: number; t: number}> = ({hp, t}) => {
  const k = ease(interpolate(t, [0, 0.22], [0, 1], clamp));
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: `rgba(0,0,0,${0.35 * k})`}}>
    <AbsoluteFill style={{background: `rgba(255,255,255,${interpolate(t, [0, 0.05, 0.4], [0.9, 0.6, 0], clamp)})`}} />
    <div style={{fontFamily: SANS, fontWeight: 800, fontSize: 260, letterSpacing: 10, color: '#fff', transform: `scale(${3 - 2 * k}) rotate(-5deg)`, textShadow: `0 12px 0 ${CL}, 0 0 80px rgba(224,138,102,0.9)`}}>K.O.</div>
    <div style={{fontFamily: MONO, fontSize: 40, color: '#fff', marginTop: 20, opacity: interpolate(t, [0.35, 0.6], [0, 1], clamp), background: 'rgba(0,0,0,0.5)', padding: '10px 26px', borderRadius: 12}}>раунд Клоду · осталось {hp} HP</div>
  </AbsoluteFill>;
};

// ── схема арены для объяснений (рифма стены) ────────────────────────────
const MINI_LINE = 'rgba(255,255,255,0.55)';
const Mini: React.FC<{base: number; who: 'claude' | 'codex'; keys: [number, number][]; label?: string; at?: number}> = ({base, who, keys, label, at}) => {
  const t = useSec() + V(base);
  if (at !== undefined && t < V(at)) return null;
  const x = kf(t, keys.map(([s, v]) => [V(s), v]));
  const L = 260, Rr = 1660;
  return <>
    <div style={{position: 'absolute', left: L, top: 820, width: Rr - L, height: 3, background: MINI_LINE}} />
    <div style={{position: 'absolute', left: L, top: 420, width: 3, height: 402, background: MINI_LINE}} />
    <div style={{position: 'absolute', left: Rr, top: 420, width: 3, height: 402, background: MINI_LINE}} />
    <Img src={f(`${who}_stance.png`)} style={{position: 'absolute', left: L + (Rr - L) * x, top: 820 - 360, height: 360, transform: 'translateX(-50%)', filter: `drop-shadow(0 0 30px ${who === 'claude' ? 'rgba(224,138,102,0.5)' : 'rgba(63,199,192,0.5)'})`}} />
    {label ? <div style={{position: 'absolute', left: L, top: 850, fontFamily: MONO, fontSize: 28, color: MUTED}}>{label}</div> : null}
  </>;
};

// ── ролик ────────────────────────────────────────────────────────────────
export const Boj: React.FC<{music?: boolean}> = ({music = true}) => {
  const {fps} = useVideoConfig();
  const S = (v: number) => Math.round(V(v) * fps);
  const fightA = 197.4;
  const musicVol = (fr: number) => {
    const t = fr / fps;
    const inFight = t >= V(fightA) && t < V(P2);
    const pause = (t >= P1 && t < P1 + D1) || (t >= P2 + D1 && t < P2 + D1 + D2);
    let v = inFight ? (pause ? 0.42 : 0.12) : 0.085;
    // после каждого KO полсекунды тишины, счёт появляется в тишине
    for (const ko of [V(fightA) + 28.3, P1 + D1 + 29.2]) if (t > ko && t < ko + 0.6) v *= 0.05;
    return v * interpolate(t, [0, 1.5, BOJ_SECONDS - 3, BOJ_SECONDS], [0, 1, 1, 0], clamp);
  };
  return <AbsoluteFill style={{background: '#080B0D', fontFamily: SANS}}>
    <Backdrop />
    {/* ВХОД */}
    <Kl src="kling_3_face_off.mp4" a={0}>
      <Txt base={0} at={0.6} out={4.8} x={120} y={940} size={30} font={MONO} color="#fff" ls={4}>CLAUDE CODE  vs  CODEX</Txt>
    </Kl>
    <Fight ri={0} a={5} b={10.7} keys={[[0, 560], [5.7, 730]]} label="запись боя" />
    <Scene a={10.7} b={16.9} bg={PAPER}>
      <Reel base={10.7} b={16.9} clips={[['kling_3_face_off.mp4', 0.8]]} />
      <Txt base={10.7} at={12.4} x={0} w={1920} y={150} align="center" size={64} weight={700} card>«правила против меня»</Txt>
      <Txt base={10.7} at={15.0} x={0} w={1920} y={240} align="center" size={34} color={MUTED}>но по порядку</Txt>
    </Scene>

    {/* ЗАДАНИЕ */}
    <Scene a={16.9} b={32.2} bg={PAPER}>
      <Reel base={16.9} b={32.2} clips={[['kling_7_respect.mp4', 0], ['kling_3_face_off.mp4', 0.3]]} />
      <Txt base={16.9} at={17.0} x={160} y={160} size={30} font={MONO} color={MUTED} ls={3}>ЗАДАНИЕ</Txt>
      <Txt base={16.9} at={19.0} x={160} y={230} size={72} weight={700}>Создайте себе персонажа.</Txt>
      <Txt base={16.9} at={20.6} out={23.8} x={160} y={350} size={44} color={MUTED}>навыки · характеристики · слабость</Txt>
      <Txt base={16.9} at={23.9} out={27.4} x={160} y={350} size={44} color={MUTED}>и промпт: каким вы хотите себя видеть</Txt>
      <Txt base={16.9} at={27.5} x={160} y={350} size={44} color={MUTED}>картинки нарисовал ChatGPT</Txt>
    </Scene>

    {/* КЛОД */}
    <Kl src="kling_1_claude_intro.mp4" a={32.2} />
    <Scene a={37.2} b={51.45} bg={PAPER}>
      <Reel base={37.2} b={51.45} clips={[['kling_1_claude_intro.mp4', 0.5], ['kling_8_claude_victory.mp4', 0]]} />
      <Txt base={37.2} at={37.3} out={44.7} x={160} y={330} size={120} weight={700} color={CL}>Клод</Txt>
      <Txt base={37.2} at={39.2} out={44.7} x={166} y={480} size={40} color={MUTED}>Хранитель Контекста</Txt>
      <Txt base={37.2} at={41.7} out={44.7} x={166} y={560} size={40}>удар слабенький, голова светлая</Txt>
      <Txt base={37.2} at={44.8} x={160} y={160} size={30} font={MONO} color={MUTED} ls={3}>СЛАБОСТЬ</Txt>
      <Fig base={37.2} at={45.0} src="claude_ult.png" x={1300} h={700} />
      <Txt base={37.2} at={47.1} x={160} y={300} w={900} size={56} weight={700}>перед самым мощным приёмом он спрашивает…</Txt>
    </Scene>
    <Kl src="kling_4_claude_ask.mp4" a={51.45} dur={3.8}>
      <Txt base={51.45} at={51.5} out={55.2} x={0} w={1920} y={880} align="center" size={64} weight={700} color="#fff">«Можно я это сделаю?»</Txt>
    </Kl>

    {/* КОДЕКС */}
    <Kl src="kling_2_codex_intro.mp4" a={55.25} />
    <Scene a={60.25} b={67.0} bg={PAPER}>
      <Reel base={60.25} b={67.0} clips={[['kling_2_codex_intro.mp4', 0.8]]} />
      <Txt base={60.25} at={60.3} x={980} y={300} size={120} weight={700} color={CX}>Кодекс</Txt>
      <Txt base={60.25} at={60.6} x={986} y={450} size={40}>быстрый, бьёт коротко и точно</Txt>
      <Txt base={60.25} at={62.3} x={986} y={160} size={30} font={MONO} color={MUTED} ls={3}>СЛАБОСТЬ</Txt>
      <Txt base={60.25} at={62.6} x={986} y={560} w={800} size={44}>соперник два раза подряд делает одно и то же…</Txt>
      <Txt base={60.25} at={66.0} x={986} y={690} size={84} font={MONO} color={CL}>■ ■ <span style={{color: CX}}>?</span></Txt>
    </Scene>
    <Kl src="kling_5_codex_shield.mp4" a={67.0}>
      <Txt base={67.0} at={71.0} out={72.0} x={0} w={1920} y={880} align="center" size={60} weight={700} color="#fff">по привычке</Txt>
    </Kl>

    {/* АРЕНА */}
    <Scene a={72.0} b={97.3} bg={PAPER}>
      <Reel base={72.0} b={97.3} clips={[['kling_3_face_off.mp4', 0], ['kling_5_codex_shield.mp4', 0], ['kling_8_claude_victory.mp4', 0.5]]} />
      <Txt base={72.0} at={72.1} out={79.5} x={0} w={1920} y={420} align="center" size={64} weight={700} card>можно было просто нарисовать драку</Txt>
      <Txt base={72.0} at={75.7} out={79.5} x={0} w={1920} y={530} align="center" size={40} color={MUTED}>но тогда победителя выбрал бы я</Txt>
      <Txt base={72.0} at={79.6} x={160} y={140} size={30} font={MONO} color={MUTED} ls={3}>НАСТОЯЩАЯ АРЕНА</Txt>
      <Txt base={72.0} at={82.1} x={160} y={200} size={44}>удары, урон, скорость: всё посчитано в коде</Txt>
      <Mini base={72.0} at={79.6} who="claude" keys={[[79.6, 0.7], [97.3, 0.7]]} />
      <Txt base={72.0} at={88.4} x={160} y={300} size={44}>а мозг своему бойцу каждый пишет <b>сам</b></Txt>
      <Txt base={72.0} at={92.1} x={1150} y={360} size={36} font={MONO} color={MUTED}>30 раз в секунду:</Txt>
      <Txt base={72.0} at={95.2} x={1520} y={360} size={36} font={MONO} color={CL}>бить</Txt>
      <Txt base={72.0} at={95.7} x={1520} y={410} size={36} font={MONO} color={CL}>блокировать</Txt>
      <Txt base={72.0} at={96.4} x={1520} y={460} size={36} font={MONO} color={CL}>отходить</Txt>
    </Scene>

    {/* ПРОВЕРКА */}
    <Scene a={97.3} b={123.1} bg={PAPER}>
      <Reel base={97.3} b={123.1} clips={[['kling_2_codex_intro.mp4', 0], ['kling_5_codex_shield.mp4', 0.5], ['kling_3_face_off.mp4', 0.5]]} />
      <Txt base={97.3} at={97.4} out={102.2} x={0} w={1920} y={400} align="center" size={64} weight={700} card>арену писал Claude</Txt>
      <Txt base={97.3} at={99.9} out={102.2} x={0} w={1920} y={510} align="center" size={44} color={CL}>а вдруг подыграл себе?</Txt>
      <Txt base={97.3} at={102.3} out={118.4} x={160} y={160} size={30} font={MONO} color={MUTED} ls={3}>CODEX ПРОВЕРЯЕТ</Txt>
      <Txt base={97.3} at={103.9} out={109.2} x={160} y={420} size={72} weight={700} card>«проверь соперника»</Txt>
      <Txt base={97.3} at={105.8} out={109.2} x={160} y={560} size={48} font={MONO}>проверка <span style={{color: CX}}>1</span></Txt>
      <Txt base={97.3} at={106.6} out={109.2} x={520} y={560} size={48} font={MONO} color={CX}>2</Txt>
      <Txt base={97.3} at={107.4} out={109.2} x={610} y={560} size={48} font={MONO} color={CX}>3</Txt>
      {/* одновременный удар: сначала удар Клода раньше, потом поровну */}
      <Txt base={97.3} at={109.3} out={118.4} x={160} y={400} size={40} color={MUTED}>оба бьют в одно мгновение</Txt>
      <Sequence from={Math.round((V(109.6) - V(97.3)) * 30)} durationInFrames={Math.round((118.4 - 109.6) * 30)} layout="none"><Line base={109.6} at={109.6} x={160} y={600} w={1600} /></Sequence>
      <Txt base={97.3} at={110.2} out={116.0} x={760} y={540} size={44} font={MONO} color={CL}>│ клод</Txt>
      <Txt base={97.3} at={110.2} out={116.0} x={900} y={620} size={44} font={MONO} color={CX}>│ кодекс</Txt>
      <Txt base={97.3} at={112.4} out={116.0} x={160} y={680} size={44}>удар Клода засчитывался <b style={{color: CL}}>первым</b></Txt>
      <Txt base={97.3} at={116.0} out={118.4} x={830} y={540} size={44} font={MONO} color={CL}>│ клод</Txt>
      <Txt base={97.3} at={116.0} out={118.4} x={830} y={620} size={44} font={MONO} color={CX}>│ кодекс</Txt>
      <Txt base={97.3} at={116.0} out={118.4} x={160} y={680} size={44}>исправили: теперь проходят оба</Txt>
      <Txt base={97.3} at={118.6} x={0} w={1920} y={440} align="center" size={60} weight={700} card>код соперника подсмотреть нельзя</Txt>
    </Scene>

    {/* ПРИЗНАНИЕ */}
    <Scene a={123.1} b={169.0} bg={PAPER}>
      <Reel base={123.1} b={169.0} clips={[['kling_4_claude_ask.mp4', 0], ['kling_2_codex_intro.mp4', 0.5], ['kling_1_claude_intro.mp4', 0.5], ['kling_3_face_off.mp4', 0.5], ['kling_7_respect.mp4', 0.5]]} />
      <Txt base={123.1} at={123.2} out={126.4} x={0} w={1920} y={460} align="center" size={56} weight={700} card>а дальше случилось неожиданное</Txt>
      <Fig base={123.1} at={126.5} out={137.9} src="claude_stance.png" x={1350} h={620} />
      <Fig base={123.1} at={127.6} out={137.9} src="codex_stance.png" x={650} h={620} gray />
      <Txt base={123.1} at={128.6} out={137.9} x={160} y={110} size={30} font={MONO} color={MUTED} ls={3}>СПАРРИНГ</Txt>
      <Num base={123.1} at={133.6} out={137.9} to={100} fmt={(n) => `0 / ${n}`} y={120} size={140} color={CL} />
      <Txt base={123.1} at={133.9} out={137.9} x={0} w={1920} y={290} align="center" size={36} font={MONO} color={MUTED}>побед Клода</Txt>
      <Txt base={123.1} at={138.0} out={149.0} x={160} y={160} size={30} font={MONO} color={MUTED} ls={3}>CLAUDE → CODEX</Txt>
      <Txt base={123.1} at={141.4} out={149.0} x={160} y={300} w={1500} size={72} weight={700}>«Правила нечестные. <span style={{color: CL}}>Против меня.</span>»</Txt>
      <Txt base={123.1} at={145.4} out={149.0} x={160} y={440} w={1500} size={72} weight={700}>«Решай ты.»</Txt>
      <Txt base={123.1} at={153.3} out={156.2} x={0} w={1920} y={440} align="center" size={72} weight={700} card>«у тебя перчатки лучше»</Txt>
      <Fig base={123.1} at={156.3} src="codex_attack.png" x={560} h={620} out={169.0} />
      <Txt base={123.1} at={156.6} out={169.0} x={1000} y={260} size={30} font={MONO} color={MUTED} ls={3}>CODEX РЕШИЛ</Txt>
      <Txt base={123.1} at={157.6} out={169.0} x={1000} y={320} size={48} font={MONO}>замах тычка <span style={{color: MUTED}}>5</span> → <span style={{color: CX}}>7</span> кадров</Txt>
      <Txt base={123.1} at={158.2} out={169.0} x={1000} y={385} size={32} color={MUTED}>удар стал медленнее</Txt>
      <Txt base={123.1} at={160.6} out={169.0} x={1000} y={470} size={48} font={MONO}>здоровье <span style={{color: MUTED}}>1000</span> → <span style={{color: INK}}>1500</span></Txt>
      <Txt base={123.1} at={164.2} out={169.0} x={1000} y={560} w={800} size={48} weight={700}>соперники вместе чинили правила</Txt>
    </Scene>

    {/* ТРЕНИРОВКИ: рифма стены, часть 1 */}
    <Scene a={169.0} b={183.2} bg={PAPER}>
      <Reel base={169.0} b={183.2} clips={[['kling_1_claude_intro.mp4', 0], ['kling_4_claude_ask.mp4', 0.5]]} />
      <Txt base={169.0} at={169.1} x={160} y={140} size={30} font={MONO} color={MUTED} ls={3}>ТРЕНИРОВКА КЛОДА</Txt>
      <Mini base={169.0} who="claude" keys={[[169, 0.62], [172, 0.62], [176.5, 0.97], [179.5, 0.97], [181.5, 0.6], [183.2, 0.6]]} />
      <Txt base={169.0} at={175.5} out={179.5} x={1180} y={220} size={44} color={CL}>у стены от захвата не уйти</Txt>
      <Txt base={169.0} at={179.6} x={1180} y={220} size={44}>держать центр</Txt>
    </Scene>
    <Scene a={183.2} b={190.8} bg={PAPER}>
      <Reel base={183.2} b={190.8} clips={[['kling_2_codex_intro.mp4', 0.3]]} />
      <Txt base={183.2} at={183.5} x={1000} y={260} size={30} font={MONO} color={MUTED} ls={3}>ТРЕНИРОВКА КОДЕКСА</Txt>
      <Num base={183.2} at={185.6} to={352} fmt={(n) => `${n}/352`} x={1000} w={900} align="left" y={330} size={150} color={CX} />
      <Txt base={183.2} at={189.2} x={1006} y={540} size={44}>ни одного поражения</Txt>
    </Scene>
    <Scene a={190.8} b={197.4}>
      <Img src={f('vs.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.6) brightness(0.65)'}} />
      <Txt base={190.8} at={191.0} x={0} w={1920} y={440} align="center" size={64} weight={700} color="#fff">официальный бой</Txt>
      <Txt base={190.8} at={192.4} x={0} w={1920} y={540} align="center" size={40} font={MONO} color="#fff">1 запуск · без повторов</Txt>
    </Scene>

    {/* БОЙ */}
    <Fight ri={0} a={197.4} b={P1 + 0.0001} keys={[[0, 0], [1.2, 0], [7.7, 330], [11.2, 378], [17.2, 950], [17.7 + D1 - 1.4, R[0].f.length - 1]]} label="РАУНД 1" />
    <Fight ri={1} a={P1 + 0.0002} b={P2 + 0.0001} keys={[[0, 0], [1.0, 0], [8, 450], [14.8, 700], [14.8 + D2 - 1.6, R[1].f.length - 1]]} label="РАУНД 2" />

    {/* ИТОГ */}
    <Kl src="kling_6_codex_defeat.mp4" a={P2 + 0.0002} dur={3.2} />
    <Kl src="kling_8_claude_victory.mp4" a={233.1} dur={3.6}>
      <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 90, fontFamily: MONO, color: '#fff', background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0) 55%)'}}>
        <div style={{fontSize: 150, fontWeight: 600, textShadow: '0 4px 30px rgba(0,0,0,0.6)'}}><span style={{color: '#F2B49A'}}>2</span> : <span style={{color: '#7FD6CF'}}>0</span></div>
        <div style={{fontSize: 36, letterSpacing: 4}}>ПОБЕДИЛ КЛОД</div>
      </AbsoluteFill>
    </Kl>
    {/* РАЗБОР */}
    <Scene a={236.7} b={256.2} bg={PAPER}>
      <Reel base={236.7} b={256.2} clips={[['kling_3_face_off.mp4', 0.6], ['kling_5_codex_shield.mp4', 0.3]]} />
      <Txt base={236.7} at={236.7} x={160} y={140} size={30} font={MONO} color={MUTED} ls={3}>РАЗБОР</Txt>
      <UltShow base={236.7} at={237.4} stamp={239.5} out={245.1} />
      <Txt base={236.7} at={237.3} out={245.1} x={0} w={1920} y={150} align="center" size={200} font={MONO} weight={600}>0</Txt>
      <Txt base={236.7} at={237.6} out={245.1} x={0} w={1920} y={380} align="center" size={52} weight={700}>ультимейтов за весь бой</Txt>
      <Txt base={236.7} at={240.4} out={245.1} x={0} w={1920} y={450} align="center" size={34} color="#FFD36B">у Кодекса до конца полная энергия: 100 из 100</Txt>
      <Txt base={236.7} at={245.2} out={249.1} x={0} w={1920} y={440} align="center" size={60} weight={700} card>Кодекс не стоял столбом</Txt>
      <Num base={236.7} at={249.2} out={253.5} to={15} fmt={(n) => `${n}`} y={300} size={220} color={CX} />
      <Txt base={236.7} at={249.5} out={253.5} x={0} w={1920} y={560} align="center" size={52}>захватов Кодекса за раунд</Txt>
      <Num base={236.7} at={253.6} to={16} fmt={(n) => `${n}`} y={300} size={220} color={CL} />
      <Txt base={236.7} at={253.8} x={0} w={1920} y={560} align="center" size={52}>щитов по привычке: лишний урон себе</Txt>
    </Scene>
    {/* рифма стены, часть 2 */}
    <Scene a={256.2} b={266.0} bg={PAPER}>
      <Reel base={256.2} b={266.0} clips={[['kling_6_codex_defeat.mp4', 0]]} />
      <Txt base={256.2} at={256.3} x={160} y={140} size={30} font={MONO} color={MUTED} ls={3}>СНАЧАЛА</Txt>
      <Mini base={256.2} who="claude" keys={[[256.2, 0.96], [261.4, 0.96]]} label="Клод на тренировке" />
      <Sequence from={Math.round((V(261.5) - V(256.2)) * fps)} layout="none">
        <AbsoluteFill style={{background: 'rgba(8,11,13,0.55)'}}>
          <div style={{position: 'absolute', left: 160, top: 140, fontFamily: MONO, fontSize: 30, color: MUTED, letterSpacing: 3}}>В ИТОГЕ</div>
          <Mini base={261.5} who="codex" keys={[[261.5, 0.03], [266, 0.03]]} label="Кодекс в бою" />
        </AbsoluteFill>
      </Sequence>
    </Scene>
    <Scene a={266.0} b={272.9} bg={PAPER}>
      <Reel base={266.0} b={272.9} clips={[['kling_7_respect.mp4', 0]]} />
      <Txt base={266.0} at={266.1} x={0} w={1920} y={380} align="center" size={56} weight={700} card>после боя проверили код друг друга</Txt>
      <Txt base={266.0} at={268.0} x={0} w={1920} y={545} align="center" size={56} font={MONO}><span style={{color: CL}}>✓ честно</span>   <span style={{color: CX}}>✓ честно</span></Txt>
      <Txt base={266.0} at={270.5} x={0} w={1920} y={650} align="center" size={34} color={MUTED}>отпечатки файлов совпали</Txt>
    </Scene>

    {/* СЛОВО ПРОИГРАВШЕМУ */}
    <Scene a={272.9} b={286.1} bg={PAPER}>
      <Reel base={272.9} b={286.1} clips={[['kling_6_codex_defeat.mp4', 0.3], ['kling_5_codex_shield.mp4', 0]]} />
      <Txt base={272.9} at={273.0} x={900} y={180} size={30} font={MONO} color={MUTED} ls={3}>КОДЕКС ПОСЛЕ БОЯ</Txt>
      <Txt base={272.9} at={278.0} out={281.4} x={900} y={400} w={880} size={60} weight={700}>«Ты поймал меня на моей же привычке.</Txt>
      <Txt base={272.9} at={281.5} out={283.1} x={900} y={400} w={880} size={60} weight={700}>Научился отвечать на захват,</Txt>
      <Txt base={272.9} at={283.2} x={900} y={400} w={880} size={60} weight={700} color={CX}>но не научился выходить из размена.»</Txt>
    </Scene>
    <Scene a={286.1} b={293.5} bg={PAPER}>
      <Reel base={286.1} b={293.5} clips={[['kling_3_face_off.mp4', 0.5]]} />
      <Txt base={286.1} at={286.2} out={289.9} x={0} w={1920} y={460} align="center" size={52} color={MUTED}>по-моему, это вообще про людей</Txt>
      <Txt base={286.1} at={290.0} x={0} w={1920} y={400} align="center" size={44} color={MUTED}>победил не тот, кто быстрее</Txt>
      <Txt base={286.1} at={291.4} x={0} w={1920} y={480} align="center" size={64} weight={700} card>а тот, кто не повторял свою ошибку</Txt>
    </Scene>
    <Kl src="kling_7_respect.mp4" a={293.5} dur={5.04} />
    <Scene a={298.5} b={300.5}>
      <Img src={f('after.jpg')} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.5) brightness(0.55)'}} />
      <Txt base={298.5} at={298.5} x={0} w={1920} y={470} align="center" size={60} weight={700} color="#fff">кого с кем дальше?</Txt>
    </Scene>

    {/* ЗВУК */}
    <Sequence from={0} durationInFrames={S(P1) + 1}><Audio src={f('voice.wav')} endAt={Math.round(P1 * fps)} /></Sequence>
    <Sequence from={Math.round((P1 + D1) * fps)} durationInFrames={Math.round((P2 - P1) * fps) + 1}><Audio src={f('voice.wav')} startFrom={Math.round(P1 * fps)} endAt={Math.round(P2 * fps)} /></Sequence>
    <Sequence from={Math.round((P2 + D1 + D2) * fps)}><Audio src={f('voice.wav')} startFrom={Math.round(P2 * fps)} /></Sequence>
    {music ? <Audio loop src={f('music.mp3')} volume={musicVol} /> : null}
  </AbsoluteFill>;
};

// Образец: вступление и бойцы (0–72 с голоса) + первый раунд целиком
export const BojSample: React.FC = () => {
  const {fps} = useVideoConfig();
  return <AbsoluteFill>
    <Sequence durationInFrames={72 * fps}><Boj /></Sequence>
    <Sequence from={72 * fps} durationInFrames={Math.round((P1 + D1 - 196.5) * fps)}><Sequence from={-Math.round(196.5 * fps)}><Boj /></Sequence></Sequence>
  </AbsoluteFill>;
};
export const BOJ_SAMPLE_SECONDS = 72 + (P1 + D1 - 196.5);
