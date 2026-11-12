// The steps: a compact steps file, or one flow of the UI kit harness's scenario format (ux/scenarios/*.json).
// A step is { do, target|text|choice|role+name|label|placeholder, caption|say, expect, until, pause, timeout, ... }.
import { readFileSync } from 'node:fs';
import { looksSecret, SecretRefusal } from './safety.mjs';

export const VERBS = ['tap', 'click', 'hover', 'type', 'focus', 'press', 'hold', 'release', 'scroll', 'drag', 'swipe', 'drop', 'attach', 'wait', 'fixture', 'goto', 'caption', 'select'];
export const VIEWPORTS = {
  phone: { name: 'phone', width: 390, height: 844, touch: true },
  desktop: { name: 'desktop', width: 1440, height: 900, touch: false },
};

export class UsageError extends Error {}

export function parseViewport(spec = 'phone') {
  if (typeof spec === 'object' && spec) return { name: spec.name ?? `${spec.width}x${spec.height}`, width: spec.width, height: spec.height, touch: !!spec.touch };
  if (VIEWPORTS[spec]) return VIEWPORTS[spec];
  const m = /^(\d{2,5})x(\d{2,5})(:touch)?$/.exec(String(spec));
  if (!m) throw new UsageError(`viewport must be phone, desktop or WIDTHxHEIGHT[:touch] (got "${spec}")`);
  return { name: spec, width: +m[1], height: +m[2], touch: !!m[3] };
}

/** A value that may differ by viewport: { "390": "...", "1440": "...", "default": "..." }. */
export const pick = (value, vp) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value[vp.name] ?? value[String(vp.width)] ?? value[vp.touch ? 'phone' : 'desktop'] ?? value.default;
  return value;
};

const KEY_ALIASES = { 'échap': 'Escape', echap: 'Escape', esc: 'Escape', escape: 'Escape', entrée: 'Enter', entree: 'Enter', enter: 'Enter', retour: 'Backspace' };
export const keyName = (k) => KEY_ALIASES[String(k).toLowerCase()] ?? k;

const CONDITION = /^(visible|gone|focus|value|text|count|eval|see|nosee):/;
export const isCondition = (s) => typeof s === 'string' && s.split(' & ').every((p) => p === 'true' || CONDITION.test(p));

