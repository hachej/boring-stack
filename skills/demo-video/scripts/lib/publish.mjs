// Publish a recording folder to the private R2 archive bucket and hand out a time-limited link.
// Secrets (the Cloudflare token, the derived S3 key) live in memory for one call: never printed, never written to a file.
import { createHash, createHmac } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

export const BUCKET = 'boring-backups';
export const ACCOUNT = 'dc4425210d37b6b16e7882b919b8b7fc';
export const LINK_SECONDS = 7 * 24 * 3600;
const API = 'https://api.cloudflare.com/client/v4';

/** What goes up, under what object name, with which headers (inline + a range-capable type, so a phone plays and seeks). */
export const FILES = {
  mp4: { name: 'demo.mp4', type: 'video/mp4' },
  webm: { name: 'demo.webm', type: 'video/webm' },
  poster: { name: 'poster.png', type: 'image/png' },
  strip: { name: 'strip.png', type: 'image/png' },
  steps: { name: 'steps.json', type: 'application/json' },
  evidence: { name: 'evidence.json', type: 'application/json' },
};

export const slug = (s) => String(s ?? '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'demo';

/** evidence/<app>/<D-n or date>/<title slug>/ and the key of every file; a re-run of the same title overwrites (the latest take wins). */
export function objectKeys({ app, task, date, title }) {
  const prefix = `evidence/${slug(app)}/${task ? String(task).toUpperCase() : date}/${slug(title)}/`;
  return { prefix, keys: Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, prefix + f.name])) };
}

export const putHeaders = (file) => ({ 'content-type': file.type, 'content-disposition': 'inline', 'cache-control': 'private, max-age=3600' });

const hmac = (key, s) => createHmac('sha256', key).update(s).digest();
const enc = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());

/** AWS Signature V4 query-string signing of a GET (R2 speaks it with region "auto"). Returns the full URL. */
export function presign({ host, path, accessKeyId, secret, region = 'auto', expires = LINK_SECONDS, now = new Date() }) {
  const stamp = now.toISOString().replace(/[-:]|\.\d{3}/g, '');
  const day = stamp.slice(0, 8);
  const scope = `${day}/${region}/s3/aws4_request`;
  const q = { 'X-Amz-Algorithm': 'AWS4-HMAC-SHA256', 'X-Amz-Credential': `${accessKeyId}/${scope}`, 'X-Amz-Date': stamp, 'X-Amz-Expires': String(expires), 'X-Amz-SignedHeaders': 'host' };
  const query = Object.keys(q).sort().map((k) => `${enc(k)}=${enc(q[k])}`).join('&');
  const canonPath = path.split('/').map(enc).join('/');
  const canonical = ['GET', canonPath, query, `host:${host}\n`, 'host', 'UNSIGNED-PAYLOAD'].join('\n');
  const toSign = ['AWS4-HMAC-SHA256', stamp, scope, createHash('sha256').update(canonical).digest('hex')].join('\n');
  const signingKey = hmac(hmac(hmac(hmac('AWS4' + secret, day), region), 's3'), 'aws4_request');
  const signature = createHmac('sha256', signingKey).update(toSign).digest('hex');
  return `https://${host}${canonPath}?${query}&X-Amz-Signature=${signature}`;
}

export const signedLink = (key, creds, opts = {}) => presign({ host: `${ACCOUNT}.r2.cloudflarestorage.com`, path: `/${BUCKET}/${key}`, ...creds, ...opts });

// --- credentials: read at the moment of use --------------------------------------------------------------------------
export class PublishError extends Error {}

// A child process never inherits the live-session cookie the recorder was started with.
const childEnv = (extra = {}) => ({ ...Object.fromEntries(Object.entries(process.env).filter(([k]) => !/_SESSION$|^LIVE_SESSION_FILE$/.test(k))), ...extra });

function cloudflareToken() {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  const r = spawnSync('vault', ['kv', 'get', '-mount=secret', '-field=deploy_token', 'agent/services/cloudflare'], { encoding: 'utf8', env: childEnv({ VAULT_ADDR: process.env.VAULT_ADDR ?? 'http://127.0.0.1:8200' }) });
  if (r.status !== 0 || !r.stdout.trim()) throw new PublishError('the Cloudflare credential is not reachable (Vault: agent/services/cloudflare)');
  return r.stdout.trim();
}

