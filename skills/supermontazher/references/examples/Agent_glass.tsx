// Ролик «Собрал своего ИИ-агента по частям». 1920×1080, без лица.
// Формат «создание персонажа»: слева список деталей, в центре робот собирается по частям, справа содержимое детали.
// Вторая версия оформления (13.10.2026): объёмные плитки-иконки и стеклянные панели вместо эмодзи, робот-андроид,
// сдержанная палитра под зелёный фон (лайм, бирюза, золото, коралл только для «нельзя»).
// Озвучка: public/agent/voice.wav, 186.33 с. Времена в коде стоят по первой версии озвучки;
// после 45.41 с из голоса вырезана запинка 0.2 с, поэтому useT() прибавляет сдвиг, а звуки его вычитают.
// public/agent/phone.mp4: настоящая съёмка телефона, на который приходит уведомление от бота.
import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, DISPLAY, FONT, Sfx} from './ui';

export const AGENT_SECONDS = 186.33;
const CUT = 45.41, SHIFT = 0.2;
const TOTAL = AGENT_SECONDS + SHIFT;          // конец в «старом» времени
const toVideo = (old: number) => (old < CUT ? old : old - SHIFT);
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

const INK = '#04130F';
const TEXT = '#EAF4EF';
const DIM = 'rgba(234,244,239,0.62)';
const LIME = '#C6FF3D';
const TEAL = '#4FE3C1';
const GOLD = '#F2C86B';
const CORAL = '#FF6B5E';
const MONO = "Consolas, 'Cascadia Mono', monospace";
const SOFT = {damping: 14, mass: 0.6, stiffness: 160};
const HARD = {damping: 10, mass: 0.55, stiffness: 220};
const dark = (c: string, p = 55) => `color-mix(in srgb, ${c} ${p}%, #000)`;
const light = (c: string, p = 60) => `color-mix(in srgb, ${c} ${p}%, #fff)`;

const useT = () => { const v = useCurrentFrame() / 30; return v < CUT ? v : v + SHIFT; };
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
const sp = (t: number, at: number, cfg = SOFT) => spring({frame: Math.round((t - at) * 30), fps: 30, config: cfg});
const abs = (x: number, y: number, w?: number): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w});
const typed = (s: string, t: number, at: number, cps = 24) => s.slice(0, Math.max(0, Math.floor((t - at) * cps)));

// ---------- Иконки: свои, линиями, без эмодзи ----------
const ICONS = {
  head: 'M5 10a7 7 0 0 1 14 0v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z M8 11h8v3.5H8z',
  brain: 'M12 3v4 M12 17v4 M3 12h4 M17 12h4 M6 6l3.2 3.2 M18 6l-3.2 3.2 M6 18l3.2-3.2 M18 18l-3.2-3.2 M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  doc: 'M7 3h8l4 4v14H7z M15 3v4h4 M10 12h6 M10 16h6',
  eye: 'M2 12s4-7 10-7s10 7 10 7s-4 7-10 7S2 12 2 12z M12 9a3 3 0 1 0 0 6a3 3 0 1 0 0-6',
  send: 'M3 11l18-8l-6 18l-3-8z M12 13l9-10',
  clock: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7v5l3.5 2',
  chip: 'M7 7h10v10H7z M10 3v4 M14 3v4 M10 17v4 M14 17v4 M3 10h4 M3 14h4 M17 10h4 M17 14h4',
  target: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18 M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10 M12 11.2a.8.8 0 1 0 0 1.6a.8.8 0 1 0 0-1.6',
  check: 'M5 12.5l4.5 4.5L19 7',
  cross: 'M6 6l12 12 M18 6L6 18',
  search: 'M10 4a6 6 0 1 0 0 12a6 6 0 1 0 0-12 M15 15l5 5',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  box: 'M3 8l9-5l9 5v8l-9 5l-9-5z M3 8l9 5l9-5 M12 13v8',
  belloff: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z M10 21h4 M4 4l16 16',
  link: 'M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1 M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1',
  unlock: 'M6 11h12v9H6z M8 11V8a4 4 0 0 1 7.6-1.8',
  key: 'M8 11a4 4 0 1 0 0 8a4 4 0 1 0 0-8 M11 12l9-9 M17 6l3 3 M14 9l2 2',
  laptop: 'M5 5h14v10H5z M2 19h20',
  cloud: 'M7 18a4 4 0 0 1 0-8a6 6 0 0 1 11.5 1.5A3.5 3.5 0 0 1 18 18z',
  moon: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z',
  wrench: 'M15 4a5 5 0 0 0-5 6l-6 6a2.1 2.1 0 0 0 3 3l6-6a5 5 0 0 0 6-5l-3 3l-3-1l-1-3z',
  news: 'M4 5h13v14H6a2 2 0 0 1-2-2z M17 9h3v8a2 2 0 0 1-2 2 M8 9h5 M8 13h5 M8 16h3',
  trash: 'M5 7h14 M9 7V4h6v3 M7 7l1 13h8l1-13',
  plug: 'M9 3v5 M15 3v5 M6 8h12v3a6 6 0 0 1-12 0z M12 17v4',
  thumb: 'M7 11v9H4v-9z M7 11l4-8a2 2 0 0 1 3 2l-1 4h5a2 2 0 0 1 2 2l-2 8H7',
  pen: 'M4 20l4-1l11-11l-3-3L5 16z',
  bot: 'M6 9h12v10H6z M12 9V5.5 M9 13v2 M15 13v2 M12 3a1 1 0 1 0 0 2a1 1 0 1 0 0-2',
  play: 'M8 5l11 7l-11 7z',
  arrow: 'M5 12h14 M13 6l6 6l-6 6',
  down: 'M12 5v14 M6 13l6 6l6-6',
  repeat: 'M4 9a5 5 0 0 1 5-5h9 M15 1l3 3l-3 3 M20 15a5 5 0 0 1-5 5H6 M9 23l-3-3l3-3',
} as const;
type IcName = keyof typeof ICONS;
const Ic: React.FC<{n: IcName; size?: number; color?: string; w?: number}> = ({n, size = 40, color = TEXT, w = 2}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" style={{display: 'block', flexShrink: 0}}><path d={ICONS[n]} /></svg>
);
// объёмная плитка с иконкой
const Tile: React.FC<{n: IcName; col?: string; size?: number; off?: boolean; style?: React.CSSProperties}> = ({n, col = LIME, size = 80, off, style}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.27, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: off ? 'linear-gradient(160deg, #24403A, #12241F)' : `linear-gradient(160deg, ${light(col, 62)} 0%, ${col} 42%, ${dark(col, 70)} 100%)`,
    boxShadow: off ? 'inset 0 2px 0 rgba(255,255,255,0.12), 0 6px 0 #071410, 0 14px 22px rgba(0,0,0,0.45)'
      : `inset 0 ${size * 0.035}px 0 rgba(255,255,255,0.65), inset 0 ${-size * 0.06}px 0 rgba(0,0,0,0.2), 0 ${size * 0.09}px 0 ${dark(col, 42)}, 0 ${size * 0.26}px ${size * 0.34}px rgba(0,0,0,0.5)`, ...style}}>
    <Ic n={n} size={size * 0.56} color={off ? 'rgba(234,244,239,0.35)' : INK} w={2.2} />
  </div>
);

// семь деталей: когда встаёт на место и когда заполняется её шкала
const PARTS: {name: string; icon: IcName; at: number; full: number; col: string; stat: string}[] = [
  {name: 'Голова', icon: 'head', at: 11.3, full: 27.3, col: LIME, stat: 'кто он'},
  {name: 'Мозг', icon: 'brain', at: 29.1, full: 34.9, col: TEAL, stat: 'чем думает'},
  {name: 'Характер', icon: 'doc', at: 44.8, full: 66.6, col: GOLD, stat: 'как себя ведёт'},
  {name: 'Глаза', icon: 'eye', at: 72.1, full: 76.5, col: TEAL, stat: 'откуда берёт'},
  {name: 'Руки', icon: 'send', at: 83.4, full: 94.9, col: LIME, stat: 'куда доставляет'},
  {name: 'Часы', icon: 'clock', at: 97.1, full: 103.4, col: GOLD, stat: 'когда работает'},
  {name: 'Память', icon: 'chip', at: 107.6, full: 116.3, col: TEAL, stat: 'что уже было'},
];
const EDIT_END = 117.3, LAUNCH_END = 133.2, WAYS_END = 174.3;
const cur = (t: number) => { let k = -1; PARTS.forEach((p, i) => { if (t >= p.at - 1.0) k = i; }); return k; };

// В шортсе редактор показывается без левого списка и без шапки детали: они там свои
const ShortCtx = React.createContext(false);

