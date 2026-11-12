#!/usr/bin/env node
// demo-video: record a short, watchable video of a web product doing something, or check it without a video (--fast).
// Usage: node record.mjs --steps steps.json --out DIR [--url URL] [--viewport phone|desktop|WxH[:touch]] [--fast] ...   (--help for all)
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, realpathSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEFAULT_MASK, SecretRefusal, bare, redact, safeError, scanScript, urlSecret } from './lib/safety.mjs';
import { UsageError, autoCaption, conditionJs, describe, fromScenario, loadStepsFile, normalizeStep, parseViewport } from './lib/steps.mjs';
import { overlayScript } from './lib/overlay.mjs';
import { perform, sleep } from './lib/gestures.mjs';
import { verdictOf } from './lib/verdict.mjs';
import { renderStrip } from './lib/strip.mjs';

const HELP = `demo-video: record a short video of a product doing something (and prove it), or check it with --fast.

  node record.mjs --steps flow.json --out DIR [options]
  node record.mjs --scenario ux/scenarios/x.json --flow F01 --url file:///built/page.html --out DIR

  --steps FILE        compact steps file (JSON): { "title", "url", "viewport", "lang", "steps": [ ... ] }
  --scenario FILE     a UI-kit harness scenario; --flow F01 picks the flow, --viewport 390 the viewport; --url is the built fixture page
  --url URL|PATH      page to open (http(s), file: or a local path); default: the steps file's url, then $LIVE_APP_URL
  --serve "CMD"       start a server first (killed at the end; waits until --url answers)
  --viewport V        phone (390x844 touch), desktop (1440x900), or WIDTHxHEIGHT[:touch]; default phone
  --out DIR           result folder (demo.mp4, demo.webm, poster.png, strip.png, steps.json, verdict.txt)
  --fast              no pauses, no video: checks, steps.json and strip only (for a gate)
  --session-env NAME  environment variable holding the session cookie value (never argv); default: the one live-session.mjs sets
  --cookie-name NAME  default __Host-app_session
  --child-frame CSS   the app renders inside this iframe: gestures and checks run in it
  --mask CSS,CSS      extra selectors to blur (default: input[type=password], [data-private])
  --title T --app NAME --version V --lang fr|en   title card text (version: a commit or release)
  --ready CSS         wait for this selector after opening
  --device-frame      draw a phone bezel (off by default)
  --strict-console    a console error fails the step
  --no-cards          no title or end card
Exit: 0 pass, 1 a step failed, 2 usage, 3 refused (secret-looking value), 4 environment.`;

function parseArgs(argv) {
  const o = {}, flags = new Set(['fast', 'device-frame', 'strict-console', 'no-cards', 'help']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) throw new UsageError(`unexpected argument "${a}"`);
    const k = a.slice(2);
    if (flags.has(k)) o[k] = true; else { if (argv[i + 1] == null) throw new UsageError(`--${k} needs a value`); o[k] = argv[++i]; }
  }
  return o;
}

export function findPlaywright() {
  const roots = [process.env.DEMO_VIDEO_PLAYWRIGHT, process.cwd(), dirname(fileURLToPath(import.meta.url))].filter(Boolean);
  const dirs = [];
  try { const r = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }); if (r.stdout) dirs.push(r.stdout.trim()); } catch { /* none */ }
  dirs.push('/usr/lib/node_modules/agent-browser/node_modules', join(homedir(), '.cache/studio-tasks-compact-deps/node_modules'));
  for (const from of roots) for (const name of ['playwright', 'playwright-core']) { try { return createRequire(join(resolve(from), 'x.js'))(name); } catch { /* next */ } }
  for (const dir of dirs) for (const name of ['playwright', 'playwright-core']) { try { return createRequire(join(dir, 'x.js'))(join(dir, name)); } catch { /* next */ } }
  throw new Error('playwright not found: `npm i -g playwright` or set DEMO_VIDEO_PLAYWRIGHT to a folder that has node_modules/playwright-core');
}

async function launch(pw) {
  const args = ['--no-sandbox'];
  if (process.env.CHROMIUM) return pw.chromium.launch({ executablePath: process.env.CHROMIUM, args });
  try { return await pw.chromium.launch({ args }); } catch (first) {
    const cache = join(homedir(), '.cache/ms-playwright');
    const found = existsSync(cache) ? readdirSync(cache).filter((d) => /^chromium(_headless_shell)?-\d+$/.test(d)).sort().reverse() : [];
    for (const d of found) for (const rel of ['chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-headless-shell-linux64/chrome-headless-shell']) {
      const exe = join(cache, d, rel);
      if (existsSync(exe)) { try { return await pw.chromium.launch({ executablePath: exe, args }); } catch { /* next */ } }
    }
    throw first;
  }
}

