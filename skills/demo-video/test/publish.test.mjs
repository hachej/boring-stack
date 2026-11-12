// Offline tests for publishing: the key scheme, the headers, the comment, "no secret in a written file", the fallbacks.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FILES, PublishError, buildEvidence, commentText, linkFor, objectKeys, presign, publishFolder, putHeaders, slug } from '../scripts/lib/publish.mjs';
import { parsePublishArgs } from '../scripts/publish.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const work = mkdtempSync(join(tmpdir(), 'demo-video-publish-'));
process.on('exit', () => rmSync(work, { recursive: true, force: true }));

const TOKEN = 'cf-token-SECRET-0123456789';
const SIGNATURE = 'SIGNATURE0123456789';
const DOC = {
  title: 'Expert-comptable : les fichiers', app: 'Expert-comptable', date: '2026-11-12', lang: 'fr', version: 'abc1234', durationMs: 21480,
  viewport: { width: 390, height: 844, touch: true }, verdict: { ok: true, failedStep: null, line: 'PASS 2/2 steps, 21.5s, 0 console errors' },
  steps: [{ n: 1, ok: true }, { n: 2, ok: true }], files: { mp4: 'demo.mp4', webm: 'demo.webm', poster: 'poster.png', strip: 'strip.png' },
};
function recording(doc = DOC) {
  const dir = mkdtempSync(join(work, 'rec-'));
  writeFileSync(join(dir, 'steps.json'), JSON.stringify(doc));
  for (const f of ['demo.mp4', 'demo.webm', 'poster.png', 'strip.png']) writeFileSync(join(dir, f), 'bytes');
  writeFileSync(join(dir, 'verdict.txt'), doc.verdict.line + '\n');
  return dir;
}
const fakeDeps = (over = {}) => {
  const puts = [];
  return {
    puts,
    loadCredentials: async () => ({ token: TOKEN, accessKeyId: 'kid', secret: 'sk' }),
    uploadObject: (file, key, headers) => puts.push({ file, key, headers }),
    signedLink: (key) => `https://r2.example/boring-backups/${key}?X-Amz-Signature=${SIGNATURE}`,
    range0: async () => ({ status: 206, type: 'video/mp4' }),
    runBoring: () => ({ status: 0, stdout: '{}', stderr: '' }),
    ...over,
  };
};
const writtenText = (dir) => readdirSync(dir).filter((f) => /\.(json|txt)$/.test(f)).map((f) => readFileSync(join(dir, f), 'utf8')).join('\n');

