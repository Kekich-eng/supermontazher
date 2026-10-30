// Шортс «Топ 5 ошибок при работе с Claude Code» в виде аркадной игры.
// Озвучка: public/osh/voice.wav, 83.38 с. Все времена ниже в секундах ролика (не сцены).
// Наверху всё время висит здоровье проекта: ошибка снимает сердечко, решение возвращает.
import React from 'react';
import {AbsoluteFill, Audio, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadPixel} from '@remotion/google-fonts/PressStart2P';
import {At, C, DISPLAY, FONT, Sfx} from './ui';
import {WORDS} from './oshWords';

const PIX = loadPixel('normal', {weights: ['400'], subsets: ['cyrillic', 'latin']}).fontFamily;

export const OSH_SECONDS = 83.38;
const TOTAL = OSH_SECONDS;
const INK = '#07030F';
const RED = '#FF3B5C';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SOFT = {damping: 13, mass: 0.6, stiffness: 170};
const HARD = {damping: 9, mass: 0.5, stiffness: 260};

const useT = () => useCurrentFrame() / 30;
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
const sp = (t: number, at: number, cfg = SOFT) => spring({frame: Math.round((t - at) * 30), fps: 30, config: cfg});
const abs = (x: number, y: number, w?: number): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w});
const box = (col: string, bg = '#120A26'): React.CSSProperties => ({background: bg, border: `6px solid ${col}`, boxShadow: '10px 10px 0 rgba(0,0,0,0.75)'});

// Уровни: когда начинается, когда ошибка бьёт по проекту и когда решение его лечит
const LV = [
  {a: 6.75, b: 17.4, name: 'ВСЁ СРАЗУ', col: '#FF9F1C', hit: 12.34, heal: 16.75},
  {a: 17.4, b: 31.8, name: 'НИ СЛОВА О ПРОЕКТЕ', col: '#3DA9FF', hit: 23.96, heal: 30.3},
  {a: 31.8, b: 41.15, name: 'КОД БЕЗ ПЛАНА', col: '#2EE6A6', hit: 35.7, heal: 40.4},
  {a: 41.15, b: 53.4, name: 'СПОР ДО НОЧИ', col: '#B26BFF', hit: 47.4, heal: 50.5},
  {a: 53.4, b: 63.35, name: 'ВЕРИТЕ НА СЛОВО', col: '#FFD23F', hit: 59.5, heal: 62.85},
];
const BOSS = {a: 63.35, b: 74.85, drain0: 67.1, over: 70.26, save: 73.5};
const END = 74.85;
const HITS = [...LV.map((l) => l.hit), BOSS.over];
const HEALS = [...LV.map((l) => l.heal), BOSS.save];
// мелкая тряска: заставки уровней и удары
const BUMPS = [0.44, 3.16, ...LV.map((l) => l.a + 0.05), 15.07, 16.01, 43.44, 46.42, 63.4, 65.84, 74.2];

const hpAt = (t: number) => {
  if (t >= BOSS.drain0 && t < BOSS.save) return 5 * (1 - ramp(t, BOSS.drain0, BOSS.over));
  return LV.some((l) => t >= l.hit && t < l.heal) ? 4 : 5;
};
const scoreAt = (t: number) => LV.reduce((s, l) => s + 100 * ramp(t, l.heal, l.heal + 0.5), 0) + 500 * ramp(t, BOSS.save, BOSS.save + 0.7);
const tintAt = (t: number) => (t >= END ? '#B26BFF' : t >= BOSS.a ? RED : LV.find((l) => t >= l.a && t < l.b)?.col ?? C.lime);

// ---------- Кирпичики ----------
const Px: React.FC<{size: number; color?: string; style?: React.CSSProperties; children: React.ReactNode}> = ({size, color = '#fff', style, children}) => (
  <div style={{fontFamily: PIX, fontSize: size, lineHeight: 1.35, color, textShadow: `${Math.max(3, size / 10)}px ${Math.max(3, size / 10)}px 0 #000`, textAlign: 'center', ...style}}>{children}</div>
);
const Big: React.FC<{size: number; color?: string; style?: React.CSSProperties; children: React.ReactNode}> = ({size, color = '#fff', style, children}) => (
  <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: size, lineHeight: 1.05, color, textAlign: 'center', textShadow: '0 8px 0 #000', ...style}}>{children}</div>
);
const Txt: React.FC<{size: number; color?: string; style?: React.CSSProperties; children: React.ReactNode}> = ({size, color = '#fff', style, children}) => (
  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.2, color, textAlign: 'center', ...style}}>{children}</div>
);
// появление: удар сверху, с боков или из точки
const In: React.FC<{at: number; from?: 'scale' | 'up' | 'down' | 'left' | 'right' | 'slam'; out?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({at, from = 'scale', out, style, children}) => {
  const t = useT();
  if (t < at - 0.02) return null;
  const s = sp(t, at, from === 'slam' ? HARD : SOFT);
  const o = out === undefined ? 1 : 1 - ramp(t, out, out + 0.25);
  if (o <= 0) return null;
  const d = (1 - s) * 140;
  const tr = from === 'slam' ? `scale(${3.4 - 2.4 * s})` : from === 'scale' ? `scale(${0.3 + 0.7 * s})` : from === 'up' ? `translateY(${d}px)` : from === 'down' ? `translateY(${-d}px)` : from === 'left' ? `translateX(${-d * 2}px)` : `translateX(${d * 2}px)`;
  return <div style={{...style, opacity: Math.min(1, s * 2.5) * o, transform: tr}}>{children}</div>;
};
// текст, который печатается по буквам
const typed = (s: string, t: number, at: number, cps = 26) => s.slice(0, Math.max(0, Math.floor((t - at) * cps)));

// пиксельное сердечко
const HEART = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
const Heart: React.FC<{fill: number; px?: number; pop?: number}> = ({fill, px = 9, pop = 0}) => (
  <svg width={7 * px} height={6 * px} style={{transform: `scale(${1 + pop * 0.5}) rotate(${pop * 14}deg)`, filter: pop > 0.3 ? 'brightness(3)' : undefined}}>
    {HEART.flatMap((row, y) => row.split('').map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={x * px} y={y * px} width={px} height={px} fill={fill > 0.5 ? RED : '#3A2850'} /> : null)))}
    {fill > 0.5 ? <rect x={px} y={px} width={px} height={px} fill="#fff" opacity={0.8} /> : null}
  </svg>
);

// обломки: квадратики, разлетающиеся из точки
const Burst: React.FC<{at: number; x: number; y: number; col: string; n?: number; power?: number}> = ({at, x, y, col, n = 18, power = 520}) => {
  const t = useT();
  const k = t - at;
  if (k < 0 || k > 0.9) return null;
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const ang = random(`b${at}${i}`) * Math.PI * 2, v = power * (0.4 + random(`v${at}${i}`));
        const s = 14 + random(`s${at}${i}`) * 26;
        return <div key={i} style={{position: 'absolute', left: x + Math.cos(ang) * v * k, top: y + Math.sin(ang) * v * k + 900 * k * k, width: s, height: s, background: i % 3 ? col : '#fff', opacity: 1 - k / 0.9, transform: `rotate(${k * 600 * (i % 2 ? 1 : -1)}deg)`}} />;
      })}
    </>
  );
};

