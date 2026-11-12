#!/usr/bin/env node
// demo-video: a fresh 7-day link for a recording already published. Usage: node link.mjs <key | prefix/ | folder> [mp4|webm|poster|strip|steps]
import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PublishError, linkFor } from './lib/publish.mjs';

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const [target, which = 'mp4'] = process.argv.slice(2);
  if (!target || target === '--help') { console.log('node link.mjs <evidence/<app>/<D-n or date>/<slug>/demo.mp4 | prefix ending in / | recording folder> [mp4|webm|poster|strip|steps]\nPrints one link valid 7 days: written nowhere else.'); process.exit(target ? 0 : 2); }
  linkFor(target, { which }).then((r) => console.log(r.url), (e) => { console.error(e instanceof PublishError ? `No link: ${e.message}` : `error: ${e.message}`); process.exit(e instanceof PublishError ? 5 : 4); });
}
