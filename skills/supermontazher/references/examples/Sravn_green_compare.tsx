// Ролик «Кто лучше сделает игру на двоих: Claude Opus 5.5 или GPT-6 Astra?». 1920×1080.
// Стиль первых роликов канала: тёмно-зелёный фон, лаймовый акцент, карточки выпрыгивают, плашки раундов, табло счёта.
// Источники (обрезаны вкладки браузера и панель задач, 1600×822, 30 к/с): public/sravn/claude.mp4 и codex.mp4.
// Голос public/sravn/voice.wav (340 с). В голос вставлены 15 живых реакций из записи прохождения (со своим звуком).
// Все времена ниже в секундах голоса; T() переводит их во время ролика с учётом вставок.
import React from 'react';
import {AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {DISPLAY, FONT} from './ui';

const BG1 = '#0C2A22', BG2 = '#14463A', LIME = '#C6FF3D', TXT = '#EAF4EF', MUTED = '#9DB8AE', RED = '#FF5A5A';
const CL = '#E8895F', GP = '#3FD0C0';
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const ease = Easing.bezier(0.22, 1, 0.36, 1);
const f = (p: string) => staticFile('sravn/' + p);
const useSec = () => { const fr = useCurrentFrame(); const {fps} = useVideoConfig(); return fr / fps; };
type Src = 'claude' | 'codex';
const NAME: Record<Src, string> = {claude: 'CLAUDE OPUS 5.5', codex: 'GPT-6 ASTRA'};
const COLOR: Record<Src, string> = {claude: CL, codex: GP};

// ── живые реакции: [после слова голоса v, источник, с, по, подпись] ─────
type Ins = {at: number; src: Src; a: number; b: number; cap: string};
const INS: Ins[] = [
  {at: 97.75, src: 'claude', a: 45.05, b: 46.8, cap: '«Он даже заставку сделал»'},
  {at: 123.8, src: 'codex', a: 69.15, b: 72.05, cap: '«Как будто там текстуры сильно лучше были»'},
  {at: 127.55, src: 'codex', a: 108.6, b: 111.2, cap: '«У тебя NPC, обрати внимание, плывут»'},
  {at: 140.5, src: 'claude', a: 81.35, b: 83.8, cap: '«Ого, двойной прыжок!»'},
  {at: 153.7, src: 'codex', a: 100.0, b: 105.25, cap: '«Нажимаю вправо, а он показывает влево»'},
  {at: 178.62, src: 'claude', a: 182.6, b: 186.2, cap: '«Для тебя прошла секунда. Для дерева 500 лет»'},
  {at: 206.9, src: 'codex', a: 418.85, b: 423.3, cap: '«Такие тут топорные задания, вообще думать не надо»'},
  {at: 210.95, src: 'codex', a: 541.25, b: 544.15, cap: '«Могли ничего не делать, просто дойти до ворот»'},
  {at: 225.2, src: 'claude', a: 788.6, b: 795.3, cap: '«То вперёд, то назад… Кошмар, играть невозможно»'},
  {at: 245.7, src: 'codex', a: 544.05, b: 547.4, cap: '«Босс прикольно, кстати, выглядит»'},
  {at: 253.18, src: 'codex', a: 620.4, b: 626.7, cap: '«Это было очень тупо. Очень плохо»'},
  {at: 277.1, src: 'claude', a: 1004.4, b: 1007.8, cap: '«Я вижу тебя по-настоящему»'},
  {at: 280.44, src: 'claude', a: 1027.5, b: 1030.1, cap: '«Красиво, ничего не скажешь»'},
  {at: 323.5, src: 'codex', a: 640.55, b: 657.1, cap: 'POLINA'},
  {at: 323.5001, src: 'codex', a: 676.45, b: 681.5, cap: '«Вторая выдала настолько сырой материал, что играть невозможно»'},
];
const DUR = (i: Ins) => i.b - i.a;
// куски голоса, которые не звучат: «что гость сказала» (реплику на самом деле говорит автор) и запинка на 5:31
const SKIPS: [number, number][] = [[206.9, 208.3], [280.5, 283.95], [309.2, 311.53]];   // + первый дубль «Но идеальной игры никто не…»   // второй кусок: первый дубль «У GPT вместо этого итоговая карт… карта»
const skipped = (v: number) => SKIPS.reduce((s, [a, b]) => s + Math.max(0, Math.min(v, b) - a), 0);
// время ролика для момента голоса v (вставки, стоящие ровно в v, считаются уже прошедшими, если after = true)
const T = (v: number, after = true) => v - skipped(v) + INS.filter((i) => (after ? i.at <= v : i.at < v)).reduce((s, i) => s + DUR(i), 0);
const insStart = (k: number) => T(INS[k].at, false);
const VOICE_END = 339.9;
export const SRAVN_SECONDS = T(VOICE_END) + 2.5;

// ── кирпичики ───────────────────────────────────────────────────────────
const Sfx: React.FC<{name: string; at: number; vol?: number}> = ({name, at, vol = 0.2}) => {
  const {fps} = useVideoConfig();
  return <Sequence from={Math.max(0, Math.round(at * fps))} durationInFrames={45} layout="none"><Audio src={staticFile(`sfx/${name}.wav`)} volume={vol} /></Sequence>;
};
// кусок ролика [a, b) во времени голоса
const At: React.FC<{a: number; b: number; children: React.ReactNode; sfx?: string}> = ({a, b, children, sfx}) => {
  const {fps} = useVideoConfig();
  const from = Math.round(T(a) * fps), dur = Math.max(1, Math.round((T(b, false) - T(a)) * fps));
  return <Sequence from={from} durationInFrames={dur} layout="none">{children}{sfx ? <Sfx name={sfx} at={0} vol={0.22} /> : null}</Sequence>;
};
// появление пружиной относительно начала куска (d секунд)
const usePop = (d = 0) => { const {fps} = useVideoConfig(); const fr = useCurrentFrame(); return spring({frame: fr - Math.round(d * fps), fps, config: {damping: 13, stiffness: 160, mass: 0.7}}); };

const Backdrop: React.FC = () => {
  const t = useSec();
  return <AbsoluteFill style={{background: `linear-gradient(135deg, ${BG1}, ${BG2})`}}>
    <AbsoluteFill style={{background: `radial-gradient(circle at ${30 + 10 * Math.sin(t * 0.12)}% ${35 + 8 * Math.cos(t * 0.1)}%, rgba(198,255,61,0.10), transparent 45%), radial-gradient(circle at ${72 + 9 * Math.cos(t * 0.11)}% ${70 + 8 * Math.sin(t * 0.13)}%, rgba(63,208,192,0.12), transparent 45%)`}} />
    <AbsoluteFill style={{backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '90px 90px', backgroundPosition: `0 ${(t * 10) % 90}px`}} />
    {new Array(24).fill(0).map((_, i) => { const x = random('x' + i) * 1920, sp = 6 + random('s' + i) * 16, y = 1080 - ((random('y' + i) * 1080 + t * sp) % 1160);
      return <div key={i} style={{position: 'absolute', left: x, top: y, width: 4, height: 4, borderRadius: 2, background: i % 3 ? LIME : GP, opacity: 0.25 + 0.2 * Math.sin(t + i)}} />; })}
  </AbsoluteFill>;
};

// окно с игрой: подпись нейросети, тень, медленный наезд; startAt — секунда исходника, rate — скорость
const Win: React.FC<{src: Src; from: number; rate?: number; x: number; y: number; w: number; d?: number; label?: boolean; sound?: number; zoom?: number}> = ({src, from, rate = 1, x, y, w, d = 0, label = true, sound = 0, zoom = 1}) => {
  const {fps} = useVideoConfig();
  const t = useSec();
  const p = usePop(d);
  const h = w * 822 / 1600;
  return <div style={{position: 'absolute', left: x, top: y, width: w, height: h, transform: `translateY(${(1 - p) * 60}px) scale(${0.92 + 0.08 * p})`, opacity: Math.min(1, p * 1.5)}}>
    <div style={{position: 'absolute', inset: 0, borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.55)', border: `3px solid ${COLOR[src]}`}}>
      <OffthreadVideo src={f(src + '.mp4')} startFrom={Math.round(from * fps)} playbackRate={rate} volume={sound} muted={sound === 0} style={{width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom * (1 + 0.02 * t)})`}} />
    </div>
    {label ? <div style={{position: 'absolute', left: 22, top: -26, padding: '8px 18px', borderRadius: 12, background: COLOR[src], color: '#05211C', fontFamily: DISPLAY, fontWeight: 900, fontSize: 24, letterSpacing: 1}}>{NAME[src]}</div> : null}
    {rate > 1.05 ? <div style={{position: 'absolute', right: 20, top: 18, padding: '6px 14px', borderRadius: 10, background: 'rgba(0,0,0,0.65)', color: LIME, fontFamily: DISPLAY, fontWeight: 900, fontSize: 26}}>×{Math.round(rate)}</div> : null}
  </div>;
};
const FULL = {x: 110, y: 120, w: 1700};
const L = {x: 40, y: 300, w: 900};
const R = {x: 980, y: 300, w: 900};

// плашка поверх кадра
const Chip: React.FC<{d?: number; x: number; y: number; children: React.ReactNode; color?: string; big?: boolean; minus?: boolean}> = ({d = 0, x, y, children, color = LIME, big, minus}) => {
  const p = usePop(d);
  const t = useSec();
  const snd = <Sfx name={minus ? 'alert' : 'pop'} at={d} vol={minus ? 0.18 : 0.16} />;
  if (t < d) return snd;
  return <>{snd}<div style={{position: 'absolute', left: x, top: y, transform: `scale(${0.6 + 0.4 * p})`, transformOrigin: '0 50%', opacity: Math.min(1, p * 1.5), padding: big ? '18px 30px' : '12px 22px', borderRadius: 16, background: minus ? 'rgba(40,8,8,0.88)' : 'rgba(8,24,20,0.88)', border: `2px solid ${minus ? RED : color}`, color: minus ? RED : color, fontFamily: FONT, fontWeight: 800, fontSize: big ? 46 : 34, boxShadow: '0 14px 40px rgba(0,0,0,0.5)', whiteSpace: 'nowrap'}}>{minus ? '− ' : ''}{children}</div></>;
};
// стрелка с подписью к точке кадра (x, y — точка, куда указывает)
const Callout: React.FC<{d?: number; x: number; y: number; text: string; color?: string; side?: 'left' | 'right'}> = ({d = 0, x, y, text, color = LIME, side = 'right'}) => {
  const p = usePop(d);
  const t = useSec();
  const snd = <Sfx name="tick" at={d} vol={0.15} />;
  if (t < d) return snd;
  const dx = side === 'right' ? 160 : -160;
  return <>{snd}
    <div style={{position: 'absolute', left: x - 40, top: y - 40, width: 80, height: 80, borderRadius: '50%', border: `4px solid ${color}`, transform: `scale(${p})`, boxShadow: `0 0 30px ${color}`}} />
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: p}} width={1} height={1}><line x1={x + (side === 'right' ? 40 : -40)} y1={y - 30} x2={x + dx} y2={y - 110} stroke={color} strokeWidth={4} /></svg>
    <div style={{position: 'absolute', left: side === 'right' ? x + dx : undefined, right: side === 'left' ? 1920 - (x + dx) : undefined, top: y - 150, padding: '10px 20px', borderRadius: 14, background: color, color: '#05211C', fontFamily: FONT, fontWeight: 800, fontSize: 32, opacity: p, transform: `scale(${0.7 + 0.3 * p})`, whiteSpace: 'nowrap'}}>{text}</div>
  </>;
};

// плашка раунда во весь экран (1,6 с)
const Round: React.FC<{n: string; title: string}> = ({n, title}) => {
  const t = useSec();
  const k = ease(interpolate(t, [0, 0.35], [0, 1], clamp)), out = 1;
  return <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', background: `rgba(6,20,16,${0.82 * out})`, opacity: out}}>
    <Sfx name="whoosh" at={0} vol={0.3} />
    <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 64, color: LIME, letterSpacing: 8, transform: `translateX(${(1 - k) * -300}px)`}}>РАУНД {n}</div>
    <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 110, color: TXT, marginTop: 10, transform: `translateX(${(1 - k) * 300}px)`}}>{title}</div>
  </AbsoluteFill>;
};

// табло счёта: [время голоса, Claude, GPT]
const SCORE: [number, number, number][] = [[84.3, 0, 1], [127.7, 1, 1], [154.0, 2, 1], [211.0, 3, 1], [262.0, 4, 1], [289.0, 5, 1]];
const Score: React.FC = () => {
  const {fps} = useVideoConfig();
  const t = useSec();
  const cur = [...SCORE].reverse().find((s) => t >= T(s[0]));
  if (!cur || t > T(292.0)) return null;
  const since = t - T(cur[0]);
  const bump = since < 0.6 ? 1 + 0.25 * Math.sin((since / 0.6) * Math.PI) : 1;
  const snd = SCORE.map((s, i) => <Sequence key={i} from={Math.round(T(s[0]) * fps)} durationInFrames={30} layout="none"><Audio src={staticFile('sfx/ding.wav')} volume={0.2} /></Sequence>);
  return <>{snd}<div style={{position: 'absolute', right: 40, top: 30, display: 'flex', alignItems: 'center', gap: 16, padding: '12px 22px', borderRadius: 18, background: 'rgba(6,20,16,0.9)', border: `2px solid ${LIME}`, fontFamily: DISPLAY, fontWeight: 900, color: TXT, transform: `scale(${bump})`, transformOrigin: '100% 0'}}>
    <span style={{color: CL, fontSize: 24}}>CLAUDE</span><span style={{fontSize: 44}}>{cur[1]} : {cur[2]}</span><span style={{color: GP, fontSize: 24}}>GPT</span>
  </div></>;
};

// крупный текст
const Say: React.FC<{d?: number; y: number; size?: number; color?: string; children: React.ReactNode; x?: number; w?: number; align?: 'left' | 'center'}> = ({d = 0, y, size = 72, color = TXT, children, x = 0, w = 1920, align = 'center'}) => {
  const p = usePop(d);
  const t = useSec();
  const snd = <Sfx name="pop" at={d} vol={0.14} />;
  if (t < d) return snd;
  return <>{snd}<div style={{position: 'absolute', left: x, top: y, width: w, textAlign: align, fontFamily: DISPLAY, fontWeight: 900, fontSize: size, color, lineHeight: 1.1, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 40}px) scale(${0.9 + 0.1 * p})`, textShadow: '0 6px 30px rgba(0,0,0,0.5)'}}>{children}</div></>;
};

