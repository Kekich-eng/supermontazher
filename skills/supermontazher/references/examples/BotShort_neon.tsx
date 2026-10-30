// Шортс из ролика про защиту бота. 1080×1920, без лица. Стиль отличается от длинного ролика:
// чёрный фон, неоновая сетка в перспективе, глитч-заголовки, частицы, тряска камеры.
// Все времена — секунды озвучки (public/bot/short_voice.wav, 54.0 с).
import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {At, C, DISPLAY, FONT, Sfx} from './ui';
import {WORDS} from './botShortWords';

export const BOT_SHORT_SECONDS = 58.95;
const TOTAL = BOT_SHORT_SECONDS;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const INK = '#05070A';
const MONO = "Consolas, 'Cascadia Mono', monospace";
const RUB = "'Segoe UI', Arial, sans-serif";
const CYAN = '#3DE8FF';
const HARD = {damping: 8, mass: 0.6, stiffness: 210};

const useT = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return f / fps;
};
const useS = (at: number, cfg = {damping: 12, mass: 0.6, stiffness: 170}) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - Math.round(at * fps), fps, config: cfg});
};
const ramp = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], clamp);
const abs = (x: number, y: number, w?: number): React.CSSProperties => ({position: 'absolute', left: x, top: y, width: w});

// тревожные отрезки: сетка и свечение становятся красными
const ALARM: [number, number][] = [[0, 15.8], [31.9, 34.2], [35.9, 38.4], [42.6, 44.6]];
// удары: кадр на мгновение трясёт
const HITS = [1.06, 6.2, 12.1, 15.4, 17.0, 20.5, 23.2, 25.6, 31.3, 34.2, 38.5, 41.4, 45.4, 47.5, 51.3, 53.3];