// монстр: тело, глаза и зубы. hurt — моменты, когда он вспыхивает от удара
type Kind = 'blob' | 'ball' | 'chest' | 'boss';
const BODY: Record<Kind, string> = {
  blob: 'M12 88 Q2 62 16 46 Q8 22 34 22 Q44 4 62 17 Q88 10 85 38 Q100 56 88 88 Z',
  ball: 'M50 8 Q92 8 92 50 Q92 92 50 92 Q8 92 8 50 Q8 8 50 8 Z',
  chest: 'M10 44 L90 44 L90 90 L10 90 Z',
  boss: 'M8 92 L8 44 L2 8 L26 30 Q50 14 74 30 L98 8 L92 44 L92 92 L76 80 L62 92 L50 80 L38 92 L24 80 Z',
};
const Monster: React.FC<{x: number; y: number; size: number; col: string; kind: Kind; born: number; dead?: number; hurt?: number[]; teeth?: number; lid?: number; label?: string}> = ({x, y, size, col, kind, born, dead, hurt = [], teeth = 1, lid = 0, label}) => {
  const t = useT();
  if (t < born) return null;
  if (dead !== undefined && t >= dead) return <Burst at={dead} x={x + size / 2} y={y + size / 2} col={col} n={30} power={760} />;
  const s = sp(t, born, HARD);
  const hit = hurt.some((h) => t >= h && t < h + 0.16);
  const bob = Math.sin(t * 5) * size * 0.025;
  const eye = (cx: number) => (
    <g>
      <rect x={cx - 9} y={kind === 'chest' ? 54 : 40} width={18} height={18} fill="#fff" />
      <rect x={cx - 3 + Math.sin(t * 2.3) * 4} y={(kind === 'chest' ? 54 : 40) + 6} width={8} height={10} fill="#000" />
      <path d={`M${cx - 12} ${kind === 'chest' ? 50 : 36} L${cx + 12} ${(kind === 'chest' ? 50 : 36) + (cx < 50 ? 8 : -8) * teeth}`} stroke="#000" strokeWidth="5" />
    </g>
  );
  return (
    <div style={{...abs(x + (hit ? 22 : 0), y + bob), width: size, opacity: Math.min(1, s * 3), transform: `scale(${0.2 + 0.8 * s})`, filter: hit ? 'brightness(4) saturate(0)' : `drop-shadow(0 0 ${size / 12}px ${col})`}}>
      <svg viewBox="0 0 100 100" width={size} height={size} style={{overflow: 'visible'}}>
        <path d={BODY[kind]} fill={kind === 'boss' ? '#1A0410' : col} stroke="#000" strokeWidth="4" strokeLinejoin="miter" />
        {kind === 'ball' ? [0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx="50" cy="50" rx={40 - i * 3} ry={14 + i * 5} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="3" transform={`rotate(${i * 37 + t * 40} 50 50)`} />) : null}
        {kind === 'blob' ? ['{', '}', ';', '</>', '?'].map((c, i) => <text key={i} x={18 + i * 15} y={34 + (i % 2) * 44 + Math.sin(t * 4 + i) * 3} fontSize="11" fontFamily="monospace" fontWeight="700" fill="rgba(0,0,0,0.55)">{c}</text>) : null}
        {kind === 'chest' ? (
          <g transform={`rotate(${-lid * 42} 10 44)`}>
            <path d="M10 44 Q10 14 50 14 Q90 14 90 44 Z" fill={col} stroke="#000" strokeWidth="4" />
            <rect x="44" y="34" width="12" height="14" fill="#fff" stroke="#000" strokeWidth="3" />
          </g>
        ) : null}
        {kind === 'boss' ? (
          <g>
            <path d="M22 44 L44 52 L22 58 Z" fill={RED} /><path d="M78 44 L56 52 L78 58 Z" fill={RED} />
            <rect x="30" y="50" width="5" height="5" fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 20)} /><rect x="66" y="50" width="5" height="5" fill="#fff" opacity={0.5 + 0.5 * Math.sin(t * 20)} />
          </g>
        ) : (<>{eye(34)}{eye(66)}</>)}
        {teeth > 0 ? <path d={kind === 'chest' ? 'M14 46 L22 58 L30 46 L38 58 L46 46 L54 58 L62 46 L70 58 L78 46 L86 58' : 'M28 70 L34 80 L40 70 L46 80 L52 70 L58 80 L64 70 L70 80 L72 70'} fill="none" stroke={kind === 'boss' ? RED : '#fff'} strokeWidth={4 * teeth} strokeLinejoin="miter" /> : null}
      </svg>
      {label ? <Px size={42} color={col} style={{marginTop: 10}}>{label}</Px> : null}
    </div>
  );
};

// всплывающие очки
const Float: React.FC<{at: number; x: number; y: number; text: string; col: string}> = ({at, x, y, text, col}) => {
  const t = useT();
  const k = t - at;
  if (k < 0 || k > 1.1) return null;
  return <div style={{...abs(x, y - k * 190), opacity: 1 - ramp(k, 0.7, 1.1), transform: `scale(${1 + 0.4 * Math.sin(Math.min(1, k * 4) * Math.PI)})`}}><Px size={52} color={col}>{text}</Px></div>;
};

// ---------- Фон ----------
const Bg: React.FC = () => {
  const t = useT();
  const tint = tintAt(t);
  const boss = t >= BOSS.a && t < BOSS.b;
  return (
    <AbsoluteFill style={{background: boss ? '#16030A' : INK}}>
      <AbsoluteFill style={{background: `radial-gradient(900px 900px at 50% 38%, ${tint}38, transparent 70%)`}} />
      {Array.from({length: 70}).map((_, i) => {
        const sz = 4 + Math.floor(random(`z${i}`) * 3) * 4, v = 60 + random(`sv${i}`) * 240;
        return <div key={i} style={{position: 'absolute', left: random(`sx${i}`) * 1080, top: (random(`sy${i}`) * 1920 + t * v) % 1920, width: sz, height: sz, background: i % 5 ? '#fff' : tint, opacity: 0.25 + random(`so${i}`) * 0.5}} />;
      })}
      <div style={{position: 'absolute', left: -700, right: -700, top: 1360, height: 1000, transform: 'perspective(520px) rotateX(64deg)', transformOrigin: '50% 0%', backgroundImage: `linear-gradient(${tint}AA 4px, transparent 4px), linear-gradient(90deg, ${tint}AA 4px, transparent 4px)`, backgroundSize: '120px 120px', backgroundPosition: `0 ${(t * 160) % 120}px`, opacity: 0.5, maskImage: 'linear-gradient(transparent, #000 35%)', WebkitMaskImage: 'linear-gradient(transparent, #000 35%)'}} />
      {boss ? [0, 1].map((i) => <div key={i} style={{position: 'absolute', left: -200, width: 1480, top: i ? 1760 : 232, height: 36, backgroundImage: `repeating-linear-gradient(-45deg, ${RED} 0 40px, #000 40px 80px)`, backgroundPosition: `${t * (i ? -200 : 200)}px 0`, opacity: 0.8 * ramp(t, BOSS.a, BOSS.a + 0.3) * (1 - ramp(t, BOSS.save, BOSS.save + 0.4))}} />) : null}
    </AbsoluteFill>
  );
};
const Crt: React.FC = () => {
  const t = useT();
  const dmg = Math.max(0, ...HITS.map((h) => (t >= h ? 1 - ramp(t, h, h + 0.5) : 0)));
  const heal = Math.max(0, ...HEALS.map((h) => (t >= h ? 1 - ramp(t, h, h + 0.45) : 0)));
  const siren = t >= BOSS.a && t < BOSS.over ? 0.1 + 0.1 * Math.sin(t * 9) : 0;
  return (
    <>
      <AbsoluteFill style={{background: RED, opacity: dmg * 0.5 + siren}} />
      <AbsoluteFill style={{background: C.lime, opacity: heal * 0.3}} />
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(rgba(0,0,0,0.22) 0 3px, transparent 3px 7px)', opacity: 0.55}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.72) 100%)'}} />
    </>
  );
};
const Shake: React.FC<{children: React.ReactNode}> = ({children}) => {
  const t = useT();
  let amp = 0;
  for (const h of HITS) if (t >= h) amp = Math.max(amp, 34 * (1 - ramp(t, h, h + 0.55)));
  for (const h of BUMPS) if (t >= h) amp = Math.max(amp, 14 * (1 - ramp(t, h, h + 0.3)));
  return <AbsoluteFill style={{transform: `translate(${Math.sin(t * 91) * amp}px, ${Math.cos(t * 77) * amp}px)`}}>{children}</AbsoluteFill>;
};