// ---------- Кирпичики ----------
const Bg: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{background: 'radial-gradient(ellipse 80% 70% at 42% 46%, #124438 0%, #0A2A22 42%, #051712 75%, #020C09 100%)'}}>
      {/* мягкие световые пятна и едва заметная сетка */}
      <div style={{position: 'absolute', left: 300 + Math.sin(t * 0.21) * 60, top: -160, width: 900, height: 900, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,227,193,0.14), transparent 65%)'}} />
      <div style={{position: 'absolute', right: -200, bottom: -260 + Math.cos(t * 0.17) * 40, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(198,255,61,0.07), transparent 65%)'}} />
      <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(234,244,239,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(234,244,239,0.035) 1px, transparent 1px)', backgroundSize: '96px 96px'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.62) 100%)'}} />
    </AbsoluteFill>
  );
};
const Big: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 90, color = TEXT, style}) => (
  <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: size, lineHeight: 1.08, color, textShadow: '0 10px 34px rgba(0,0,0,0.6)', ...style}}>{children}</div>
);
// заголовок «взрослым» шрифтом: прописные с разрядкой
const H: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 56, color = TEXT, style}) => (
  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: size * 0.05, textTransform: 'uppercase', color, ...style}}>{children}</div>
);
const Txt: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 40, color = TEXT, style}) => (
  <div style={{fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.25, color, ...style}}>{children}</div>
);
const In: React.FC<{at: number; out?: number; from?: 'up' | 'down' | 'left' | 'right' | 'scale' | 'slam'; children: React.ReactNode; style?: React.CSSProperties}> = ({at, out, from = 'up', children, style}) => {
  const t = useT();
  if (t < at - 0.02) return null;
  const o = out === undefined ? 1 : 1 - ramp(t, out, out + 0.25);
  if (o <= 0) return null;
  const s = sp(t, at, from === 'slam' ? HARD : SOFT);
  const d = (1 - s) * 70;
  const tr = from === 'up' ? `translateY(${d}px)` : from === 'down' ? `translateY(${-d}px)` : from === 'left' ? `translateX(${-d * 1.5}px)` : from === 'right' ? `translateX(${d * 1.5}px)` : from === 'slam' ? `scale(${2.0 - 1.0 * s})` : `scale(${0.5 + 0.5 * s})`;
  return <div style={{...style, opacity: Math.min(1, s * 1.8) * o, transform: tr}}>{children}</div>;
};
const F: React.FC<{a: number; b: number; children: React.ReactNode}> = ({a, b, children}) => {
  const t = useT();
  if (t < a || t >= b) return null;
  const o = interpolate(t, [a, a + 0.25, b - 0.25, b], [a === 0 ? 1 : 0, 1, 1, 0], clamp);
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};
// стеклянная панель с объёмом: блик сверху, толщина снизу, цветная кромка
const Glass: React.FC<{children: React.ReactNode; style?: React.CSSProperties; accent?: string; pad?: string}> = ({children, style, accent, pad = '24px 30px'}) => (
  <div style={{position: 'relative', borderRadius: 26, padding: pad, background: 'linear-gradient(150deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.045) 38%, rgba(4,19,15,0.55) 100%)',
    border: '1.5px solid rgba(234,244,239,0.2)', boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.28), 0 8px 0 rgba(1,8,6,0.75), 0 30px 60px rgba(0,0,0,0.55)${accent ? `, 0 0 46px ${accent}33` : ''}`, ...style}}>
    {accent ? <div style={{position: 'absolute', left: 26, right: 26, top: -1.5, height: 3, borderRadius: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`}} /> : null}
    {children}
  </div>
);
const Chip: React.FC<{children: React.ReactNode; color?: string; size?: number; solid?: boolean}> = ({children, color = LIME, size = 34, solid}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: FONT, fontWeight: 800, fontSize: size, letterSpacing: size * 0.02, color: solid ? INK : TEXT, whiteSpace: 'nowrap', padding: `${size * 0.26}px ${size * 0.8}px`, borderRadius: 999,
    background: solid ? `linear-gradient(170deg, ${light(color, 55)}, ${color} 50%, ${dark(color, 72)})` : 'linear-gradient(160deg, rgba(255,255,255,0.12), rgba(4,19,15,0.6))',
    border: solid ? 'none' : `1.5px solid ${color}`, boxShadow: solid ? `inset 0 2px 0 rgba(255,255,255,0.6), 0 5px 0 ${dark(color, 42)}, 0 14px 26px rgba(0,0,0,0.45)` : '0 5px 0 rgba(1,8,6,0.7), 0 14px 26px rgba(0,0,0,0.4)'}}>{children}</div>
);
const Row: React.FC<{at: number; n: IcName; col?: string; color?: string; children: React.ReactNode; size?: number}> = ({at, n, col = LIME, color = TEXT, children, size = 38}) => (
  <In at={at} from="left" style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 16}}>
    <Tile n={n} col={col} size={size * 1.5} />
    <Txt size={size} color={color}>{children}</Txt>
  </In>
);
const ClaudeMark: React.FC<{size?: number}> = ({size = 48}) => (
  <div style={{width: size, height: size, borderRadius: size * 0.27, background: 'linear-gradient(160deg, #FFFFFF, #E9E2D8)', boxShadow: `inset 0 ${size * 0.03}px 0 #fff, 0 ${size * 0.08}px 0 #9C8F80, 0 ${size * 0.2}px ${size * 0.28}px rgba(0,0,0,0.5)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
    <Img src={staticFile('short/claude_burst.png')} style={{width: size * 0.72, height: size * 0.72}} />
  </div>
);
// вспышка при установке детали: кольцо и искры
const Burst: React.FC<{at: number; x: number; y: number; col: string; n?: number}> = ({at, x, y, col, n = 16}) => {
  const t = useT();
  const k = t - at;
  if (k < 0 || k > 0.8) return null;
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const ang = random(`ab${at}${i}`) * Math.PI * 2, v = 520 * (0.5 + random(`av${at}${i}`));
        return <div key={i} style={{position: 'absolute', left: x + Math.cos(ang) * v * k, top: y + Math.sin(ang) * v * k, width: 26 * (1 - k), height: 3, borderRadius: 2, background: i % 2 ? col : '#fff', opacity: 1 - k / 0.8, transform: `rotate(${ang}rad)`}} />;
      })}
      <div style={{position: 'absolute', left: x - 520 * k, top: y - 520 * k, width: 1040 * k, height: 1040 * k, borderRadius: '50%', border: `3px solid ${col}`, boxShadow: `0 0 40px ${col}`, opacity: Math.max(0, 1 - k * 1.9)}} />
    </>
  );
};

// ---------- Робот-андроид: жемчужная броня, графитовые суставы, светящиеся акценты ----------
// Координаты 400×660, видимая область 310×589. Детали появляются по времени (или сразу все, если all).
const Robot: React.FC<{t: number; size?: number; all?: boolean; scan?: number; mail?: boolean; sleep?: boolean; wave?: number; id?: string}> = ({t, size = 500, all, scan = 0, mail, sleep, wave = 0, id = 'r'}) => {
  const s = PARTS.map((p) => (all ? 1 : sp(t, p.at, HARD)));
  const has = PARTS.map((p) => all || t >= p.at);
  const drop = (i: number) => `translate(0 ${(1 - s[i]) * -240})`;
  const op = (i: number) => Math.min(1, s[i] * 2);
  const bob = Math.sin(t * 2.0) * 3;
  const eyeOn = has[3] && !sleep;
  const blink = eyeOn && Math.sin(t * 1.7) > 0.985;
  const pulse = 0.6 + 0.4 * Math.sin(t * 5);
  const u = (n: string) => `url(#${id}${n})`;
  // левая рука поднимается при wave
  const lx = 104 - wave * 26, ly = 340 - wave * 70, hx = 96 - wave * 70, hy = 424 - wave * 250;
  return (
    <svg width={size} height={size * 1.9} viewBox="45 30 310 589" style={{overflow: 'visible'}}>
      <defs>
        <linearGradient id={`${id}pearl`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="0.45" stopColor="#DCE7E2" /><stop offset="1" stopColor="#8FA69D" /></linearGradient>
        <linearGradient id={`${id}pearlV`} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#F6FAF8" /><stop offset="1" stopColor="#9DB2AA" /></linearGradient>
        <linearGradient id={`${id}graph`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3C4F49" /><stop offset="1" stopColor="#0E1916" /></linearGradient>
        <linearGradient id={`${id}glass`} x1="0" y1="0" x2="0.6" y2="1"><stop offset="0" stopColor="#1F3530" /><stop offset="0.5" stopColor="#081310" /><stop offset="1" stopColor="#030907" /></linearGradient>
        <radialGradient id={`${id}disc`} cx="0.5" cy="0.5" r="0.5"><stop offset="0" stopColor={TEAL} stopOpacity="0.55" /><stop offset="0.6" stopColor={TEAL} stopOpacity="0.12" /><stop offset="1" stopColor={TEAL} stopOpacity="0" /></radialGradient>
        <filter id={`${id}glow`} x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id={`${id}sh`} x="-30%" y="-10%" width="160%" height="130%"><feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#000" floodOpacity="0.45" /></filter>
      </defs>
      {/* голографический подиум */}
      <ellipse cx="200" cy="600" rx="170" ry="30" fill={u('disc')} />
      <ellipse cx="200" cy="600" rx="140" ry="20" fill="none" stroke={TEAL} strokeWidth="1.5" opacity="0.7" />
      <ellipse cx="200" cy="600" rx="108" ry="14" fill="none" stroke={LIME} strokeWidth="2.5" opacity="0.9" strokeDasharray="8 10" strokeDashoffset={-t * 14} />
      <ellipse cx="200" cy="600" rx="70" ry="8" fill="rgba(0,0,0,0.5)" />
      <g transform={`translate(0 ${bob})`} filter={u('sh')}>
        {/* контур-заготовка */}
        <g fill="none" stroke="rgba(234,244,239,0.3)" strokeWidth="2" strokeDasharray="7 7">
          {!has[0] ? <path d="M132 150 Q132 78 200 78 Q268 78 268 150 L268 176 Q268 214 228 218 L172 218 Q132 214 132 176 Z" /> : null}
          {!has[2] ? <><path d="M138 250 Q200 226 262 250 L246 372 Q200 392 154 372 Z" /><rect x="158" y="400" width="36" height="180" rx="16" /><rect x="206" y="400" width="36" height="180" rx="16" /></> : null}
          {!has[4] ? <><path d="M132 262 L104 340 L96 424" /><path d="M268 262 L296 340 L304 424" /></> : null}
        </g>
        {/* 7. память: модули за плечами */}
        {has[6] ? (
          <g transform={drop(6)} opacity={op(6)}>
            {[112, 250].map((x) => (
              <g key={x}>
                <rect x={x} y="232" width="38" height="118" rx="14" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" />
                {[0, 1, 2, 3].map((i) => <rect key={i} x={x + 9} y={248 + i * 22} width="20" height="6" rx="3" fill={TEAL} opacity={0.35 + 0.65 * Math.abs(Math.sin(t * 3 + i * 0.9 + x))} />)}
              </g>
            ))}
          </g>
        ) : null}
        {/* 3. характер: корпус и ноги, на груди панель с инструкцией */}
        {has[2] ? (
          <g transform={drop(2)} opacity={op(2)}>
            {[176, 224].map((cx) => (
              <g key={cx}>
                <rect x={cx - 18} y="398" width="36" height="96" rx="16" fill={u('pearl')} />
                <circle cx={cx} cy="496" r="15" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" />
                <rect x={cx - 16} y="502" width="32" height="80" rx="14" fill={u('pearl')} />
                <path d={`M${cx - 26} 580 h46 a10 10 0 0 1 10 10 v8 h-66 v-8 a10 10 0 0 1 10 -10 z`} fill={u('graph')} stroke="#52665F" strokeWidth="1.5" />
                <rect x={cx - 10} y="520" width="20" height="4" rx="2" fill={LIME} opacity="0.9" />
              </g>
            ))}
            <path d="M158 370 Q200 392 242 370 L236 408 Q200 418 164 408 Z" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" />
            <path d="M138 250 Q200 226 262 250 L246 372 Q200 392 154 372 Z" fill={u('pearl')} />
            <path d="M146 254 Q200 234 254 254" fill="none" stroke="#fff" strokeWidth="2.5" opacity="0.8" />
            <rect x="164" y="270" width="72" height="62" rx="12" fill={u('glass')} stroke={GOLD} strokeWidth="2.5" />
            {[0, 1, 2].map((i) => <rect key={i} x="176" y={283 + i * 15} width={i === 2 ? 30 : 48} height="6" rx="3" fill={[LIME, CORAL, TEAL][i]} opacity="0.95" />)}
            <path d="M150 300 L158 356" stroke={LIME} strokeWidth="3" strokeLinecap="round" opacity="0.8" /><path d="M250 300 L242 356" stroke={LIME} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          </g>
        ) : null}
        {/* 5. руки */}
        {has[4] ? (
          <g transform={drop(4)} opacity={op(4)}>
            <path d={`M132 262 L${lx} ${ly}`} stroke="#E4ECE8" strokeWidth="24" strokeLinecap="round" />
            <path d={`M${lx} ${ly} L${hx} ${hy}`} stroke="#D3DED9" strokeWidth="20" strokeLinecap="round" />
            <path d={`M127 262 L${lx - 5} ${ly}`} stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <circle cx={lx} cy={ly} r="13" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" />
            <circle cx={hx} cy={hy + 10} r="17" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" />
            <circle cx={hx} cy={hy + 10} r="6" fill={LIME} />
            <path d="M268 262 L296 340" stroke="#C9D6D0" strokeWidth="24" strokeLinecap="round" />
            <path d="M296 340 L304 424" stroke="#B9C9C2" strokeWidth="20" strokeLinecap="round" />
            <circle cx="296" cy="340" r="13" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" />
            <circle cx="304" cy="434" r="17" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" />
            <circle cx="304" cy="434" r="6" fill={LIME} />
            {mail ? <g transform="translate(278 400)"><rect width="56" height="40" rx="6" fill="#fff" stroke={INK} strokeWidth="2.5" /><path d="M2 4 L28 24 L54 4" fill="none" stroke={INK} strokeWidth="2.5" /></g> : null}
            {[132, 268].map((cx) => <g key={cx}><circle cx={cx} cy="262" r="22" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" /><path d={`M${cx - 15} 256 A16 16 0 0 1 ${cx + 15} 256`} fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.85" /></g>)}
          </g>
        ) : null}
        {/* 6. часы: браслет на левом запястье */}
        {has[5] ? (
          <g transform={`translate(${hx + 3} ${hy - 22 + (1 - s[5]) * -240}) scale(${0.4 + 0.6 * s[5]})`} opacity={op(5)}>
            <circle r="30" fill={GOLD} opacity="0.35" filter={u('glow')} />
            <circle r="24" fill={u('glass')} stroke={GOLD} strokeWidth="4" />
            <line x1="0" y1="0" x2="-13" y2="0" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
            <line x1="0" y1="0" x2="0" y2="-16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </g>
        ) : null}
        {/* 1. голова: шлем с тёмным визором */}
        {has[0] ? (
          <g transform={drop(0)} opacity={op(0)}>
            <rect x="184" y="210" width="32" height="34" rx="8" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" />
            {[128, 272].map((cx) => <g key={cx}><circle cx={cx} cy="160" r="15" fill={u('graph')} stroke="#52665F" strokeWidth="1.5" /><circle cx={cx} cy="160" r="6" fill={LIME} opacity="0.9" /></g>)}
            <path d="M132 150 Q132 78 200 78 Q268 78 268 150 L268 176 Q268 214 228 218 L172 218 Q132 214 132 176 Z" fill={u('pearl')} />
            <path d="M144 132 Q150 92 200 88" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
            <path d="M148 134 Q148 120 164 120 L236 120 Q252 120 252 134 L252 166 Q252 184 232 184 L168 184 Q148 184 148 166 Z" fill={u('glass')} stroke="#0B1512" strokeWidth="2" />
            <path d="M156 130 Q160 124 172 124 L196 124 L170 176 Q158 174 156 164 Z" fill="#fff" opacity="0.07" />
            {/* глаза: световые полосы; до детали «Глаза» погашены */}
            {eyeOn ? <g filter={u('glow')} opacity={0.9}><rect x="164" y="146" width="28" height={blink ? 3 : 13} rx="6" fill={TEAL} /><rect x="208" y="146" width="28" height={blink ? 3 : 13} rx="6" fill={TEAL} /></g> : null}
            {sleep ? (<><path d="M165 154 Q178 162 191 154" fill="none" stroke={TEAL} strokeWidth="4" strokeLinecap="round" /><path d="M209 154 Q222 162 235 154" fill="none" stroke={TEAL} strokeWidth="4" strokeLinecap="round" /></>)
              : (<><rect x="164" y={blink ? 151 : 146} width="28" height={blink ? 3 : 13} rx="6" fill={eyeOn ? '#D9FFF6' : '#2A3C37'} /><rect x="208" y={blink ? 151 : 146} width="28" height={blink ? 3 : 13} rx="6" fill={eyeOn ? '#D9FFF6' : '#2A3C37'} /></>)}
          </g>
        ) : null}
        {/* 2. мозг: прозрачное окно в шлеме со светящейся сетью */}
        {has[1] ? (
          <g transform={drop(1)} opacity={op(1)}>
            <path d="M158 108 Q200 76 242 108 Q200 100 158 108 Z" fill={TEAL} opacity={0.5 * pulse} filter={u('glow')} />
            <path d="M160 110 Q200 82 240 110 L234 114 Q200 104 166 114 Z" fill="#06231C" stroke={TEAL} strokeWidth="2" />
            {[[176, 106], [190, 98], [200, 104], [212, 97], [224, 106]].map(([x, y], i, a) => (
              <g key={i}>{i < a.length - 1 ? <line x1={x} y1={y} x2={a[i + 1][0]} y2={a[i + 1][1]} stroke={TEAL} strokeWidth="1.5" opacity="0.9" /> : null}<circle cx={x} cy={y} r={2.6 + 1.2 * Math.abs(Math.sin(t * 5 + i))} fill="#D9FFF6" /></g>
            ))}
          </g>
        ) : null}
        {/* лучи из глаз при поиске */}
        {scan > 0 && eyeOn ? <g opacity={scan * 0.5}><path d="M178 152 L600 60 L600 250 Z" fill={TEAL} opacity="0.3" /><path d="M222 152 L600 80 L600 270 Z" fill={TEAL} opacity="0.2" /></g> : null}
        {sleep ? <text x="286" y={92 - (t % 2) * 18} fontSize="30" fill={TEXT} opacity={1 - (t % 2) / 2} fontFamily="sans-serif" fontWeight="800" letterSpacing="4">z z</text> : null}
      </g>
    </svg>
  );
};

// ---------- Редактор персонажа (0–117.3) ----------
const Slots: React.FC = () => {
  const short = React.useContext(ShortCtx);
  const t = useT();
  const k = cur(t);
  const show = sp(t, 9.9);
  if (short) return null;
  return (
    <div style={{...abs(56 - (1 - show) * 440, 150, 370), opacity: show, transform: 'perspective(1500px) rotateY(7deg) scale(1.12)', transformOrigin: 'left top'}}>
      {PARTS.map((p, i) => {
        const on = t >= p.at, now = i === k;
        const fill = on ? ramp(t, p.at + 0.3, p.full) : 0;
        const pop = on ? 1 - ramp(t, p.at, p.at + 0.45) : 0;
        return (
          <div key={p.name} style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 14, padding: '11px 16px', borderRadius: 22,
            background: now ? `linear-gradient(120deg, ${p.col}33, rgba(4,19,15,0.6))` : 'linear-gradient(150deg, rgba(255,255,255,0.09), rgba(4,19,15,0.55))',
            border: `1.5px solid ${now ? p.col : 'rgba(234,244,239,0.16)'}`, boxShadow: `inset 0 1.5px 0 rgba(255,255,255,0.2), 0 6px 0 rgba(1,8,6,0.75), 0 16px 30px rgba(0,0,0,0.4)${now ? `, 0 0 36px ${p.col}44` : ''}`,
            transform: `translateX(${now ? 14 : 0}px) scale(${1 + pop * 0.07})`, transformOrigin: 'left center'}}>
            <Tile n={p.icon} col={p.col} size={70} off={!on} />
            <div style={{flex: 1}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Txt size={30} color={on ? TEXT : 'rgba(234,244,239,0.42)'} style={{fontWeight: 800}}>{p.name}</Txt>
                {on && fill >= 1 ? <Ic n="check" size={26} color={p.col} w={3} /> : <Txt size={22} color="rgba(234,244,239,0.35)">0{i + 1}</Txt>}
              </div>
              <Txt size={19} color="rgba(234,244,239,0.5)" style={{fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase'}}>{p.stat}</Txt>
              <div style={{height: 8, borderRadius: 4, background: 'rgba(0,0,0,0.45)', marginTop: 7, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)'}}><div style={{width: `${fill * 100}%`, height: '100%', background: `linear-gradient(90deg, ${dark(p.col, 70)}, ${p.col})`, boxShadow: `0 0 10px ${p.col}`}} /></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
// правая часть: содержимое текущей детали, слегка развёрнуто к зрителю
const D: React.FC<{i: number; children: React.ReactNode}> = ({i, children}) => {
  const short = React.useContext(ShortCtx);
  const t = useT();
  const a = PARTS[i].at - 0.2, b = i < 6 ? PARTS[i + 1].at - 1.0 : EDIT_END;
  if (t < a || t >= b) return null;
  const o = interpolate(t, [a, a + 0.3, b - 0.3, b], [0, 1, 1, 0], clamp);
  return (
    <div style={{...abs(1040, 150, 820), opacity: o, transform: short ? undefined : 'perspective(1600px) rotateY(-5deg) scale(1.1)', transformOrigin: 'right top'}}>
      <In at={PARTS[i].at} from="slam" style={{display: short ? 'none' : 'flex', alignItems: 'center', gap: 22, marginBottom: 18}}>
        <Tile n={PARTS[i].icon} col={PARTS[i].col} size={104} />
        <div>
          <Txt size={24} color={PARTS[i].col} style={{letterSpacing: 4, fontWeight: 800}}>ДЕТАЛЬ 0{i + 1} · {PARTS[i].stat.toUpperCase()}</Txt>
          <H size={66}>{PARTS[i].name}</H>
        </div>
      </In>
      {children}
    </div>
  );
};
const Editor: React.FC = () => {
  const short = React.useContext(ShortCtx);
  const t = useT();
  const intro = t < 10.2;
  const k = cur(t);
  const mv = sp(t, 9.9);
  const rsz = 480, rx = 720 - 222 * mv, ry = 132 - 14 * mv;
  const hot = intro ? (t >= 9.5 ? 3 : t >= 8.9 ? 2 : t >= 8.0 ? 1 : t >= 7.2 ? 0 : -1) : -1;
  const mailFly = ramp(t, 92.2, 93.6);
  const col = k >= 0 ? PARTS[k].col : TEAL;
  return (
    <F a={0} b={EDIT_END}>
      {intro ? (
        <div style={{opacity: 1 - ramp(t, 9.8, 10.2)}}>
          <In at={0} from="slam" style={{...abs(0, 44, 1920), textAlign: 'center'}}><H size={78}>Что такое <span style={{color: LIME}}>ИИ-агент?</span></H></In>
          {t >= 2.2 && t < 4.5 ? (
            <div style={{...abs(1230, 330, 600), opacity: ramp(t, 2.2, 2.5) * (1 - ramp(t, 4.2, 4.5))}}>
              <svg width="600" height="420">
                {[[40, 30], [330, 20], [180, 170], [20, 300], [360, 290]].map(([x, y], i) => <rect key={i} x={x} y={y} width="200" height="80" rx="14" fill="rgba(255,255,255,0.06)" stroke="rgba(234,244,239,0.45)" strokeWidth="2" />)}
                {[[240, 70, 330, 60], [140, 110, 240, 170], [430, 100, 330, 170], [240, 250, 120, 300], [330, 250, 440, 290], [220, 340, 360, 330]].map(([a, b2, c, d], i) => <line key={i} x1={a} y1={b2} x2={c} y2={d} stroke="rgba(234,244,239,0.45)" strokeWidth="2" />)}
                <line x1="20" y1="20" x2={20 + 560 * ramp(t, 3.0, 3.4)} y2={20 + 380 * ramp(t, 3.0, 3.4)} stroke={CORAL} strokeWidth="12" strokeLinecap="round" />
                <line x1="580" y1="20" x2={580 - 560 * ramp(t, 3.3, 3.7)} y2={20 + 380 * ramp(t, 3.3, 3.7)} stroke={CORAL} strokeWidth="12" strokeLinecap="round" />
              </svg>
              <Txt size={34} color={DIM} style={{textAlign: 'center', letterSpacing: 3, textTransform: 'uppercase'}}>сложные схемы</Txt>
            </div>
          ) : null}
          <In at={4.4} from="right" style={abs(1230, 370, 620)}><H size={58} style={{letterSpacing: 2}}>Это <span style={{color: LIME}}>персонаж</span>,<br />которого вы собираете сами</H></In>
          {([['Голова', 7.2, 250, 'head'], ['Глаза', 8.0, 350, 'eye'], ['Руки', 8.9, 540, 'send'], ['Будильник', 9.5, 640, 'clock']] as [string, number, number, IcName][]).map(([s, at, y, ic], i) => (
            <In key={s} at={at} from="left" style={{...abs(150, y, 460), display: 'flex', alignItems: 'center', gap: 18}}>
              <Tile n={ic} col={hot === i ? LIME : TEAL} size={84} off={hot !== i} /><H size={40} color={hot === i ? TEXT : DIM}>{s}</H>
            </In>
          ))}
        </div>
      ) : null}
      <In at={10.0} from="down" style={{...abs(56, 56, 1810), display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <H size={36} style={{letterSpacing: 6}}>Создание <span style={{color: LIME}}>агента</span></H>
        <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
          {PARTS.map((p, i) => <div key={i} style={{width: i === k ? 46 : 22, height: 8, borderRadius: 4, background: t >= p.at ? p.col : 'rgba(234,244,239,0.2)', boxShadow: i === k ? `0 0 14px ${p.col}` : 'none'}} />)}
          <Txt size={26} color={DIM} style={{marginLeft: 14, letterSpacing: 2}}>{Math.max(1, k + 1)} / 7</Txt>
        </div>
      </In>
      <Slots />
      {/* свет за роботом */}
      <div style={{...abs(rx - 150, ry + 40), width: rsz + 300, height: rsz * 1.7, borderRadius: '50%', background: `radial-gradient(ellipse at 50% 42%, ${col}30, transparent 62%)`}} />
      <div style={abs(rx, ry)}><Robot t={t} size={rsz} scan={!short && t >= 75.3 && t < 82 ? ramp(t, 75.3, 75.8) * (1 - ramp(t, 81.4, 82)) : 0} mail={t >= 90.8 && t < 92.2} /></div>
      {PARTS.map((p, i) => <Burst key={i} at={p.at} x={rx + rsz / 2} y={ry + [110, 70, 300, 125, 330, 400, 270][i] * (rsz / 310)} col={p.col} />)}
      {t >= 26.9 && !intro ? <In at={27.0} from="slam" style={{...abs(rx - 60, ry + rsz * 1.9 - 78, rsz + 120), textAlign: 'center'}}><Chip size={30} solid>НОВОСТНИК</Chip></In> : null}
      {t >= 92.2 && t < 94 ? (
        <div style={{...abs(rx + rsz * 0.82 + mailFly * 560, ry + rsz * 1.18 - Math.sin(mailFly * Math.PI) * 240 - mailFly * 240), transform: `rotate(${mailFly * 360}deg) scale(${1.4 - 0.4 * mailFly})`, opacity: 1 - ramp(t, 93.5, 93.9)}}>
          <svg width="80" height="58" viewBox="0 0 56 40"><rect width="56" height="40" rx="6" fill="#fff" stroke={INK} strokeWidth="2.5" /><path d="M2 4 L28 24 L54 4" fill="none" stroke={INK} strokeWidth="2.5" /></svg>
        </div>
      ) : null}

      {/* 1. Голова */}
      <D i={0}>
        <Row at={13.5} n="target" size={40}>одна понятная работа</Row>
        <In at={16.4} from="left" style={{marginTop: 26}}><Glass accent={CORAL} pad="18px 24px" style={{display: 'flex', alignItems: 'center', gap: 18}}><Tile n="cross" col={CORAL} size={56} /><Txt size={40} color="#FFD2CD" style={{textDecoration: t >= 18.0 ? 'line-through' : 'none'}}>«помогай мне во всём»</Txt></Glass></In>
        <In at={20.4} from="left" style={{marginTop: 20}}><Glass accent={LIME} pad="18px 24px" style={{display: 'flex', alignItems: 'center', gap: 18}}><Tile n="check" col={LIME} size={56} /><Txt size={40}>«следи за новостями про нейросети»</Txt></Glass></In>
        <In at={22.9} from="up" style={{marginTop: 30}}><Txt size={42} color={DIM}>чем у́же задача,<br /><span style={{color: LIME}}>тем лучше он её делает</span></Txt></In>
      </D>
      {/* 2. Мозг: Claude и другие нейросети */}
      <D i={1}>
        <In at={29.9} from="up"><Txt size={38} color={DIM}>это сама нейросеть</Txt></In>
        <In at={31.3} from="slam" style={{marginTop: 18}}>
          <Glass accent="#D97757" pad="22px 28px" style={{display: 'flex', alignItems: 'center', gap: 26}}>
            <ClaudeMark size={124} />
            <div><Txt size={24} color="#E8A58D" style={{letterSpacing: 4, fontWeight: 800}}>У МЕНЯ</Txt><H size={74} style={{letterSpacing: 1, textTransform: 'none'}}>Claude</H></div>
          </Glass>
        </In>
        <In at={32.4} from="up" style={{marginTop: 24, display: 'flex', alignItems: 'center', gap: 16}}><Tile n="wrench" col={TEAL} size={54} /><Txt size={32} color={DIM}>подойдёт любая, которая умеет<br />пользоваться инструментами</Txt></In>
        {t < 36.0 ? (
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 20, opacity: 1 - ramp(t, 35.7, 36.0)}}>
            {['ChatGPT', 'Gemini', 'Copilot', 'DeepSeek', 'Grok', 'GigaChat'].map((n, i) => <In key={n} at={33.0 + i * 0.16} from="scale"><Chip size={34} color={TEAL}>{n}</Chip></In>)}
          </div>
        ) : (
          <div style={{marginTop: 20}}>
            <div style={{display: 'flex', gap: 20}}>
              <div style={{flex: 1}}><In at={36.4} from="left"><Glass accent={LIME} pad="18px 20px" style={{display: 'flex', alignItems: 'center', gap: 16}}><Tile n="news" col={LIME} size={64} /><Txt size={34}>важная</Txt></Glass></In></div>
              <div style={{flex: 1}}><In at={38.4} from="right"><Glass pad="18px 20px" style={{display: 'flex', alignItems: 'center', gap: 16, opacity: 0.7}}><Tile n="trash" col={CORAL} size={64} /><Txt size={34} color={DIM}>шум</Txt></Glass></In></div>
            </div>
            <In at={39.8} from="up" style={{marginTop: 22}}><Txt size={34} color={DIM}>остальные детали нужны, чтобы мозг мог <span style={{color: LIME}}>что-то сделать</span></Txt></In>
          </div>
        )}
      </D>
      {/* 3. Характер: инструкция */}
      <D i={2}>
        <Glass accent={GOLD} pad="20px 26px 24px" style={{transform: `scaleY(${ramp(t, 45.5, 46.2)})`, transformOrigin: 'top center'}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 24, color: GOLD, letterSpacing: 2}}>ИНСТРУКЦИЯ.md · обычный текст</div>
          {([
            ['Берём', LIME, 'check', 50.0, [['новая модель', 51.3], ['полезный инструмент', 52.9]]],
            ['Не берём', CORAL, 'cross', 54.6, [['слухи', 56.1], ['рекламу', 57.1], ['«эксперт заявил»', 57.9]]],
            ['Как писать', TEAL, 'pen', 59.1, [['коротко', 60.3], ['простыми словами', 61.1], ['со ссылкой на источник', 62.5]]],
          ] as [string, string, IcName, number, [string, number][]][]).map(([h, c, ic, at, items]) => (
            <In key={h} at={at} from="left" style={{marginTop: 14, display: 'flex', gap: 16, alignItems: 'flex-start'}}>
              <Tile n={ic} col={c} size={52} />
              <div><Txt size={24} color={c} style={{letterSpacing: 3, fontWeight: 800, textTransform: 'uppercase'}}>{h}</Txt>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '2px 22px'}}>{items.map(([s, a]) => <In key={s} at={a} from="up"><Txt size={34}>{s}</Txt></In>)}</div></div>
            </In>
          ))}
          <In at={64.4} from="slam" style={{marginTop: 18, borderRadius: 14, padding: '10px 18px', textAlign: 'center', background: t >= 65.8 ? `linear-gradient(170deg, ${light(GOLD, 50)}, ${GOLD} 50%, ${dark(GOLD, 72)})` : 'rgba(255,255,255,0.06)', boxShadow: t >= 65.8 ? `inset 0 2px 0 rgba(255,255,255,0.6), 0 5px 0 ${dark(GOLD, 42)}` : 'none'}}>
            <Txt size={36} color={t >= 65.8 ? INK : TEXT} style={{fontWeight: 800}}>Главное: ничего не выдумывай</Txt>
          </In>
        </Glass>
        <In at={67.5} from="up" style={{marginTop: 22}}><Txt size={36} color={DIM}>плохой агент = <span style={{color: CORAL}}>плохая настройка</span></Txt></In>
      </D>
      {/* 4. Глаза: поиск */}
      <D i={3}>
        <In at={75.2} from="up"><Glass pad="14px 22px" style={{display: 'flex', alignItems: 'center', gap: 16, borderRadius: 999}}><Ic n="search" size={40} color={TEAL} w={2.4} /><Txt size={36}>{typed('новости ИИ за сутки', t, 75.4, 16)}</Txt></Glass></In>
        {t < 77.0 ? ['Вышла новая модель…', 'Обновление популярного сервиса…', 'Эксперт заявил, что…', 'Скидка на курс по нейросетям…'].map((s, i) => (
          <In key={s} at={75.9 + i * 0.18} from="left" style={{marginTop: 14, display: 'flex', alignItems: 'center', gap: 16}}><Tile n={i < 2 ? 'check' : 'cross'} col={i < 2 ? LIME : CORAL} size={46} off={i >= 2} /><Txt size={32} color={i < 2 ? TEXT : 'rgba(234,244,239,0.4)'}>{s}</Txt></In>
        )) : (
          <div style={{marginTop: 28}}>
            <In at={77.0} from="left"><Txt size={40} color={DIM}>без глаз он знает только то,<br />чему его научили</Txt></In>
            <In at={80.5} from="slam" style={{marginTop: 26}}><Glass accent={CORAL} pad="18px 24px" style={{display: 'inline-flex', alignItems: 'center', gap: 20}}><Tile n="calendar" col={CORAL} size={70} /><Txt size={42}>прошлогодние новости</Txt></Glass></In>
          </div>
        )}
      </D>
      {/* 5. Руки: телеграм-бот */}
      <D i={4}>
        <Row at={84.2} n="box" size={38}>найти мало, надо принести</Row>
        <In at={87.1} from="left" style={{marginTop: 24}}>
          <Glass accent="#3AB0E8" pad="20px 26px" style={{display: 'flex', alignItems: 'center', gap: 24}}>
            <div style={{width: 104, height: 104, borderRadius: 28, background: 'linear-gradient(160deg, #6CCBF5, #229ED9 45%, #156A96)', boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.6), 0 9px 0 #0E4866, 0 24px 34px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <svg width="62" height="62" viewBox="0 0 24 24"><path fill="#fff" d="M2 11.5 L22 3 L18.5 21 L11.5 15.5 L8.5 20 L8.2 14 L18 6.5 L6 12.8 Z" /></svg>
            </div>
            <div><H size={44} style={{letterSpacing: 2}}>Телеграм-бот</H>
              <div style={{display: 'flex', gap: 12, marginTop: 12}}><In at={88.7} from="scale"><Chip size={26} color="#3AB0E8">бесплатно</Chip></In><In at={89.8} from="scale"><Chip size={26} color="#3AB0E8">5 минут</Chip></In></div>
            </div>
          </Glass>
        </In>
        <In at={93.4} from="up" style={{marginTop: 24}}>
          <Glass accent={LIME} pad="16px 22px">
            <Txt size={22} color={LIME} style={{letterSpacing: 3, fontWeight: 800}}>ЛИЧНЫЕ СООБЩЕНИЯ · НОВОСТНИК</Txt>
            <Txt size={34} style={{marginTop: 6}}>ИИ за сутки</Txt>
            {[0.9, 0.75].map((w, i) => <div key={i} style={{height: 12, borderRadius: 6, background: 'rgba(234,244,239,0.25)', width: `${w * 100}%`, marginTop: 12}} />)}
          </Glass>
        </In>
      </D>
      {/* 6. Часы: расписание */}
      <D i={5}>
        <In at={97.8} from="up" style={{display: 'flex', alignItems: 'center', gap: 18}}><Txt size={42} color={DIM}>помощник</Txt><Ic n="arrow" size={44} color={GOLD} w={2.6} /><H size={52} color={LIME}>агент</H></In>
        <In at={100.3} from="slam" style={{marginTop: 28}}>
          <Glass accent={GOLD} pad="24px 30px" style={{display: 'flex', alignItems: 'center', gap: 36}}>
            <svg width="230" height="230" viewBox="-110 -110 220 220">
              <defs><radialGradient id="clk" cx="0.35" cy="0.3" r="0.9"><stop offset="0" stopColor="#1F3530" /><stop offset="1" stopColor="#030907" /></radialGradient></defs>
              <circle r="104" fill="#7A6126" /><circle r="100" fill="url(#clk)" stroke={GOLD} strokeWidth="6" />
              {Array.from({length: 12}).map((_, i) => <line key={i} x1="0" y1="-88" x2="0" y2={i % 3 ? -80 : -72} stroke={i % 3 ? 'rgba(234,244,239,0.4)' : GOLD} strokeWidth={i % 3 ? 2 : 4} transform={`rotate(${i * 30})`} />)}
              <line x1="0" y1="0" x2="0" y2="-48" stroke={GOLD} strokeWidth="8" strokeLinecap="round" transform={`rotate(${interpolate(t, [100.6, 102.3], [0, 270], clamp)})`} />
              <line x1="0" y1="0" x2="0" y2="-74" stroke={TEXT} strokeWidth="4" strokeLinecap="round" transform={`rotate(${interpolate(t, [100.6, 102.3], [-1080, 0], clamp)})`} />
              <circle r="7" fill={GOLD} />
            </svg>
            <div>
              <In at={102.0} from="left"><Txt size={26} color={GOLD} style={{letterSpacing: 4, fontWeight: 800}}>КАЖДЫЙ ДЕНЬ</Txt></In>
              <In at={102.4} from="slam"><Big size={124} color={TEXT}>9:00</Big></In>
            </div>
          </Glass>
        </In>
        <Row at={103.9} n="belloff" col={GOLD} size={38}>напоминать <span style={{color: LIME}}>не надо</span></Row>
      </D>
      {/* 7. Память */}
      <D i={6}>
        {t < 111.4 ? (
          <div style={{opacity: 1 - ramp(t, 111.1, 111.4)}}>
            <In at={108.3} from="up"><Txt size={36} color={CORAL}>без памяти: каждое утро одно и то же</Txt></In>
            {[0, 1, 2].map((i) => <In key={i} at={109.4 + i * 0.4} from="left" style={{marginTop: 14}}><Glass pad="14px 20px" style={{display: 'flex', alignItems: 'center', gap: 16, opacity: 0.9}}><Tile n="repeat" col={CORAL} size={48} /><Txt size={32}>Meta выпустила Muse Wonder</Txt></Glass></In>)}
          </div>
        ) : (
          <div>
            <In at={111.6} from="up">
              <Glass accent={TEAL}>
                <Txt size={24} color={TEAL} style={{letterSpacing: 4, fontWeight: 800}}>УЖЕ ПРИСЫЛАЛ</Txt>
                <Row at={112.6} n="check" col={TEAL} size={32}>Meta выпустила Muse Wonder</Row>
                <Row at={113.3} n="check" col={TEAL} size={32}>Anthropic выпустила Claude Haiku 5.5</Row>
              </Glass>
            </In>
            <In at={115.4} from="right" style={{marginTop: 22, display: 'flex', alignItems: 'center', gap: 18}}>
              <div style={{transform: `translateX(${t >= 116.3 ? ramp(t, 116.3, 116.7) * 220 : 0}px) rotate(${t >= 116.3 ? ramp(t, 116.3, 116.7) * 14 : 0}deg)`, opacity: t >= 116.3 ? 1 - ramp(t, 116.5, 116.9) * 0.6 : 1}}><Glass pad="12px 20px"><Txt size={30}>Meta выпустила Muse Wonder</Txt></Glass></div>
              <In at={116.3} from="slam"><Chip size={30} color={CORAL} solid>уже было</Chip></In>
            </In>
          </div>
        )}
      </D>
    </F>
  );
};

// ---------- Запуск: настоящее видео с телефона и первое сообщение (117.3–133.2) ----------
const Launch: React.FC = () => {
  const t = useT();
  const {fps} = useVideoConfig();
  const vid = t >= 119.3 && t < 123.2;
  const msg = sp(t, 123.0);
  return (
    <F a={EDIT_END} b={LAUNCH_END}>
      <div style={{...abs(60, 150), width: 760, height: 900, borderRadius: '50%', background: `radial-gradient(ellipse at 50% 42%, ${LIME}26, transparent 62%)`}} />
      <div style={abs(210, 130)}><Robot t={t} all size={440} wave={t < 119.3 ? Math.abs(Math.sin(t * 6)) * 0.9 : 0} id="l" /></div>
      <Burst at={117.5} x={430} y={520} col={LIME} n={30} />
      <In at={117.4} from="slam" out={119.1} style={{...abs(760, 340, 1060), textAlign: 'center'}}><H size={96}>Персонаж <span style={{color: LIME}}>собран</span></H><Txt size={40} style={{marginTop: 20, letterSpacing: 4}} color={DIM}>7 ДЕТАЛЕЙ ИЗ 7</Txt></In>
      <In at={118.9} from="slam" out={119.4} style={{...abs(760, 660, 1060), textAlign: 'center'}}><Chip size={50} solid><Ic n="play" size={44} color={INK} w={2.6} />ЗАПУСКАЕМ</Chip></In>
      {t >= 119.3 ? (
        <div style={{...abs(800, 90), width: 506, height: 900, borderRadius: 44, overflow: 'hidden', border: '2px solid rgba(234,244,239,0.35)', boxShadow: `0 10px 0 rgba(1,8,6,0.8), 0 40px 90px rgba(0,0,0,0.7), 0 0 60px ${LIME}33`, opacity: ramp(t, 119.3, 119.6) * (1 - 0.7 * ramp(t, 122.9, 123.3)), transform: `translateX(${-ramp(t, 122.9, 123.4) * 40}px) scale(${1 - 0.12 * ramp(t, 122.9, 123.4)})`, transformOrigin: 'left center'}}>
          <Sequence from={Math.round(toVideo(119.3) * fps)} layout="none"><OffthreadVideo src={staticFile('agent/phone.mp4')} muted style={{width: '100%', height: '100%', objectFit: 'cover'}} /></Sequence>
        </div>
      ) : null}
      {vid ? <In at={119.8} from="right" style={abs(1360, 400, 500)}><Txt size={26} color={LIME} style={{letterSpacing: 4, fontWeight: 800}}>НАСТОЯЩАЯ СЪЁМКА</Txt><H size={50} style={{marginTop: 10, letterSpacing: 2}}>Первое сообщение</H></In> : null}
      {t >= 123.0 ? (
        <div style={{...abs(1140, 110, 720), opacity: Math.min(1, msg * 2), transform: `perspective(1600px) rotateY(-5deg) translateY(${(1 - msg) * 80}px)`, transformOrigin: 'right center'}}>
          <Glass accent="#3AB0E8" pad="22px 26px">
            <div style={{display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12}}><Tile n="bot" col={LIME} size={58} /><div><Txt size={30} style={{fontWeight: 800}}>Новостник</Txt><Txt size={20} color={DIM}>бот</Txt></div></div>
            <Txt size={30}>ИИ за неделю · 13 октября</Txt>
            {[['1. Meta выпустила новую модель Muse Wonder', 'Вышла 12 октября. Доступ платный, по подписке.'], ['2. Anthropic выпустила Claude Haiku 5.5', 'Вышла 7 октября. Маленькая и дешёвая модель.']].map(([h, s], i) => {
              const on = t >= 124.9 + i * 2.5 && t < 128.6 + i * 0.4;
              return (
                <div key={i} style={{marginTop: 14, padding: '10px 14px', borderRadius: 14, background: on ? `${LIME}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${on ? LIME : 'transparent'}`}}>
                  <Txt size={28} style={{fontWeight: 800}}>{h}</Txt><Txt size={24} color={DIM} style={{fontWeight: 500}}>{s}</Txt><Txt size={24} color="#6CCBF5">Источник</Txt>
                </div>
              );
            })}
          </Glass>
          <In at={123.4} from="slam" style={{marginTop: 26, textAlign: 'center'}}><H size={44} style={{letterSpacing: 2, whiteSpace: 'nowrap'}}>Новостей <span style={{color: LIME}}>две</span>, а не три</H></In>
          <In at={129.2} from="up" style={{marginTop: 20}}><Glass accent={GOLD} pad="14px 22px" style={{display: 'flex', alignItems: 'center', gap: 16}}><Tile n="doc" col={GOLD} size={58} /><div><Txt size={20} color={GOLD} style={{letterSpacing: 3, fontWeight: 800}}>ИЗ ИНСТРУКЦИИ</Txt><Txt size={32}>одна настоящая новость лучше трёх пустых</Txt></div></Glass></In>
        </div>
      ) : null}
    </F>
  );
};

// ---------- Два способа запуска (133.2–174.3) ----------
const LaptopArt: React.FC<{w?: number; off?: number}> = ({w = 300, off = 0}) => (
  <svg width={w} height={w * 0.7} viewBox="0 0 300 210" style={{filter: `grayscale(${off}) brightness(${1 - 0.55 * off})`}}>
    <defs><linearGradient id="lap" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F6FAF8" /><stop offset="1" stopColor="#8FA69D" /></linearGradient></defs>
    <rect x="34" y="8" width="232" height="150" rx="14" fill="url(#lap)" /><rect x="46" y="20" width="208" height="126" rx="6" fill={off > 0.5 ? '#020806' : '#06231C'} />
    {off > 0.5 ? null : [0, 1, 2].map((i) => <rect key={i} x="62" y={40 + i * 26} width={[150, 110, 130][i]} height="10" rx="5" fill={[LIME, TEAL, 'rgba(234,244,239,0.4)'][i]} />)}
    <path d="M8 166 H292 L276 196 H24 Z" fill="url(#lap)" /><rect x="120" y="172" width="60" height="8" rx="4" fill="#5E726B" />
  </svg>
);
const Ways: React.FC = () => {
  const t = useT();
  const two = t >= 145.4;
  const pick = t >= 162.3 && t < 165.0;
  const honest = t >= 167.6;
  const off = ramp(t, 154.0, 154.8);
  return (
    <F a={LAUNCH_END} b={WAYS_END}>
      <In at={133.4} from="slam" style={{...abs(0, 50, 1920), textAlign: 'center'}}><H size={64}>Два способа <span style={{color: LIME}}>запуска</span></H></In>
      <div style={{opacity: honest ? 0.18 : 1}}>
        <In at={136.5} from="left" style={abs(90, 170, 840)}>
          <div style={{transform: 'perspective(1800px) rotateY(4deg)', transformOrigin: 'left center', opacity: two && !pick && t < 162.3 ? 0.6 : 1}}>
            <Glass accent={LIME} style={{height: 760, borderColor: pick ? LIME : undefined}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 20}}><Tile n="laptop" col={LIME} size={92} /><div><Txt size={24} color={LIME} style={{letterSpacing: 4, fontWeight: 800}}>СПОСОБ 01</Txt><H size={48} style={{letterSpacing: 2}}>Свой компьютер</H></div></div>
              <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 30, marginTop: 10, height: 290}}>
                <LaptopArt w={300} />
                <Robot t={t} all size={120} id="w1" />
              </div>
              <In at={138.4} from="scale" style={{marginTop: 10}}><Chip size={28} solid>так сделал я</Chip></In>
              <Row at={139.3} n="thumb" size={32}>проще всего</Row>
              <Row at={140.4} n="plug" col={GOLD} size={32}>работает, пока компьютер включён</Row>
              <In at={143.8} from="left" style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 16}}><ClaudeMark size={48} /><Txt size={32}>и приложение Claude открыто</Txt></In>
            </Glass>
          </div>
        </In>
        <In at={145.5} from="right" style={abs(990, 170, 840)}>
          <div style={{transform: 'perspective(1800px) rotateY(-4deg)', transformOrigin: 'right center', opacity: pick ? 0.5 : 1}}>
            <Glass accent={TEAL} style={{height: 760}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 20}}><Tile n="cloud" col={TEAL} size={92} /><div><Txt size={24} color={TEAL} style={{letterSpacing: 4, fontWeight: 800}}>СПОСОБ 02</Txt><H size={48} style={{letterSpacing: 2}}>Сервер, облако</H></div></div>
              <div style={{position: 'relative', height: 290, marginTop: 10}}>
                <svg width="430" height="250" viewBox="0 0 430 250" style={{position: 'absolute', left: 20, top: 8 + Math.sin(t * 1.6) * 6}}>
                  <defs><linearGradient id="cld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="#9FC9BE" /></linearGradient></defs>
                  <path d="M110 220 a70 70 0 0 1 -8 -139 a100 100 0 0 1 190 -24 a84 84 0 0 1 30 163 z" fill="url(#cld)" />
                  <path d="M104 96 a84 84 0 0 1 150 -30" fill="none" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.9" />
                  {[0, 1, 2].map((i) => <g key={i}><rect x={250} y={112 + i * 30} width="110" height="22" rx="6" fill="#06231C" /><circle cx={266} cy={123 + i * 30} r="4" fill={TEAL} opacity={0.4 + 0.6 * Math.abs(Math.sin(t * 4 + i))} /><rect x="280" y={119 + i * 30} width="66" height="8" rx="4" fill="rgba(234,244,239,0.3)" /></g>)}
                </svg>
                <div style={{position: 'absolute', left: 96, top: 22 + Math.sin(t * 1.6) * 6}}><Robot t={t} all size={96} id="w2" /></div>
                <div style={{position: 'absolute', right: 30, bottom: 6}}><LaptopArt w={170} off={off} /></div>
                {off > 0.5 ? <div style={{position: 'absolute', right: 26, bottom: 134}}><Chip size={22} color={CORAL}>выключен</Chip></div> : null}
              </div>
              {t >= 148.2 && t < 156.6 ? (
                <div style={{marginTop: 10, opacity: 1 - ramp(t, 156.3, 156.6)}}>
                  <In at={148.3} from="up">
                    <div style={{width: 440, height: 68, borderRadius: 34, background: 'rgba(0,0,0,0.45)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.6)', position: 'relative'}}>
                      <div style={{position: 'absolute', left: 6 + sp(t, 150.9, HARD) * 214, top: 6, width: 214, height: 56, borderRadius: 28, background: t >= 150.9 ? `linear-gradient(170deg, ${light(TEAL, 50)}, ${TEAL} 50%, ${dark(TEAL, 72)})` : 'linear-gradient(170deg, #fff, #9FB3AC)', boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.6), 0 4px 8px rgba(0,0,0,0.5)'}} />
                      <div style={{position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-around', fontFamily: FONT, fontWeight: 800, fontSize: 28}}><span style={{color: t < 150.9 ? INK : TEXT}}>локально</span><span style={{color: t >= 150.9 ? INK : TEXT}}>облако</span></div>
                    </div>
                  </In>
                  <In at={152.0} from="left" style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 16}}><ClaudeMark size={48} /><Txt size={32}>живёт на серверах Claude</Txt></In>
                  <Row at={154.3} n="moon" col={TEAL} size={30}>работает, даже когда компьютер выключен</Row>
                </div>
              ) : null}
              {t >= 156.6 ? (
                <div style={{marginTop: 10}}>
                  <In at={156.8} from="up"><Txt size={24} color={GOLD} style={{letterSpacing: 4, fontWeight: 800}}>НАСТРОЙКА ЧУТЬ ДОЛЬШЕ</Txt></In>
                  <Row at={158.8} n="unlock" col={GOLD} size={32}>разрешить доступ к Telegram</Row>
                  <Row at={160.6} n="key" col={GOLD} size={32}>надёжно сохранить ключ бота</Row>
                  <In at={161.9} from="up" style={{marginTop: 14}}><Txt size={21} color="rgba(234,244,239,0.5)" style={{fontWeight: 500}}>по документации Claude; у себя я этот способ пока не настраивал</Txt></In>
                </div>
              ) : null}
            </Glass>
          </div>
        </In>
        <In at={162.4} out={164.9} from="slam" style={{...abs(250, 900, 520), textAlign: 'center'}}><Chip size={38} solid>начните с первого</Chip></In>
        {t >= 165.0 ? <In at={166.0} from="slam" style={{...abs(560, 900, 800), textAlign: 'center'}}><Chip size={38} color={TEAL} solid>понравится <Ic n="arrow" size={34} color={INK} w={2.8} /> переселите в облако</Chip></In> : null}
      </div>
      {honest ? (
        <div style={{...abs(360, 320, 1200), textAlign: 'center'}}>
          <In at={167.9} from="slam"><Chip color={GOLD} size={34} solid>ЧЕСТНО</Chip></In>
          <In at={168.9} from="up" style={{marginTop: 26}}><H size={72}>Агент может <span style={{color: CORAL}}>ошибиться</span></H></In>
          <In at={170.6} from="up" style={{marginTop: 34, display: 'flex', justifyContent: 'center'}}><Glass accent={LIME} style={{display: 'inline-flex', alignItems: 'center', gap: 24}}><Tile n="link" col={LIME} size={88} /><Txt size={42} style={{textAlign: 'left'}}>в каждой новости ссылка:<br /><span style={{color: LIME}}>открыл и проверил</span></Txt></Glass></In>
        </div>
      ) : null}
    </F>
  );
};

// ---------- Концовка (174.3–конец) ----------
const Outro: React.FC = () => {
  const t = useT();
  const q = t >= 182.2;
  return (
    <F a={WAYS_END} b={TOTAL + 1}>
      {!q ? (
        <div style={{opacity: 1 - ramp(t, 181.9, 182.2)}}>
          <div style={{...abs(60, 130), width: 700, height: 900, borderRadius: '50%', background: `radial-gradient(ellipse at 50% 42%, ${TEAL}26, transparent 62%)`}} />
          <div style={abs(200, 150)}><Robot t={t} all size={410} mail id="o" /></div>
          <div style={{...abs(770, 220, 1040), transform: 'perspective(1600px) rotateY(-4deg)', transformOrigin: 'right center'}}>
            <In at={174.5} from="left"><Glass accent={LIME} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 22}}><Tile n="doc" col={LIME} size={84} /><Txt size={42}>готовая просьба для Claude</Txt></Glass></In>
            <In at={178.0} from="left"><Glass accent={TEAL} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 22}}><Tile n="bot" col={TEAL} size={84} /><Txt size={42}>инструкция по боту</Txt></Glass></In>
            <In at={179.6} from="scale">
              <div style={{display: 'flex', alignItems: 'center', gap: 28, borderRadius: 32, background: 'linear-gradient(160deg, #6CCBF5, #229ED9 45%, #156A96)', padding: '26px 34px', boxShadow: 'inset 0 3px 0 rgba(255,255,255,0.55), 0 10px 0 #0E4866, 0 34px 60px rgba(0,0,0,0.55)'}}>
                <svg width="110" height="110" viewBox="0 0 24 24"><path fill="#fff" d="M2 11.5 L22 3 L18.5 21 L11.5 15.5 L8.5 20 L8.2 14 L18 6.5 L6 12.8 Z" /></svg>
                <div><Txt size={28} color="rgba(255,255,255,0.9)" style={{letterSpacing: 3, fontWeight: 800}}>ЛЕЖАТ В TELEGRAM</Txt><Big size={62} color="#fff">t.me/your_channel</Big></div>
              </div>
            </In>
            <In at={180.9} from="up" style={{marginTop: 26, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14}}><Txt size={40} color={LIME} style={{letterSpacing: 2}}>ссылка в описании</Txt><Ic n="down" size={44} color={LIME} w={2.8} /></In>
          </div>
        </div>
      ) : (
        <>
          <In at={182.4} from="slam" style={{...abs(0, 110, 1920), textAlign: 'center'}}><H size={80}>Какого агента собрали бы <span style={{color: LIME}}>вы?</span></H></In>
          <div style={{...abs(230, 300, 1460), display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
            <Robot t={t} all size={250} wave={Math.abs(Math.sin(t * 6)) * 0.9} id="q" />
            {[0, 1, 2].map((i) => (
              <In key={i} at={182.8 + i * 0.2} from="scale">
                <div style={{width: 280, height: 440, borderRadius: 34, border: '2px dashed rgba(234,244,239,0.4)', background: 'linear-gradient(150deg, rgba(255,255,255,0.07), rgba(4,19,15,0.4))', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `translateY(${Math.sin(t * 3 + i) * 8}px)`}}><Big size={190} color="rgba(234,244,239,0.4)">?</Big></div>
              </In>
            ))}
          </div>
          <In at={184.1} from="up" style={{...abs(0, 900, 1920), textAlign: 'center'}}><Txt size={44} color={LIME} style={{letterSpacing: 3}}>напишите в комментариях</Txt></In>
        </>
      )}
    </F>
  );
};

// ---------- Звуки (времена по первой версии озвучки, при выводе сдвигаются) ----------
const Ping: React.FC<{t: number; sfx: Sfx; vol?: number}> = ({t, sfx, vol = 0.4}) => <At t={toVideo(t)} dur={1.3} sfx={sfx} vol={vol} />;
const S: [number, Sfx, number?][] = [
  [0.0, 'ding', 0.55], [2.4, 'pop'], [3.0, 'swap', 0.5], [3.3, 'swap', 0.5], [4.4, 'whoosh', 0.4], [7.2, 'tick', 0.8], [8.0, 'tick', 0.8], [8.9, 'tick', 0.8], [9.5, 'tick', 0.8], [10.0, 'whoosh', 0.45],
  ...PARTS.flatMap((p): [number, Sfx, number?][] => [[p.at - 0.15, 'whoosh', 0.45], [p.at, 'swap', 0.75], [p.at + 0.1, 'ding', 0.45], [p.full, 'pop', 0.3]]),
  [13.5, 'pop', 0.35], [16.4, 'alert', 0.3], [20.4, 'pop'], [22.9, 'pop', 0.35], [27.0, 'ding', 0.55],
  [31.3, 'ding', 0.55], [33.0, 'pop', 0.3], [33.3, 'pop', 0.3], [33.6, 'pop', 0.3], [33.9, 'pop', 0.3], [36.4, 'pop'], [38.4, 'alert', 0.25],
  [45.5, 'whoosh', 0.35], [50.0, 'pop'], [51.3, 'tick'], [52.9, 'tick'], [54.6, 'alert', 0.3], [56.1, 'tick'], [57.1, 'tick'], [57.9, 'tick'], [59.1, 'pop'], [60.3, 'tick'], [61.1, 'tick'], [62.5, 'tick'], [65.8, 'ding', 0.55], [67.5, 'pop'],
  [75.3, 'whoosh', 0.35], [75.9, 'tick'], [76.1, 'tick'], [76.3, 'tick'], [76.5, 'tick'], [77.0, 'pop', 0.35], [80.5, 'alert', 0.35],
  [84.2, 'pop', 0.35], [87.1, 'pop'], [88.7, 'pop', 0.3], [89.8, 'pop', 0.3], [92.2, 'whoosh', 0.45], [93.5, 'ding', 0.55],
  [97.8, 'pop'], [100.3, 'swap', 0.6], [100.8, 'tick'], [101.2, 'tick'], [101.6, 'tick'], [102.4, 'ding', 0.65], [103.9, 'pop'],
  [108.3, 'alert', 0.25], [109.4, 'pop', 0.3], [109.8, 'pop', 0.3], [110.2, 'pop', 0.3], [111.6, 'swap', 0.5], [112.6, 'tick'], [113.3, 'tick'], [116.3, 'alert', 0.4],
  [117.4, 'ding', 0.75], [117.5, 'swap', 0.7], [118.9, 'pop'], [119.3, 'whoosh', 0.5], [121.0, 'ding', 0.5], [123.0, 'swap', 0.6], [123.4, 'pop'], [129.2, 'pop'],
  [133.2, 'whoosh', 0.5], [133.4, 'swap', 0.6], [136.5, 'pop'], [138.4, 'pop', 0.35], [139.3, 'pop', 0.35], [140.4, 'pop', 0.35], [143.8, 'pop', 0.35], [145.5, 'swap', 0.6], [150.9, 'tick', 0.9], [152.0, 'pop', 0.35], [154.3, 'ding', 0.5], [156.8, 'pop'], [158.8, 'tick'], [160.6, 'tick'], [162.4, 'ding', 0.5], [166.0, 'whoosh', 0.45], [167.9, 'swap', 0.6], [168.9, 'alert', 0.35], [170.6, 'pop'],
  [174.3, 'whoosh', 0.5], [174.5, 'pop'], [178.0, 'pop'], [179.6, 'ding', 0.55], [180.9, 'pop'], [182.4, 'swap', 0.7], [182.8, 'pop', 0.3], [183.0, 'pop', 0.3], [183.2, 'pop', 0.3], [184.1, 'pop'],
];

export const Agent: React.FC<{music?: string}> = ({music = 'fishki/music.mp3'}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <Bg />
      <Audio src={staticFile('agent/voice.wav')} />
      {music ? <Audio loop src={staticFile(music)} volume={(f) => 0.08 * interpolate(f / fps, [0, 0.8, AGENT_SECONDS - 2.2, AGENT_SECONDS], [0, 1, 1, 0], clamp)} /> : null}
      <Editor /><Launch /><Ways /><Outro />
      {S.map(([at, sfx, vol], i) => <Ping key={i} t={at} sfx={sfx} vol={vol} />)}
    </AbsoluteFill>
  );
};

// для шортса: редактор без боковых частей, робот, кирпичики оформления и звуки
export const AgentEditor: React.FC = () => <ShortCtx.Provider value={true}><Editor /></ShortCtx.Provider>;
export const AgentPings: React.FC = () => <>{S.map(([at, sfx, vol], i) => <Ping key={i} t={at} sfx={sfx} vol={(vol ?? 0.4) * 0.85} />)}</>;
export {Robot as AgentRobot, Tile as AgentTile, Glass as AgentGlass, Chip as AgentChip, Ic as AgentIc, H as AgentH, Txt as AgentTxt, Big as AgentBig, PARTS as AGENT_PARTS};
export const AGENT_COLORS = {INK, TEXT, DIM, LIME, TEAL, GOLD, CORAL};
export const agentOldTime = (video: number) => (video < CUT ? video : video + SHIFT);
