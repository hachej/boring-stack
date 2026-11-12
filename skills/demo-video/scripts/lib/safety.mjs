// Privacy and safety: what looks like a secret, what is masked, what may be printed. No dependency.

export const DEFAULT_MASK = ['input[type=password]', '[data-private]'];

// A token-like string: one word of 32+ URL-safe characters with a letter and a digit (API keys, JWTs, session ids).
export const GENERIC_TOKEN = String.raw`^[A-Za-z0-9_\-.+/=~]{32,}$`;
// Shapes that are secrets whatever their length: provider key prefixes, a JWT, a private key, a bearer header.
export const STRONG_SECRET = String.raw`(sk-[A-Za-z0-9_-]{16,}|gh[pousr]_[A-Za-z0-9]{20,}|github_pat_\w{20,}|xox[abprs]-[\w-]{10,}|AKIA[0-9A-Z]{16}|eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|Bearer\s+[A-Za-z0-9._~+/-]{20,})`;
const SECRET_PARAM = /^(token|access_token|id_token|code|key|api_key|apikey|secret|sig|signature|session|sid|auth|password|jwt)$/i;

export const looksSecret = (value) => {
  const s = String(value ?? '').trim();
  if (!s) return false;
  if (new RegExp(STRONG_SECRET).test(s)) return true;
  return new RegExp(GENERIC_TOKEN).test(s) && /[A-Za-z]/.test(s) && /\d/.test(s);
};

/** Why a URL looks like it carries a secret, or null. Never returns the value. */
export function urlSecret(url) {
  let u;
  try { u = new URL(url); } catch { return null; }
  if (u.protocol === 'data:' || u.protocol === 'about:') return null;
  const parts = [...u.searchParams.entries(), ...new URLSearchParams(u.hash.replace(/^#/, '')).entries()];
  for (const [name, value] of parts) {
    if (looksSecret(value) || (SECRET_PARAM.test(name) && value.length >= 16)) return `the address carries a token-like value in "${name}"`;
  }
  if (u.username || u.password) return 'the address carries a user name or password';
  return null;
}

/** An address without its query string or fragment: the only form that may be printed or kept. */
export function bare(url) {
  try { const u = new URL(url); return u.protocol === 'file:' ? `file://…/${u.pathname.split('/').pop()}` : `${u.origin}${u.pathname}`; } catch { return '<address>'; }
}

/** One printable line from any text: no URL query, no secret value, no long token. */
export function redact(text, secrets = []) {
  let s = String(text ?? '');
  for (const v of secrets) if (v && v.length >= 6) s = s.split(v).join('<session>');
  s = s.replace(/\bhttps?:\/\/[^\s"')<>]+/g, (m) => bare(m));
  s = s.replace(/\bfile:\/\/\S+/g, 'file://…');
  s = s.replace(new RegExp(STRONG_SECRET, 'g'), '<redacted>');
  s = s.replace(/[A-Za-z0-9_\-.+/=~]{32,}/g, (m) => (/[A-Za-z]/.test(m) && /\d/.test(m) ? '<redacted>' : m));
  return s;
}

export const safeError = (error, secrets = []) => redact(String(error?.message ?? error).split('\n').slice(0, process.env.DEMO_VIDEO_DEBUG ? 12 : 1).join(' | '), secrets).slice(0, process.env.DEMO_VIDEO_DEBUG ? 1200 : 220);

export class SecretRefusal extends Error {}

/** The CSS that blurs everything the mask list matches (also in child frames: it is an init script). */
export const maskCss = (selectors) => selectors.filter(Boolean).map((s) => `${s}`).join(',') + ' { filter: blur(9px) !important; }';

/** Script run in a frame: what looks like a secret in visible inputs and text, as kinds only, never values. */
export const scanScript = ({ mask, sessionValue }) => `(() => {
  const mask = ${JSON.stringify(mask.join(','))}, generic = new RegExp(${JSON.stringify(GENERIC_TOKEN)}), strong = new RegExp(${JSON.stringify(STRONG_SECRET)}), session = ${JSON.stringify(sessionValue ?? '')};
  const masked = (el) => { try { return mask && el.closest(mask); } catch { return false; } };
  const shown = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const found = new Set();
  const test = (s, input) => {
    s = String(s || '');
    if (session && s.includes(session)) found.add('the session value');
    if (strong.test(s)) found.add('a key, token or private key shape');
    if (input) { const t = s.trim(); if (generic.test(t) && /[A-Za-z]/.test(t) && /\\d/.test(t)) found.add('a long token-like value in an input'); }
  };
  for (const el of document.querySelectorAll('input,textarea')) {
    if (el.type === 'hidden' || !shown(el) || masked(el)) continue;
    test(el.value, true);
  }
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const p = n.parentElement;
    if (!p || /^(SCRIPT|STYLE|NOSCRIPT)$/.test(p.tagName) || masked(p) || !shown(p)) continue;
    test(n.textContent, false);
  }
  return [...found];
})()`;