// ---------- Здоровье проекта и счёт ----------
const Hud: React.FC = () => {
  const t = useT();
  const hp = hpAt(t);
  const s = sp(t, 1.5);
  const low = hp < 1.5 && t < BOSS.save;
  return (
    <div style={{...abs(40, 64 - (1 - s) * 260, 1000), opacity: Math.min(1, s * 2)}}>
      <div style={{...box(low ? RED : '#fff'), padding: '18px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
        <div>
          <Px size={22} style={{textAlign: 'left'}} color={low && Math.sin(t * 22) > 0 ? RED : '#fff'}>ПРОЕКТ</Px>
          <div style={{display: 'flex', gap: 10, marginTop: 10}}>
            {[0, 1, 2, 3, 4].map((i) => {
              const pop = Math.max(0, ...[...HITS, ...HEALS].map((h) => (t >= h && t < h + 0.4 && Math.round(hpAt(h + 0.01)) === (HEALS.includes(h) ? i + 1 : i) ? 1 - (t - h) / 0.4 : 0)));
              return <Heart key={i} fill={hp - i} pop={pop} />;
            })}
          </div>
        </div>
        <div style={{width: 300}}>
          <div style={{height: 34, border: '5px solid #fff', background: '#000', padding: 3}}>
            <div style={{height: '100%', width: `${(hp / 5) * 100}%`, background: hp > 3 ? C.lime : hp > 1.5 ? '#FFD23F' : RED}} />
          </div>
          <Px size={18} style={{textAlign: 'left', marginTop: 10}}>HP {Math.round((hp / 5) * 100)}%</Px>
        </div>
        <div>
          <Px size={22} style={{textAlign: 'right'}}>ОЧКИ</Px>
          <Px size={30} color={C.lime} style={{textAlign: 'right', marginTop: 8}}>{String(Math.round(scoreAt(t))).padStart(4, '0')}</Px>
        </div>
      </div>
    </div>
  );
};

// заставка уровня и маленький заголовок после неё
const LevelCard: React.FC<{n: number}> = ({n}) => {
  const t = useT();
  const l = LV[n];
  const s = sp(t, l.a + 0.05, HARD);
  const gone = ramp(t, l.a + 1.45, l.a + 1.7);
  const head = sp(t, l.a + 1.55);
  return (
    <>
      {gone < 1 ? (
        <div style={{...abs(0, 520, 1080), opacity: 1 - gone, transform: `translateX(${(1 - s) * -1100 - gone * 300}px)`}}>
          <div style={{background: '#000', borderTop: `10px solid ${l.col}`, borderBottom: `10px solid ${l.col}`, padding: '46px 0 52px', transform: 'skewY(-4deg)', boxShadow: `0 0 120px ${l.col}66`}}>
            <Px size={62} color={l.col} style={{transform: `scale(${2.2 - 1.2 * s})`}}>УРОВЕНЬ {n + 1}</Px>
            <Big size={l.name.length > 13 ? 62 : 84} style={{marginTop: 26}}>{l.name}</Big>
          </div>
        </div>
      ) : null}
      <div style={{...abs(40, 262, 1000), opacity: head, transform: `translateY(${(1 - head) * -30}px)`, display: 'flex', alignItems: 'center', gap: 18}}>
        <div style={{background: l.col, padding: '12px 16px', boxShadow: '6px 6px 0 #000'}}><Px size={24} color="#000" style={{textShadow: 'none'}}>LVL {n + 1}</Px></div>
        <Txt size={46} style={{textAlign: 'left'}}>{l.name}</Txt>
      </div>
    </>
  );
};

// ---------- 0. Заставка (0–6.75) ----------
const Intro: React.FC = () => {
  const t = useT();
  const dark = ramp(t, 3.0, 3.3);
  const five = sp(t, 0.44, HARD);
  return (
    <AbsoluteFill>
      <div style={{opacity: 1 - 0.96 * dark}}>
        <In at={0} from="down" style={abs(0, 330, 1080)}><Px size={96} color="#fff">ТОП</Px></In>
        <div style={{...abs(0, 430, 1080), opacity: Math.min(1, five * 3), transform: `scale(${5 - 4 * five}) rotate(${(1 - five) * -30}deg)`}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 620, lineHeight: 1, textAlign: 'center', color: C.lime, textShadow: `14px 14px 0 #000, 0 0 120px ${C.lime}`}}>5</div>
        </div>
        <In at={0.84} from="slam" style={abs(0, 1040, 1080)}><Big size={128}>ОШИБОК</Big></In>
        <In at={1.6} from="up" style={{...abs(0, 1220, 1080), display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 22}}>
          <Img src={staticFile('short/claude_burst.png')} style={{width: 96, height: 96}} />
          <Txt size={62}>в Claude Code</Txt>
        </In>
      </div>
      <Burst at={0.44} x={540} y={740} col={C.lime} n={26} power={900} />
      {t >= 3.1 ? (
        <>
          <Monster x={240} y={380 + (1 - sp(t, 3.16)) * 500} size={600} col={RED} kind="boss" born={3.16} />
          <In at={3.3} from="slam" style={abs(0, 300, 1080)}><Px size={44} color={RED} style={{opacity: Math.sin(t * 14) > -0.4 ? 1 : 0.2}}>+1 СЕКРЕТНЫЙ БОСС</Px></In>
          <In at={4.5} from="slam" style={abs(0, 1040, 1080)}><Big size={84} color={RED}>МИНУС ВЕСЬ<br />ПРОЕКТ</Big></In>
          <In at={5.74} from="up" style={{...abs(0, 1300, 1080), display: 'flex', justifyContent: 'center'}}>
            <div style={{...box('#fff'), padding: '20px 30px', transform: `translateY(${Math.abs(Math.sin(t * 7)) * -14}px)`}}><Px size={34}>🔒 ЖДЁТ В КОНЦЕ</Px></div>
          </In>
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- 1. Всё сразу (6.75–17.4) ----------
const L1: React.FC = () => {
  const t = useT();
  const {col, hit, heal} = LV[0];
  const fall = sp(t, 9.0, HARD);
  const grow = 1 + 0.22 * ramp(t, 9.6, hit);
  const steps: [string, number][] = [['МЕНЮ', 14.82], ['УРОВЕНЬ', 15.76], ['ВРАГИ', 16.5]];
  return (
    <AbsoluteFill>
      <LevelCard n={0} />
      {t >= 9.0 && t < hit ? (
        <div style={{...abs(90, 470 - (1 - fall) * 1200, 900), transform: `scale(${grow}) rotate(${Math.sin(t * 30) * ramp(t, 11.2, hit) * 3}deg)`}}>
          <div style={{...box('#3DE8FF'), padding: '40px 36px'}}>
            <Px size={24} color="#3DE8FF" style={{textAlign: 'left'}}>ЗАПРОС</Px>
            <Txt size={74} style={{textAlign: 'left', marginTop: 16}}>«Сделай мне игру как Майнкрафт»</Txt>
          </div>
        </div>
      ) : null}
      <Burst at={hit} x={540} y={700} col="#3DE8FF" n={30} power={900} />
      <Monster x={270} y={420} size={540} col={col} kind="blob" born={hit} dead={heal} hurt={steps.map((s) => s[1] + 0.25)} label="КАША" />
      <Float at={hit + 0.1} x={640} y={420} text="-1 ♥" col={RED} />
      <In at={13.08} from="up" style={abs(0, 1090, 1080)}><Px size={34} color={C.lime}>ДЕЛИТЕ НА ШАГИ</Px></In>
      {steps.map(([name, at], i) => {
        const fly = ramp(t, at, at + 0.25);
        const back = sp(t, at + 0.25);
        if (t < at) return null;
        const hx = 60 + i * 330, hy = 1190;
        const x = fly < 1 ? hx + (430 - hx) * fly : 430 + (hx - 430) * back;
        const y = fly < 1 ? hy + 300 * (1 - fly) + (700 - hy - 300 * (1 - fly)) * fly : 700 + (hy - 700) * back;
        return (
          <div key={name} style={{...abs(x, y, 300), transform: `rotate(${fly < 1 ? fly * 360 : 0}deg)`}}>
            <div style={{...box(C.lime, '#16300A'), padding: '26px 0'}}>
              <Px size={i === 1 ? 26 : 30} color={C.lime}>{fly >= 1 ? '✓ ' : ''}{name}</Px>
            </div>
          </div>
        );
      })}
      {steps.map(([n, at]) => <Burst key={n} at={at + 0.25} x={540} y={700} col={col} n={10} power={420} />)}
      <Float at={heal} x={380} y={620} text="+100" col={C.lime} />
    </AbsoluteFill>
  );
};

// ---------- 2. Ни слова о проекте (17.4–31.8) ----------
const L2: React.FC = () => {
  const t = useT();
  const {col, heal} = LV[1];
  const lit = ramp(t, 30.08, 30.4);
  const lost = 1 - lit;
  const lines: [string, number, string][] = [['# Что это за проект', 26.5, '#fff'], ['# Как тут принято', 27.5, '#fff'], ['⛔ НЕ ТРОГАТЬ: оплату', 28.7, RED]];
  const card = sp(t, 24.58, HARD);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{background: '#000', opacity: 0.55 * lost * ramp(t, 19.0, 19.9)}} />
      <AbsoluteFill style={{background: `radial-gradient(700px 700px at 50% 30%, ${C.lime}55, transparent 70%)`, opacity: lit}} />
      <LevelCard n={1} />
      {t >= 19.0 ? (
        <div style={{...abs(390 + Math.sin(t * 2.6) * 190 * lost, 350), fontSize: 300, lineHeight: 1, opacity: ramp(t, 19.0, 19.4), transform: `rotate(${Math.sin(t * 5.2) * 9 * lost}deg) translateY(${lit > 0 ? -Math.abs(Math.sin(t * 9)) * 26 : 0}px)`}}>🤖</div>
      ) : null}
      {t >= 19.6 ? Array.from({length: 9}).map((_, i) => {
        const ang = t * (1.4 + (i % 3) * 0.5) + i * 0.7, r = 250 + (i % 3) * 50;
        return <div key={i} style={{...abs(520 + Math.sin(t * 2.6) * 190 * lost + Math.cos(ang) * r, 480 + Math.sin(ang) * r * 0.5), opacity: ramp(t, 19.6 + i * 0.08, 19.9 + i * 0.08)}}><Px size={i % 2 ? 44 : 64} color={lit > 0.5 ? C.lime : col}>{lit > 0.5 ? '✓' : '?'}</Px></div>;
      }) : null}
      <In at={21.4} from="slam" out={24.4} style={{...abs(0, 780, 1080), display: 'flex', justifyContent: 'center'}}>
        <div style={{...box(col), padding: '24px 30px'}}><Px size={30} color={col}>ПЕРВЫЙ ДЕНЬ НА РАБОТЕ</Px></div>
      </In>
      {[['ИМЕНА', 23.16, 110], ['ПРАВИЛА', 23.96, 570]].map(([name, at, x]) => (
        <In key={name as string} at={at as number} from="slam" out={24.4} style={abs(x as number, 960, 400)}>
          <div style={{...box(RED), padding: '26px 0'}}><Px size={32} color={RED}>✗ {name}</Px></div>
        </In>
      ))}
      <Float at={LV[1].hit + 0.1} x={640} y={420} text="-1 ♥" col={RED} />
      {t >= 24.58 ? (
        <div style={{...abs(110, 790 - (1 - card) * 1500, 860), transform: `rotate(${(1 - card) * 20}deg)`}}>
          <div style={{...box(C.lime, '#0E1B0A')}}>
            <div style={{background: t >= 25.44 ? C.lime : '#2A3A1A', padding: '20px 26px', display: 'flex', alignItems: 'center', gap: 16, transform: `scale(${1 + 0.06 * Math.sin(Math.min(1, ramp(t, 25.44, 25.8)) * Math.PI)})`}}>
              <div style={{fontSize: 50, lineHeight: 1}}>📜</div>
              <Px size={40} color="#000" style={{textShadow: 'none'}}>CLAUDE.md</Px>
            </div>
            <div style={{padding: '28px 30px 34px', minHeight: 330}}>
              {lines.map(([s, at, c]) => <div key={s} style={{fontFamily: 'Consolas, monospace', fontWeight: 700, fontSize: 54, lineHeight: 1.7, color: c, whiteSpace: 'nowrap'}}>{typed(s, t, at)}{t >= at && t < at + s.length / 26 ? '█' : ''}</div>)}
            </div>
          </div>
        </div>
      ) : null}
      {t >= 30.08 && t < 31.0 ? (
        <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0}}>
          <line x1="540" y1="800" x2="540" y2="640" stroke={C.lime} strokeWidth="14" strokeDasharray="26 18" strokeDashoffset={t * 300} />
        </svg>
      ) : null}
      <In at={30.1} from="slam" style={abs(640, 330, 400)}><Px size={30} color={C.lime}>ЧИТАЕТ САМ</Px></In>
      <Float at={heal} x={130} y={640} text="+100" col={C.lime} />
    </AbsoluteFill>
  );
};

// ---------- 3. Код без плана (31.8–41.15) ----------
const L3: React.FC = () => {
  const t = useT();
  const {col, hit, heal} = LV[2];
  const plan = sp(t, 36.7, HARD);
  const stamp = sp(t, 40.28, HARD);
  const steps: [string, number][] = [['1. Что делаем', 36.95], ['2. Из чего собираем', 37.3], ['3. В каком порядке', 37.65]];
  const fixd = ramp(t, 38.82, 39.2);
  return (
    <AbsoluteFill>
      <LevelCard n={2} />
      <In at={33.2} from="slam" out={35.9} style={{...abs(0, 360, 1080), display: 'flex', justifyContent: 'center'}}>
        <div style={{...box(RED, '#2A0A12'), padding: '22px 34px', transform: `translateY(${t > 33.5 && t < 33.7 ? 10 : 0}px)`}}><Px size={34} color="#fff">▶ ПИШИ КОД!</Px></div>
      </In>
      {t >= 34.2 && t < 36.7 ? Array.from({length: 15}).map((_, i) => {
        const row = Math.floor(i / 3), c = i % 3, at = 34.44 + i * 0.075;
        if (t < at) return null;
        const drop = sp(t, at, HARD);
        const k = Math.max(0, t - hit);
        const jx = (random(`hx${i}`) - 0.5) * 60 * (row + 1) * 0.5, rot = (random(`hr${i}`) - 0.5) * 16 * (row + 1) * 0.6;
        const sway = Math.sin(t * 12) * row * 5 * ramp(t, 35.0, hit);
        const vx = (random(`hv${i}`) - 0.5) * 900;
        return <div key={i} style={{position: 'absolute', left: 300 + c * 160 + jx + sway + vx * k, top: 1040 - row * 128 - (1 - drop) * 900 + 1500 * k * k - 200 * k, width: 156, height: 124, background: i % 4 === 1 ? '#3DE8FF' : col, border: '6px solid #000', transform: `rotate(${rot + k * vx * 0.5}deg)`, opacity: 1 - ramp(k, 0.5, 0.9)}}>{i % 4 === 1 ? null : <div style={{margin: 24, height: 60, background: 'rgba(0,0,0,0.3)'}} />}</div>;
      }) : null}
      <Burst at={hit} x={540} y={900} col="#fff" n={26} power={700} />
      <Float at={hit + 0.1} x={640} y={520} text="-1 ♥" col={RED} />
      <In at={34.5} from="up" out={36.5} style={abs(0, 1220, 1080)}><Px size={32} color={RED}>ДОМ БЕЗ ЧЕРТЕЖА</Px></In>
      {t >= 36.7 ? (
        <div style={{...abs(100, 380, 880), opacity: Math.min(1, plan * 2), transform: `scale(${0.4 + 0.6 * plan}) rotate(${(1 - plan) * -8}deg)`}}>
          <div style={{border: '8px solid #fff', boxShadow: '12px 12px 0 #000', background: '#1246B8', backgroundImage: 'linear-gradient(rgba(255,255,255,0.14) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.14) 2px, transparent 2px)', backgroundSize: '44px 44px', padding: '34px 40px 44px', minHeight: 720}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <Px size={56}>ПЛАН</Px>
              <In at={38.02} from="slam" style={{fontSize: 90, lineHeight: 1}}>👀</In>
            </div>
            {steps.map(([s, at], i) => (
              <In key={s} at={at} from="left" style={{marginTop: 34, position: 'relative'}}>
                <Txt size={62} style={{textAlign: 'left', opacity: i === 1 ? 1 - 0.55 * fixd : 1}}>{s}</Txt>
                {i === 1 ? <div style={{position: 'absolute', left: 0, top: 36, height: 10, width: `${fixd * 88}%`, background: RED}} /> : null}
              </In>
            ))}
            <In at={39.0} from="left" style={{marginTop: 30, display: 'flex', alignItems: 'center', gap: 16}}>
              <div style={{fontSize: 60, lineHeight: 1}}>✏️</div>
              <Txt size={58} color={C.lime} style={{textAlign: 'left'}}>проще и по частям</Txt>
            </In>
          </div>
        </div>
      ) : null}
      {t >= 40.28 ? (
        <div style={{...abs(250, 900, 580), opacity: Math.min(1, stamp * 3), transform: `scale(${4 - 3 * stamp}) rotate(-12deg)`}}>
          <div style={{border: `14px solid ${C.lime}`, background: 'rgba(7,3,15,0.9)', padding: '30px 0', boxShadow: `0 0 80px ${C.lime}`}}><Big size={120} color={C.lime}>ДЕЛАЙ!</Big></div>
        </div>
      ) : null}
      <Float at={heal} x={380} y={1320} text="+100" col={C.lime} />
    </AbsoluteFill>
  );
};

// ---------- 4. Спор до ночи (41.15–53.4) ----------
const L4: React.FC = () => {
  const t = useT();
  const {col, heal} = LV[3];
  const born = 46.42;
  const tangle = ramp(t, 44.1, born);
  const n = Math.max(0, Math.min(22, Math.floor((t - 41.9) / 0.16)));
  const mins = Math.round(interpolate(t, [41.9, 43.44], [21 * 60, 27 * 60], clamp));
  const clock = `${String(Math.floor(mins / 60) % 24).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const late = t >= 43.44;
  const eat: [string, number][] = [['✓ МЕНЮ', 47.06], ['✓ УРОВЕНЬ', 47.4], ['✓ ВРАГИ', 47.8]];
  const boom = t >= heal ? 1 - ramp(t, heal, heal + 0.5) : 0;
  return (
    <AbsoluteFill>
      <LevelCard n={3} />
      {t >= 41.9 && t < born + 0.2 ? Array.from({length: n}).map((_, i) => {
        const me = i % 2 === 0;
        const y0 = 1080 - (n - 1 - i) * 92;
        if (y0 < 360) return null;
        const x0 = me ? 470 : 90, w = 380 + ((i * 53) % 140);
        const ang = i * 2.4 + t * 6 * tangle, r = 150 * (1 - tangle * 0.4);
        const x = x0 + (540 - w / 2 + Math.cos(ang) * r - x0) * tangle, y = y0 + (640 + Math.sin(ang) * r - y0) * tangle;
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: w, height: 70, background: me ? '#2A1B55' : '#3A2850', border: `5px solid ${me ? col : '#8A7AA8'}`, transform: `rotate(${tangle * (i * 47 + t * 200)}deg) scale(${1 - 0.3 * tangle})`, opacity: (1 - ramp(t, born, born + 0.2)) * Math.min(1, (y0 - 360) / 90)}}><div style={{margin: '18px 20px', height: 12, width: '70%', background: 'rgba(255,255,255,0.5)'}} /><div style={{margin: '0 20px', height: 10, width: '45%', background: 'rgba(255,255,255,0.28)'}} /></div>;
      }) : null}
      <In at={41.9} from="right" out={46.2} style={abs(640, 350, 400)}>
        <div style={{...box(late ? RED : '#fff'), padding: '18px 0', transform: `scale(${late ? 1.12 + 0.06 * Math.sin(t * 16) : 1})`, transformOrigin: 'right center'}}><Px size={52} color={late ? RED : '#fff'}>{clock}</Px></div>
      </In>
      <Monster x={300} y={400} size={480} col={col} kind="ball" born={born} dead={heal} hurt={eat.map((e) => e[1] + 0.3)} label="КЛУБОК" />
      {eat.map(([name, at], i) => {
        if (t < at - 0.5 || t >= at + 0.32) return null;
        const k = ramp(t, at, at + 0.3), s = sp(t, at - 0.5);
        return <div key={name} style={{...abs(60 + i * 330 + (430 - 60 - i * 330) * k, 1010 + (640 - 1010) * k, 300), opacity: Math.min(1, s * 2), transform: `scale(${(0.5 + 0.5 * s) * (1 - 0.7 * k)}) rotate(${k * 300}deg)`}}><div style={{...box(C.lime, '#16300A'), padding: '24px 0'}}><Px size={i === 1 ? 24 : 28} color={C.lime}>{name}</Px></div></div>;
      })}
      <In at={47.1} from="up" out={48.8} style={abs(0, 1200, 1080)}><Px size={30} color={RED}>ЧИНИТ ТО, ЧТО РАБОТАЛО</Px></In>
      <Float at={LV[3].hit + 0.1} x={640} y={420} text="-1 ♥" col={RED} />
      {[['ПОПЫТКА 1', 49.1, 90], ['ПОПЫТКА 2', 49.58, 560]].map(([name, at, x]) => (
        <In key={name as string} at={at as number} from="slam" out={50.3} style={abs(x as number, 1130, 430)}>
          <div style={{...box(RED), padding: '26px 0'}}><Px size={28} color={RED}>{name} ✗</Px></div>
        </In>
      ))}
      {t >= 50.36 && t < 52.1 ? (
        <div style={{...abs(170, 1120, 740), opacity: 1 - ramp(t, 51.8, 52.1), transform: `scale(${(0.3 + 0.7 * sp(t, 50.36, HARD)) * (t >= heal && t < heal + 0.15 ? 0.9 : 1)})`}}>
          <div style={{background: C.lime, border: '8px solid #000', boxShadow: `0 ${t >= heal && t < heal + 0.15 ? 4 : 16}px 0 #5E8A00, 0 0 90px ${C.lime}`, padding: '40px 0'}}><Px size={46} color="#000" style={{textShadow: 'none'}}>+ НОВЫЙ ЧАТ</Px></div>
        </div>
      ) : null}
      <AbsoluteFill style={{background: '#fff', opacity: boom * 0.85}} />
      <Float at={heal} x={380} y={520} text="+100" col={C.lime} />
      <In at={51.9} from="slam" style={abs(110, 560, 860)}>
        <div style={{...box(C.lime, '#0E1B0A'), padding: '40px 36px'}}>
          <Px size={24} color={C.lime} style={{textAlign: 'left'}}>ОДНО СООБЩЕНИЕ</Px>
          <Txt size={68} style={{textAlign: 'left', marginTop: 18}}>Вся задача заново. Целиком.</Txt>
        </div>
      </In>
    </AbsoluteFill>
  );
};