export function normalizeStep(raw, index, vp) {
  const fail = (m) => { throw new UsageError(`step ${index + 1}: ${m}`); };
  if (!raw || typeof raw !== 'object') fail('a step is an object');
  const step = { ...raw };
  if (!step.do) step.do = step.pause != null && !step.caption && !step.say ? 'wait' : 'caption';
  if (!VERBS.includes(step.do)) fail(`unknown gesture "${step.do}" (known: ${VERBS.join(', ')})`);
  if (step.do === 'wait' && step.pause != null && step.ms == null) step.ms = step.pause;
  step.caption = step.caption ?? step.say ?? null;
  if (step.caption && typeof step.caption === 'object') step.caption = pick(step.caption, vp);
  if (step.caption) step.caption = String(step.caption).replace(/(https?:\/\/[^\s?#]+)[?#]\S*/g, '$1');
  // `expect` is a sentence, or a checkable condition ("see:Midi", "visible:fixture-preview"); `until` is the condition to wait for.
  if (isCondition(step.expect) && !step.until) { step.until = step.expect; step.expect = null; }
  if (step.do === 'type') {
    const text = pick(step.text, vp);
    if (typeof text !== 'string' || !text) fail('type needs a "text"');
    if (looksSecret(text)) throw new SecretRefusal(`step ${index + 1}: the text to type looks like a secret; use invented words`);
  }
  const needsTarget = ['tap', 'click', 'hover', 'focus', 'hold', 'swipe', 'select'];
  if (step.do === 'select' && step.option == null) fail('select needs an "option" (a value or label)');
  if (needsTarget.includes(step.do) && !['target', 'text', 'choice', 'role', 'label', 'placeholder', 'testid'].some((k) => step[k] != null)) fail(`${step.do} needs a target, text, role+name, label or placeholder`);
  if (step.do === 'drag' && (!step.from || !step.to)) fail('drag needs from and to');
  if (step.do === 'press' && !step.key) fail('press needs a key');
  if (step.do === 'swipe' && !['up', 'down', 'left', 'right'].includes(step.dir)) fail('swipe needs dir: up, down, left or right');
  return step;
}

export function loadStepsFile(file, vp) {
  let doc;
  try { doc = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { throw new UsageError(`cannot read the steps file (${String(e.message).split('\n')[0]})`); }
  const steps = Array.isArray(doc) ? doc : doc.steps;
  if (!Array.isArray(steps) || !steps.length) throw new UsageError('the steps file has no "steps" list');
  return { meta: Array.isArray(doc) ? {} : doc, steps };
}

/** One flow of a harness scenario, as the compact steps. `file://` page and its query are made by the caller. */
export function fromScenario(scenario, { flowId, viewport }) {
  const flow = (scenario.flows ?? []).find((f) => f.id === flowId) ?? (flowId ? null : scenario.flows?.[0]);
  if (!flow) throw new UsageError(`flow "${flowId}" not found (flows: ${(scenario.flows ?? []).map((f) => f.id).join(', ') || 'none'})`);
  const vpDef = (scenario.viewports ?? []).find((v) => v.name === viewport || String(v.width) === String(viewport)) ?? scenario.viewports?.[0];
  const vp = vpDef ? parseViewport(vpDef) : parseViewport(viewport ?? 'phone');
  const query = ['demo=1', scenario.fixture?.query, pick(scenario.fixture?.queryBy, vp), flow.query, 'pace=real'].filter(Boolean).join('&');
  const steps = flow.steps.filter((s) => !(s.only && String(s.only) !== vp.name) && !(s.skip && String(s.skip) === vp.name));
  return { meta: { title: `${scenario.title} : ${flow.name}`, viewport: vp, query, lang: 'en', ready: scenario.fixture?.ready }, steps };
}

// --- conditions: the harness's `until` grammar, plus see: / nosee: (the page shows a text) ---
const css = (t) => (/^[\w-]+$/.test(t) ? `[data-testid=${t}]` : t.replace(/^([\w-]+)(\[.*)$/, '[data-testid=$1]$2'));
export const cssOf = css;

/** A JavaScript expression, true when the condition holds in the page or frame it runs in. */
export function conditionJs(text, vp) {
  const raw = String(pick(text, vp) ?? 'true');
  const shown = (sel) => `[...document.querySelectorAll(${JSON.stringify(sel)})].some(e => e.getClientRects().length > 0)`;
  const any = (list) => list.split('|').map((t) => `(${shown(css(t))})`).join(' || ');
  const flat = 'const flat = (s) => String(s ?? "").replace(/\\s+/g, " ").toLowerCase();';
  const parts = raw.split(' & ').map((part) => {
    const at = part.indexOf(':');
    const kind = part.slice(0, at), rest = part.slice(at + 1);
    if (part === 'true') return 'true';
    if (kind === 'visible') return `(${any(rest)})`;
    if (kind === 'gone') return `!(${any(rest)})`;
    if (kind === 'focus') return `!!document.activeElement?.matches(${JSON.stringify(css(rest))})`;
    if (kind === 'see') return `(() => { ${flat} return flat(document.body.innerText).includes(flat(${JSON.stringify(rest)})); })()`;
    if (kind === 'nosee') return `(() => { ${flat} return !flat(document.body.innerText).includes(flat(${JSON.stringify(rest)})); })()`;
    if (kind === 'value' || kind === 'text') {
      const [t, needle = ''] = rest.split('~');
      const el = t ? `document.querySelector(${JSON.stringify(css(t))})` : 'document.body';
      return `(() => { ${flat} return flat(${el}?.${kind === 'value' ? 'value' : 'innerText ?? ' + el + '?.textContent'}).includes(flat(${JSON.stringify(needle)})); })()`;
    }
    if (kind === 'count') { const m = /^(.*?)(>=|<=|==|=|>|<)(\d+)$/.exec(rest); if (!m) throw new UsageError(`bad count condition: ${part}`); return `document.querySelectorAll(${JSON.stringify(css(m[1]))}).length ${m[2] === '=' ? '==' : m[2]} ${Number(m[3])}`; }
    if (kind === 'eval') return `(${rest})`;
    throw new UsageError(`unknown condition: ${part} (known: visible, gone, focus, value, text, count, eval, see, nosee)`);
  });
  return parts.join(' && ');
}

export function describe(step, vp) {
  const t = pick(step.target, vp);
  const what = step.role ? `${step.role} "${step.name ?? ''}"` : step.label ? `label "${step.label}"` : step.placeholder ? `placeholder "${step.placeholder}"` : step.choice ? `choice "${pick(step.choice, vp)}"` : step.testid ? `test id ${step.testid}` : t ? `${t}` : step.do !== 'type' && step.text ? `text "${pick(step.text, vp)}"` : '';
  return `${step.do}${what ? ' ' + what : ''}`.trim();
}

const PHRASES = {
  fr: { tap: 'Appuyer sur', click: 'Cliquer sur', hover: 'Survoler', select: 'Choisir', type: 'Écrire', press: 'Touche', focus: 'Aller dans', hold: 'Maintenir', release: 'Relâcher', scroll: 'Défiler', drag: 'Glisser', swipe: 'Balayer', drop: 'Déposer un fichier', attach: 'Joindre un fichier', wait: 'Patienter', fixture: '', goto: 'Ouvrir la page' },
  en: { tap: 'Tap', click: 'Click', hover: 'Hover', select: 'Choose', type: 'Type', press: 'Press', focus: 'Focus', hold: 'Hold', release: 'Release', scroll: 'Scroll', drag: 'Drag', swipe: 'Swipe', drop: 'Drop a file', attach: 'Attach a file', wait: 'Wait', fixture: '', goto: 'Open the page' },
};
export function autoCaption(step, vp, lang = 'en') {
  const p = (PHRASES[lang] ?? PHRASES.en)[step.do] ?? step.do;
  const q = lang === 'fr' ? ['« ', ' »'] : ['"', '"'];
  const label = step.do === 'type' ? pick(step.text, vp) : step.do === 'press' ? keyName(pick(step.key, vp)) : step.name ?? pick(step.text, vp) ?? step.label ?? step.placeholder ?? pick(step.choice, vp) ?? (typeof pick(step.target, vp) === 'string' ? pick(step.target, vp) : '') ?? '';
  return label ? `${p} ${q[0]}${label}${q[1]}`.trim() : p;
}
