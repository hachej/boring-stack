// Offline tests for the demo-video recorder: node --test skills/demo-video/test
// The parser, the secret checks, the verdict and the masking need no network; the recorder runs in --fast on local pages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fromScenario, normalizeStep, parseViewport, conditionJs, UsageError } from '../scripts/lib/steps.mjs';
import { looksSecret, redact, urlSecret, bare, SecretRefusal } from '../scripts/lib/safety.mjs';
import { verdictOf } from '../scripts/lib/verdict.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const RECORD = join(here, '../scripts/record.mjs');
const PHONE = parseViewport('phone');
const work = mkdtempSync(join(tmpdir(), 'demo-video-test-'));
process.on('exit', () => rmSync(work, { recursive: true, force: true }));

const PAGE = `<!doctype html><meta charset=utf-8><link rel=icon href="data:,"><title>t</title>
<h1>Liste</h1><input id=item aria-label="Article"><button id=add>Ajouter</button><p id=count>0 article</p>
<select id=j aria-label="Journal"><option value="">Tous</option><option value="VE">VE</option></select><input type=password id=pw value="invente123"><div data-private id=priv>Jean Dupont fictif</div><div id=plain>visible</div>
<script>add.onclick=()=>{count.textContent='1 article'};addEventListener('keydown',e=>{if(e.key==='Escape')count.textContent='ferme'})</script>`;
const page = (name, html) => { const f = join(work, name); writeFileSync(f, html); return f; };
const steps = (name, doc) => { const f = join(work, name); writeFileSync(f, JSON.stringify(doc)); return f; };
const recAsync = (args, env = {}) => new Promise((resolve) => {
  const p = spawn('node', [RECORD, ...args], { env: { ...process.env, ...env } });
  let stdout = '', stderr = '';
  p.stdout.on('data', (d) => { stdout += d; });
  p.stderr.on('data', (d) => { stderr += d; });
  p.on('close', (status) => resolve({ status, stdout, stderr }));
});
const rec = (args, env = {}) => spawnSync('node', [RECORD, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

test('steps: the compact format and its aliases', () => {
  const s = normalizeStep({ do: 'tap', role: 'button', name: 'Ajouter', say: 'Ajouter', expect: 'see:1 article' }, 0, PHONE);
  assert.equal(s.caption, 'Ajouter');
  assert.equal(s.until, 'see:1 article', 'a checkable expect becomes the condition');
  assert.equal(s.expect, null);
  assert.equal(normalizeStep({ do: 'tap', target: 'x', expect: 'The list opens' }, 0, PHONE).until, undefined, 'a sentence stays a sentence');
  assert.equal(normalizeStep({ pause: 800 }, 0, PHONE).do, 'wait');
  assert.equal(normalizeStep({ caption: 'Bonjour' }, 0, PHONE).do, 'caption');
  assert.throws(() => normalizeStep({ do: 'dance' }, 0, PHONE), UsageError);
  assert.throws(() => normalizeStep({ do: 'tap' }, 2, PHONE), /step 3: tap needs a target/);
  assert.equal(normalizeStep({ caption: 'Voir https://x.example/a?token=abc' }, 0, PHONE).caption, 'Voir https://x.example/a', 'a caption never keeps a query string');
});

test('steps: a text that looks like a secret is refused before anything runs', () => {
  assert.throws(() => normalizeStep({ do: 'type', text: 'sk-ant-api03-AbCdEf0123456789abcdef' }, 0, PHONE), SecretRefusal);
  assert.throws(() => normalizeStep({ do: 'type', text: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8' }, 0, PHONE), SecretRefusal);
  assert.doesNotThrow(() => normalizeStep({ do: 'type', text: 'ce midi 150 g de riz et 120 g de poulet' }, 0, PHONE));
});

test('steps: one flow of a kit harness scenario plays as steps', () => {
  const sc = { title: 'Le champ', fixture: { query: 'tabs=1', queryBy: { 390: 'single=1' } }, viewports: [{ name: '390', width: 390, height: 844, touch: true }, { name: '1440', width: 1440, height: 900 }],
    flows: [{ id: 'F01', name: 'Écrire', query: 'x=1', steps: [{ do: 'tap', target: 'composer-input', say: 'Tap', until: 'focus:composer-input' }, { do: 'wait', ms: 100, only: '1440' }] }] };
  const f = fromScenario(sc, { flowId: 'F01', viewport: '390' });
  assert.equal(f.meta.query, 'demo=1&tabs=1&single=1&x=1&pace=real');
  assert.equal(f.meta.viewport.touch, true);
  assert.equal(f.steps.length, 1, 'a step for another viewport is left out');
  assert.throws(() => fromScenario(sc, { flowId: 'F9', viewport: '390' }), /flow "F9" not found/);
});

test('conditions: the harness grammar compiles, an unknown one is refused', () => {
  assert.match(conditionJs('visible:a|b & gone:c & count:item>=2 & value:field~x & text:~hello & see:Midi', PHONE), /querySelectorAll/);
  assert.throws(() => conditionJs('nonsense:x', PHONE), /unknown condition/);
});

test('safety: secret shapes, addresses, redaction', () => {
  assert.equal(looksSecret('ce midi 150 g de riz'), false);
  assert.equal(looksSecret('ghp_abcdefghijklmnopqrstuvwxyz0123456789'), true);
  assert.equal(looksSecret('eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghij'), true);
  assert.equal(looksSecret('A1b2C3d4E5f6G7h8I9j0K1l2M3n4O5p6Q7'), true);
  assert.equal(looksSecret('https://coach-max.boringbots.ai'), false);
  assert.ok(urlSecret('https://x.example/cb?code=abcdef0123456789abcdef'));
  assert.equal(urlSecret('https://x.example/ecritures?journal=VT'), null);
  assert.equal(bare('https://x.example/p?token=abcdef#frag'), 'https://x.example/p');
  const text = redact('GET https://x.example/a?sig=zzz failed with abcdefghijklmnopqrstuvwxyz0123456789ABCD and SESSIONVALUE-123', ['SESSIONVALUE-123']);
  assert.ok(!text.includes('sig=') && !text.includes('SESSIONVALUE') && !text.includes('abcdefghijklmnop'));
});

test('verdict: pass, the first failure named, console errors counted', () => {
  const ok = verdictOf([{ n: 1, caption: 'a', ok: true, consoleErrors: [] }, { n: 2, caption: 'b', ok: true, consoleErrors: ['boom'] }], { lang: 'fr', durationMs: 12300 });
  assert.equal(ok.ok, true);
  assert.equal(ok.card.text, 'Fonctionne');
  assert.match(ok.line, /^PASS 2\/2 steps, 12\.3s, 1 console error$/);
  const ko = verdictOf([{ n: 1, caption: 'a', ok: true }, { n: 2, caption: 'b', ok: false, reason: 'expected see:x' }, { n: 3, caption: 'c', ok: false, reason: 'later' }], { lang: 'fr' });
  assert.equal(ko.failedStep, 2);
  assert.equal(ko.card.text, 'Ne fonctionne pas : étape 2');
  assert.match(ko.line, /^FAIL step 2\/3 "b": expected see:x/);
  assert.equal(verdictOf([{ n: 1, caption: 'a', ok: true, consoleErrors: ['x'] }], { strictConsole: true }).ok, false);
});

test('recorder --fast: a passing run writes steps.json, the strip and the verdict', () => {
  const out = join(work, 'ok');
  const r = rec(['--fast', '--url', page('p.html', PAGE), '--out', out, '--steps', steps('ok.json', { lang: 'fr', steps: [
    { do: 'type', label: 'Article', text: 'du pain', caption: 'Écrire' },
    { do: 'tap', role: 'button', name: 'Ajouter', caption: 'Ajouter', expect: 'see:1 article' },
    { do: 'select', label: 'Journal', option: 'VE', caption: 'Filtrer', until: "eval:document.querySelector('#j').value === 'VE'" },
    { do: 'press', key: 'Échap', caption: 'Fermer', expect: 'text:#count~ferme' }] })]);
  assert.equal(r.status, 0, r.stderr);
  const doc = JSON.parse(readFileSync(join(out, 'steps.json'), 'utf8'));
  assert.equal(doc.verdict.ok, true);
  assert.equal(doc.steps.length, 4);
  assert.deepEqual(doc.steps.map((s) => s.check?.ok ?? null), [null, true, true, true]);
  assert.ok(existsSync(join(out, 'strip.png')) && existsSync(join(out, 'verdict.txt')));
  assert.ok(!existsSync(join(out, 'demo.mp4')), '--fast makes no video');
  assert.ok(!JSON.stringify(doc).includes('file:///'), 'no local address is kept');
});

test('recorder --fast: a failing expectation is recorded, the run goes on, the exit code says so', () => {
  const out = join(work, 'ko');
  const r = rec(['--fast', '--url', join(work, 'p.html'), '--out', out, '--steps', steps('ko.json', { steps: [
    { do: 'tap', role: 'button', name: 'Ajouter', expect: 'see:3 articles', timeout: 800 },
    { do: 'tap', text: 'Bouton absent', timeout: 800 },
    { do: 'tap', role: 'button', name: 'Ajouter', expect: 'see:1 article' }] })]);
  assert.equal(r.status, 1);
  const doc = JSON.parse(readFileSync(join(out, 'steps.json'), 'utf8'));
  assert.deepEqual(doc.steps.map((s) => s.ok), [false, false, true], 'it keeps going after a failure');
  assert.equal(doc.verdict.failedStep, 1);
  assert.match(doc.steps[0].reason, /expected see:3 articles/);
  assert.match(doc.steps[1].reason, /text "Bouton absent"/);
  assert.match(r.stdout, /^FAIL step 1\/3/);
});

test('masking: password inputs and data-private elements are blurred by default, and a custom selector too', () => {
  const out = join(work, 'mask');
  const r = rec(['--fast', '--url', join(work, 'p.html'), '--out', out, '--mask', '#plain', '--steps', steps('mask.json', { steps: [
    { do: 'wait', ms: 10, until: "eval:getComputedStyle(document.querySelector('#pw')).filter.includes('blur')", caption: 'password' },
    { do: 'wait', ms: 10, until: "eval:getComputedStyle(document.querySelector('#priv')).filter.includes('blur')" },
    { do: 'wait', ms: 10, until: "eval:getComputedStyle(document.querySelector('#plain')).filter.includes('blur')" }] })]);
  assert.equal(r.status, 0, r.stderr + r.stdout);
});

test('refusal: a visible input holding a token-like value stops the recording and writes nothing', () => {
  const out = join(work, 'secret');
  const leak = page('leak.html', '<!doctype html><link rel=icon href="data:,"><input aria-label="Clé" value="a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8"><button>ok</button>');
  const r = rec(['--fast', '--url', leak, '--out', out, '--steps', steps('s.json', { steps: [{ do: 'tap', role: 'button', name: 'ok' }] })]);
  assert.equal(r.status, 3);
  assert.match(r.stderr, /refused: the page shows a long token-like value in an input/);
  assert.ok(!r.stderr.includes('a1B2c3D4'), 'the value is never printed');
  assert.ok(!existsSync(out) || readdirSync(out).length === 0, 'no file is written');
  const masked = page('masked.html', '<!doctype html><link rel=icon href="data:,"><input type=password aria-label="Clé" value="a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8"><button>ok</button>');
  assert.equal(rec(['--fast', '--url', masked, '--out', join(work, 'masked'), '--steps', join(work, 's.json')]).status, 0, 'a masked field is blurred, so it is allowed');
  const url = rec(['--fast', '--url', `file://${leak}?token=a1B2c3D4e5F6g7H8i9J0k1L2m3N4o5P6q7R8`, '--out', out, '--steps', join(work, 's.json')]);
  assert.equal(url.status, 3);
  assert.ok(!url.stderr.includes('a1B2c3D4'));
});

test('session: the cookie reaches the app, never the files, and a page that shows it is refused', async () => {
  const value = 'SESSION-0123456789-abcdefghijklmnopqrstuvwxyz';
  const server = createServer((req, res) => {
    const ok = (req.headers.cookie ?? '').includes(`test_session=${value}`);
    const shown = req.url.startsWith('/leak') && ok ? `<p>cookie ${value}</p>` : '';
    res.setHeader('content-type', 'text/html; charset=utf-8');
    if (req.url.startsWith('/frame')) return res.end(`<!doctype html><button>Dans le cadre</button><p id=m>${ok ? 'connecté' : 'anonyme'}</p>`);
    res.end(`<!doctype html><link rel=icon href="data:,"><h1>${ok ? 'connecté' : 'anonyme'}</h1>${shown}<iframe src="/frame" title="app" style="width:300px;height:120px"></iframe>`);
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const env = { TEST_SESSION: value };
  try {
    const out = join(work, 'sess');
    const spec = steps('sess.json', { steps: [{ do: 'tap', text: 'Dans le cadre', until: 'see:connecté' }] });
    const r = await recAsync(['--fast', '--url', base, '--cookie-name', 'test_session', '--session-env', 'TEST_SESSION', '--child-frame', 'iframe', '--out', out, '--steps', spec], env);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    for (const f of readdirSync(out)) if (/\.(json|txt)$/.test(f)) assert.ok(!readFileSync(join(out, f), 'utf8').includes(value), `${f} holds no session value`);
    assert.ok(!r.stdout.includes(value) && !r.stderr.includes(value));
    const leak = await recAsync(['--fast', '--url', `${base}/leak`, '--cookie-name', 'test_session', '--session-env', 'TEST_SESSION', '--out', join(work, 'sess2'), '--steps', spec], env);
    assert.equal(leak.status, 3);
    assert.match(leak.stderr, /the session value/);
    assert.ok(!leak.stderr.includes(value));
  } finally { server.close(); }
});

test('errors never print an address with a query string', () => {
  const r = rec(['--fast', '--url', 'http://127.0.0.1:9/page?code=zzzz', '--out', join(work, 'down'), '--steps', join(work, 's.json')]);
  assert.equal(r.status, 4);
  assert.ok(!r.stderr.includes('code=zzzz'));
});