// ---------- 5. Верите на слово (53.4–63.35) ----------
const L5: React.FC = () => {
  const t = useT();
  const {col, hit, heal} = LV[4];
  const lid = sp(t, 58.2, HARD) * (t >= 58.2 ? 1 : 0);
  const mimic = t >= hit;
  const btn = sp(t, 58.9, HARD);
  const check = ramp(t, 62.0, heal);
  const ok = t >= heal;
  const cmd = '> запусти и проверь сам';
  return (
    <AbsoluteFill>
      <LevelCard n={4} />
      <Monster x={300} y={600} size={480} col={col} kind="chest" born={55.3} dead={heal} hurt={[]} teeth={mimic ? 1 : 0} lid={lid} label={mimic ? 'ОБМАНКА' : 'СУНДУК'} />
      {t >= 55.3 && t < 58.2 ? Array.from({length: 8}).map((_, i) => <div key={i} style={{...abs(250 + ((i * 97) % 560), 560 + ((i * 61) % 380)), fontSize: 50, opacity: 0.5 + 0.5 * Math.sin(t * 9 + i * 2)}}>✨</div>) : null}
      {[['«Готово ✓»', 56.42, 110, 370], ['«Всё работает!»', 56.98, 330, 470]].map(([s, at, x, y]) => (
        <In key={s as string} at={at as number} from="slam" out={58.2} style={abs(x as number, y as number)}>
          <div style={{...box(col, '#2B2206'), padding: '20px 30px'}}><Txt size={62} color={col}>{s}</Txt></div>
        </In>
      ))}
      {t >= 58.9 ? (
        <div style={{...abs(290, 610 - btn * 240, 500), opacity: Math.min(1, btn * 2), transform: `scale(${0.4 + 0.6 * btn}) rotate(${ok ? 0 : -5}deg)`}}>
          <div style={{background: ok ? C.lime : '#4A4458', border: '8px solid #000', boxShadow: ok ? `0 14px 0 #5E8A00, 0 0 100px ${C.lime}` : '0 14px 0 #23202B', padding: '34px 0', position: 'relative', transform: `scale(${ok ? 1 + 0.07 * Math.sin(t * 14) : 1})`}}>
            <Px size={40} color={ok ? '#000' : '#8A8496'} style={{textShadow: 'none'}}>{ok ? 'КНОПКА ✓' : 'КНОПКА'}</Px>
            {!ok && mimic ? <svg viewBox="0 0 100 40" style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}}><path d="M30 0 L42 14 L34 22 L52 40 M42 14 L60 10 L70 0" fill="none" stroke="#000" strokeWidth="2.5" /></svg> : null}
          </div>
          {!ok && mimic && t < 62.0 ? <Px size={38} color={RED} style={{marginTop: 22}}>НЕ РАБОТАЕТ</Px> : null}
          {t >= 62.0 && !ok ? (
            <div style={{marginTop: 22}}>
              <div style={{height: 34, border: '5px solid #fff', background: '#000', padding: 3}}><div style={{height: '100%', width: `${check * 100}%`, background: C.lime}} /></div>
              <Px size={24} style={{marginTop: 10}}>ПРОВЕРКА {Math.round(check * 100)}%</Px>
            </div>
          ) : null}
        </div>
      ) : null}
      <Float at={hit + 0.1} x={640} y={470} text="-1 ♥" col={RED} />
      <In at={60.4} from="up" style={abs(90, 1200, 900)}>
        <div style={{...box(C.lime, '#0E1B0A'), padding: '26px 30px 32px'}}>
          <Px size={24} color={C.lime} style={{textAlign: 'left'}}>ДОБАВЬТЕ В КОНЦЕ</Px>
          <div style={{fontFamily: 'Consolas, monospace', fontWeight: 700, fontSize: 60, color: '#fff', marginTop: 16, whiteSpace: 'nowrap'}}>{typed(cmd, t, 61.2, 20)}{Math.sin(t * 12) > 0 ? '█' : ''}</div>
        </div>
      </In>
      <Float at={heal} x={380} y={640} text="+100" col={C.lime} />
    </AbsoluteFill>
  );
};