// живая реакция: окно со звуком исходника и крупная цитата
const POLINA: [number, string][] = [[640.55, 'Ваше мнение, гость?'], [641.75, '«Первая нейронка гораздо лучше справилась со своей задачей.'], [645.3, 'Она сделала анимацию персонажей лучше, она дизайн сделала,'], [649.8, 'постаралась сделать нормальную траву, и у неё не плыли персонажи.'], [654.3, 'А вторая прям сильно прокосячила»']];
const Reaction: React.FC<{ins: Ins}> = ({ins}) => {
  const t = useSec();
  const capText = ins.cap === 'POLINA' ? ([...POLINA].reverse().find((c) => ins.a + t >= c[0]) || POLINA[0])[1] : ins.cap;
  const k = ease(interpolate(t, [0, 0.25], [0, 1], clamp));
  return <AbsoluteFill>
    <Win src={ins.src} from={ins.a} x={FULL.x} y={FULL.y - 40} w={FULL.w} sound={2.2} d={-1} />
    <div style={{position: 'absolute', right: 140, top: 54, padding: '8px 18px', borderRadius: 12, background: LIME, color: '#05211C', fontFamily: DISPLAY, fontWeight: 900, fontSize: 22, letterSpacing: 2, opacity: k}}>● ЖИВАЯ РЕАКЦИЯ</div>
    <div style={{position: 'absolute', left: 140, right: 140, bottom: 70, textAlign: 'center', padding: '22px 34px', borderRadius: 22, background: 'rgba(6,20,16,0.88)', border: `2px solid ${LIME}`, fontFamily: FONT, fontWeight: 800, fontSize: 50, color: TXT, lineHeight: 1.15, transform: `translateY(${(1 - k) * 60}px)`, opacity: k}}>{capText}</div>
  </AbsoluteFill>;
};

