// The final frame is composed after the capture: the recorded page, untouched, sits inside a stage; the caption and the step counter live
// in a band outside the app's screen; the title and end cards use the whole frame. Nothing of ours is drawn over the app except the pointer.
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const even = (n) => Math.ceil(n / 2) * 2;
export const FPS = 30;
export const CARD_SECONDS = 2.6;
const FADE = 0.3; // the cards dissolve into the page and back, no hard cut

/** Where the screen, the band and the whole frame sit. A phone (touch) is captured at CSS size and shown at 2x: a portrait frame. */
export function geometry(vp) {
  const k = vp.touch ? 2 : 1;
  const sw = vp.width * k, sh = vp.height * k;
  const pad = vp.touch ? even(sw * 0.115) : 40;
  const bh = even(vp.touch ? Math.max(300, sw * 0.415) : 200);
  const fw = even(sw + 2 * pad), fh = even(pad * (vp.touch ? 0.4 : 1) + sh + bh);
  const sy = vp.touch ? even(pad * 0.4) : pad;
  return { k, sw, sh, sx: pad, sy, fw, fh, by: fh - bh, bh, fs: vp.touch ? Math.round(fw * 0.052) : 32, phone: !!vp.touch };
}

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const FONT = "font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif;";
const TONES = { '': '#15151a', ok: '#0f5a36', ko: '#9b1c1c' };

export const baseHtml = (g) => `<!doctype html><meta charset=utf-8><body style="margin:0;background:#0d0d10;width:${g.fw}px;height:${g.fh}px;overflow:hidden">
<div style="position:absolute;left:${g.sx - 6}px;top:${g.sy - 6}px;width:${g.sw}px;height:${g.sh}px;border:6px solid #2a2a31;border-radius:${g.phone ? 18 : 4}px"></div>
<div style="position:absolute;left:0;top:${g.by}px;width:${g.fw}px;height:${g.bh}px;background:${TONES['']}"></div>`;

/** One caption band: the step counter, then the caption. `ko` turns the band red. */
export const bandHtml = (g, { n, total, text, ko }) => { const fs = Math.round(g.fs * (String(text).length > 70 ? 0.82 : 1)); return `<!doctype html><meta charset=utf-8><body style="margin:0;width:${g.fw}px;height:${g.bh}px;background:${ko ? TONES.ko : TONES['']};${FONT}color:#fff;overflow:hidden;display:flex;flex-direction:column;justify-content:center;gap:${Math.round(g.fs * 0.3)}px;padding:0 ${g.sx}px;box-sizing:border-box">
<div style="font-size:${Math.round(g.fs * 0.68)}px;font-weight:600;opacity:.7;letter-spacing:.04em">${n} / ${total}</div>
<div style="font-size:${fs}px;font-weight:650;line-height:1.22;text-wrap:balance;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden">${esc(text)}</div>`; };

/** A title or end card over the whole frame. */
export const cardHtml = (g, { title, sub, date, tone }) => `<!doctype html><meta charset=utf-8><body style="margin:0;width:${g.fw}px;height:${g.fh}px;${FONT}color:#fff;background:${tone === 'ok' ? 'linear-gradient(160deg,#0b3d26,#14633d)' : tone === 'ko' ? 'linear-gradient(160deg,#4a0d0d,#861b1b)' : 'linear-gradient(160deg,#101827,#1f2a44)'};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${Math.round(g.fw * 0.02)}px;padding:8%;box-sizing:border-box;text-align:center">
<div style="font-size:${Math.round(g.fw * (g.phone ? 0.06 : 0.035))}px;font-weight:750;line-height:1.15;text-wrap:balance">${esc(title)}</div>
<div style="font-size:${Math.round(g.fw * (g.phone ? 0.036 : 0.017))}px;opacity:.85;line-height:1.3">${esc(sub)}</div>
<div style="font-size:${Math.round(g.fw * (g.phone ? 0.028 : 0.013))}px;opacity:.6">${esc(date)}</div>`;

