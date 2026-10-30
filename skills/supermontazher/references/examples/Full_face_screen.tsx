// Полный ролик «Бесплатный Claude Code из России».
// Все времена — секунды чернового монтажа (talk/rough.mp4, 448.9 с).
import React from 'react';
import {
  AbsoluteFill, Audio, Freeze, Img, OffthreadVideo, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig,
} from 'remotion';
import {At, C, Card, DISPLAY, FONT, Label, Pop, RightColumn, Sfx} from './ui';
import {CUTS} from './cuts';
import {Intro} from './Sample';

const TOTAL = 448.9;
const MONO = "Consolas, 'Cascadia Mono', monospace";
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

// --- Когда на экране запись с компьютера (говорящий уезжает в угол) ---------
const SCREEN: [number, number][] = [
  [64.2, 114.6],   // шаг 1: установка
  [119.8, 127.6],  // шаг 2: страница настроек
  [169.0, 224.0],  // шаг 3: ключ и модель
  [227.8, 240.2],  // шаг 4: экран входа
  [279.5, 325.6],  // шаг 5: запуск и результат
];

// --- Главы: плашка в левом верхнем углу -------------------------------------
const STEPS: [number, number, string, string][] = [
  [62.2, 114.8, 'Шаг 1', 'Установка'],
  [115.0, 127.7, 'Шаг 2', 'Запуск'],
  [127.9, 224.0, 'Шаг 3', 'Бесплатный ключ'],
  [224.2, 253.2, 'Шаг 4', 'Экран входа'],
  [253.4, 325.6, 'Шаг 5', 'Проверка'],
  [325.9, 375.5, 'Честно', 'Чего ждать'],
  [375.7, 431.9, 'Итог', 'Кому подойдёт'],
];

// --- Когда справа от говорящего стоят карточки (затемняем фон под ними) ------
const SHADES: [number, number][] = [
  [1.0, 5.9], [7.2, 12.0], [12.4, 16.4], [19.5, 41.6], [42.2, 49.6], [49.9, 61.0],
  [115.7, 119.7], [128.5, 168.9], [240.3, 253.3], [254.2, 279.4], [327.3, 375.5], [375.9, 431.9], [432.2, 448.9],
];

const useT = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return frame / fps;
};

// 0 → 1 → 0 на интервалах, с плавным входом и выходом
const envelope = (t: number, ranges: [number, number][], ease = 0.45) => {
  let v = 0;
  for (const [a, b] of ranges) {
    v = Math.max(v, interpolate(t, [a, a + ease, b - ease, b], [0, 1, 1, 0], clamp));
  }
  return v * v * (3 - 2 * v);
};

// --- Говорящий: весь кадр или окошко в углу ----------------------------------
const Speaker: React.FC = () => {
  const t = useT();
  const p = envelope(t, SCREEN);
  // приближение меняется на каждой склейке — скачок кадра выглядит как смена плана
  let seg = 0;
  for (let i = 0; i < CUTS.length; i++) if (CUTS[i] <= t + 1e-3) seg = i;
  const punch = seg % 2 === 1 ? 1.07 : 1.0;

  const box = {
    x: interpolate(p, [0, 1], [0, 56]),
    y: interpolate(p, [0, 1], [0, 716]),
    w: interpolate(p, [0, 1], [1920, 440]),
    h: interpolate(p, [0, 1], [1080, 308]),
  };
  const k = interpolate(p, [0, 1], [punch, 2.0]);
  const fx = 0.42, fy = 0.37; // где в кадре лицо
  const vw = box.w * k;
  const vh = (vw * 9) / 16;
  const left = Math.min(0, Math.max(box.w - vw, box.w / 2 - fx * vw));
  const top = Math.min(0, Math.max(box.h - vh, box.h / 2 - fy * vh));
  return (
    <div
      style={{
        position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden',
        borderRadius: 30 * p, border: `${3 * p}px solid ${C.lime}`, boxSizing: 'border-box',
        boxShadow: p > 0.01 ? '0 20px 60px rgba(0,0,0,0.6)' : 'none',
      }}
    >
      <OffthreadVideo src={staticFile('rough.mp4')} style={{position: 'absolute', left, top, width: vw, height: vh}} />
    </div>
  );
};