// карточка-список
const Card: React.FC<{d?: number; x: number; y: number; w: number; children: React.ReactNode; color?: string}> = ({d = 0, x, y, w, children, color = LIME}) => {
  const p = usePop(d);
  const t = useSec();
  const snd = <Sfx name="pop" at={d} vol={0.15} />;
  if (t < d) return snd;
  return <>{snd}<div style={{position: 'absolute', left: x, top: y, width: w, padding: '26px 32px', borderRadius: 24, background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03))', border: `2px solid ${color}`, boxShadow: '0 20px 60px rgba(0,0,0,0.45)', fontFamily: FONT, fontWeight: 700, fontSize: 40, color: TXT, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 50}px) scale(${0.9 + 0.1 * p})`}}>{children}</div></>;
};

// быстрая нарезка коротких клипов
const Montage: React.FC<{clips: [Src, number][]; each: number; rate?: number; layout?: {x: number; y: number; w: number}}> = ({clips, each, rate = 1, layout = FULL}) => {
  const {fps} = useVideoConfig();
  return <>{clips.map(([s, from], i) => <Sequence key={i} from={Math.round(i * each * fps)} durationInFrames={Math.round(each * fps)} layout="none"><Win src={s} from={from} rate={rate} {...layout} d={-1} /><Sfx name="swap" at={0} vol={0.12} /></Sequence>)}</>;
};

