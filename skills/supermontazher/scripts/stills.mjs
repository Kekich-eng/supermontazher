// node stills.mjs <папка remotion> <композиция> <папка> <t1,t2,...> — кадры по секундам одним бандлом (ширина 540)
import {createRequire} from 'module';
import path from 'path';
import fs from 'fs';
const [dir, comp, out, times] = process.argv.slice(2);
const req = createRequire(path.join(dir, 'package.json'));
const {bundle} = req('@remotion/bundler');
const {selectComposition, renderStill} = req('@remotion/renderer');
fs.mkdirSync(out, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(dir, 'src/index.ts')});
const composition = await selectComposition({serveUrl, id: comp});
for (const [i, t] of times.split(',').map(Number).entries()) {
  const frame = Math.round(t * composition.fps);
  await renderStill({serveUrl, composition, frame, output: path.join(out, `${String(i).padStart(3, '0')}.png`), scale: 540 / composition.width});
  process.stdout.write('.');
}
console.log(' ok', composition.durationInFrames, composition.fps);