test('signing: the AWS documentation example gives its documented signature', () => {
  const url = presign({ host: 'examplebucket.s3.amazonaws.com', path: '/test.txt', accessKeyId: 'AKIAIOSFODNN7EXAMPLE', secret: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY', region: 'us-east-1', expires: 86400, now: new Date('2013-05-24T00:00:00Z') });
  assert.match(url, /X-Amz-Signature=aeeed9bbccd4d02ee5c0109b86d86835f995330da4c265957d157751f604d404$/);
});

test('keys: one predictable scheme, a task number or the date, never a space or an accent', () => {
  assert.equal(slug('Expert-comptable : retrouver une écriture'), 'expert-comptable-retrouver-une-ecriture');
  const t = objectKeys({ app: 'expert-comptable', task: 'd-2235', date: '2026-11-12', title: 'Les fichiers' });
  assert.equal(t.prefix, 'evidence/expert-comptable/D-2235/les-fichiers/');
  assert.equal(t.keys.mp4, 'evidence/expert-comptable/D-2235/les-fichiers/demo.mp4');
  assert.equal(objectKeys({ app: 'Coach Max', date: '2026-11-12', title: 'Midi' }).prefix, 'evidence/coach-max/2026-11-12/midi/');
  assert.deepEqual(Object.keys(t.keys), ['mp4', 'webm', 'poster', 'strip', 'steps', 'evidence']);
});

test('headers: video types and inline, so a phone plays and seeks', () => {
  assert.equal(putHeaders(FILES.mp4)['content-type'], 'video/mp4');
  assert.equal(putHeaders(FILES.webm)['content-type'], 'video/webm');
  assert.equal(putHeaders(FILES.strip)['content-type'], 'image/png');
  assert.equal(putHeaders(FILES.steps)['content-type'], 'application/json');
  for (const f of Object.values(FILES)) assert.equal(putHeaders(f)['content-disposition'], 'inline');
});

test('evidence.json carries object keys and no link', () => {
  const { keys } = objectKeys({ app: 'expert-comptable', date: DOC.date, title: DOC.title });
  const ev = buildEvidence(DOC, { keys, app: 'expert-comptable' });
  assert.equal(ev.kind, 'demo-video');
  assert.equal(ev.verdict, 'pass');
  assert.equal(ev.durationMs, 21480);
  assert.equal(ev.commit, 'abc1234');
  assert.deepEqual(Object.keys(ev.objects), ['mp4', 'webm', 'poster', 'strip', 'steps']);
  assert.ok(Object.values(ev.objects).every((k) => k.startsWith('evidence/expert-comptable/')));
  assert.doesNotMatch(JSON.stringify(ev), /https?:|Signature|Credential/);
});

test('comment: short, in the recording language, verdict + title + duration + two links', () => {
  const links = { watch: 'https://w.example/v', strip: 'https://w.example/s' };
  const text = commentText(DOC, { prefix: 'evidence/a/D-1/t/', links });
  assert.match(text, /^Vidéo de démonstration : Fonctionne\. 2\/2 étapes, 21 s, téléphone\./);
  assert.match(text, /« Expert-comptable : les fichiers »/);
  assert.match(text, /Regarder : https:\/\/w\.example\/v/);
  assert.match(text, /Les étapes en images : https:\/\/w\.example\/s/);
  assert.match(text, /Les liens valent 7 jours \(jusqu'au \d{4}-\d\d-\d\d\)/);
  assert.ok(text.split('\n').length <= 6);
  assert.match(commentText({ ...DOC, lang: 'en', verdict: { ok: false } }, { prefix: 'p/', links }), /^Demo video : Does not work\./);
});

test('publish: uploads every file with its headers and writes no secret to any file', async () => {
  const dir = recording();
  const deps = fakeDeps();
  const r = await publishFolder(dir, { app: 'expert-comptable', task: { app: 'expert-comptable', number: 'D-2235' }, deps });
  assert.equal(r.prefix, 'evidence/expert-comptable/D-2235/expert-comptable-les-fichiers/');
  const sent = Object.fromEntries(deps.puts.map((p) => [p.key.split('/').pop(), p.headers['content-type']]));
  assert.deepEqual(sent, { 'demo.mp4': 'video/mp4', 'demo.webm': 'video/webm', 'poster.png': 'image/png', 'strip.png': 'image/png', 'steps.json': 'application/json', 'evidence.json': 'application/json' });
  assert.ok(r.playable);
  const text = writtenText(dir);
  assert.ok(text.length > 100);
  for (const secret of [TOKEN, SIGNATURE, 'X-Amz-', 'sk']) if (secret.length > 3) assert.ok(!text.includes(secret), `a written file contains ${secret}`);
  assert.ok(existsSync(join(dir, 'evidence.json')));
});

test('publish: the comment carries the signed links, the files do not; strip and steps are attached', async () => {
  const dir = recording();
  const calls = [];
  const deps = fakeDeps({ runBoring: (args) => { calls.push(args); return { status: 0, stdout: '', stderr: '' }; } });
  const r = await publishFolder(dir, { task: { app: 'expert-comptable', number: 'D-2235' }, deps });
  assert.deepEqual(calls.map((c) => c.slice(0, 4)), [['task', 'comment', 'expert-comptable', 'D-2235'], ['task', 'attach', 'expert-comptable', 'D-2235'], ['task', 'attach', 'expert-comptable', 'D-2235']]);
  assert.match(calls[0][5], new RegExp(`X-Amz-Signature=${SIGNATURE}`));
  assert.deepEqual(r.comment.attached, ['strip.png', 'steps.json']);
  assert.ok(!existsSync(join(dir, 'task-comment.txt')), 'no fallback file when the comment was accepted');
});

test('publish: a refused comment (shipped task) never fails the run; the text goes to a file without the signature', async () => {
  const dir = recording();
  const deps = fakeDeps({ runBoring: () => ({ status: 1, stdout: '', stderr: 'A shipped task is immutable' }) });
  const r = await publishFolder(dir, { task: { app: 'expert-comptable', number: 'D-2235' }, deps });
  assert.equal(r.comment.commented, false);
  assert.match(r.comment.problems.join('\n'), /comment refused: A shipped task is immutable/);
  assert.equal(r.fallbackFile, join(dir, 'task-comment.txt'));
  const file = readFileSync(r.fallbackFile, 'utf8');
  assert.match(file, /Vidéo de démonstration : Fonctionne/);
  assert.match(file, /link\.mjs evidence\/expert-comptable\/D-2235\//);
  assert.doesNotMatch(file, /X-Amz-|https?:/);
  assert.ok(r.links.watch.includes(SIGNATURE), 'the caller still gets the link');
});

test('publish: unreachable credentials give one sentence and leave the recording alone', () => {
  const dir = recording();
  const r = spawnSync(process.execPath, [join(here, '../scripts/publish.mjs'), dir], { encoding: 'utf8', env: { PATH: dirname(process.execPath), HOME: work } });
  assert.equal(r.status, 5);
  assert.match(r.stderr, /^Not published: the Cloudflare credential is not reachable.*The recording is intact in .*publish it later with: node /s);
  assert.equal(r.stderr.trim().split('\n').length, 1);
  assert.ok(existsSync(join(dir, 'demo.mp4')));
});

test('publish: a folder that is not a recording is refused', async () => {
  await assert.rejects(publishFolder(mkdtempSync(join(work, 'empty-')), { deps: fakeDeps() }), PublishError);
});

test('link: from a folder (evidence.json), a prefix or a key; anything else is refused', async () => {
  const dir = recording();
  const deps = fakeDeps();
  await publishFolder(dir, { app: 'expert-comptable', deps });
  const a = await linkFor(dir, { which: 'strip', deps });
  assert.match(a.key, /^evidence\/expert-comptable\/2026-11-12\/.+\/strip\.png$/);
  assert.equal((await linkFor(a.key.replace('strip.png', ''), { deps })).key, a.key.replace('strip.png', 'demo.mp4'));
  await assert.rejects(linkFor('../../etc/passwd', { deps }), PublishError);
  await assert.rejects(linkFor('evidence/x/../../y/demo.mp4', { deps }), PublishError);
});

test('arguments: --task takes an app and a task number', () => {
  assert.deepEqual(parsePublishArgs(['f', '--task', 'expert-comptable', 'd-2235']).task, { app: 'expert-comptable', number: 'D-2235' });
  assert.throws(() => parsePublishArgs(['f', '--task', 'expert-comptable']), /--task needs/);
  assert.throws(() => parsePublishArgs([]), /recording folder/);
});