// ── ролик ────────────────────────────────────────────────────────────────
export const Sravn: React.FC = () => {
  const {fps} = useVideoConfig();
  const rel = (v: number, base: number) => T(v) - T(base);   // секунды от начала куска
  // голос кусками между вставками
  const cuts = [...new Set(INS.map((i) => i.at))].sort((a, b) => a - b);
  const pieces: [number, number][] = []; let prev = 0;
  for (const c of cuts) { pieces.push([prev, c]); prev = c; }
  pieces.push([prev, VOICE_END + 0.2]);
  // выкидываем пропущенные куски голоса
  for (const [sa, sb] of SKIPS) for (let i = pieces.length - 1; i >= 0; i--) { const [a, b] = pieces[i];
    if (sa >= a && sb <= b) pieces.splice(i, 1, [a, sa], [sb, b]); }
  const reactRanges = INS.map((ins, k) => [insStart(k), insStart(k) + DUR(ins)] as [number, number]);
  const musicVol = (fr: number) => {
    const t = fr / fps;
    const inR = reactRanges.some(([a, b]) => t > a - 0.2 && t < b + 0.2);
    return (inR ? 0.025 : 0.085) * interpolate(t, [0, 1, SRAVN_SECONDS - 3, SRAVN_SECONDS], [0, 1, 1, 0], clamp);
  };
  return <AbsoluteFill style={{fontFamily: FONT}}>
    <Backdrop />

    {/* ВХОД */}
    <At a={0} b={9.1}>
      <Win src="claude" from={66} {...L} />
      <Win src="codex" from={62} {...R} d={0.25} />
      <Say d={0.3} y={130} size={64}>одно задание <span style={{color: LIME}}>·</span> две игры</Say>
      <Chip d={3.3} x={700} y={820} big>игра на двоих как It Takes Two</Chip>
    </At>
    <At a={9.1} b={15.4}>
      <Montage each={1.25} clips={[['claude', 745], ['codex', 556], ['claude', 905], ['claude', 1001], ['codex', 25]]} />
      <Say d={3.6} y={960} size={58} color={LIME}>разница видна с первых секунд</Say>
    </At>

    {/* ЗАДАНИЕ */}
    <At a={15.4} b={21.1} sfx="whoosh">
      <Card x={360} y={170} w={1200}>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 30, color: LIME, letterSpacing: 4}}>ЗАДАНИЕ</div>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 84, marginTop: 6}}>«ЭПОХИ»</div>
        <div style={{fontSize: 34, color: MUTED, marginTop: 14}}>кооперативная игра уровня It Takes Two · несколько страниц требований</div>
      </Card>
      <Chip d={1.4} x={420} y={640}>разделённый экран</Chip>
      <Chip d={1.9} x={830} y={640}>500 лет разницы</Chip>
      <Chip d={2.4} x={1230} y={640}>3 зоны · погоня · босс</Chip>
    </At>
    <At a={21.1} b={36.8}>
      <Win src="claude" from={67} {...FULL} />
      <Chip d={rel(27.0, 21.1)} x={220} y={210} color={CL} big>ПРОШЛОЕ</Chip>
      <Chip d={rel(29.6, 21.1)} x={1360} y={210} color={GP} big>БУДУЩЕЕ</Chip>
      <Chip d={rel(24.5, 21.1)} x={820} y={140}>500 лет</Chip>
      <Chip d={rel(32.8, 21.1)} x={560} y={860}>действие в прошлом → изменение в будущем</Chip>
    </At>
    <At a={36.8} b={48.5}>
      <Say y={150} size={60}>что должно быть в игре</Say>
      <Chip d={rel(37.3, 36.8)} x={250} y={340} big>3 зоны с головоломками</Chip>
      <Chip d={rel(39.0, 36.8)} x={1030} y={340} big>погоня</Chip>
      <Chip d={rel(39.7, 36.8)} x={250} y={480} big>босс · 3 фазы</Chip>
      <Chip d={rel(41.0, 36.8)} x={1030} y={480} big>финальная катсцена · титры</Chip>
      <Chip d={rel(43.4, 36.8)} x={520} y={680} big color={GP}>«игру покажут на YouTube и сравнят с соперником»</Chip>
    </At>

    {/* УСЛОВИЯ */}
    <At a={48.5} b={65.2} sfx="whoosh">
      <Say y={120} size={60}>условия <span style={{color: LIME}}>одинаковые</span></Say>
      <Card d={rel(50.2, 48.5)} x={160} y={290} w={500}>тот же промпт</Card>
      <Card d={rel(51.3, 48.5)} x={710} y={290} w={500}>та же папка с картинками</Card>
      <Card d={rel(53.4, 48.5)} x={1260} y={290} w={500}>одна подписка</Card>
      <Chip d={rel(55.0, 48.5)} x={420} y={560} big>обе на максимуме, который доступен в подписке</Chip>
      <Chip d={rel(61.5, 48.5)} x={430} y={720} color={GP}>подсказки: только «продолжаем» и «доведи до конца сам»</Chip>
    </At>
    <At a={65.2} b={78.3}>
      <Say y={120} size={60}>сколько работали</Say>
      <Card x={200} y={300} w={700} color={CL}><div style={{color: CL, fontFamily: DISPLAY, fontWeight: 900, fontSize: 34}}>CLAUDE OPUS 5.5</div><div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, marginTop: 10}}>≈ 2 ч</div><div style={{color: MUTED, marginTop: 6}}>1 раз упёрся в лимит, ждал до утра</div></Card>
      <Card d={rel(72.5, 65.2)} x={1020} y={300} w={700} color={GP}><div style={{color: GP, fontFamily: DISPLAY, fontWeight: 900, fontSize: 34}}>GPT-6 ASTRA</div><div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 96, marginTop: 10}}>≈ 4 ч</div><div style={{color: MUTED, marginTop: 6}}>в лимит не упёрся</div></Card>
    </At>

    {/* РАУНД 1 */}
    <At a={78.3} b={82.3}><Round n="1" title="ПЕРВОЕ ВПЕЧАТЛЕНИЕ" /></At>
    <At a={82.3} b={92.65}>
      <Win src="codex" from={20} {...FULL} />
      <Sequence from={Math.round(rel(88.5, 82.3) * fps)} layout="none"><Win src="codex" from={44} {...FULL} d={-1} /></Sequence>
      <Chip d={rel(86.0, 82.3)} x={180} y={880} big color={GP}>красивый титульный экран</Chip>
      <Chip d={rel(89.0, 82.3)} x={1050} y={880} big color={GP}>выбор героя с портретами</Chip>
    </At>
    <At a={92.65} b={97.75}>
      <Win src="claude" from={31} {...FULL} />
      <Sequence from={Math.round(rel(95.5, 92.65) * fps)} layout="none"><Win src="claude" from={55} {...FULL} d={-1} /></Sequence>
      <Chip d={rel(95.6, 92.65)} x={180} y={880} big color={CL}>вступительная катсцена</Chip>
    </At>
    <At a={97.75} b={102.6}>
      <Win src="claude" from={68} {...L} />
      <Win src="codex" from={63} {...R} d={0.2} />
      <Say d={0.3} y={150} size={60}>а дальше <span style={{color: LIME}}>сама игра</span></Say>
    </At>

    {/* РАУНД 2 */}
    <At a={102.6} b={104.4}><Round n="2" title="КАРТИНКА И МИР" /></At>
    <At a={104.4} b={118.2}>
      <Win src="claude" from={70} {...FULL} />
      <Chip d={rel(104.4, 104.4)} x={180} y={880} color={CL}>тёплое прошлое</Chip>
      <Chip d={rel(106.6, 104.4)} x={1100} y={880} color={GP}>бирюзовое будущее со светлячками</Chip>
      <Callout d={rel(113.0, 104.4)} x={110 + 1700 * 0.354} y={120 + 874 * 0.53} text="призрак напарника" />
    </At>
    <At a={118.2} b={123.8}>
      <Win src="codex" from={64} {...FULL} />
      <Chip d={rel(119.1, 118.2)} x={180} y={880} color={GP}>картинка бледнее</Chip>
      <Chip d={rel(121.7, 118.2)} x={760} y={880} color={GP}>маленький мир, видны края</Chip>
    </At>
    <At a={123.8} b={127.55}><Win src="codex" from={106} {...FULL} /><Say y={960} size={50}>деталь, которую гость заметила первой</Say></At>
    <At a={127.55} b={132.0}>
      <Win src="codex" from={111} {...FULL} />
      <Chip d={0.2} x={640} y={150} big minus>NPC летают по воздуху без анимации</Chip>
    </At>

    {/* РАУНД 3 */}
    <At a={132.0} b={134.7}><Round n="3" title="УПРАВЛЕНИЕ" /></At>
    <At a={134.7} b={140.5}>
      <Win src="claude" from={84} {...FULL} />
      <Chip d={rel(135.9, 134.7)} x={180} y={880} color={CL}>двойной прыжок</Chip>
      <Chip d={rel(137.1, 134.7)} x={620} y={880} color={CL}>рывок на Shift</Chip>
      <Chip d={rel(138.6, 134.7)} x={1020} y={880} color={CL}>трава приминается</Chip>
    </At>
    <At a={140.5} b={148.1}>
      <Win src="claude" from={94} {...FULL} />
      <Chip d={rel(142.4, 140.5)} x={540} y={150} big minus>камеру повернуть нельзя</Chip>
      <Chip d={rel(146.0, 140.5)} x={700} y={880} minus>в начале застряли</Chip>
    </At>
    <At a={148.1} b={153.7}>
      <Win src="codex" from={96} {...FULL} />
      <Chip d={rel(151.0, 148.1)} x={600} y={150} big minus>зеркальное управление у гость</Chip>
    </At>
    <At a={153.7} b={160.7}>
      <Win src="codex" from={196} {...L} />
      <Win src="codex" from={438} {...R} d={0.2} label={false} />
      <Chip d={0.4} x={120} y={800} minus>камера в стене</Chip>
      <Chip d={rel(157.4, 153.7)} x={1080} y={800} minus>прыжки как у Человека-паука</Chip>
    </At>

    {/* РАУНД 4 */}
    <At a={160.7} b={162.4}><Round n="4" title="ГОЛОВОЛОМКИ" /></At>
    <At a={162.4} b={166.8}>
      <Win src="claude" from={163} {...L} />
      <Win src="codex" from={133} {...R} d={0.2} />
      <Say d={0.3} y={150} size={58}>одни и те же задания, сравниваем один в один</Say>
    </At>
    <At a={166.8} b={178.62}>
      <Win src="claude" from={166} {...FULL} />
      <Chip d={0.2} x={180} y={150} big>СЕМЯ</Chip>
      <Chip d={rel(169.8, 166.8)} x={180} y={880} color={CL}>в прошлом посадили семя</Chip>
      <Chip d={rel(171.1, 166.8)} x={900} y={880} color={GP}>в будущем выросло дерево-мост</Chip>
    </At>
    <At a={178.62} b={188.3}>
      <Win src="claude" from={256} {...L} />
      <Win src="codex" from={186} {...R} d={0.2} />
      <Chip d={0.1} x={820} y={150} big>КОЛОКОЛА</Chip>
      <Chip d={rel(181.2, 178.62)} x={300} y={800}>фреска в будущем</Chip>
      <Chip d={rel(184.3, 178.62)} x={1160} y={800}>звонок в прошлом</Chip>
    </At>
    <At a={188.3} b={197.2}>
      <Montage each={2.2} rate={2} clips={[['claude', 352], ['claude', 441], ['claude', 497], ['claude', 664]]} />
      <Chip d={rel(189.9, 188.3)} x={180} y={150} color={CL}>плотина</Chip>
      <Chip d={rel(190.8, 188.3)} x={480} y={150} color={CL}>кузница</Chip>
      <Chip d={rel(191.5, 188.3)} x={780} y={150} color={CL}>синхронные плиты</Chip>
      <Chip d={rel(193.7, 188.3)} x={1200} y={150} color={CL}>эхо-лестница</Chip>
    </At>
    <At a={197.2} b={204.6}>
      <Win src="claude" from={281} {...FULL} />
      <Chip d={rel(201.3, 197.2)} x={560} y={150} big minus>прошли сквозь стену</Chip>
    </At>
    <At a={204.6} b={206.9}><Win src="codex" from={328} {...FULL} /></At>
    <At a={208.3} b={210.95}><Win src="codex" from={520} rate={2} {...FULL} /><Chip d={0.2} x={560} y={150} big minus>задание можно пропустить</Chip></At>

    {/* РАУНД 5 */}
    <At a={210.95} b={212.7}><Round n="5" title="ПОГОНЯ" /></At>
    <At a={212.7} b={225.2}>
      <Win src="claude" from={722} {...FULL} />
      <Chip d={rel(216.7, 212.7)} x={180} y={880} color={CL}>огонь на весь экран</Chip>
      <Chip d={rel(221.6, 212.7)} x={900} y={880} minus>управлять тяжело</Chip>
    </At>
    <At a={225.2} b={232.1}>
      <Win src="codex" from={514} rate={2} {...FULL} />
      <Chip d={rel(227.5, 225.2)} x={180} y={880} color={GP}>короче и проще: бежишь до ворот</Chip>
    </At>
    <At a={232.1} b={239.5}>
      <Win src="claude" from={760} {...L} />
      <Win src="codex" from={524} {...R} d={0.2} />
      <Say d={rel(234.6, 232.1)} y={140} size={90} color={LIME}>НИЧЬЯ</Say>
      <Chip d={rel(235.5, 232.1)} x={150} y={800} color={CL}>красиво, но неудобно</Chip>
      <Chip d={rel(237.2, 232.1)} x={1150} y={800} color={GP}>удобно, но скучно</Chip>
    </At>

    {/* РАУНД 6 */}
    <At a={239.5} b={241.9}><Round n="6" title="БОСС" /></At>
    <At a={241.9} b={245.7}><Win src="codex" from={548} {...FULL} /><Chip d={0.2} x={180} y={880} color={GP}>выглядит прикольно</Chip></At>
    <At a={245.7} b={253.18}>
      <Win src="codex" from={556} {...FULL} />
      <Chip d={rel(248.1, 245.7)} x={600} y={150} big minus>у босса нет анимации</Chip>
      <Chip d={rel(251.0, 245.7)} x={600} y={880} minus>весь бой: 3 удара молотом</Chip>
    </At>
    <At a={253.18} b={266.8}>
      <Montage each={3.4} clips={[['claude', 846], ['claude', 905], ['claude', 958], ['claude', 985]]} />
      <Chip d={rel(256.5, 253.18)} x={180} y={150} color={CL} big>3 фазы</Chip>
      <Chip d={rel(258.0, 253.18)} x={520} y={150} color={CL} big>синхронные удары в двух эпохах</Chip>
      <Chip d={rel(262.4, 253.18)} x={600} y={880} minus>местами непонятно</Chip>
    </At>

    {/* ФИНАЛ */}
    <At a={266.8} b={277.1}>
      <Win src="claude" from={994} {...FULL} />
      <Say d={0.2} y={960} size={52} color={LIME}>экраны сливаются в один</Say>
    </At>
    <At a={277.1} b={280.44}><Win src="claude" from={1021} {...FULL} /><Chip d={0.2} x={180} y={880} color={CL}>титры, как в задании</Chip></At>
    <At a={280.44} b={292.0}>
      <Win src="codex" from={642} {...FULL} zoom={1.0} />
      <Chip d={rel(287.2, 280.44)} x={620} y={150} big color={GP}>8:59 вместе</Chip>
      <Chip d={rel(289.7, 280.44)} x={480} y={880} big>игра GPT в два раза короче</Chip>
    </At>

    {/* ИТОГ */}
    <At a={292.0} b={309.2} sfx="whoosh">
      <Say y={70} size={56}>пять критериев из задания</Say>
      {[['Вау-эффект', 298.8], ['Кооперация', 299.9], ['Управление', 300.9], ['Законченность', 302.8], ['Головоломки', 303.6]].map(([name, at], i) => (
        <Card key={i} d={rel(at as number, 292.0)} x={360} y={190 + i * 132} w={1200}>
          <div style={{display: 'flex', justifyContent: 'space-between'}}><span>{name}</span><span style={{color: CL, fontFamily: DISPLAY, fontWeight: 900}}>✓ CLAUDE</span></div>
        </Card>))}
      <Chip d={rel(306.2, 292.0)} x={560} y={880} big color={GP}>GPT: меню и выбор героя</Chip>
    </At>
    <At a={309.2} b={320.9}>
      <Say y={130} size={64}>идеальной игры <span style={{color: RED}}>не сделал никто</span></Say>
      <Chip d={rel(314.4, 309.2)} x={500} y={330} big minus>у Claude не крутится камера</Chip>
      <Chip d={rel(315.3, 309.2)} x={500} y={460} big minus>путается погоня</Chip>
      <Chip d={rel(317.6, 309.2)} x={500} y={590} big minus>непонятные моменты у босса</Chip>
      <Say d={rel(318.4, 309.2)} y={760} size={50} color={LIME}>но это детали, которые можно доделать</Say>
    </At>
    <At a={320.9} b={323.5}><Win src="codex" from={636} {...FULL} /></At>

    {/* ФИНАЛЬНЫЕ ПЛАШКИ */}
    <At a={323.5} b={329.6} sfx="whoosh">
      <Say y={300} size={84}>какие нейросети</Say>
      <Say d={0.3} y={410} size={84} color={LIME}>столкнуть следующими?</Say>
      <Chip d={rel(327.6, 323.5)} x={640} y={600} big>пишите в комментариях</Chip>
    </At>
    <At a={329.6} b={VOICE_END + 2.4}>
      <Say y={260} size={72}>подписывайтесь</Say>
      <Card d={rel(335.7, 329.6)} x={330} y={440} w={560}><div style={{fontFamily: DISPLAY, fontWeight: 900, color: '#FF4E45'}}>YouTube</div><div style={{color: MUTED, fontSize: 32, marginTop: 6}}>новые сравнения нейросетей</div></Card>
      <Card d={rel(337.5, 329.6)} x={1030} y={440} w={560} color={GP}><div style={{fontFamily: DISPLAY, fontWeight: 900, color: GP}}>Telegram</div><div style={{color: MUTED, fontSize: 32, marginTop: 6}}>t.me/your_channel</div></Card>
      <Say d={rel(338.5, 329.6)} y={760} size={54} color={LIME}>спасибо за просмотр!</Say>
    </At>

    {/* живые реакции */}
    {INS.map((ins, k) => <Sequence key={k} from={Math.round(insStart(k) * fps)} durationInFrames={Math.round(DUR(ins) * fps)} layout="none"><Reaction ins={ins} /><Sfx name="swap" at={0} vol={0.15} /></Sequence>)}

    <Score />

    {/* звук: голос кусками между реакциями, музыка тише на реакциях */}
    {pieces.map(([a, b], i) => <Sequence key={i} from={Math.round(T(a) * fps)} durationInFrames={Math.max(1, Math.round((b - a) * fps))} layout="none"><Audio src={f('voice.wav')} startFrom={Math.round(a * fps)} endAt={Math.round(b * fps)} /></Sequence>)}
    <Audio loop src={staticFile('fishki/music.mp3')} volume={musicVol} />
  </AbsoluteFill>;
};
