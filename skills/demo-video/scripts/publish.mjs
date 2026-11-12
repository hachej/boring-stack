#!/usr/bin/env node
// demo-video: put a recording folder in the private archive bucket and print a link that plays on a phone.
// Usage: node publish.mjs <folder> [--app NAME] [--task <app> D-n]
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PublishError, publishFolder } from './lib/publish.mjs';

const HELP = `node publish.mjs <folder> [--app NAME] [--task <app> D-n [--no-post]]
  Uploads demo.mp4, demo.webm, poster.png, strip.png, steps.json and evidence.json to evidence/<app>/<D-n or date>/<slug>/ in the
  private bucket, prints a watch link valid 7 days (printed once, written nowhere), and with --task posts the comment and attaches the strip (--no-post: only files the objects under that task's key).
  Exit: 0 published, 2 usage, 5 not published (the recording is untouched; the sentence says what to do).`;

export function parsePublishArgs(argv) {
  const o = { folder: null, app: undefined, task: undefined, post: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--app') o.app = argv[++i];
    else if (a === '--task') { const app = argv[++i], number = argv[++i]; if (!app || !/^D-\d+$/i.test(number ?? '')) throw new Error('--task needs an app and a task number: --task expert-comptable D-2235'); o.task = { app, number: number.toUpperCase() }; }
    else if (a === '--no-post') o.post = false;
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
    else if (!o.folder) o.folder = a; else throw new Error(`unexpected argument "${a}"`);
  }
  if (!o.folder) throw new Error('give the recording folder');
  return o;
}

/** Prints what the caller needs; the signed links appear here and nowhere else. */
export function report(r) {
  console.log(`published ${r.prefix} (${Object.keys(r.keys).length} objects)`);
  console.log(`${r.playable ? 'plays' : 'NOT confirmed playable'}: range request gave ${r.probe.status} ${r.probe.type ?? ''}`.trim());
  console.log(`watch (7 days): ${r.links.watch}`);
  console.log(`strip (7 days): ${r.links.strip}`);
  if (r.comment) {
    console.log(r.comment.commented ? 'task: comment posted' : `task: the comment was refused, the same text is in ${r.fallbackFile} (without the signature)`);
    if (r.comment.attached.length) console.log(`task: attached ${r.comment.attached.join(', ')}`);
    for (const p of r.comment.problems) console.log(`task: ${p}`);
  }
}

export const unpublished = (folder, e) => `Not published: ${e.message}. The recording is intact in ${folder}; publish it later with: node ${fileURLToPath(import.meta.url)} ${folder}`;

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const argv = process.argv.slice(2);
  if (!argv.length || argv.includes('--help')) { console.log(HELP); process.exit(0); }
  let o;
  try { o = parsePublishArgs(argv); } catch (e) { console.error(`usage: ${e.message}`); process.exit(2); }
  publishFolder(o.folder, { app: o.app, task: o.task, post: o.post }).then(report, (e) => {
    if (e instanceof PublishError) { console.error(unpublished(o.folder, e)); process.exit(5); }
    console.error(`error: ${e.message}`); process.exit(4);
  });
}
