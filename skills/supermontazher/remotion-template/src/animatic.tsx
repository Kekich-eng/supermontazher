// Аниматик по раскладке движка: весь ролик смотрится до того, как нарисованы сцены.
// Сцена без готового компонента показывает заглушку: свою задачу (note из edit.json), события (вспыхивают в свою
// секунду), куски записей и слова озвучки с подсветкой. Готовые сцены передаются в `real` и рисуются как есть.
// Пример: src/Animaciya.tsx (AnimaciyaAnimatic). Раскладка — <имя>Edit.json, слова — <имя>Words.json (make.py).
import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {clamp, makeChunks} from './kit';
import {DISPLAY, FONT} from './ui';

export type EditScene = {at: number; dur: number; ev: Record<string, number>; kind?: string; who?: string; name?: string; note?: string; pieces?: [number, number, number][]; [k: string]: unknown};
export type EditJson = {T: number; order: string[]; scenes: Record<string, EditScene>; windows?: Record<string, [number, number][]>; audio?: {voice?: string; music?: string}};
type Word = {w: string; s: number; e: number};

const HUE: Record<string, string> = {claude: '#F08A5D', codex: '#3FC7C0', plate: '#B98CFF', shot: '#5DA9F0'};
const colorOf = (id: string, sc: EditScene) => (sc.color as string) ?? HUE[sc.who ?? ''] ?? HUE[sc.kind ?? ''] ?? ['#C6FF3D', '#FFD25A', '#FF8FB1', '#7FD1FF'][[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 4];
const mmss = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;

const Placeholder: React.FC<{id: string; sc: EditScene; n: number; total: number; chunks: ReturnType<typeof makeChunks>}> = ({id, sc, n, total, chunks}) => {
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = f / fps;
  const T = sc.at + t;
  const u = Math.min(width, height) / 1080;
  const c = colorOf(id, sc);
  const evs = Object.entries(sc.ev).sort((a, b) => a[1] - b[1]);
  const flash = Math.max(0, ...evs.map(([, at]) => interpolate(t - at, [0, 0.05, 0.35], [0, 1, 0], clamp)));
  // текущая секунда записи для сцен с кусками
  let src: string | null = null;
  if (sc.pieces) {
    let acc = 0;
    for (const [a, b, r] of sc.pieces) {
      const d = (b - a) / r;
      if (t < acc + d) { src = `${(a + (t - acc) * r).toFixed(1)} с${r !== 1 ? ` ×${r}` : ''}`; break; }
      acc += d;
    }
  }
  const ch = chunks.find((x) => T >= x.s - 0.02 && T < x.e);
  const pad = 60 * u;
  return (
    <AbsoluteFill style={{background: `radial-gradient(ellipse at 30% 20%, ${c}33, #07090C 70%)`, fontFamily: FONT, color: '#EEF2EF', padding: pad}}>
      <AbsoluteFill style={{boxShadow: `inset 0 0 ${160 * u}px ${c}`, opacity: flash * 0.9}} />
      <div style={{fontFamily: 'monospace', fontSize: 30 * u, color: c, letterSpacing: 2 * u, marginTop: 40 * u}}>
        СЦЕНА {n}/{total} · {id}{sc.kind ? ` · ${sc.kind}` : ''}{sc.who ? ` · ${sc.who}` : ''} · {mmss(sc.at)}–{mmss(sc.at + sc.dur)}
      </div>
      <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 88 * u, lineHeight: 1.05, marginTop: 24 * u, textTransform: 'uppercase'}}>{(sc.title as string) ?? sc.name ?? id}</div>
      {sc.note ? <div style={{fontSize: 40 * u, lineHeight: 1.3, marginTop: 28 * u, color: '#C9D4D2'}}>{sc.note}</div> : null}
      {sc.pieces ? (
        <div style={{fontFamily: 'monospace', fontSize: 34 * u, marginTop: 30 * u, color: '#9FB0AE'}}>
          {sc.pieces.map(([a, b, r], i) => <div key={i}>запись {sc.who ?? ''}: {a}→{b} с{r !== 1 ? ` ×${r}` : ''}</div>)}
          <div style={{color: c, marginTop: 6 * u}}>● сейчас {src ?? '—'}</div>
        </div>
      ) : null}
      <div style={{display: 'flex', flexWrap: 'wrap', gap: 14 * u, marginTop: 34 * u}}>
        {evs.map(([name, at]) => {
          const on = t >= at;
          const k = interpolate(t - at, [0, 0.4], [1, 0], clamp);
          return (
            <div key={name} style={{fontFamily: 'monospace', fontSize: 34 * u, padding: `${8 * u}px ${16 * u}px`, borderRadius: 999, border: `2px solid ${on ? c : '#ffffff33'}`, background: on ? `${c}${k > 0 ? 'CC' : '33'}` : 'transparent', color: on && k > 0 ? '#05070A' : on ? '#fff' : '#ffffff66', transform: `scale(${1 + 0.15 * (on ? k : 0)})`}}>
              {name} {at.toFixed(2)}
            </div>
          );
        })}
      </div>
      {/* полоса сцены с отметками событий */}
      <div style={{position: 'absolute', left: pad, right: pad, top: height * 0.62, height: 10 * u, borderRadius: 5 * u, background: '#ffffff1A'}}>
        <div style={{width: `${Math.min(1, t / sc.dur) * 100}%`, height: '100%', borderRadius: 5 * u, background: c}} />
        {evs.map(([name, at]) => <div key={name} style={{position: 'absolute', left: `${(at / sc.dur) * 100}%`, top: -8 * u, width: 4 * u, height: 26 * u, background: '#fff'}} />)}
      </div>
      {ch ? (
        <div style={{position: 'absolute', left: pad, right: pad, top: height * 0.68, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', fontFamily: FONT, fontWeight: 800, fontSize: 64 * u, textTransform: 'uppercase', lineHeight: 1.15}}>
          {ch.words.map((w, i) => <span key={i} style={{margin: `0 ${14 * u}px`, color: T >= w.s - 0.02 && T < w.e + 0.08 ? c : '#fff'}}>{w.w.replace(/[.,:!]$/g, '')}</span>)}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// Готовая сцена сделана под design (обычно 1080×1920) — в аниматике другого размера она масштабируется.
const Fit: React.FC<{design: [number, number]; children: React.ReactNode}> = ({design, children}) => {
  const {width} = useVideoConfig();
  return <div style={{position: 'absolute', left: 0, top: 0, width: design[0], height: design[1], transform: `scale(${width / design[0]})`, transformOrigin: '0 0'}}>{children}</div>;
};

export const Animatic: React.FC<{edit: EditJson; words: Word[]; real?: Record<string, React.ReactNode>; design?: [number, number]; base?: number; up?: number}> = ({edit, words, real = {}, design = [1080, 1920], base = 0.14, up = 0.4}) => {
  const {fps} = useVideoConfig();
  const chunks = React.useMemo(() => makeChunks(words, 3, 22), [words]);
  const loud = edit.windows?.loud ?? [];
  const music = (t: number) => {
    let k = 0;
    for (const [a, b] of loud) k = Math.max(k, interpolate(t, [a, a + 0.25, b - 0.2, b + 0.05], [0, 1, 1, 0], clamp));
    return (base + (up - base) * k) * interpolate(t, [0, 0.15, edit.T - 0.15, edit.T], [0, 1, 1, 0], clamp);
  };
  return (
    <AbsoluteFill style={{background: '#07090C'}}>
      {edit.order.map((id, i) => {
        const sc = edit.scenes[id];
        return (
          <Sequence key={id} from={Math.round(sc.at * fps)} durationInFrames={Math.max(1, Math.round(sc.dur * fps))} layout="none">
            {real[id] ? <Fit design={design}>{real[id]}</Fit> : <Placeholder id={id} sc={sc} n={i + 1} total={edit.order.length} chunks={chunks} />}
          </Sequence>
        );
      })}
      <Clock T={edit.T} />
      {edit.audio?.voice ? <Audio src={staticFile(edit.audio.voice)} /> : null}
      {edit.audio?.music ? <Audio src={staticFile(edit.audio.music)} volume={(f) => music(f / fps)} /> : null}
    </AbsoluteFill>
  );
};

const Clock: React.FC<{T: number}> = ({T}) => {
  const f = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const u = Math.min(width, height) / 1080;
  const t = f / fps;
  return (
    <>
      <div style={{position: 'absolute', left: 0, top: 0, width: `${(t / T) * 100}%`, height: 8 * u, background: '#C6FF3D'}} />
      <div style={{position: 'absolute', right: 24 * u, top: 20 * u, fontFamily: 'monospace', fontSize: 26 * u, color: '#C6FF3D', background: '#000A', padding: `${4 * u}px ${10 * u}px`, borderRadius: 8 * u}}>АНИМАТИК {mmss(t)} / {mmss(T)}</div>
    </>
  );
};
