// The gestures, played the way a person would (visible pointer, touch dot, typing at human speed).
// The vocabulary is the kit harness's (ux/runner/gestures.mjs): tap click type press focus hold release scroll drag swipe drop attach wait fixture,
// plus hover, goto and caption. A target is a test id or CSS selector, or text / choice / role+name / label / placeholder.
import { cssOf, keyName, pick } from './steps.mjs';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FILES = { 'facture-delorme-0112.pdf': 'application/pdf', 'releve-fevrier.pdf': 'application/pdf', 'ecarts-janvier.csv': 'text/csv' };

export function locate(root, step, vp, { forType = false } = {}) {
  const t = pick(step.target, vp);
  const visible = (l) => l.filter({ visible: true }).first(); // the first one a person could see, not a hidden twin earlier in the page
  if (step.role) return visible(root.getByRole(step.role, step.name ? { name: step.name } : {}));
  if (step.label) return visible(root.getByLabel(step.label));
  if (step.placeholder) return visible(root.getByPlaceholder(step.placeholder));
  if (step.testid) return visible(root.getByTestId(step.testid));
  if (!forType && step.text) return visible(root.getByText(pick(step.text, vp), { exact: false }));
  if (step.choice) return visible(root.locator('[data-choice]', { hasText: pick(step.choice, vp) }));
  if (t) return visible(root.locator(cssOf(t)));
  return null;
}