// --- Фон для режима «экран» ---------------------------------------------------
const Backdrop: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 60% 35%, #1B5A49 0%, #0C2A22 55%, #07201A 100%)'}}>
    <AbsoluteFill
      style={{
        backgroundImage: 'radial-gradient(rgba(198,255,61,0.16) 2px, transparent 2.5px)',
        backgroundSize: '46px 46px', opacity: 0.6,
      }}
    />
  </AbsoluteFill>
);

// --- Окно с записью экрана ------------------------------------------------------
const WIN = {x: 548, y: 92, w: 1316, h: 740};

type Seg = {at: number; to: number; clip?: string; from?: number; rate?: number; img?: string; freeze?: number; zoom?: number};
const SEGS: Seg[] = [
  {at: 64.2, to: 69.2, clip: '01_install', from: 26, rate: 1},       // пустое окно PowerShell
  {at: 69.2, to: 89.6, clip: '01_install', from: 31, rate: 0.49},    // вставка команды
  {at: 89.6, to: 97.7, clip: '01_install', from: 41, rate: 0.62},    // первый вопрос
  {at: 97.7, to: 101.6, clip: '01_install', from: 46, rate: 1.15},   // отвечаем y
  {at: 101.6, to: 107.6, clip: '01_install', from: 50.5, rate: 4.25}, // остальные n
  {at: 107.6, to: 114.6, clip: '01_install', from: 76, rate: 9.1},   // установка
  {at: 119.8, to: 127.6, clip: '02_admin', from: 0, rate: 1.75},
  {at: 169.0, to: 190.3, img: 'openrouter_keys.png'},
  {at: 190.3, to: 206.5, clip: '04_key', from: 0, rate: 0.58},
  {at: 206.5, to: 210.6, clip: '04_key', from: 9.4, rate: 1.7},
  {at: 210.6, to: 222.6, clip: '05a_model', from: 0, rate: 2.3},
  {at: 222.6, to: 224.0, clip: '05b_apply', from: 5, rate: 1.6},
  {at: 227.8, to: 240.2, clip: '07_login', from: 0, rate: 0.8},
  {at: 279.5, to: 288.5, clip: '08_run', from: 0, rate: 1},
  {at: 288.5, to: 303.0, clip: '08_run', from: 9, rate: 4.4},
  {at: 303.0, to: 316.2, clip: '09_result', from: 14, rate: 3.15},
  {at: 316.2, to: 325.6, clip: '08_run', freeze: 70, zoom: 2.1},
];