/** R2's S3 key pair derived from the same Cloudflare token the archive uses: key id = the token's id, secret = sha256(token). No new token. */
export async function loadCredentials() {
  const token = cloudflareToken();
  let id;
  try {
    const res = await fetch(`${API}/user/tokens/verify`, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
    id = (await res.json())?.result?.id;
  } catch { throw new PublishError('Cloudflare is not reachable'); }
  if (!id) throw new PublishError('the Cloudflare token was not accepted');
  return { token, accessKeyId: id, secret: createHash('sha256').update(token).digest('hex') };
}

function wranglerBin() {
  for (const dir of [...(process.env.PATH ?? '').split(':'), join(homedir(), '.bun/bin')]) { const f = join(dir, 'wrangler'); if (dir && existsSync(f)) return f; }
  throw new PublishError('wrangler is not installed (the archive tool of docs/archive/ARCHIVE.md)');
}

/** One object up, with its headers, through the archive's documented tool. */
export function uploadObject(file, key, headers, { token }) {
  const r = spawnSync(wranglerBin(), ['r2', 'object', 'put', `${BUCKET}/${key}`, '--file', file, '--content-type', headers['content-type'], '--content-disposition', headers['content-disposition'], '--cache-control', headers['cache-control'], '--remote'],
    { encoding: 'utf8', env: childEnv({ CLOUDFLARE_API_TOKEN: token, CLOUDFLARE_ACCOUNT_ID: ACCOUNT }), timeout: 180000 });
  if (r.status !== 0) throw new PublishError(`the upload of ${basename(file)} failed (wrangler exit ${r.status})`);
}

// --- what is written beside the recording -----------------------------------------------------------------------------
export function buildEvidence(doc, { keys, app }) {
  const objects = { mp4: null, webm: null, poster: null, strip: null, steps: null };
  for (const k of Object.keys(objects)) if (doc.files?.[k] || k === 'steps') objects[k] = keys[k];
  return {
    kind: 'demo-video', schema: 'demo-video-evidence/1', title: doc.title, verdict: doc.verdict?.ok ? 'pass' : 'fail', verdictLine: doc.verdict?.line,
    durationMs: doc.durationMs, viewport: doc.viewport, app, commit: doc.version ?? null, createdAt: new Date().toISOString(), objects,
  };
}

const WORDS = {
  fr: { pass: 'Fonctionne', fail: 'Ne fonctionne pas', head: 'Vidéo de démonstration', watch: 'Regarder', strip: 'Les étapes en images', valid: (d) => `Les liens valent 7 jours (jusqu'au ${d}). Un lien frais : `, s: 'étapes', phone: 'téléphone', desktop: 'ordinateur' },
  en: { pass: 'Works', fail: 'Does not work', head: 'Demo video', watch: 'Watch', strip: 'Steps as pictures', valid: (d) => `Links last 7 days (until ${d}). A fresh link: `, s: 'steps', phone: 'phone', desktop: 'desktop' },
};

/** The task comment. `links` null gives the signature-free form that is written to a file when the comment is refused. */
export function commentText(doc, { prefix, links, now = new Date() }) {
  const w = WORDS[doc.lang] ?? WORDS.en;
  const ok = doc.verdict?.ok;
  const total = doc.steps?.length ?? 0;
  const done = doc.steps?.filter((s) => s.ok).length ?? 0;
  const secs = Math.round((doc.durationMs ?? 0) / 1000);
  const until = new Date(now.getTime() + LINK_SECONDS * 1000).toISOString().slice(0, 10);
  const head = `${w.head} : ${ok ? w.pass : w.fail}. ${done}/${total} ${w.s}, ${secs} s, ${doc.viewport?.touch ? w.phone : w.desktop}.`;
  const refresh = `node ~/.agents/skills/demo-video/scripts/link.mjs ${prefix}`;
  return [head, `« ${doc.title} »`, `${w.watch} : ${links ? links.watch : `(link: ${refresh})`}`, `${w.strip} : ${links ? links.strip : `(link: ${refresh}strip.png)`}`, `${w.valid(until)}${refresh}`, `evidence: ${prefix}`].join('\n');
}

const refused = (r) => (r.stdout + r.stderr).replace(/\s+/g, ' ').trim().slice(0, 160);

/** Comment on the task, attach the strip and steps.json. Each step may be refused (a shipped task is immutable); none stops the others. */
export function postToTask({ app, number, text, folder, run }) {
  const out = { commented: false, attached: [], problems: [] };
  const c = run(['task', 'comment', app, number, '--text', text]);
  if (c.status === 0) out.commented = true; else out.problems.push(`comment refused: ${refused(c)}`);
  for (const f of ['strip.png', 'steps.json']) {
    const a = run(['task', 'attach', app, number, join(folder, f)]);
    if (a.status === 0) out.attached.push(f); else out.problems.push(`${f} not attached: ${refused(a)}`);
  }
  return out;
}

export const runBoring = (args) => spawnSync('boring', args, { encoding: 'utf8', timeout: 60000, env: childEnv() });

const range0 = async (url) => {
  try { const r = await fetch(url, { headers: { range: 'bytes=0-0' }, signal: AbortSignal.timeout(20000) }); return { status: r.status, type: r.headers.get('content-type') }; } catch { return { status: 0, type: null }; }
};

/** Upload the folder, write evidence.json (keys only), post to the task if asked. Returns what the caller prints. `deps` are replaced in tests. */
export async function publishFolder(folder, { app, task, post = true, deps = {} } = {}) {
  const dir = resolve(folder);
  const stepsFile = join(dir, 'steps.json');
  if (!existsSync(stepsFile)) throw new PublishError(`${dir} has no steps.json: it is not a recording folder`);
  const doc = JSON.parse(readFileSync(stepsFile, 'utf8'));
  const appKey = slug(app ?? doc.app);
  const { prefix, keys } = objectKeys({ app: appKey, task: task?.number, date: doc.date, title: doc.title });
  const evidence = buildEvidence(doc, { keys, app: appKey });
  writeFileSync(join(dir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
  const creds = await (deps.loadCredentials ?? loadCredentials)();
  const up = deps.uploadObject ?? uploadObject;
  for (const [k, f] of Object.entries(FILES)) {
    const file = join(dir, f.name);
    if (existsSync(file) && statSync(file).size > 0) up(file, keys[k], putHeaders(f), creds);
  }
  const sign = deps.signedLink ?? signedLink;
  const main = keys.mp4 && existsSync(join(dir, FILES.mp4.name)) ? keys.mp4 : keys.webm;
  const links = { watch: sign(main, creds), strip: sign(keys.strip, creds) };
  const probe = await (deps.range0 ?? range0)(links.watch);
  const result = { prefix, keys, links, evidence, playable: probe.status === 206 || probe.status === 200, probe, comment: null };
  if (task && post) {
    const text = commentText({ ...doc, lang: doc.lang }, { prefix, links });
    const posted = postToTask({ app: task.app, number: task.number, text, folder: dir, run: deps.runBoring ?? runBoring });
    result.comment = posted;
    if (!posted.commented) {
      const file = join(dir, 'task-comment.txt');
      writeFileSync(file, commentText(doc, { prefix, links: null }) + '\n');
      result.fallbackFile = file;
    }
  }
  return result;
}

/** A fresh link for a key or for a recording folder (its evidence.json names the keys). */
export async function linkFor(target, { which = 'mp4', deps = {} } = {}) {
  let key = target;
  if (existsSync(target) && statSync(target).isDirectory()) {
    const ev = JSON.parse(readFileSync(join(target, 'evidence.json'), 'utf8'));
    key = ev.objects[which] ?? ev.objects.webm;
  } else if (target.endsWith('/')) key = target + FILES[which].name;
  if (!/^evidence\/[a-z0-9-]+\/[A-Za-z0-9-]+\/[a-z0-9-]+\/[A-Za-z0-9._-]+$/.test(key)) throw new PublishError('give an object key such as evidence/<app>/<D-n or date>/<slug>/demo.mp4, a prefix ending in /, or a recording folder');
  const creds = await (deps.loadCredentials ?? loadCredentials)();
  return { key, url: (deps.signedLink ?? signedLink)(key, creds) };
}
