// Демонстрация kit.tsx: 12 секунд, горизонтальный кадр. Заодно проверка, что набор компилируется.
// В Root.tsx: <Composition id="KitDemo" component={KitDemo} width={1920} height={1080} fps={30} durationInFrames={12 * 30} />
import React from 'react';
import {AbsoluteFill} from 'remotion';
import {DISPLAY} from './ui';
import {Backdrop, Burst, Chip, Count, Flash, Glass, Glitch, K, Rise, Scene, Shake, Stamp, abs} from './kit';

export const KitDemo: React.FC = () => (
  <AbsoluteFill>
    <Backdrop />
    <Shake hits={[2.0, 8.6]}>
      <Scene a={0} b={6}>
        <div style={abs(160, 300)}><Rise at={0.3}><Chip>шаг 1</Chip></Rise></div>
        <div style={abs(160, 380, 1600)}><Glitch at={0.8} size={110} style={{textAlign: 'left'}}>ОДИН ЭКРАН</Glitch></div>
        <div style={abs(160, 600)}>
          <Rise at={2.0} from="scale" hard>
            <Glass accent={K.lime} style={{fontSize: 44, fontWeight: 700}}>
              Сэкономлено <Count at={2.0} to={125000} style={{color: K.lime, fontSize: 64}} /> знаков
            </Glass>
          </Rise>
        </div>
        <Burst at={2.0} x={500} y={660} />
      </Scene>
      <Scene a={6} b={12}>
        <div style={{...abs(0, 420, 1920), textAlign: 'center', fontFamily: DISPLAY, fontWeight: 900, fontSize: 120, color: K.text}}>
          <Rise at={0.2}>ФИНАЛ</Rise>
        </div>
        <div style={abs(1180, 640)}><Stamp at={2.6} text="ГОТОВО" color={K.lime} /></div>
      </Scene>
    </Shake>
    <Flash at={6} />
  </AbsoluteFill>
);