const ScreenWindow: React.FC = () => {
  const t = useT();
  const {fps} = useVideoConfig();
  const p = envelope(t, SCREEN);
  if (p < 0.005) return null;
  const inner = {w: WIN.w, h: WIN.h - 44};
  return (
    <div
      style={{
        position: 'absolute', left: WIN.x + (1 - p) * 120, top: WIN.y, width: WIN.w, height: WIN.h, opacity: p,
        transform: `scale(${0.94 + 0.06 * p})`, borderRadius: 22, overflow: 'hidden', background: '#0B0D12',
        boxShadow: '0 30px 90px rgba(0,0,0,0.65)', border: '2px solid rgba(255,255,255,0.14)',
      }}
    >
      <div style={{height: 44, background: '#151A21', display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 18}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
          <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
        ))}
      </div>
      <div style={{position: 'relative', width: inner.w, height: inner.h, overflow: 'hidden', background: '#0B0D12'}}>
        {SEGS.map((s, i) => (
          <Sequence key={i} from={Math.round(s.at * fps)} durationInFrames={Math.max(1, Math.round((s.to - s.at) * fps))} layout="none">
            {s.img ? (
              <div style={{position: 'absolute', left: 0, top: 0, width: inner.w, height: inner.h, background: '#FAFAFA', transform: 'scale(1.5)', transformOrigin: '64% 0%'}}>
                <Img src={staticFile(s.img)} style={{position: 'absolute', left: 0, top: 0, width: inner.w, height: (inner.w * 644) / 1270}} />
                {/* кнопка «Новый ключ» */}
                <Sequence from={Math.round(3.8 * fps)} durationInFrames={Math.round(7.6 * fps)} layout="none">
                  <Ring x={952} y={27} w={82} h={30} />
                </Sequence>
              </div>
            ) : s.freeze !== undefined ? (
              <Freeze frame={0}>
                <OffthreadVideo
                  muted src={staticFile(`clips/${s.clip}.mp4`)} startFrom={Math.round(s.freeze * fps)}
                  style={{position: 'absolute', left: 0, top: 0, width: inner.w * (s.zoom ?? 1), height: inner.h * (s.zoom ?? 1), objectFit: 'cover', objectPosition: 'left top'}}
                />
              </Freeze>
            ) : (
              <OffthreadVideo
                muted src={staticFile(`clips/${s.clip}.mp4`)} startFrom={Math.round((s.from ?? 0) * fps)} playbackRate={s.rate ?? 1}
                style={{position: 'absolute', left: 0, top: 0, width: inner.w, height: inner.h, objectFit: 'cover'}}
              />
            )}
          </Sequence>
        ))}
        <Marks />
      </div>
    </div>
  );
};

// Обводки поверх записи экрана: показывают, куда смотреть
const Ring: React.FC<{x: number; y: number; w: number; h: number}> = ({x, y, w, h}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 11, mass: 0.6}});
  const pulse = 1 + 0.04 * Math.sin(frame / 5);
  return (
    <div
      style={{
        position: 'absolute', left: x, top: y, width: w, height: h, borderRadius: 16, border: `5px solid ${C.lime}`,
        boxShadow: `0 0 30px ${C.lime}AA`, transform: `scale(${(1.5 - 0.5 * s) * pulse})`, opacity: s,
      }}
    />
  );
};

const Marks: React.FC = () => (
  <>
    {/* надпись «Opus» в шапке Claude Code */}
    <At t={317.0} dur={8.4} sfx="tick">
      <Ring x={170} y={60} w={470} h={50} />
    </At>
  </>
);

// --- Подпись под окном с экраном -------------------------------------------------
type Tone = 'info' | 'warn' | 'good';
const Cap: React.FC<{t: number; to: number; title: React.ReactNode; sub?: React.ReactNode; tone?: Tone; sfx?: Sfx; mono?: boolean}> = ({
  t, to, title, sub, tone = 'info', sfx = 'pop', mono,
}) => {
  const dur = to - t;
  const accent = tone === 'warn' ? C.red : C.lime;
  return (
    <At t={t} dur={dur} sfx={sfx} vol={tone === 'warn' ? 0.45 : 0.5}>
      <div style={{position: 'absolute', left: WIN.x, top: 862, width: WIN.w}}>
        <Pop dur={dur} from="bottom">
          <Card accent={accent} style={{padding: '22px 32px', display: 'flex', alignItems: 'center', gap: 22, minHeight: 118, boxSizing: 'border-box'}}>
            <div style={{width: 12, alignSelf: 'stretch', borderRadius: 6, background: accent, flexShrink: 0}} />
            <div>
              <div style={{fontFamily: mono ? MONO : FONT, fontWeight: mono ? 700 : 800, fontSize: mono ? 34 : 44, lineHeight: 1.15, color: tone === 'warn' ? C.red : C.white}}>
                {title}
              </div>
              {sub ? <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 27, color: C.dim, marginTop: 6}}>{sub}</div> : null}
            </div>
          </Card>
        </Pop>
      </div>
    </At>
  );
};

