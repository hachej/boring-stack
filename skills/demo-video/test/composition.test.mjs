// The composition: the app is recorded untouched, captions live in a band outside its screen, the video is a constant 30 fps.
// The recording tests drive a local page with a real browser and ffmpeg.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { geometry } from '../scripts/lib/compose.mjs';
import { parseViewport } from '../scripts/lib/steps.mjs';

const RECORD = join(dirname(fileURLToPath(import.meta.url)), '../scripts/record.mjs');
const work = mkdtempSync(join(tmpdir(), 'demo-video-compose-'));
process.on('exit', () => rmSync(work, { recursive: true, force: true }));

test('geometry: a portrait frame for a phone, a landscape frame for a desktop, even sizes, the band below the screen', () => {
  const p = geometry(parseViewport('phone')), d = geometry(parseViewport('desktop'));
  assert.deepEqual([p.sw, p.sh, p.fw, p.fh], [780, 1688, 960, 2048]);
  assert.ok(p.fh > p.fw && d.fw > d.fh, 'portrait for a phone, landscape for a desktop');
  assert.deepEqual([d.sw, d.sh, d.fw, d.fh], [1440, 900, 1520, 1140]);
  for (const g of [p, d]) {
    for (const n of [g.fw, g.fh, g.sx, g.sy, g.by]) assert.equal(n % 2, 0, 'H.264 needs even sizes');
    assert.equal(g.sy + g.sh, g.by, 'the band starts where the screen ends: nothing of the caption is over the app');
    assert.equal(g.by + g.bh, g.fh);
  }
});

// A page that reports every layout shift into its own text. The recorder must cause none: no shift while it types, taps, shows
// a caption, moves its pointer or scrolls, and none of its captions may be in the page's DOM.
const PAGE = `<!doctype html><meta charset=utf-8><meta name=viewport content="width=device-width"><title>t</title>
<body style="margin:0;font:16px sans-serif"><h1>Page statique</h1><input id=a aria-label="Champ" style="font-size:16px"><button id=b>Valider</button><p id=out>rien</p>
<div style="height:1400px">long</div><button id=low>Bas de page</button><p id=ls>shifts 0</p>
<script>let n=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)n+=1;document.getElementById('ls').textContent='shifts '+n}).observe({type:'layout-shift',buffered:true});
b.onclick=()=>{out.textContent='ok'}</script>`;

for (const [name, viewport, frame] of [['phone', 'phone', [960, 2048]], ['desktop', 'desktop', [1520, 1140]]]) {
  test(`recording (${name}): zero layout shift caused by the recorder, captions outside the page, 30 fps, ${frame.join('x')}`, () => {
    const dir = join(work, name);
    const page = join(work, `${name}.html`), steps = join(work, `${name}.json`);
    writeFileSync(page, PAGE);
    writeFileSync(steps, JSON.stringify({ title: 'Page statique', lang: 'fr', viewport, steps: [
      { do: 'type', target: '#a', text: 'bonjour', caption: 'Légende invisible dans la page', until: 'nosee:Légende invisible' },
      { do: 'tap', role: 'button', name: 'Valider', caption: 'Je valide', until: 'see:ok' },
      { do: 'tap', role: 'button', name: 'Bas de page', caption: 'Je descends', pause: 1200 },
      { caption: 'Aucun décalage', until: 'see:shifts 0', pause: 1500 },
    ] }));
    const r = spawnSync(process.execPath, [RECORD, '--steps', steps, '--url', page, '--out', dir], { encoding: 'utf8' });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'stream=width,height,r_frame_rate,codec_name', '-of', 'csv=p=0', join(dir, 'demo.mp4')], { encoding: 'utf8' }).stdout.trim();
    assert.equal(probe, `h264,${frame[0]},${frame[1]},30/1`);
    const doc = JSON.parse(readFileSync(join(dir, 'steps.json'), 'utf8'));
    assert.ok(doc.steps.every((s) => s.ok), 'every step held, including shifts 0');
  });
}
