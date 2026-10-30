// Общие кирпичики оформления: цвета канала, появление с пружиной, карточка, звук.
import React from 'react';
import {Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {loadFont as loadManrope} from '@remotion/google-fonts/Manrope';
import {loadFont as loadUnbounded} from '@remotion/google-fonts/Unbounded';

const manrope = loadManrope('normal', {weights: ['500', '700', '800'], subsets: ['cyrillic', 'latin']});
const unbounded = loadUnbounded('normal', {weights: ['700', '900'], subsets: ['cyrillic', 'latin']});

export const FONT = manrope.fontFamily;        // основной текст
export const DISPLAY = unbounded.fontFamily;   // крупные цифры и заголовки

export const C = {
  lime: '#C6FF3D',
  green: '#0C2A22',
  greenLight: '#14463A',
  white: '#FFFFFF',
  dim: 'rgba(255,255,255,0.62)',
  red: '#FF5A5A',
};

export type Sfx = 'pop' | 'whoosh' | 'ding' | 'tick' | 'swap' | 'alert';

// Кусок ролика: начинается в секунду `t`, длится `dur` секунд, при старте может сыграть звук
export const At: React.FC<{t: number; dur: number; sfx?: Sfx; vol?: number; children?: React.ReactNode}> = ({
  t, dur, sfx, vol = 0.55, children,
}) => {
  const {fps} = useVideoConfig();
  return (
    <Sequence from={Math.round(t * fps)} durationInFrames={Math.round(dur * fps)} layout="none">
      {sfx ? <Audio src={staticFile(`sfx/${sfx}.wav`)} volume={vol} /> : null}
      {children}
    </Sequence>
  );
};

// Появление с лёгким отскоком и мягкий уход в конце. `dur` — сколько секунд элемент на экране.
export const Pop: React.FC<{
  dur: number; delay?: number; from?: 'right' | 'bottom' | 'left' | 'scale'; children: React.ReactNode; style?: React.CSSProperties;
}> = ({dur, delay = 0, from = 'right', children, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const f = frame - Math.round(delay * fps);
  const total = Math.round(dur * fps) - Math.round(delay * fps);
  const enter = spring({frame: f, fps, config: {damping: 13, mass: 0.7, stiffness: 150}});
  const exit = interpolate(f, [total - 9, total], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const shift = (1 - enter) * 70;
  const move =
    from === 'right' ? `translateX(${shift}px)` : from === 'left' ? `translateX(${-shift}px)` : from === 'bottom' ? `translateY(${shift}px)` : '';
  const scale = from === 'scale' ? 0.6 + 0.4 * enter : 0.94 + 0.06 * enter;
  return (
    <div
      style={{
        opacity: Math.min(1, Math.max(0, f < 0 ? 0 : enter * 1.4)) * exit,
        transform: `${move} scale(${scale * (0.97 + 0.03 * exit)})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Карточка в стиле канала
export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties; accent?: string}> = ({children, style, accent = C.lime}) => (
  <div
    style={{
      background: `linear-gradient(160deg, ${C.greenLight} 0%, ${C.green} 70%)`,
      border: `2px solid ${accent}55`,
      borderRadius: 30,
      padding: '30px 38px',
      boxShadow: '0 24px 70px rgba(0,0,0,0.55), 0 2px 0 rgba(255,255,255,0.06) inset',
      color: C.white,
      fontFamily: FONT,
      ...style,
    }}
  >
    {children}
  </div>
);

// Маленькая подпись над основным текстом карточки
export const Label: React.FC<{children: React.ReactNode; color?: string}> = ({children, color = C.lime}) => (
  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 24, letterSpacing: 2.5, textTransform: 'uppercase', color, marginBottom: 10}}>
    {children}
  </div>
);

// Место справа от говорящего, куда встают карточки
export const RightColumn: React.FC<{children: React.ReactNode; top?: number; width?: number}> = ({children, top = 150, width = 660}) => (
  <div style={{position: 'absolute', left: 1920 - width - 70, top, width}}>{children}</div>
);