// Значок «ускорено» в углу окна
const Fast: React.FC<{t: number; to: number; x: string}> = ({t, to, x}) => (
  <At t={t} dur={to - t}>
    <div style={{position: 'absolute', left: WIN.x + WIN.w - 190, top: WIN.y + 62}}>
      <Pop dur={to - t} from="scale">
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 28, background: C.lime, color: C.green, padding: '8px 20px', borderRadius: 999, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
          ▶▶ {x}
        </div>
      </Pop>
    </div>
  </At>
);

// --- Плашка главы --------------------------------------------------------------
const StepChip: React.FC = () => (
  <>
    {STEPS.map(([a, b, n, title]) => (
      <At key={a} t={a} dur={b - a} sfx="whoosh" vol={0.4}>
        <div style={{position: 'absolute', left: 56, top: 48}}>
          <Pop dur={b - a} from="left">
            <div style={{display: 'flex', alignItems: 'center', filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.55))'}}>
              <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 30, background: C.lime, color: C.green, padding: '12px 22px', borderRadius: '16px 0 0 16px'}}>{n}</div>
              <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 32, background: C.green, color: C.white, padding: '12px 26px 13px 20px', borderRadius: '0 16px 16px 0', border: `2px solid ${C.lime}55`, borderLeft: 'none'}}>{title}</div>
            </div>
          </Pop>
        </div>
      </At>
    ))}
  </>
);

// --- Карточки справа от говорящего -----------------------------------------------
const Big: React.FC<{children: React.ReactNode; size?: number; color?: string}> = ({children, size = 52, color = C.white}) => (
  <div style={{fontFamily: FONT, fontWeight: 800, fontSize: size, lineHeight: 1.12, color}}>{children}</div>
);
const Sub: React.FC<{children: React.ReactNode}> = ({children}) => (
  <div style={{fontFamily: FONT, fontWeight: 500, fontSize: 28, color: C.dim, marginTop: 8, lineHeight: 1.3}}>{children}</div>
);

// Строка списка, появляется в свою секунду (время — от начала карточки)
const Row: React.FC<{at: number; mark?: string; color?: string; children: React.ReactNode}> = ({at, mark = '•', color = C.lime, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - Math.round(at * fps), fps, config: {damping: 14, mass: 0.6}});
  return (
    <div style={{display: 'flex', gap: 16, alignItems: 'flex-start', marginTop: 16, opacity: s, transform: `translateX(${(1 - s) * 40}px)`}}>
      <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 34, color, width: 34, textAlign: 'center', flexShrink: 0}}>{mark}</div>
      <div style={{fontFamily: FONT, fontWeight: 700, fontSize: 34, lineHeight: 1.2, color: C.white}}>{children}</div>
    </div>
  );
};

const Side: React.FC<{t: number; to: number; top?: number; width?: number; sfx?: Sfx; accent?: string; children: React.ReactNode}> = ({
  t, to, top = 200, width = 680, sfx = 'pop', accent, children,
}) => (
  <At t={t} dur={to - t} sfx={sfx}>
    <RightColumn top={top} width={width}>
      <Pop dur={to - t}>
        <Card accent={accent}>{children}</Card>
      </Pop>
    </RightColumn>
  </At>
);

const Ping: React.FC<{t: number; sfx: Sfx; vol?: number}> = ({t, sfx, vol}) => <At t={t} dur={1.2} sfx={sfx} vol={vol} />;

const Shade: React.FC = () => {
  const t = useT();
  const o = envelope(t, SHADES, 0.4);
  return <AbsoluteFill style={{opacity: o, background: 'linear-gradient(90deg, rgba(4,18,14,0) 46%, rgba(4,18,14,0.64) 70%, rgba(4,18,14,0.8) 100%)'}} />;
};