const hasFfmpeg = () => spawnSync('ffmpeg', ['-version']).status === 0;
const run = (bin, args) => spawnSync(bin, args, { encoding: 'utf8' });
const toUrl = (s) => (/^[a-z][a-z0-9+.-]*:/i.test(s) ? s : pathToFileURL(resolve(s)).href);

async function waitUp(url, ms = 60000) {
  const t = Date.now();
  while (Date.now() - t < ms) { try { const r = await fetch(url); if (r.status < 500) return; } catch { /* not yet */ } await sleep(400); }
  throw new Error('the served page did not answer in 60 s');
}

export async function main(argv) {
  const o = parseArgs(argv);
  if (o.help || !argv.length) { console.log(HELP); return 0; }
  const fast = !!o.fast;
  // --- the steps ---
  let meta, rawSteps, vp;
  if (o.scenario) {
    const sc = JSON.parse(readFileSync(o.scenario, 'utf8'));
    ({ meta, steps: rawSteps } = fromScenario(sc, { flowId: o.flow, viewport: o.viewport }));
    vp = meta.viewport;
  } else {
    if (!o.steps) throw new UsageError('give --steps FILE (or --scenario FILE --flow ID); --help lists the options');
    vp = parseViewport(o.viewport ?? 'phone');
    ({ meta, steps: rawSteps } = loadStepsFile(o.steps, vp));
    if (!o.viewport && meta.viewport) vp = parseViewport(meta.viewport);
  }
  const lang = o.lang ?? meta.lang ?? 'en';
  const steps = rawSteps.map((s, i) => normalizeStep(s, i, vp));
  for (const s of steps) s.caption = s.caption ?? autoCaption(s, vp, lang);
  const mask = [...DEFAULT_MASK, ...(o.mask ? o.mask.split(',').map((x) => x.trim()) : []), ...(meta.mask ?? [])];
  // --- the page and the session (the cookie value lives in memory only) ---
  let url = o.url ?? meta.url ?? process.env.LIVE_APP_URL;
  if (!url) throw new UsageError('no page: give --url, a "url" in the steps file, or run inside live-session.mjs');
  url = toUrl(url);
  if (meta.query && url.startsWith('file:')) url += (url.includes('?') ? '&' : '?') + meta.query;
  const sessionEnv = o['session-env'] ?? (process.env.LIVE_APP === 'expert-comptable' ? 'COMPTA_SESSION' : process.env.LIVE_APP === 'coach-max' ? 'COACH_SESSION' : null);
  const sessionValue = sessionEnv ? process.env[sessionEnv] : undefined;
  if (o['session-env'] && !sessionValue) throw new UsageError(`the environment variable ${sessionEnv} is empty`);
  const secrets = [sessionValue].filter(Boolean);
  const safe = (e) => safeError(e, secrets);
  const reason0 = urlSecret(url);
  if (reason0) throw new SecretRefusal(`refused: ${reason0}`);
  const base = bare(url);
  const origin = new URL(url).origin;
  const childFrame = o['child-frame'] ?? meta.childFrame ?? null;
  const out = resolve(o.out ?? 'demo-video-out');
  const tmp = mkdtempSync(join(tmpdir(), 'demo-video-'));
  let server = null, browser = null, context = null;
  const cleanup = async () => {
    try { await context?.close(); } catch { /* closed */ }
    try { await browser?.close(); } catch { /* closed */ }
    if (server) { try { process.kill(-server.pid, 'SIGTERM'); } catch { /* gone */ } }
    rmSync(tmp, { recursive: true, force: true });
  };
  try {
    if (o.serve) { server = spawn('bash', ['-c', o.serve], { detached: true, stdio: 'ignore' }); await waitUp(url); }
    const pw = findPlaywright();
    browser = await launch(pw);
    const phone = vp.touch;
    const k = phone ? 2 : 1;
    context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: k, isMobile: phone, hasTouch: phone,
      locale: lang === 'fr' ? 'fr-FR' : 'en-US',
      ...(fast ? {} : { recordVideo: { dir: tmp, size: { width: vp.width * k, height: vp.height * k } } }),
    });
    await context.addInitScript({ content: overlayScript({ mask, phone, deviceFrame: o['device-frame'], ui: !fast }) });
    if (sessionValue) await context.addCookies([{ name: o['cookie-name'] ?? '__Host-app_session', value: sessionValue, url: origin }]);
    const tVideo = Date.now();
    const page = await context.newPage();
    page.setDefaultTimeout(5000);
    // console errors, attributed to the step in progress
    let current = -1;
    const errors = new Map();
    const noteError = (text) => { const list = errors.get(current) ?? errors.set(current, []).get(current); const t = redact(text, secrets).slice(0, 200); if (!list.includes(t)) list.push(t); };
    page.on('console', (m) => { if (m.type() === 'error') noteError(m.text()); });
    page.on('pageerror', (e) => noteError(String(e.message ?? e).split('\n')[0]));
    let cdpSession = null;
    const ctx = {
      page, vp, touch: phone, fast, timeout: 5000, baseOrigin: origin,
      cdp: async () => (cdpSession ??= await context.newCDPSession(page)),
      root: async () => {
        if (!childFrame) return page;
        const h = await page.locator(childFrame).first().elementHandle({ timeout: 8000 }).catch(() => null);
        const f = await h?.contentFrame();
        if (!f) throw new Error('the child frame was not found');
        return f;
      },
    };
    const scan = async () => {
      const found = new Set();
      for (const f of page.frames()) {
        const why = urlSecret(f.url()); if (why) found.add(why);
        try { for (const kind of await f.evaluate(scanScript({ mask, sessionValue }))) found.add(kind); } catch { /* frame gone */ }
      }
      if (found.size) throw new SecretRefusal(`refused: the page shows ${[...found].join(', ')}. Record with the fictional test user and invented data only`);
    };
    try { await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); } catch (e) { throw new Error(`could not open the page ${base}: ${safe(e).replace(/page\.goto: /, '').slice(0, 120)}`); }
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
    const ready = o.ready ?? meta.ready;
    if (ready) await (await ctx.root()).waitForSelector(ready, { timeout: 15000 }).catch(() => { throw new Error('the page never showed the --ready selector'); });
    await scan();
    const date = new Date().toISOString().slice(0, 10);
    const host = (() => { try { const u = new URL(url); return u.protocol === 'file:' ? 'local page' : u.host; } catch { return ''; } })();
    const title = o.title ?? meta.title ?? host;
    const appLine = [o.app ?? meta.app ?? host, o.version ?? meta.version].filter(Boolean).join(' · ');
    const dv = (fn, ...a) => (fast ? null : page.evaluate(([f, x]) => window.__dv?.[f]?.(...x), [fn, a]).catch(() => null));
    let trimAt = 0;
    if (!fast && !o['no-cards']) {
      await dv('card', { title, sub: appLine, date, tone: '' }, true);
      trimAt = Date.now() - tVideo + 150;
      await sleep(Math.min(3200, 1700 + title.length * 25));
      await dv('card', null);
      await sleep(350);
    } else if (!fast) trimAt = Date.now() - tVideo + 50;
    // --- the steps ---
    const results = [], shots = [], ends = [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      current = i;
      ctx.timeout = step.timeout ?? 5000;
      const caption = step.caption;
      const shownAt = Date.now();
      if (!fast) { await dv('caption', caption); await sleep(step.do === 'caption' ? 0 : 450); }
      const t0 = Date.now();
      let ok = true, reason = null, expectOk = null;
      let retried = false;
      const attempt = async () => { try { await perform(ctx, step); return null; } catch (e) { return e; } };
      let failure = await attempt();
      if (failure && !['type', 'press', 'goto'].includes(step.do) && !(failure instanceof SecretRefusal)) { retried = true; await sleep(700); failure = await attempt(); } // a page still hydrating: one more try, noted in steps.json
      try { if (failure) throw failure; } catch (e) { ok = false; reason = `${describe(step, vp)}: ${safe(e).replace(/^\w+\.\w+: /, '').slice(0, 140)}`; }
      if (ok && step.until) {
        try { await (await ctx.root()).waitForFunction(conditionJs(step.until, vp), null, { timeout: step.timeout ?? 5000, polling: 100 }); expectOk = true; }
        catch { expectOk = false; ok = false; reason = `expected ${step.until} (not true after ${(step.timeout ?? 5000) / 1000}s)`; }
      }
      const took = Date.now() - t0;
      await scan();
      if (!fast) {
        const read = Math.max(1400, 55 * caption.length) - (Date.now() - shownAt);
        if (!ok) await dv('caption', caption, 'ko');
        await sleep(Math.max(step.pause ?? 900, read, ok ? 0 : 1500));
      }
      await dv('hideCaption', true);
      const png = await page.screenshot({ type: 'png' }).catch(() => null);
      await dv('hideCaption', false);
      shots.push({ n: i + 1, png, caption, ok, reason, ms: took });
      ends.push(Date.now() - tVideo);
      results.push({ n: i + 1, do: describe(step, vp), caption, ms: took, ok, retried: retried || undefined, reason, expect: step.expect ?? null, check: step.until ? { condition: step.until, ok: expectOk } : null, consoleErrors: errors.get(i) ?? [] });
    }
    // --- the verdict ---
    const strictConsole = !!o['strict-console'];
    let verdict = verdictOf(results, { lang, durationMs: fast ? results.reduce((n, r) => n + r.ms, 0) : Date.now() - tVideo - trimAt, strictConsole });
    if (!fast && !o['no-cards']) { await dv('card', { title: verdict.card.text, sub: verdict.card.sub, date, tone: verdict.card.tone }); await sleep(2600); }
    let webmPath = null;
    if (!fast) { const v = page.video(); await context.close(); context = null; webmPath = await v.path(); }
    // --- the files ---
    mkdirSync(out, { recursive: true });
    const files = {}, warnings = [];
    let seconds = NaN;
    if (webmPath) {
      const trim = (trimAt / 1000).toFixed(2);
      if (hasFfmpeg()) {
        const mp4 = join(tmp, 'demo.mp4'), webm = join(tmp, 'demo.webm');
        const a = run('ffmpeg', ['-y', '-v', 'error', '-ss', trim, '-i', webmPath, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '24', '-pix_fmt', 'yuv420p', '-r', '25', '-movflags', '+faststart', '-an', mp4]);
        const b = run('ffmpeg', ['-y', '-v', 'error', '-ss', trim, '-i', webmPath, '-c:v', 'libvpx', '-deadline', 'realtime', '-threads', '4', '-cpu-used', '8', '-b:v', '1200k', '-an', webm]);
        if (a.status === 0) { renameSync(mp4, join(out, 'demo.mp4')); files.mp4 = 'demo.mp4'; } else warnings.push('ffmpeg could not make the MP4 (no libx264?): only the WebM was written');
        if (b.status === 0) { renameSync(webm, join(out, 'demo.webm')); files.webm = 'demo.webm'; }
        const at = Math.max(0, (ends[0] - 150 - trimAt) / 1000).toFixed(2);
        const p = run('ffmpeg', ['-y', '-v', 'error', '-ss', at, '-i', join(out, files.mp4 ?? files.webm ?? 'none'), '-frames:v', '1', join(out, 'poster.png')]);
        if (p.status === 0) files.poster = 'poster.png';
      }
      if (!files.webm) { renameSync(webmPath, join(out, 'demo.webm')); files.webm = 'demo.webm'; warnings.push('ffmpeg is not installed: the untrimmed WebM is the only video'); }
      const probe = hasFfmpeg() ? run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(out, files.mp4 ?? files.webm)]) : null;
      seconds = probe ? parseFloat(probe.stdout) : NaN;
      if (seconds > 60) warnings.push(`the video lasts ${seconds.toFixed(0)} s: over 60 s, split it or cut steps (10 to 40 s is best)`);
      else if (seconds > 40) warnings.push(`the video lasts ${seconds.toFixed(0)} s: longer than the 10 to 40 s target`);
      if (!Number.isNaN(seconds)) verdict = verdictOf(results, { lang, durationMs: seconds * 1000, strictConsole });
    }
    files.strip = 'strip.png';
    writeFileSync(join(out, 'strip.png'), await renderStrip(browser, shots.filter((s) => s.png), { phone, title, verdictLine: verdict.line, ok: verdict.ok }));
    const doc = {
      schema: 'demo-video/1', title, app: o.app ?? meta.app ?? host, address: base, version: o.version ?? meta.version ?? null, date, mode: fast ? 'fast' : 'record',
      viewport: { width: vp.width, height: vp.height, touch: phone }, lang, session: sessionValue ? 'cookie from environment (not stored)' : 'none',
      durationMs: Number.isNaN(seconds) ? results.reduce((n, r) => n + r.ms, 0) : Math.round(seconds * 1000),
      verdict: { ok: verdict.ok, failedStep: verdict.failedStep, line: verdict.line },
      setupConsoleErrors: errors.get(-1) ?? [], steps: results, warnings, files,
    };
    let json = JSON.stringify(doc, null, 2);
    for (const s of secrets) json = json.split(s).join('<session>');
    writeFileSync(join(out, 'steps.json'), json);
    writeFileSync(join(out, 'verdict.txt'), verdict.line + '\n');
    for (const w of warnings) console.error(`warning: ${w}`);
    console.log(verdict.line);
    console.log(`written to ${out}: ${Object.values(files).concat(['steps.json', 'verdict.txt']).join(' ')}`);
    await cleanup();
    return verdict.ok ? 0 : 1;
  } catch (e) {
    await cleanup();
    if (e instanceof SecretRefusal) { console.error(safe(e)); return 3; }
    throw e;
  }
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) { // also when run through the skills symlink
  main(process.argv.slice(2)).then((code) => process.exit(code), (e) => {
    const m = safeError(e);
    console.error(e instanceof UsageError ? `usage: ${m}` : e instanceof SecretRefusal ? m : `error: ${m}`);
    process.exit(e instanceof UsageError ? 2 : e instanceof SecretRefusal ? 3 : 4);
  });
}