const Bg: React.FC = () => {
  const t = useT();
  let a = 0;
  for (const [s, e] of ALARM) a = Math.max(a, interpolate(t, [s, s + 0.25, e - 0.35, e], [0, 1, 1, 0], clamp));
  const col = a > 0.5 ? '255,70,70' : '198,255,61';
  return (
    <AbsoluteFill style={{background: INK}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 30%, rgba(${col},0.22) 0%, rgba(${col},0.05) 38%, rgba(0,0,0,0) 65%)`}} />
      {/* пол в перспективе, сетка бежит на зрителя */}
      <div style={{position: 'absolute', left: -540, top: 1180, width: 2160, height: 1400, transform: 'perspective(900px) rotateX(64deg)', transformOrigin: '50% 0%', backgroundImage: `linear-gradient(rgba(${col},0.55) 3px, transparent 3px), linear-gradient(90deg, rgba(${col},0.55) 3px, transparent 3px)`, backgroundSize: '120px 120px', backgroundPosition: `0 ${(t * 160) % 120}px`, maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 45%)', WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 45%)', opacity: 0.6}} />
      {/* частицы летят вверх */}
      {Array.from({length: 46}).map((_, i) => {
        const x = random(`x${i}`) * 1080, sp = 60 + random(`s${i}`) * 220, sz = 3 + random(`z${i}`) * 7;
        const y = 1920 - ((t * sp + random(`o${i}`) * 1920) % 2000);
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: sz, height: sz, borderRadius: sz, background: `rgba(${col},${0.25 + random(`a${i}`) * 0.5})`, boxShadow: `0 0 ${sz * 3}px rgba(${col},0.8)`}} />;
      })}
      <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 2px, transparent 2px, transparent 6px)'}} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)'}} />
    </AbsoluteFill>
  );
};

// вся картинка внутри — с тряской на ударах
const Shake: React.FC<{children: React.ReactNode}> = ({children}) => {
  const t = useT();
  const f = useCurrentFrame();
  let k = 0;
  for (const h of HITS) if (t >= h && t < h + 0.32) k = Math.max(k, 1 - (t - h) / 0.32);
  return <AbsoluteFill style={{transform: `translate(${Math.sin(f * 2.9) * 16 * k}px, ${Math.cos(f * 3.7) * 12 * k}px) scale(${1 + 0.035 * k})`}}>{children}</AbsoluteFill>;
};

const Scene: React.FC<{a: number; b: number; children: React.ReactNode}> = ({a, b, children}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.round(a * fps)} durationInFrames={Math.round((b - a) * fps)} layout="none">
      <SceneFade dur={b - a}>{children}</SceneFade>
    </Sequence>
  );
};
// вход — наезд из глубины, выход — пролёт сквозь кадр
const SceneFade: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const t = useT();
  const i = ramp(t, 0, 0.28), o = ramp(t, dur - 0.2, dur);
  return <AbsoluteFill style={{opacity: Math.min(i * 1.4, 1) * (1 - o), transform: `scale(${0.7 + 0.3 * (1 - Math.pow(1 - i, 3)) + o * o * 0.9})`, filter: `blur(${(1 - i) * 14 + o * 10}px)`}}>{children}</AbsoluteFill>;
};

// заголовок с глитчем: цветные двойники дёргаются в первые доли секунды и на ударах
const Glitch: React.FC<{at: number; children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({at, children, size = 120, color = '#fff', style}) => {
  const t = useT();
  const f = useCurrentFrame();
  const s = useS(at, HARD);
  const g = Math.max(0, 1 - (t - at) / 0.45) * (t >= at ? 1 : 0);
  const dx = (random(`g${f}`) - 0.5) * 46 * g, dy = (random(`h${f}`) - 0.5) * 16 * g;
  const base: React.CSSProperties = {fontFamily: DISPLAY, fontWeight: 900, fontSize: size, lineHeight: 1.02, textAlign: 'center'};
  return (
    <div style={{position: 'relative', opacity: Math.min(1, s * 3), transform: `scale(${2.6 - 1.6 * s})`, ...style}}>
      <div style={{...base, position: 'absolute', inset: 0, color: CYAN, transform: `translate(${dx}px, ${dy}px)`, opacity: g, mixBlendMode: 'screen'}}>{children}</div>
      <div style={{...base, position: 'absolute', inset: 0, color: '#FF2E6A', transform: `translate(${-dx}px, ${-dy}px)`, opacity: g, mixBlendMode: 'screen'}}>{children}</div>
      <div style={{...base, color, textShadow: `0 0 40px ${color}88, 0 10px 30px rgba(0,0,0,0.8)`}}>{children}</div>
    </div>
  );
};
const Txt: React.FC<{children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties}> = ({children, size = 48, color = '#fff', style}) => (
  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.2, color, textAlign: 'center', ...style}}>{children}</div>
);
const In: React.FC<{at: number; from?: 'up' | 'down' | 'left' | 'right' | 'scale'; children: React.ReactNode; style?: React.CSSProperties}> = ({at, from = 'up', children, style}) => {
  const s = useS(at);
  const d = (1 - s) * 110;
  const tr = from === 'up' ? `translateY(${d}px)` : from === 'down' ? `translateY(${-d}px)` : from === 'left' ? `translateX(${-d}px)` : from === 'right' ? `translateX(${d}px)` : `scale(${0.3 + 0.7 * s})`;
  return <div style={{opacity: Math.min(1, s * 1.6), transform: tr, ...style}}>{children}</div>;
};
const neon = (c: string): React.CSSProperties => ({border: `4px solid ${c}`, boxShadow: `0 0 34px ${c}99, inset 0 0 26px ${c}33`, background: 'rgba(5,7,10,0.82)'});
const R: React.FC<{s?: number}> = ({s = 0.78}) => <span style={{fontFamily: RUB, fontWeight: 900, fontSize: `${s}em`}}> ₽</span>;
const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

// ---------- 1. Сто тысяч рублей (0–8.0) ----------
const DATA = ['имя', 'телефон', 'возраст', 'вес', 'адрес', 'почта', 'история', 'имя', 'телефон', 'возраст', 'почта', 'вес'];
const S1: React.FC = () => {
  const t = useT();
  const n = 100000 * (1 - Math.pow(1 - ramp(t, 0.0, 1.06), 3));
  return (
    <AbsoluteFill>
      <div style={abs(0, 250, 1080)}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 178, lineHeight: 1, textAlign: 'center', color: '#fff', fontVariantNumeric: 'tabular-nums', textShadow: `0 0 60px ${C.red}, 0 0 18px ${C.red}`, transform: `scale(${1 + 0.16 * Math.sin(ramp(t, 1.0, 1.4) * Math.PI)})`}}>{fmt(n)}<R /></div>
      </div>
      <Glitch at={1.96} size={74} color={C.red} style={abs(0, 470, 1080)}>ШТРАФ ЧЕЛОВЕКУ</Glitch>
      {/* бот, из которого водопадом льются данные */}
      <In at={4.4} from="scale" style={abs(350, 660)}>
        <div style={{width: 380, height: 380, borderRadius: 100, ...neon(C.red), display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', transform: `rotate(${Math.sin(t * 9) * (t > 6.1 ? 4 : 0)}deg)`}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 150, color: '#fff', lineHeight: 1}}>{'>_'}</div>
          <Txt size={40} color={C.red}>ваш бот</Txt>
        </div>
      </In>
      {DATA.map((w, i) => {
        const st = 6.1 + i * 0.13, p = ramp(t, st, st + 1.1);
        const x = 540 + (random(`dx${i}`) - 0.5) * 760;
        return p > 0 && p < 1 ? (
          <div key={i} style={{...abs(540 + (x - 540) * p - 110, 1000 + p * p * 520), opacity: 1 - p * p, transform: `rotate(${(random(`r${i}`) - 0.5) * 70 * p}deg) scale(${0.5 + p * 0.7})`}}>
            <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 44, background: '#fff', color: '#111', padding: '10px 26px', borderRadius: 16, boxShadow: `0 0 30px ${C.red}`, whiteSpace: 'nowrap'}}>{w}</div>
          </div>
        ) : null;
      })}
      <Glitch at={6.2} size={96} color="#fff" style={abs(0, 1300, 1080)}>УТЕЧКА</Glitch>
    </AbsoluteFill>
  );
};

// ---------- 2. Отвечаете вы (8.0–15.9) ----------
const S2: React.FC = () => {
  const A = 8.0;
  const t = useT();
  const you = useS(15.4 - A, HARD);
  const dim = ramp(t, 15.2 - A, 15.5 - A);
  return (
    <AbsoluteFill>
      <In at={0.2} from="down" style={abs(0, 230, 1080)}><Txt size={54} color="rgba(255,255,255,0.7)">по закону это</Txt></In>
      <Glitch at={9.16 - A} size={92} color={C.red} style={abs(0, 310, 1080)}>ПЕРСОНАЛЬНЫЕ<br />ДАННЫЕ</Glitch>
      <In at={10.7 - A} from="up" style={abs(0, 560, 1080)}><Txt size={54}>отвечает <span style={{color: C.lime}}>владелец бота</span></Txt></In>
      <div style={{opacity: 1 - 0.8 * dim}}>
        {[
          {w: 'Telegram', at: 12.84, y: 700},
          {w: 'Хостинг', at: 13.86, y: 880},
        ].map((o) => {
          const cut = ramp(t, o.at - A + 0.25, o.at - A + 0.5);
          return (
            <In key={o.w} at={o.at - A} from="left" style={abs(140, o.y, 800)}>
              <div style={{position: 'relative', borderRadius: 32, padding: '30px 0', ...neon('rgba(255,255,255,0.4)')}}>
                <Txt size={76} color="rgba(255,255,255,0.75)">{o.w}</Txt>
                <div style={{position: 'absolute', left: '6%', top: '50%', height: 12, width: `${cut * 88}%`, background: C.red, boxShadow: `0 0 26px ${C.red}`, transform: 'rotate(-4deg)', borderRadius: 6}} />
              </div>
            </In>
          );
        })}
      </div>
      <div style={{...abs(0, 720, 1080), opacity: Math.min(1, you * 3), transform: `scale(${4 - 3 * you})`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 460, lineHeight: 1, textAlign: 'center', color: C.lime, textShadow: `0 0 90px ${C.lime}, 0 0 30px ${C.lime}`}}>ВЫ</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- 3. Один вечер, девять вещей (15.9–19.55) ----------
const S3: React.FC = () => {
  const A = 15.9;
  const t = useT();
  return (
    <AbsoluteFill>
      <Glitch at={17.0 - A} size={150} color={C.lime} style={abs(0, 330, 1080)}>ОДИН<br />ВЕЧЕР</Glitch>
      {/* девять щитов по кругу */}
      {Array.from({length: 9}).map((_, i) => {
        const s = spring({frame: Math.round((t - (18.0 - A) - i * 0.06) * 30), fps: 30, config: HARD});
        const ang = (i / 9) * Math.PI * 2 + t * 0.9;
        const rad = 330 * s;
        return (
          <div key={i} style={{...abs(540 + Math.cos(ang) * rad - 60, 1010 + Math.sin(ang) * rad * 0.55 - 70), opacity: Math.min(1, s * 2), transform: `scale(${0.7 + 0.5 * (0.5 + 0.5 * Math.sin(ang))})`, zIndex: Math.round(50 + 40 * Math.sin(ang))}}>
            <svg width="120" height="140" viewBox="0 0 50 58"><path d="M25 2 L46 9 V28 C46 42 37 51 25 56 C13 51 4 42 4 28 V9 Z" fill={C.lime} stroke="#fff" strokeWidth="2" /></svg>
            <div style={{position: 'absolute', left: 0, right: 0, top: 30, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 56, color: INK}}>{i + 1}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- 4. Не собирайте лишнего (19.55–24.05) ----------
const S4: React.FC = () => {
  const A = 19.55;
  const t = useT();
  const fields: [string, boolean][] = [['Имя', true], ['Телефон', true], ['Почта', true], ['Возраст', false], ['Вес', false]];
  return (
    <AbsoluteFill>
      <In at={0.05} from="down" style={abs(0, 190, 1080)}><Txt size={50} color={C.lime}>шаг 1</Txt></In>
      <Glitch at={19.72 - A} size={92} style={abs(0, 260, 1080)}>НЕ СОБИРАЙТЕ<br /><span style={{color: C.lime}}>ЛИШНЕГО</span></Glitch>
      {fields.map(([f, bad], i) => {
        const k = bad ? ramp(t, 21.5 - A + i * 0.22, 22.2 - A + i * 0.22) : 0;
        return (
          <In key={f} at={0.5 + i * 0.1} from={i % 2 ? 'right' : 'left'} style={abs(170, 560 + i * 132, 740)}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 26, padding: '22px 34px', ...neon(bad ? C.red : C.lime), opacity: 1 - k, transform: `translateY(${k * k * 900}px) rotate(${k * (i % 2 ? 50 : -50)}deg)`}}>
              <Txt size={56}>{f}</Txt>
              <Txt size={56} color={bad ? C.red : C.lime}>{bad ? '✕' : '✓'}</Txt>
            </div>
          </In>
        );
      })}
      <Glitch at={23.16 - A} size={70} color={C.lime} style={abs(0, 1270, 1080)}>НЕТ В БАЗЕ —<br />НЕ УТЕЧЁТ</Glitch>
    </AbsoluteFill>
  );
};

// ---------- 5. Кнопка «забудь меня» (24.05–29.4) ----------
const S5: React.FC = () => {
  const A = 24.05;
  const t = useT();
  const cmd = '/delete_data';
  const press = interpolate(t, [26.4 - A, 26.55 - A, 26.8 - A], [0, 1, 0], clamp);
  return (
    <AbsoluteFill>
      <In at={0.05} from="down" style={abs(0, 190, 1080)}><Txt size={50} color={C.lime}>шаг 3</Txt></In>
      <Glitch at={24.6 - A} size={84} style={abs(0, 260, 1080)}>КНОПКА<br /><span style={{color: C.lime}}>«ЗАБУДЬ МЕНЯ»</span></Glitch>
      <In at={25.6 - A} from="scale" style={abs(140, 560, 800)}>
        <div style={{borderRadius: 34, padding: '34px 0', ...neon(C.lime), transform: `scale(${1 - 0.08 * press})`, background: press > 0.5 ? C.lime : 'rgba(5,7,10,0.82)'}}>
          <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 84, textAlign: 'center', color: press > 0.5 ? INK : C.lime}}>{cmd.slice(0, Math.floor(interpolate(t, [25.7 - A, 26.4 - A], [0, cmd.length], clamp)))}<span style={{opacity: Math.sin(t * 12) > 0 ? 1 : 0}}>▌</span></div>
        </div>
      </In>
      {/* данные рассыпаются на квадратики */}
      {['анкета', 'программа', 'история'].map((w, i) => {
        const st = 26.9 - A + i * 0.3, k = ramp(t, st, st + 0.9);
        return (
          <div key={w} style={abs(190, 800 + i * 150, 700)}>
            <div style={{opacity: (1 - k) * ramp(t, 25.9 - A + i * 0.1, 26.2 - A + i * 0.1), borderRadius: 24, padding: '22px 0', ...neon('rgba(255,255,255,0.5)'), filter: `blur(${k * 14}px)`}}><Txt size={54}>{w}</Txt></div>
            {k > 0 && k < 1 ? Array.from({length: 22}).map((_, j) => (
              <div key={j} style={{position: 'absolute', left: 350 + (random(`px${i}${j}`) - 0.5) * 700 * (0.4 + k), top: 50 + (random(`py${i}${j}`) - 0.5) * 80 - k * k * 260 * random(`pv${i}${j}`), width: 16, height: 16, background: j % 3 ? '#fff' : C.lime, opacity: 1 - k, transform: `rotate(${k * 400 * random(`pr${i}${j}`)}deg)`}} />
            )) : null}
          </div>
        );
      })}
      <Glitch at={28.72 - A} size={104} color={C.lime} style={abs(0, 900, 1080)}>НАСОВСЕМ</Glitch>
    </AbsoluteFill>
  );
};

// ---------- 6. Ключи не в коде (29.4–33.4) ----------
const S6: React.FC = () => {
  const A = 29.4;
  const t = useT();
  const scan = ramp(t, 29.6 - A, 31.4 - A);
  const fix = useS(31.75 - A, HARD);
  return (
    <AbsoluteFill>
      <In at={0.05} from="down" style={abs(0, 190, 1080)}><Txt size={50} color={C.lime}>шаг 4</Txt></In>
      <div style={{...abs(90, 300, 900), opacity: 1 - 0.75 * Math.min(1, fix), transform: `scale(${1 - 0.1 * fix}) translateY(${-fix * 40}px)`}}>
        <div style={{borderRadius: 30, overflow: 'hidden', ...neon(C.red), position: 'relative'}}>
          <div style={{padding: '30px 34px', fontFamily: MONO, fontSize: 42, lineHeight: 1.7, color: '#C9D4DF'}}>
            <div><span style={{color: '#C792EA'}}>const</span> token =</div>
            <div style={{color: C.red, fontWeight: 700}}>&nbsp;"7412••••:AAH•••••••"</div>
            <div><span style={{color: '#C792EA'}}>const</span> pay =</div>
            <div style={{color: C.red, fontWeight: 700}}>&nbsp;"live_••••••••••••"</div>
          </div>
          <div style={{position: 'absolute', left: 0, right: 0, top: `${scan * 100}%`, height: 10, background: C.red, boxShadow: `0 0 40px 10px ${C.red}`, opacity: scan < 1 ? 1 : 0}} />
        </div>
      </div>
      <Glitch at={30.0 - A} size={78} color={C.red} style={abs(0, 780, 1080)}>КЛЮЧИ В КОДЕ</Glitch>
      <div style={{...abs(0, 900, 1080), opacity: Math.min(1, fix * 3), transform: `scale(${2.6 - 1.6 * fix})`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 190, textAlign: 'center', color: C.red, textShadow: `0 0 60px ${C.red}`}}>НЕЛЬЗЯ</div>
      </div>
      <In at={32.2 - A} from="up" style={abs(140, 1170, 800)}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, borderRadius: 28, padding: '20px 0', ...neon(C.lime)}}>
          <div style={{fontSize: 70}}>🔒</div>
          <Txt size={50}>отдельный файл <span style={{fontFamily: MONO, color: C.lime}}>.env</span></Txt>
        </div>
      </In>
    </AbsoluteFill>
  );
};

// ---------- 7. Вход по паролю — отключить (33.4–41.65) ----------
const PW = ['123456', 'qwerty', 'admin', 'password', '111111', 'root', 'P@ssw0rd', 'letmein', '000000', 'iloveyou', 'test123', 'bot2026', 'zxcvbn', '1q2w3e', 'dragon', 'master'];
const S7: React.FC = () => {
  const A = 33.4;
  const t = useT();
  const off = ramp(t, 35.4 - A, 35.9 - A);
  const stamp = useS(36.26 - A, HARD);
  return (
    <AbsoluteFill>
      <In at={0.05} from="down" style={abs(0, 190, 1080)}><Txt size={50} color={C.lime}>шаг 7</Txt></In>
      {/* рубильник «вход по паролю» */}
      <In at={0.3} from="scale" style={abs(140, 280, 800)}>
        <div style={{borderRadius: 34, padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', ...neon(off > 0.5 ? C.lime : C.red)}}>
          <Txt size={54} style={{textAlign: 'left', textDecoration: off > 0.5 ? 'line-through' : 'none', textDecorationColor: C.red}}>вход по паролю</Txt>
          <div style={{width: 170, height: 86, borderRadius: 43, background: off > 0.5 ? '#333' : C.red, position: 'relative', flexShrink: 0}}>
            <div style={{position: 'absolute', top: 8, left: 92 - off * 84, width: 70, height: 70, borderRadius: 35, background: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,0.5)'}} />
          </div>
        </div>
      </In>
      <div style={{...abs(0, 470, 1080), opacity: Math.min(1, stamp * 3), transform: `scale(${3 - 2 * stamp}) rotate(-6deg)`}}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 150, textAlign: 'center', color: C.lime, textShadow: `0 0 50px ${C.lime}`}}>СОВСЕМ</div>
      </div>
      {/* замок, в который летят пароли */}
      <In at={0.15} from="scale" style={abs(390, 760)}>
        <div style={{width: 300, height: 300, borderRadius: 60, ...neon(C.lime), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 170, transform: `rotate(${Math.sin(t * 22) * 2.5}deg)`}}>🔒</div>
      </In>
      {PW.map((p, i) => {
        const st = 0.35 + i * 0.17, k = ramp(t, st, st + 0.4), back = ramp(t, st + 0.4, st + 0.95);
        const ang = (i * 137.5 * Math.PI) / 180;
        const r = 720 - k * 520 + back * 380;
        return k > 0 && back < 1 ? (
          <div key={i} style={{...abs(540 + Math.cos(ang) * r - 110, 910 + Math.sin(ang) * r * 0.7 - 30), opacity: 1 - back, transform: `rotate(${back * 140 * (i % 2 ? 1 : -1)}deg) scale(${1 - 0.3 * back})`, fontFamily: MONO, fontWeight: 700, fontSize: 40, color: C.red, ...neon(C.red), borderRadius: 14, padding: '6px 18px', whiteSpace: 'nowrap'}}>{p}</div>
        ) : null;
      })}
    </AbsoluteFill>
  );
};

// ---------- 8. Деньги мимо бота (41.65–47.1) ----------
const S8: React.FC = () => {
  const A = 41.65;
  const t = useT();
  const fly = ramp(t, 42.2 - A, 43.3 - A);
  const e = fly * fly * (3 - 2 * fly);
  return (
    <AbsoluteFill>
      <In at={0.05} from="down" style={abs(0, 190, 1080)}><Txt size={50} color={C.lime}>шаг 9</Txt></In>
      <Glitch at={41.8 - A} size={84} style={abs(0, 260, 1080)}>ДЕНЬГИ —<br /><span style={{color: C.lime}}>МИМО БОТА</span></Glitch>
      <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0}}>
        <path d="M150 1150 C 250 620, 830 620, 930 1150" fill="none" stroke={CYAN} strokeWidth="10" strokeDasharray="26 22" strokeDashoffset={-t * 120} strokeLinecap="round" opacity={ramp(t, 42.2 - A, 42.6 - A)} style={{filter: `drop-shadow(0 0 16px ${CYAN})`}} />
      </svg>
      <In at={0.4} from="left" style={abs(40, 1100, 260)}><div style={{fontSize: 150, textAlign: 'center', lineHeight: 1}}>🧑</div><Txt size={36}>человек</Txt></In>
      <In at={0.5} from="right" style={abs(780, 1100, 280)}><div style={{fontSize: 150, textAlign: 'center', lineHeight: 1}}>🏦</div><Txt size={36}>платёжный сервис</Txt></In>
      <In at={0.6} from="scale" style={abs(400, 980)}>
        <div style={{width: 280, height: 280, borderRadius: 70, ...neon(C.lime), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 110, color: C.lime}}>{'>_'}</div>
      </In>
      <div style={{...abs(150 + e * 780 - 120, 1150 - Math.sin(e * Math.PI) * 400 - 80), opacity: fly > 0 && fly < 1 ? 1 : 0, transform: `rotate(${-18 + e * 36}deg)`}}>
        <div style={{width: 240, height: 150, borderRadius: 20, background: 'linear-gradient(135deg,#3B6FE0,#1D2F7A)', boxShadow: `0 0 40px ${CYAN}`, position: 'relative'}}>
          <div style={{position: 'absolute', left: 22, top: 30, width: 48, height: 34, borderRadius: 6, background: 'rgba(255,255,255,0.8)'}} />
          <div style={{position: 'absolute', left: 22, bottom: 20, fontFamily: MONO, fontWeight: 700, fontSize: 26, color: '#fff'}}>•••• ••••</div>
        </div>
      </div>
      <In at={43.4 - A} from="up" style={abs(140, 1330, 800)}>
        <div style={{borderRadius: 26, padding: '16px 0', ...neon(C.lime)}}><div style={{fontFamily: MONO, fontWeight: 700, fontSize: 46, color: '#fff', textAlign: 'center'}}>номер карты: <span style={{color: C.lime}}>—</span></div></div>
      </In>
      <Glitch at={44.4 - A} size={88} color={C.lime} style={abs(0, 600, 1080)}>КРАСТЬ НЕЧЕГО</Glitch>
    </AbsoluteFill>
  );
};

// ---------- 9. Концовка (47.1–54.0) ----------
const S9: React.FC = () => {
  const A = 47.1;
  const t = useT();
  const tg = useS(50.5 - A, HARD);
  return (
    <AbsoluteFill>
      <Glitch at={47.3 - A} size={130} color={C.lime} style={abs(0, 250, 1080)}>9 ШАГОВ</Glitch>
      <Glitch at={48.4 - A} size={130} style={abs(0, 400, 1080)}>1 ВЕЧЕР</Glitch>
      <div style={{...abs(60, 600, 960), display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22}}>
        {Array.from({length: 9}).map((_, i) => {
          const s = spring({frame: Math.round((t - (48.7 - A) - i * 0.07) * 30), fps: 30, config: HARD});
          const shown = true;
          return (
            <div key={i} style={{height: 150, borderRadius: 28, ...neon(shown ? C.lime : 'rgba(255,255,255,0.35)'), display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: Math.min(1, s * 2), transform: `scale(${2 - s})`}}>
              <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, color: shown ? C.lime : 'rgba(255,255,255,0.4)'}}>{shown ? i + 1 : '?'}</div>
            </div>
          );
        })}
      </div>
      <In at={49.6 - A} from="up" style={abs(0, 1140, 1080)}><Txt size={48}>подробно каждый шаг — <span style={{color: C.lime}}>в полном ролике</span></Txt></In>
      <div style={{...abs(110, 1240, 860), opacity: Math.min(1, tg * 2), transform: `scale(${1.7 - 0.7 * tg})`}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 26, borderRadius: 40, background: '#229ED9', padding: '24px 32px', boxShadow: '0 0 80px #229ED9'}}>
          <svg width="110" height="110" viewBox="0 0 24 24"><path fill="#fff" d="M2 11.5 L22 3 L18.5 21 L11.5 15.5 L8.5 20 L8.2 14 L18 6.5 L6 12.8 Z" /></svg>
          <div>
            <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 36, color: 'rgba(255,255,255,0.9)'}}>чек-лист в Telegram</div>
            <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 56, color: '#fff'}}>t.me/your_channel</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Шаг 2. Согласие до сбора ----------
const N2: React.FC = () => {
  const t = useT();
  const press = interpolate(t, [1.35, 1.5, 1.75], [0, 1, 0], clamp);
  const ok = t > 1.5;
  return (
    <AbsoluteFill>
      <In at={0.02} from="down" style={abs(0, 190, 1080)}><Txt size={50} color={C.lime}>шаг 2</Txt></In>
      <Glitch at={0.0} size={96} style={abs(0, 270, 1080)}>СНАЧАЛА<br />СПРОСИТЬ</Glitch>
      <In at={0.45} from="scale" style={abs(190, 640, 700)}>
        <div style={{borderRadius: 40, padding: '44px 0', ...neon(C.lime), background: ok ? C.lime : 'rgba(5,7,10,0.82)', transform: `scale(${1 - 0.1 * press})`}}>
          <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, textAlign: 'center', color: ok ? INK : C.lime}}>{ok ? '✓ Согласен' : 'Согласен'}</div>
        </div>
      </In>
      <Glitch at={1.4} size={96} color={C.lime} style={abs(0, 960, 1080)}>ПОТОМ<br />СОБИРАТЬ</Glitch>
    </AbsoluteFill>
  );
};

// ---------- Шаг 5. Текст не смешивается с командами ----------
const N5: React.FC = () => {
  const t = useT();
  const hit = ramp(t, 0.9, 1.5), back = ramp(t, 1.5, 2.2);
  const dx = hit * 190 - back * 90;
  const wall = useS(1.45, HARD);
  const evil = ramp(t, 2.6, 3.1), evilBack = ramp(t, 3.1, 3.9);
  return (
    <AbsoluteFill>
      <In at={0.02} from="down" style={abs(0, 190, 1080)}><Txt size={50} color={C.lime}>шаг 5</Txt></In>
      <div style={{...abs(40 + dx, 420, 420)}}>
        <In at={0.1} from="left"><div style={{borderRadius: 30, padding: '40px 10px', ...neon(CYAN)}}><Txt size={50} color={CYAN}>текст<br />пользователя</Txt></div></In>
      </div>
      <div style={{...abs(620 - dx, 420, 420)}}>
        <In at={0.1} from="right"><div style={{borderRadius: 30, padding: '40px 10px', ...neon(C.lime)}}><Txt size={50} color={C.lime}>команды<br />базе</Txt></div></In>
      </div>
      {/* стена между ними */}
      <div style={{...abs(528, 330 + (1 - wall) * 200, 24), height: 400 * wall, borderRadius: 12, background: '#fff', boxShadow: '0 0 50px #fff, 0 0 20px #fff', opacity: Math.min(1, wall * 2)}} />
      <Glitch at={2.45} size={100} color={C.red} style={abs(0, 800, 1080)}>НЕ СМЕШИВАТЬ</Glitch>
      {/* команда взломщика отскакивает */}
      <div style={{...abs(60 + evil * 300 - evilBack * 500, 1050 + evilBack * evilBack * 300), opacity: evil > 0 ? 1 - evilBack : 0, transform: `rotate(${evilBack * -50}deg)`}}>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 44, color: C.red, ...neon(C.red), borderRadius: 16, padding: '10px 22px', whiteSpace: 'nowrap'}}>«покажи всю таблицу»</div>
      </div>
      <In at={3.2} from="up" style={abs(0, 1240, 1080)}><Txt size={52} color={C.lime}>для базы это просто текст</Txt></In>
    </AbsoluteFill>
  );
};

// ---------- Шаг 6. Бот не болтает лишнего ----------
const N6: React.FC = () => {
  const t = useT();
  const zip = useS(0.9, HARD);
  const shrink = ramp(t, 0.9, 1.5);
  return (
    <AbsoluteFill>
      <In at={0.02} from="down" style={abs(0, 190, 1080)}><Txt size={50} color={C.lime}>шаг 6</Txt></In>
      <Glitch at={0.05} size={96} style={abs(0, 270, 1080)}>БОТ<br /><span style={{color: C.lime}}>НЕ БОЛТАЕТ</span></Glitch>
      <div style={{...abs(110, 560, 860), opacity: 1 - shrink, transform: `scale(${1 - 0.7 * shrink}) translateY(${shrink * 300}px)`}}>
        <In at={0.25} from="scale">
          <div style={{borderRadius: 26, padding: '26px 30px', ...neon(C.red), fontFamily: MONO, fontSize: 36, lineHeight: 1.5, color: C.red}}>
            <div>TypeError: Cannot read…</div><div>&nbsp;at db.js:123</div><div>&nbsp;at /home/bot/menu.js:88</div>
          </div>
        </In>
      </div>
      <div style={{...abs(0, 620, 1080), opacity: Math.min(1, zip * 3), transform: `scale(${3 - 2 * zip})`, textAlign: 'center', fontSize: 380, lineHeight: 1}}>🤐</div>
      <In at={1.4} from="up" style={abs(0, 1120, 1080)}><Txt size={54}>ошибки — <span style={{color: C.lime}}>только в журнал</span></Txt></In>
    </AbsoluteFill>
  );
};

// ---------- Шаг 8. Никаких дверей наружу ----------
const N8: React.FC = () => {
  const t = useT();
  const wall = useS(0.9, {damping: 13, mass: 0.7, stiffness: 140});
  return (
    <AbsoluteFill>
      <In at={0.02} from="down" style={abs(0, 190, 1080)}><Txt size={50} color={C.lime}>шаг 8</Txt></In>
      <Glitch at={0.05} size={96} style={abs(0, 270, 1080)}>НИКАКИХ<br /><span style={{color: C.lime}}>ДВЕРЕЙ</span></Glitch>
      <In at={0.3} from="scale" style={abs(400, 800)}>
        <div style={{width: 280, height: 280, borderRadius: 70, ...neon(C.lime), display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: MONO, fontWeight: 700, fontSize: 110, color: C.lime}}>{'>_'}</div>
      </In>
      <svg width="1080" height="1920" style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx="540" cy="940" r="330" fill="none" stroke={C.lime} strokeWidth="14" pathLength={1} strokeDasharray={`${wall} 1`} transform="rotate(-90 540 940)" style={{filter: `drop-shadow(0 0 26px ${C.lime})`}} />
      </svg>
      {Array.from({length: 8}).map((_, i) => {
        const st = 1.0 + i * 0.14, k = ramp(t, st, st + 0.35), back = ramp(t, st + 0.35, st + 0.9);
        const ang = (i / 8) * Math.PI * 2 + 0.4;
        const r = 760 - k * 400 + back * 300;
        return k > 0 && back < 1 ? (
          <div key={i} style={{...abs(540 + Math.cos(ang) * r - 30, 940 + Math.sin(ang) * r - 40), opacity: 1 - back, fontFamily: FONT, fontWeight: 800, fontSize: 80, color: C.red, transform: `rotate(${(ang * 180) / Math.PI + 180}deg)`, textShadow: `0 0 24px ${C.red}`}}>➜</div>
        ) : null;
      })}
    </AbsoluteFill>
  );
};

// ---------- Субтитры ----------
type Chunk = {s: number; e: number; words: typeof WORDS};
const CHUNKS: Chunk[] = (() => {
  const out: Chunk[] = [];
  let cur: typeof WORDS = [];
  WORDS.forEach((w, i) => {
    cur.push(w);
    const nxt = WORDS[i + 1];
    const len = cur.map((x) => x.w).join(' ').length;
    const stop = /[.?!,:—]$/.test(w.w);
    if (!nxt || stop || cur.length >= 3 || len + nxt.w.length > 20 || nxt.s - w.e > 0.35) {
      out.push({s: cur[0].s, e: nxt ? Math.min(nxt.s, w.e + 0.5) : w.e + 0.6, words: cur});
      cur = [];
    }
  });
  return out;
})();
const Captions: React.FC = () => {
  const {fps} = useVideoConfig();
  const f = useCurrentFrame();
  const t = f / fps;
  const c = CHUNKS.find((x) => t >= x.s - 0.02 && t < x.e);
  if (!c) return null;
  const pop = spring({frame: f - Math.round(c.s * fps), fps, config: {damping: 12, mass: 0.4, stiffness: 240}});
  return (
    <div style={{position: 'absolute', left: 40, right: 40, top: 1470, display: 'flex', justifyContent: 'center', transform: `scale(${0.86 + 0.14 * pop})`}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 66, lineHeight: 1.15, textAlign: 'center', textTransform: 'uppercase', WebkitTextStroke: `10px ${INK}`, paintOrder: 'stroke fill', textShadow: `0 6px 0 ${INK}`}}>
        {c.words.map((w, i) => {
          const on = t >= w.s - 0.02 && t < w.e + 0.08;
          return <span key={i} style={{color: on ? C.lime : '#fff', marginRight: 16, display: 'inline-block', transform: on ? 'translateY(-4px) scale(1.06)' : 'none'}}>{w.w.replace(/[.,:—!]$/g, '')}</span>;
        })}
      </div>
    </div>
  );
};
const Progress: React.FC = () => {
  const t = useT();
  return (
    <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 10, background: 'rgba(255,255,255,0.08)'}}>
      <div style={{width: `${(t / TOTAL) * 100}%`, height: '100%', background: C.lime, boxShadow: `0 0 20px ${C.lime}`}} />
    </div>
  );
};

const Ping: React.FC<{t: number; sfx: Sfx; vol?: number}> = ({t, sfx, vol = 0.5}) => <At t={t} dur={1.3} sfx={sfx} vol={vol} />;
const P: [number, Sfx, number?][] = [
  [0.0, 'tick'], [1.06, 'alert', 0.7], [1.96, 'pop'], [4.4, 'whoosh', 0.4], [6.1, 'swap'], [6.2, 'alert', 0.6],
  [8.05, 'whoosh', 0.45], [9.16, 'alert', 0.55], [10.7, 'pop'], [12.84, 'pop'], [13.1, 'swap'], [13.86, 'pop'], [14.1, 'swap'], [15.4, 'ding', 0.7],
  [15.85, 'whoosh', 0.45], [16.9, 'ding', 0.6], [17.9, 'pop'], [18.1, 'pop'], [18.3, 'pop'],
  [19.65, 'whoosh', 0.45], [19.8, 'pop'], [21.55, 'swap'], [21.8, 'swap'], [22.05, 'swap'], [23.2, 'ding', 0.6],
  [24.15, 'whoosh', 0.45], [24.2, 'pop'], [25.6, 'ding', 0.6],
  [26.6, 'whoosh', 0.45], [27.1, 'pop'], [28.2, 'tick'], [28.95, 'pop', 0.6], [29.4, 'swap'], [29.7, 'swap'], [30.0, 'swap'], [31.25, 'ding', 0.7],
  [31.95, 'whoosh', 0.45], [32.5, 'alert', 0.5], [34.25, 'alert', 0.7], [34.7, 'ding', 0.5],
  [35.95, 'whoosh', 0.45], [37.3, 'swap', 0.6], [38.35, 'alert', 0.6], [39.0, 'swap'], [39.2, 'ding', 0.5],
  [40.35, 'whoosh', 0.45], [40.4, 'pop'], [41.2, 'ding', 0.6],
  [42.65, 'whoosh', 0.45], [43.1, 'swap', 0.35], [43.5, 'swap', 0.35], [43.9, 'swap', 0.35], [44.3, 'swap', 0.35], [44.65, 'tick', 0.8], [45.45, 'ding', 0.7],
  [46.2, 'whoosh', 0.45], [46.25, 'pop'], [47.1, 'ding', 0.5], [47.4, 'swap', 0.4], [47.8, 'swap', 0.4],
  [48.6, 'whoosh', 0.45], [48.7, 'pop'], [49.1, 'swap'], [50.3, 'pop'], [51.3, 'ding', 0.7],
  [52.05, 'whoosh', 0.45], [52.2, 'pop', 0.6], [53.3, 'pop', 0.6], [53.7, 'tick'], [53.9, 'tick'], [54.1, 'tick'], [55.4, 'ding', 0.6],
];

// clean — без субтитров и полоски: для кадров на обложку
export const BotShort: React.FC<{clean?: boolean}> = ({clean = false}) => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{backgroundColor: INK}}>
      <Bg />
      <Audio src={staticFile('bot/short_voice.wav')} />
      <Audio loop src={staticFile('block/music.mp3')} volume={(f) => 0.1 * interpolate(f / fps, [0, 0.6, TOTAL - 1.4, TOTAL], [0, 1, 1, 0], clamp)} />
      <Shake>
        <Scene a={0} b={8.0}><S1 /></Scene>
        <Scene a={8.0} b={15.8}><S2 /></Scene>
        <Scene a={15.8} b={19.6}><S3 /></Scene>
        <Scene a={19.6} b={24.1}><S4 /></Scene>
        <Scene a={24.1} b={26.55}><N2 /></Scene>
        <Scene a={26.55} b={31.9}><S5 /></Scene>
        <Scene a={31.9} b={35.9}><S6 /></Scene>
        <Scene a={35.9} b={40.3}><N5 /></Scene>
        <Scene a={40.3} b={42.6}><N6 /></Scene>
        <Scene a={42.6} b={46.15}><S7 /></Scene>
        <Scene a={46.15} b={48.55}><N8 /></Scene>
        <Scene a={48.55} b={52.0}><S8 /></Scene>
        <Scene a={52.0} b={TOTAL}><S9 /></Scene>
      </Shake>
      {clean ? null : <Captions />}
      {clean ? null : <Progress />}
      {P.map(([at, sfx, vol], i) => <Ping key={i} t={at} sfx={sfx} vol={vol} />)}
    </AbsoluteFill>
  );
};