const Music: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <Audio
      loop src={staticFile('music/bg.mp3')}
      volume={(f) => 0.15 * interpolate(f / fps, [0, 1.5, TOTAL - 4, TOTAL], [0, 1, 1, 0], clamp)}
    />
  );
};

export const Full: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: '#07201A'}}>
      <Backdrop />
      <Speaker />
      <Shade />
      <ScreenWindow />
      <Music />
      <StepChip />

      {/* 0:00–0:50 — вступление, как в образце */}
      <Intro />

      {/* «бесплатные нейросети слабее настоящего Claude, но чтобы попробовать — хватит» */}
      <Side t={50.0} to={60.9} top={250}>
        <Label>Сразу честно</Label>
        <Big>Слабее настоящего Claude</Big>
        <Row at={5.4} mark="✓">но попробовать и поучиться — хватит</Row>
      </Side>
      <Ping t={55.4} sfx="tick" />

      {/* ---------- Шаг 1. Установка ---------- */}
      <Cap t={64.7} to={69.0} title="Пуск → PowerShell" sub="открываем обычное окно PowerShell" />
      <Cap t={69.2} to={78.9} mono title={'& ([scriptblock]::Create((irm ".../install.ps1")))'} sub="Одна команда. Целиком — в описании и в Telegram, набирать руками не нужно" />
      <Cap t={79.1} to={89.4} tone="warn" sfx="alert" title="Чужой скрипт из интернета — всегда риск" sub="Этот проект открытый: скрипт можно прочитать перед запуском" />
      <Cap t={89.6} to={97.5} title="Установщик спросит про десяток помощников" sub="нужен только первый" />
      <Cap t={97.7} to={101.4} sfx="ding" title={<>Claude Code → <span style={{color: C.lime}}>y</span></>} />
      <Cap t={101.6} to={106.1} title={<>Все остальные → <span style={{color: C.lime}}>n</span></>} />
      <Cap t={106.3} to={107.7} sfx="tick" title={<>RTK → <span style={{color: C.lime}}>n</span></>} />
      <Cap t={107.9} to={114.5} title="Ждём пару минут" sub="он сам поставит Claude Code и всё, что нужно" />
      <Fast t={101.8} to={107.4} x="×4" />
      <Fast t={107.7} to={114.5} x="×9" />

      {/* ---------- Шаг 2. Запуск ---------- */}
      <Side t={115.9} to={119.7} top={260}>
        <Label>На рабочем столе</Label>
        <Big>Ярлык Free Claude Code</Big>
        <Sub>запускаем двойным щелчком</Sub>
      </Side>
      <Cap t={120.2} to={127.5} title="Открылась страница настроек" sub="браузер может перевести её на русский — так удобнее" />

      {/* ---------- Шаг 3. Бесплатный ключ ---------- */}
      <Side t={128.7} to={131.6} top={270} sfx="tick">
        <Label>Самое важное</Label>
        <Big>Программе нужна нейросеть</Big>
      </Side>
      <Side t={131.9} to={155.3} top={190} accent={C.red}>
        <Label color={C.dim}>Официальная инструкция</Label>
        <Big>Ключ NVIDIA</Big>
        <Row at={5.9} mark="✕" color={C.red}><span style={{color: C.red}}>из России не работает</span></Row>
        <Row at={9.9} mark="·" color={C.dim}>просит подтвердить почту и телефон</Row>
        <Row at={20.3} mark="·" color={C.dim}>России в списке стран нет</Row>
      </Side>
      <Ping t={137.8} sfx="alert" />
      <Ping t={141.8} sfx="tick" />
      <Ping t={152.2} sfx="tick" />
      <Side t={155.5} to={168.9} top={190} sfx="ding">
        <Label>Берём вместо NVIDIA</Label>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 66, color: C.lime, lineHeight: 1.1}}>OpenRouter</div>
        <Row at={2.4} mark="✓">нейросети разных компаний в одном месте</Row>
        <Row at={7.5} mark="✓">часть из них — бесплатные</Row>
        <Row at={10.1} mark="✓">регистрация по почте, без телефона</Row>
      </Side>
      <Ping t={157.9} sfx="tick" />
      <Ping t={163.0} sfx="tick" />
      <Ping t={165.6} sfx="tick" />

      <Cap t={169.4} to={172.6} mono title="openrouter.ai/keys" sub="ссылка в описании" />
      <Cap t={172.8} to={180.4} sfx="tick" title="Новый ключ → любое имя" />
      <Cap t={180.6} to={187.3} sfx="ding" title="Ключ показывают один раз" sub="сразу копируем и сохраняем в текстовый файл" />
      <Cap t={187.5} to={190.3} tone="warn" sfx="alert" title="Это как пароль — никому не показывайте" />
      <Cap t={190.5} to={195.7} title="В списке находим карточку OpenRouter" />
      <Cap t={195.9} to={206.3} tone="warn" sfx="alert" title={<>OpenRouter, а не Or<span style={{textDecoration: 'underline'}}>ca</span>Router</>} sub="название похожее, сервис другой — я перепутал и потерял 20 минут" />
      <Cap t={206.5} to={210.5} title="Настроить → вставить ключ → Сохранить" />
      <Cap t={211.3} to={215.5} title="Слева: «Конфигурация моделей»" />
      <Cap t={215.7} to={222.6} title={<>Модель по умолчанию: <span style={{fontFamily: MONO, color: C.lime}}>openrouter/free</span></>} sub="набираем в поле и выбираем из списка" />
      <Cap t={222.8} to={224.0} sfx="ding" title="Применить" />

      {/* ---------- Шаг 4. Экран входа ---------- */}
      <Cap t={228.4} to={240.1} tone="warn" sfx="alert" title="При первом запуске попросит войти в аккаунт Claude" sub="в официальной инструкции об этом ни слова. Аккаунт нам не нужен" />
      <Side t={240.3} to={253.3} top={170} width={760}>
        <Label>Один раз, до первого запуска</Label>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 25, lineHeight: 1.45, color: C.white, background: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: '18px 20px', wordBreak: 'break-all'}}>
          {'if (-not (Test-Path "$HOME\\.claude.json")) { \'{"hasCompletedOnboarding": true}\' | Set-Content "$HOME\\.claude.json" -Encoding ascii }'}
        </div>
        <Row at={6.4} mark="→">говорит программе: первый запуск уже пройден</Row>
        <Sub>строчка — в описании и в Telegram</Sub>
      </Side>
      <Ping t={246.7} sfx="tick" />

      {/* ---------- Шаг 5. Проверка ---------- */}
      <Side t={254.3} to={273.7} top={210}>
        <Label>Перед запуском</Label>
        <Row at={2.3} mark="1">создаём пустую папку</Row>
        <Row at={7.4} mark="2">в адресной строке Проводника пишем <span style={{fontFamily: MONO, color: C.lime}}>powershell</span> и Enter</Row>
        <Row at={12.6} mark="3">терминал откроется сразу в этой папке</Row>
      </Side>
      <Ping t={256.6} sfx="tick" />
      <Ping t={261.7} sfx="tick" />
      <Ping t={266.9} sfx="tick" />
      <Side t={274.0} to={279.4} top={170} sfx="ding">
        <Label>Команда запуска</Label>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 84, color: C.lime, lineHeight: 1.1}}>fcc-claude</div>
        <Sub>это команда, а не папка — она всегда одна и та же</Sub>
      </Side>
      <Side t={276.2} to={279.4} top={470} sfx="alert" accent={C.red}>
        <div style={{fontFamily: FONT, fontWeight: 800, fontSize: 30, color: C.white, lineHeight: 1.25}}>
          Спросит про доверие к папке: <span style={{color: C.lime}}>↓ и Enter</span>
        </div>
        <Sub>по умолчанию там выбрано «No, exit»</Sub>
      </Side>

      <Cap t={279.9} to={285.9} title="Перед нами Claude Code. Даём задачу" />
      <Cap t={286.1} to={290.4} title="«Калькулятор калорий одним файлом»" />
      <Cap t={290.6} to={294.7} sfx="ding" title="Минута — и готово" />
      <Cap t={294.9} to={302.9} tone="warn" sfx="tick" title="Один раз споткнулся — и сам исправился" sub="строчка «Error writing file» в окне" />
      <Cap t={303.1} to={316.1} title="Тёмная страница, поля, кнопка — считает" sub="около 2000 ккал — похоже на правду" />
      <Cap t={316.3} to={325.5} tone="warn" sfx="alert" title="«Opus» в шапке — просто подпись" sub="настоящего Opus там нет: запросы уходят в бесплатную модель" />
      <Fast t={288.7} to={302.8} x="×4" />
      <Fast t={303.2} to={316.0} x="×3" />

      {/* ---------- Чего ждать ---------- */}
      <Side t={327.5} to={375.4} top={170} width={700} sfx="whoosh">
        <Label>Чего ждать</Label>
        <Row at={0.1} mark="1"><span>Это не Claude</span><Sub>сложный проект не вытянет: будет путаться и ломать своё же</Sub></Row>
        <Row at={14.0} mark="2"><span>Лимит: <span style={{color: C.lime}}>50 запросов в день</span></span><Sub>и не больше 20 в минуту. Хватит на несколько небольших задач</Sub></Row>
        <Row at={33.6} mark="3"><span>Личное не отправляйте</span><Sub>пароли, рабочие документы, чужие данные — всё уходит на серверы сервиса</Sub></Row>
      </Side>
      <Ping t={341.5} sfx="pop" />
      <Ping t={348.0} sfx="ding" vol={0.4} />
      <Ping t={361.1} sfx="alert" vol={0.4} />

      {/* ---------- Кому подойдёт ---------- */}
      <Side t={376.0} to={431.8} top={190} width={700} sfx="whoosh">
        <Label>Кому подойдёт</Label>
        <Row at={5.1} mark="✓">попробовать и понять, как это работает</Row>
        <Row at={15.5} mark="✓">простая страница или скрипт</Row>
        <Row at={24.1} mark="✕" color={C.red}>игра, большой сайт, серьёзный проект</Row>
        <Row at={40.4} mark="✓">таблицы и отчёты в офисе</Row>
      </Side>
      <Ping t={381.1} sfx="tick" />
      <Ping t={391.5} sfx="tick" />
      <Ping t={400.1} sfx="alert" vol={0.4} />
      <Ping t={416.4} sfx="tick" />

      {/* ---------- Финал ---------- */}
      <Side t={432.4} to={448.6} top={230} width={700} sfx="whoosh">
        <Label>Все команды и ссылки</Label>
        <div style={{fontFamily: DISPLAY, fontWeight: 900, fontSize: 62, color: C.lime, lineHeight: 1.1}}>в Telegram</div>
        <div style={{fontFamily: MONO, fontWeight: 700, fontSize: 44, color: C.white, background: 'rgba(0,0,0,0.35)', borderRadius: 16, padding: '10px 20px', marginTop: 14, display: 'inline-block'}}>
          t.me/your_channel
        </div>
        <Sub>подробная инструкция одним сообщением — ссылка в описании</Sub>
        <Row at={11.4} mark="★">подписывайтесь — дальше будет больше</Row>
      </Side>
      <Ping t={443.8} sfx="ding" vol={0.45} />

      {/* затемнение в самом конце */}
      <FadeOut />
    </AbsoluteFill>
  );
};

const FadeOut: React.FC = () => {
  const t = useT();
  return <AbsoluteFill style={{background: '#07201A', opacity: interpolate(t, [TOTAL - 1.2, TOTAL], [0, 1], clamp)}} />;
};