/** c: { page, root(), vp, touch, fast, cdp(), timeout, baseOrigin } */
export async function perform(c, step) {
  const { page, vp, fast } = c;
  const dv = (fn, ...args) => (fast ? null : page.evaluate(([f, a]) => window.__dv?.[f]?.(...a), [fn, args]).catch(() => null));
  const targetBox = async (l) => {
    await l.waitFor({ state: 'visible', timeout: c.timeout });
    await bringIntoView(l);
    const b = await l.boundingBox();
    if (!b) throw new Error('the target has no size on screen');
    return { l, x: b.x + b.width / 2, y: b.y + b.height / 2 };
  };
  // A target outside the screen is scrolled to the middle smoothly (and waited for), never jumped to.
  const bringIntoView = async (l) => {
    if (fast) return l.scrollIntoViewIfNeeded({ timeout: c.timeout });
    const inView = () => l.evaluate((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; }).catch(() => true);
    if (await inView()) return;
    await l.evaluate((e) => e.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' }));
    let last = null;
    for (let i = 0; i < 20; i++) { await sleep(100); const top = await l.evaluate((e) => Math.round(e.getBoundingClientRect().top)).catch(() => null); if (top === last) break; last = top; }
  };
  const glide = async (x, y) => {
    if (fast || c.touch) return;
    await dv('move', x, y);
    await page.mouse.move(x, y, { steps: 8 });
    await sleep(300);
  };
  const press = async (x, y) => { // the visible part of a tap or click
    if (c.touch) await dv('tap', x, y); else await dv('click', x, y);
    if (!fast) await sleep(110);
  };
  const root = await c.root();
  switch (step.do) {
    case 'tap': case 'click': {
      const { l, x, y } = await targetBox(locate(root, step, vp));
      await glide(x, y); await press(x, y);
      await (c.touch ? l.tap({ timeout: c.timeout }) : l.click({ timeout: c.timeout }));
      return;
    }
    case 'hover': { const { x, y } = await targetBox(locate(root, step, vp)); await glide(x, y); await page.mouse.move(x, y); return; }
    case 'select': { // a native <select>: the pointer goes to it, the choice is made
      const { l, x, y } = await targetBox(locate(root, step, vp));
      await glide(x, y); await press(x, y);
      await l.selectOption(pick(step.option, vp), { timeout: c.timeout });
      return;
    }
    case 'focus': { const { l } = await targetBox(locate(root, step, vp)); await l.focus(); return; }
    case 'type': {
      const l = locate(root, step, vp, { forType: true });
      if (l) { const { x, y } = await targetBox(l); await glide(x, y); await press(x, y); await (c.touch ? l.tap({ timeout: c.timeout }) : l.click({ timeout: c.timeout })); }
      const text = pick(step.text, vp);
      if (fast) await page.keyboard.insertText(text); else await page.keyboard.type(text, { delay: text.length > 60 ? 35 : 60 });
      return;
    }
    case 'press': {
      for (const k of String(pick(step.key, vp)).split(' ')) { await page.keyboard.press(keyName(k)); if (!fast) await sleep(180); }
      return;
    }
    case 'hold': {
      const { x, y } = await targetBox(locate(root, step, vp));
      if (c.touch) { await dv('touch', x, y, true); await (await c.cdp()).send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] }); }
      else { await glide(x, y); await page.mouse.down(); }
      return;
    }
    case 'release': {
      if (c.touch) { await (await c.cdp()).send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await dv('touch', 0, 0, false); } else await page.mouse.up();
      return;
    }
    case 'scroll': {
      const to = step.to ?? 0;
      const l = locate(root, step, vp);
      if (l) await l.evaluate((e, y) => e.scrollTo({ top: y, behavior: 'smooth' }), to); else await root.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), to);
      await sleep(fast ? 100 : 700);
      return;
    }
    case 'drag': {
      const a = await targetBox(locate(root, { target: step.from }, vp)), b = await targetBox(locate(root, { target: step.to }, vp));
      await glide(a.x, a.y); await page.mouse.down(); await dv('click', a.x, a.y);
      for (let i = 1; i <= 14; i++) { const x = a.x + ((b.x - a.x) * i) / 14, y = a.y + ((b.y - a.y) * i) / 14; await page.mouse.move(x, y); await dv('move', x, y); if (!fast) await sleep(24); }
      await page.mouse.up();
      return;
    }
    case 'swipe': {
      const { x, y } = await targetBox(locate(root, step, vp));
      const len = step.length ?? 220, d = { up: [0, -len], down: [0, len], left: [-len, 0], right: [len, 0] }[step.dir];
      if (!c.touch) { await glide(x, y); await page.mouse.down(); for (let i = 1; i <= 10; i++) { await page.mouse.move(x + (d[0] * i) / 10, y + (d[1] * i) / 10); await dv('move', x + (d[0] * i) / 10, y + (d[1] * i) / 10); if (!fast) await sleep(25); } await page.mouse.up(); return; }
      const cdp = await c.cdp();
      await dv('touch', x, y, true);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= 10; i++) { const px = x + (d[0] * i) / 10, py = y + (d[1] * i) / 10; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: px, y: py }] }); await dv('touch', px, py, true); if (!fast) await sleep(28); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await dv('touch', 0, 0, false);
      return;
    }
    case 'drop': {
      const sel = cssOf(pick(step.target, vp)), name = step.file;
      await root.evaluate(([sel, name, type]) => {
        const el = document.querySelector(sel); if (!el) throw new Error('drop target not found');
        const dt = new DataTransfer(); dt.items.add(new File(['x'], name, { type }));
        for (const kind of ['dragenter', 'dragover', 'drop']) el.dispatchEvent(new DragEvent(kind, { dataTransfer: dt, bubbles: true, cancelable: true }));
      }, [sel, name, FILES[name] ?? 'application/octet-stream']);
      return;
    }
    case 'attach': {
      const l = locate(root, step, vp);
      if (l) { const { x, y } = await targetBox(l); await glide(x, y); await press(x, y); await (c.touch ? l.tap({ timeout: c.timeout }) : l.click({ timeout: c.timeout })).catch(() => {}); }
      await root.locator('input[type=file]').first().setInputFiles({ name: step.file, mimeType: FILES[step.file] ?? 'application/octet-stream', buffer: Buffer.from('fictif') });
      return;
    }
    case 'wait': if (!fast) await sleep(step.ms ?? 500); return;
    case 'fixture': await root.evaluate(([n, a]) => window.__ux[n](a), [step.name, step.arg]); return;
    case 'goto': {
      const u = new URL(String(step.path), c.baseOrigin);
      if (u.origin !== new URL(c.baseOrigin).origin) throw new Error('goto stays on the same site');
      await page.goto(u.href, { waitUntil: 'domcontentloaded' });
      return;
    }
    case 'caption': return;
    default: throw new Error(`unknown gesture ${step.do}`);
  }
}