// ---------- 6. Финальный босс: нет сохранений (63.35–74.85) ----------
const FILES = ['📄', '🖼️', '⚙️', '📄', '🎵', '📄', '🖼️', '📄', '⚙️', '📄', '🖼️', '📄'];
const ORDER = [7, 2, 10, 0, 5, 11, 3, 8, 1, 9, 4, 6];
const Boss: React.FC = () => {
  const t = useT();
  const {a, drain0, over, save} = BOSS;
  const title = sp(t, a + 0.05, HARD);
  const head = sp(t, 65.84, HARD);
  const rew = ramp(t, save, save + 0.6);
  const go = t >= over && t < save + 0.25;
  const cnt = Math.max(0, 9 - Math.floor((t - 71.04) / 0.27));
  const floppy = sp(t, 72.7, HARD);
  return (
    <AbsoluteFill>
      {t < 65.7 ? (
        <div style={{...abs(0, 620, 1080), opacity: 1 - ramp(t, 65.4, 65.7), transform: `scale(${3 - 2 * title})`}}>
          <Px size={34} color="#fff">ОШИБКА 6</Px>
          <Px size={74} color={RED} style={{marginTop: 26, opacity: Math.sin(t * 16) > -0.5 ? 1 : 0.25}}>ФИНАЛЬНЫЙ<br />БОСС</Px>
        </div>
      ) : null}
      {t >= 65.84 && rew < 1 ? <div style={{...abs(0, 290, 1080), opacity: Math.min(1, head * 3) * (1 - rew), transform: `scale(${3 - 2 * head})`}}><Big size={82} color={RED}>НЕТ СОХРАНЕНИЙ</Big></div> : null}
      <Monster x={370} y={380 + (t < 65.7 ? 560 : 0) - (1 - sp(t, a + 0.3)) * -400} size={340} col={RED} kind="boss" born={a + 0.3} dead={save + 0.45} />
      {t >= 65.9 ? (
        <div style={{...abs(128, 840, 824), opacity: ramp(t, 65.9, 66.3)}}>
          <Px size={22} style={{textAlign: 'left', marginBottom: 12}}>ВАШ ПРОЕКТ</Px>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 16}}>
            {FILES.map((ic, i) => {
              const k = ORDER.indexOf(i);
              const dieAt = drain0 + (k / 12) * (over - drain0 - 0.2);
              const backAt = save + ((11 - k) / 12) * 0.55;
              const dead = t >= dieAt && t < backAt;
              const dying = t >= dieAt && t < dieAt + 0.2;
              const back = t >= backAt ? sp(t, backAt, HARD) : 1;
              return (
                <div key={i} style={{width: 194, height: 168, background: dying ? RED : dead ? 'transparent' : '#1B1036', border: `6px ${dead && !dying ? 'dashed' : 'solid'} ${dead ? '#5A2030' : t >= backAt && t < backAt + 0.3 ? C.lime : '#8A7AA8'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 86, transform: `scale(${dying ? 1.12 : back})`}}>
                  {dead ? (dying ? null : <Px size={30} color="#5A2030">✗</Px>) : ic}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {t >= drain0 && t < over ? (() => {
        const k = Math.min(11, Math.floor(((t - drain0) / (over - drain0 - 0.2)) * 12));
        const i = ORDER[k];
        const tx = 128 + (i % 4) * 210 + 97, ty = 900 + Math.floor(i / 4) * 184 + 84;
        return (
          <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0}}>
            <line x1="540" y1="610" x2={tx} y2={ty} stroke="#fff" strokeWidth="6" />
            <line x1="540" y1="610" x2={tx} y2={ty} stroke={RED} strokeWidth="22" opacity={0.55 + 0.3 * Math.sin(t * 60)} />
          </svg>
        );
      })() : null}
      <In at={67.1} from="slam" out={70.0} style={abs(0, 750, 1080)}><Px size={28} color="#fff">ОДНА НЕУДАЧНАЯ ПРАВКА...</Px></In>
      {go ? (
        <AbsoluteFill style={{background: 'rgba(0,0,0,0.86)', opacity: 1 - ramp(t, save, save + 0.25)}}>
          <div style={{...abs(0, 520, 1080), transform: `scale(${3.5 - 2.5 * sp(t, over, HARD)})`}}>
            <Px size={118} color={RED}>GAME<br />OVER</Px>
          </div>
          <In at={over + 0.35} from="up" style={abs(0, 900, 1080)}><Txt size={62} color="#fff">Вчерашняя версия пропала</Txt></In>
          {t >= 71.04 && t < 72.7 ? <div style={abs(0, 1080, 1080)}><Px size={36}>ПРОДОЛЖИТЬ?</Px><Px size={120} color="#FFD23F" style={{marginTop: 20}}>{cnt}</Px></div> : null}
          {t >= 72.7 ? (
            <div style={{...abs(190, 1030, 700), opacity: Math.min(1, floppy * 2), transform: `scale(${(2.4 - 1.4 * floppy) * (t >= 73.3 ? 0.94 : 1)})`}}>
              <div style={{background: C.lime, border: '8px solid #000', boxShadow: `0 16px 0 #5E8A00, 0 0 110px ${C.lime}`, padding: '26px 0 30px', display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div style={{fontSize: 150, lineHeight: 1}}>💾</div>
                <Px size={34} color="#000" style={{textShadow: 'none', marginTop: 14}}>СОХРАНИТЬ КОПИЮ</Px>
              </div>
            </div>
          ) : null}
        </AbsoluteFill>
      ) : null}
      {t >= save && t < save + 0.7 ? (
        <AbsoluteFill style={{opacity: 1 - ramp(t, save + 0.5, save + 0.7)}}>
          {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{position: 'absolute', left: 0, width: 1080, top: ((i * 340 - t * 2600) % 1920 + 1920) % 1920, height: 26, background: 'rgba(255,255,255,0.35)'}} />)}
          <div style={abs(60, 320)}><Px size={40}>◀◀ НАЗАД</Px></div>
        </AbsoluteFill>
      ) : null}
      {rew >= 1 ? (
        <>
          <In at={save + 0.7} from="slam" style={abs(0, 420, 1080)}><Px size={104} color={C.lime} style={{textShadow: `10px 10px 0 #000, 0 0 60px ${C.lime}`}}>ПОБЕДА!</Px></In>
          <Burst at={save + 0.7} x={540} y={500} col={C.lime} n={40} power={1100} />
          <Float at={save + 0.7} x={380} y={700} text="+500" col={C.lime} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- 7. Концовка: выбор ошибки и подписка (74.85–83.38) ----------
const Outro: React.FC = () => {
  const t = useT();
  const away = ramp(t, 77.85, 78.2);
  const sel = Math.floor((t - END) / 0.24) % 6;
  const cards: [string, string, Kind][] = [['ВСЁ СРАЗУ', LV[0].col, 'blob'], ['БЕЗ ПРАВИЛ', LV[1].col, 'ball'], ['БЕЗ ПЛАНА', LV[2].col, 'blob'], ['СПОР', LV[3].col, 'ball'], ['НА СЛОВО', LV[4].col, 'chest'], ['БЕЗ КОПИИ', RED, 'boss']];
  return (
    <AbsoluteFill>
      {away < 1 ? (
        <div style={{opacity: 1 - away, transform: `translateY(${-away * 300}px)`}}>
          <In at={END + 0.05} from="slam" style={abs(0, 270, 1080)}><Big size={92}>КАКАЯ ОШИБКА<br /><span style={{color: C.lime}}>ВАША?</span></Big></In>
          {cards.map(([name, col, kind], i) => {
            const s = sp(t, END + 0.3 + i * 0.07, HARD);
            const on = sel === i;
            return (
              <div key={i} style={{...abs(60 + (i % 3) * 330, 540 + Math.floor(i / 3) * 330, 300), opacity: Math.min(1, s * 2), transform: `scale(${(0.4 + 0.6 * s) * (on ? 1.08 : 1)})`, zIndex: on ? 2 : 1}}>
                <div style={{background: '#120A26', border: `8px solid ${on ? C.lime : col}`, boxShadow: on ? `0 0 70px ${C.lime}, 10px 10px 0 #000` : '10px 10px 0 #000', height: 300, position: 'relative'}}>
                  <Px size={54} color={on ? C.lime : '#fff'} style={{position: 'absolute', left: 16, top: 12}}>{i + 1}</Px>
                  <svg viewBox="0 0 100 100" width="170" height="170" style={{position: 'absolute', left: 104, top: 44, transform: `translateY(${on ? Math.sin(t * 20) * 6 : 0}px)`}}>
                    <path d={BODY[kind]} fill={kind === 'boss' ? '#1A0410' : col} stroke="#000" strokeWidth="4" />
                    {kind === 'boss' ? <><path d="M22 44 L44 52 L22 58 Z" fill={RED} /><path d="M78 44 L56 52 L78 58 Z" fill={RED} /></> : <><rect x="25" y={kind === 'chest' ? 54 : 40} width="18" height="18" fill="#fff" /><rect x="57" y={kind === 'chest' ? 54 : 40} width="18" height="18" fill="#fff" /><rect x="32" y={kind === 'chest' ? 60 : 46} width="8" height="10" fill="#000" /><rect x="60" y={kind === 'chest' ? 60 : 46} width="8" height="10" fill="#000" /></>}
                  </svg>
                  <Px size={20} color={col} style={{position: 'absolute', left: 0, right: 0, bottom: 20}}>{name}</Px>
                </div>
              </div>
            );
          })}
          <In at={76.42} from="up" style={{...abs(0, 1230, 1080), display: 'flex', justifyContent: 'center'}}>
            <div style={{...box(C.lime), padding: '24px 30px', transform: `translateY(${Math.abs(Math.sin(t * 7)) * 14}px)`}}><Px size={30} color={C.lime}>▼ НОМЕР В КОММЕНТАРИИ ▼</Px></div>
          </In>
        </div>
      ) : null}
      {t >= 78.0 ? (
        <>
          <In at={78.06} from="slam" style={abs(0, 320, 1080)}><Px size={46} color={C.lime}>ПОДПИСЫВАЙТЕСЬ</Px></In>
          <In at={78.9} from="left" style={abs(110, 520, 860)}>
            <div style={{display: 'flex', alignItems: 'center', gap: 30, background: '#FF0033', border: '8px solid #000', boxShadow: '12px 12px 0 #000', padding: '34px 40px'}}>
              <svg width="130" height="92" viewBox="0 0 130 92"><rect width="130" height="92" rx="22" fill="#fff" /><path d="M50 24 L92 46 L50 68 Z" fill="#FF0033" /></svg>
              <Big size={76} style={{textAlign: 'left', textShadow: '0 6px 0 rgba(0,0,0,0.4)'}}>YouTube</Big>
            </div>
          </In>
          <In at={79.42} from="right" style={abs(110, 760, 860)}>
            <div style={{display: 'flex', alignItems: 'center', gap: 30, background: '#229ED9', border: '8px solid #000', boxShadow: '12px 12px 0 #000', padding: '30px 40px'}}>
              <svg width="120" height="120" viewBox="0 0 24 24"><path fill="#fff" d="M2 11.5 L22 3 L18.5 21 L11.5 15.5 L8.5 20 L8.2 14 L18 6.5 L6 12.8 Z" /></svg>
              <div>
                <Txt size={36} style={{textAlign: 'left'}} color="rgba(255,255,255,0.9)">Telegram</Txt>
                <Big size={54} style={{textAlign: 'left', textShadow: '0 6px 0 rgba(0,0,0,0.4)'}}>t.me/your_channel</Big>
              </div>
            </div>
          </In>
          <In at={80.36} from="up" style={abs(0, 1040, 1080)}>
            <Txt size={62}>ещё больше интересного<br /><span style={{color: C.lime}}>про нейросети</span></Txt>
          </In>
          <Float at={80.5} x={380} y={1300} text="+1 UP" col={C.lime} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// ---------- Субтитры ----------
type Wd = {w: string; s: number; e: number};
const CHUNKS: {s: number; e: number; words: Wd[]}[] = (() => {
  const out: {s: number; e: number; words: Wd[]}[] = [];
  let cur: Wd[] = [];
  const push = () => { if (cur.length) { out.push({s: cur[0].s, e: cur[cur.length - 1].e, words: cur}); cur = []; } };
  WORDS.forEach((w, i) => {
    const len = cur.reduce((n, x) => n + x.w.length + 1, 0);
    if (cur.length && (cur.length >= 3 || len + w.w.length > 15 || w.s - cur[cur.length - 1].e > 0.4)) push();
    cur.push(w);
    if (/[.?!:]$/.test(w.w) || i === WORDS.length - 1) push();
  });
  out.forEach((c, i) => { c.e = i < out.length - 1 ? Math.min(out[i + 1].s, c.e + 0.6) : c.e + 0.5; });
  return out;
})();
const Captions: React.FC = () => {
  const t = useT();
  const f = useCurrentFrame();
  const c = CHUNKS.find((x) => t >= x.s - 0.02 && t < x.e);
  if (!c) return null;
  const pop = spring({frame: f - Math.round(c.s * 30), fps: 30, config: {damping: 12, mass: 0.4, stiffness: 240}});
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1480, display: 'flex', justifyContent: 'center', transform: `scale(${0.86 + 0.14 * pop})`}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 68, lineHeight: 1.15, textAlign: 'center', textTransform: 'uppercase', WebkitTextStroke: `12px ${INK}`, paintOrder: 'stroke fill', textShadow: `0 7px 0 ${INK}`}}>
        {c.words.map((w, i) => {
          const on = t >= w.s - 0.02 && t < w.e + 0.08;
          const txt = w.w.replace(/[.,:!]$/g, '');
          return <span key={i} style={{color: on ? C.lime : '#fff', marginRight: 26, display: 'inline-block', textTransform: txt === 'CLAUDE.md' ? 'none' : undefined, transform: on ? 'translateY(-4px) scale(1.06)' : 'none'}}>{txt}</span>;
        })}
      </div>
    </div>
  );
};

// ---------- Звуки ----------
const Ping: React.FC<{t: number; sfx: Sfx; vol?: number}> = ({t, sfx, vol = 0.5}) => <At t={t} dur={1.3} sfx={sfx} vol={vol} />;
const P: [number, Sfx, number?][] = [
  [0.0, 'whoosh', 0.4], [0.44, 'ding', 0.7], [0.84, 'pop'], [1.6, 'pop', 0.4], [3.16, 'alert', 0.7], [4.5, 'swap', 0.6], [5.74, 'pop'],
  ...LV.flatMap((l): [number, Sfx, number?][] => [[l.a + 0.02, 'whoosh', 0.5], [l.a + 0.1, 'swap', 0.6], [l.hit, 'alert', 0.75], [l.heal, 'ding', 0.8]]),
  [9.0, 'pop'], [13.08, 'pop', 0.4], [14.82, 'whoosh', 0.3], [15.07, 'swap', 0.6], [15.76, 'whoosh', 0.3], [16.01, 'swap', 0.6], [16.5, 'whoosh', 0.3],
  [19.0, 'pop', 0.4], [21.4, 'pop'], [23.16, 'swap', 0.6], [24.58, 'whoosh', 0.45], [25.44, 'ding', 0.5], [26.5, 'tick'], [27.5, 'tick'], [28.7, 'alert', 0.4], [30.08, 'swap', 0.5],
  [33.2, 'pop'], [34.44, 'tick'], [34.7, 'tick'], [34.96, 'tick'], [35.22, 'tick'], [36.7, 'whoosh', 0.45], [36.95, 'pop', 0.4], [37.3, 'pop', 0.4], [37.65, 'pop', 0.4], [38.02, 'pop'], [38.82, 'swap', 0.6], [40.28, 'swap', 0.8],
  [41.9, 'tick'], [42.2, 'tick'], [42.5, 'tick'], [42.8, 'tick'], [43.1, 'tick'], [43.44, 'alert', 0.5], [44.1, 'whoosh', 0.35], [46.42, 'swap', 0.7], [47.06, 'pop'], [47.8, 'pop'], [49.1, 'swap', 0.5], [49.58, 'swap', 0.5], [50.36, 'pop'], [51.9, 'pop'],
  [55.3, 'ding', 0.45], [56.42, 'pop'], [56.98, 'pop'], [58.2, 'whoosh', 0.45], [58.9, 'pop'], [60.4, 'pop', 0.4], [61.2, 'tick'], [61.5, 'tick'], [61.8, 'tick'], [62.0, 'tick'], [62.3, 'tick'], [62.6, 'tick'],
  [63.36, 'alert', 0.8], [63.9, 'alert', 0.6], [64.5, 'alert', 0.6], [65.84, 'swap', 0.8], [67.1, 'whoosh', 0.4], [67.4, 'tick'], [67.9, 'tick'], [68.4, 'tick'], [68.9, 'tick'], [69.4, 'tick'], [69.9, 'tick'], [70.26, 'alert', 0.9], [70.3, 'swap', 0.8],
  [71.04, 'tick'], [71.31, 'tick'], [71.58, 'tick'], [71.85, 'tick'], [72.12, 'tick'], [72.39, 'tick'], [72.7, 'pop', 0.7], [73.3, 'pop'], [73.5, 'whoosh', 0.6], [73.5, 'ding', 0.6], [73.95, 'swap', 0.7], [74.2, 'ding', 0.9],
  [74.9, 'whoosh', 0.45], [75.2, 'pop'], [76.42, 'pop'], [78.06, 'swap', 0.6], [78.9, 'pop'], [79.42, 'pop'], [80.36, 'ding', 0.6],
];

// clean — без субтитров: для кадров на обложку
export const OshShort: React.FC<{clean?: boolean; music?: string}> = ({clean = false, music = ''}) => {
  const {fps} = useVideoConfig();
  const t = useT();
  const lv = LV.findIndex((l) => t >= l.a && t < l.b);
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <Bg />
      <Audio src={staticFile('osh/voice.wav')} />
      {music ? <Audio loop src={staticFile(music)} volume={(f) => 0.11 * interpolate(f / fps, [0, 0.5, TOTAL - 1.5, TOTAL], [0, 1, 1, 0], clamp)} /> : null}
      <Shake>
        {t < LV[0].a ? <Intro /> : null}
        {lv === 0 ? <L1 /> : null}
        {lv === 1 ? <L2 /> : null}
        {lv === 2 ? <L3 /> : null}
        {lv === 3 ? <L4 /> : null}
        {lv === 4 ? <L5 /> : null}
        {t >= BOSS.a && t < BOSS.b ? <Boss /> : null}
        {t >= END ? <Outro /> : null}
        <Hud />
      </Shake>
      <Crt />
      {clean ? null : <Captions />}
      {P.map(([at, sfx, vol], i) => <Ping key={i} t={at} sfx={sfx} vol={vol} />)}
    </AbsoluteFill>
  );
};