async function png(browser, html, w, h, file) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  try { await page.setContent(html); await page.screenshot({ path: file, clip: { x: 0, y: 0, width: w, height: h } }); } finally { await page.close(); }
}

const x264 = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '22', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', '-an'];

/**
 * raw: the Playwright WebM; trimS: seconds to skip; steps: [{ text, ok, a, b }] (a, b in seconds from the trim point); returns { ok, error }.
 * Everything is resampled to a constant 30 fps from the capture's own timestamps.
 */
export async function composeVideo({ browser, tmp, raw, trimS, mainS, vp, steps, title, end, out }) {
  const g = geometry(vp);
  const files = { base: join(tmp, 'base.png'), title: join(tmp, 'card-title.png'), end: join(tmp, 'card-end.png') };
  await png(browser, baseHtml(g), g.fw, g.fh, files.base);
  await png(browser, cardHtml(g, title), g.fw, g.fh, files.title);
  await png(browser, cardHtml(g, end), g.fw, g.fh, files.end);
  const bands = [];
  for (let i = 0; i < steps.length; i++) {
    const f = join(tmp, `band-${i}.png`);
    await png(browser, bandHtml(g, { n: i + 1, total: steps.length, text: steps[i].text, ko: !steps[i].ok }), g.fw, g.bh, f);
    bands.push(f);
  }
  const inputs = [['-loop', '1', '-framerate', String(FPS), '-t', mainS.toFixed(3), '-i', files.base], ['-ss', trimS.toFixed(3), '-t', mainS.toFixed(3), '-i', raw],
    ...bands.map((f) => ['-i', f]), ['-loop', '1', '-framerate', String(FPS), '-t', String(CARD_SECONDS), '-i', files.title], ['-loop', '1', '-framerate', String(FPS), '-t', String(CARD_SECONDS), '-i', files.end]];
  const titleIx = 2 + bands.length, endIx = titleIx + 1;
  const chain = [`[0:v]setsar=1[bg]`, `[1:v]fps=${FPS},scale=${g.sw}:${g.sh}:flags=lanczos,setpts=PTS-STARTPTS[v]`, `[bg][v]overlay=${g.sx}:${g.sy}:shortest=1[m0]`];
  steps.forEach((s, i) => chain.push(`[m${i}][${i + 2}:v]overlay=0:${g.by}:enable='between(t,${s.a.toFixed(3)},${s.b.toFixed(3)})'[m${i + 1}]`));
  chain.push(`[m${steps.length}]fps=${FPS},format=yuv420p,setsar=1[main]`, `[${titleIx}:v]fps=${FPS},format=yuv420p,setsar=1[t]`, `[${endIx}:v]fps=${FPS},format=yuv420p,setsar=1[e]`, `[t][main]xfade=transition=fade:duration=${FADE}:offset=${(CARD_SECONDS - FADE).toFixed(3)}[x1]`, `[x1][e]xfade=transition=fade:duration=${FADE}:offset=${(CARD_SECONDS + mainS - 2 * FADE).toFixed(3)}[out]`);
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', ...inputs.flat(), '-filter_complex', chain.join(';'), '-map', '[out]', ...x264, out], { encoding: 'utf8' });
  writeFileSync(join(tmp, 'ffmpeg.log'), r.stderr ?? '');
  return { ok: r.status === 0, error: (r.stderr ?? '').split('\n').slice(0, 2).join(' ').slice(0, 200), geometry: g };
}

export const toWebm = (mp4, out) => spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', mp4, '-c:v', 'libvpx', '-deadline', 'realtime', '-threads', '4', '-cpu-used', '8', '-b:v', '1500k', '-r', String(FPS), '-an', out], { encoding: 'utf8' }).status === 0;

/** A frame of the raw capture (the page alone), for the strip. */
export const frameAt = (raw, seconds, out) => spawnSync('ffmpeg', ['-y', '-v', 'error', '-ss', Math.max(0, seconds).toFixed(3), '-i', raw, '-frames:v', '1', out], { encoding: 'utf8' }).status === 0;
