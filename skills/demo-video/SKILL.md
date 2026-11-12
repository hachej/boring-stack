---
name: demo-video
description: "Record a short, watchable video of a web product doing something, to show it or to prove it works: captions, a visible pointer, a title card, an honest pass or fail verdict, a contact strip and a steps.json. Use when you shipped or built something a person can see (a fix on a live app at phone size, a UI-kit component, a feature) and must show or prove it, or when asked for a demo video."
---

# Demo video

A reviewer cannot see a gesture, a transition or a wait in a screenshot. This records the real page being driven, with the step in words at the bottom, and says honestly whether it worked. A failure stays in the video, in red.

Use it when you **shipped or built something a person can see and need to show or prove it** (10 to 40 seconds). Do not use it for static content, for a claim a test proves better (`verify-this`), for debugging a browser (`control-ui`), or for a faux product illustration (`stageshow`). **Never with real people's data**: only the fictional test user and invented data.

## The one command

```
node <skill>/scripts/record.mjs --steps flow.json --out /home/ubuntu/fleet/evidence/<app>/<task-or-date>/
```

`<skill>` is the folder of this skill (`~/.agents/skills/demo-video`). Needs Playwright with Chromium and `ffmpeg` (both on the dev VM; found by themselves). Add `--fast` to run only the checks (no pauses, no video; writes `steps.json`, `strip.png`, `verdict.txt`) as a gate. Exit code: 0 pass, 1 a step failed, 2 bad steps file, 3 refused (a secret-looking value), 4 environment.

It writes `demo.mp4` (H.264, plays on a phone, in GitHub and Slack), `demo.webm`, `poster.png`, `strip.png` (one frame per step, caption under it), `steps.json`, `verdict.txt`, and prints one line: `PASS 7/7 steps, 28.0s, 0 console errors` or `FAIL step 3/7 "caption": expected see:Midi (not true after 5s)`.

## The steps file (two minutes)

JSON: a few settings and a list of steps. Captions are in the language of the file (`"lang": "fr"` also gives the cards « Fonctionne » / « Ne fonctionne pas : étape N »).

```json
{ "title": "Coach Max : noter son déjeuner", "app": "Coach Max", "lang": "fr", "viewport": "phone",
  "steps": [
    { "do": "type", "testid": "composer-input", "text": "ce midi 150 g de riz", "caption": "J'écris ce que j'ai mangé" },
    { "do": "tap", "testid": "composer-submit", "caption": "J'envoie", "until": "nosee:Rien encore", "timeout": 90000 },
    { "caption": "Deux lignes dans Midi", "until": "see:Riz", "pause": 2000 },
    { "do": "tap", "role": "button", "name": "Modifier Riz", "caption": "Je touche la ligne", "until": "see:pour 100 g" } ] }
```

Desktop (`"viewport": "desktop"`; a native `<select>` uses `select`):

```json
{ "title": "Expert-comptable : retrouver une écriture", "lang": "fr", "viewport": "desktop",
  "steps": [
    { "do": "tap", "text": "Recette (fictif)", "caption": "J'ouvre le dossier", "until": "see:Écritures" },
    { "do": "select", "label": "Journal", "option": "VE", "caption": "Je filtre par journal", "until": "see:3 lignes" },
    { "do": "tap", "role": "button", "name": "Ouvrir écriture F26-001 · 706000", "caption": "Je clique une ligne", "until": "see:Lignes de l" },
    { "do": "press", "key": "Escape", "caption": "Échap ferme le panneau", "until": "nosee:Lignes de l", "pause": 1500 } ] }
```

Full files: `examples/phone-coach-max.json`, `examples/desktop-expert-comptable.json`, `examples/local-failure.json` (a deliberate red step). Every step: `do` + a target + `caption` + optional `until` (the check, waited up to `timeout` ms, default 5000) + `pause` (ms). Targets: `testid`, `target` (CSS), `role`+`name`, `label`, `placeholder`, `text`. A step with only a `caption` (and `until`/`pause`) shows a caption and checks. Gestures, check grammar and the rest: [reference.md](reference.md).

Write checks that prove the claim (`until`), not just that a button was pressed. A step with no check only fails if its target is missing.

## Options worth knowing

`--url` (page, file or path; default: the file's `url`, then `$LIVE_APP_URL`), `--viewport phone|desktop|WxH[:touch]`, `--child-frame <css>` (app inside an iframe), `--version <commit>` (title card: pass `"$(git rev-parse --short HEAD)"` of the thing shown), `--mask <css,css>`, `--serve "<cmd>"` (start a local server, stopped at the end), `--ready <css>`, `--strict-console` (a console error fails the step), `--device-frame`. `--help` lists all.

## The two live apps (signed in, fictional user)

Do not sign in yourself: the shared helper hands the session to the command, in its environment only (never in argv or a file):

```
cd /home/ubuntu/projects/boring-factory
node evals/e2e/live-session.mjs coach-max        -- node <skill>/scripts/record.mjs --steps flow.json --out DIR   # phone
node evals/e2e/live-session.mjs expert-comptable -- node <skill>/scripts/record.mjs --steps flow.json --out DIR   # desktop
```

The recorder reads `COACH_SESSION` / `COMPTA_SESSION` and `LIVE_APP_URL` set by the helper and sets the `__Host-app_session` cookie. Read `evals/e2e/README.md` of hachej/boring-factory for what the account may do (invented data; in expert-comptable only the dossier « Recette (fictif) »). A Coach Max sentence is a real model call: keep to a few, and clear what you wrote afterwards (the line's "Retirer" button needs no model).

## The UI kit's scenario files

The kit harness (hachej/boring-ui, `ux/scenarios/*.json`) is played as it is: `--scenario ux/scenarios/x.json --flow F01 --viewport 390 --url <built page>` (build it with the harness's `buildPage`; its fixture query is added). Same gestures; `say` is the caption, `until` the check, `expect` the sentence.

## Where the result goes

Keep it outside git: `/home/ubuntu/fleet/evidence/<app>/<task-or-date>/` (a few MB at most; delete scratch takes). Then:

- **A task** (`boring task attach <app> D-n <file>`): the server takes only `.md .json .txt .html` (200 KB) and `.pdf .png .jpg .webp .xlsx .csv .docx` (10 MB each). **A video (`.mp4`, `.webm`) is refused** (checked in the Factory's task schema, `tasks/src/domain.mjs`). Attach `strip.png` and `steps.json` (both small), and say where the video is. Finished evidence: archive to R2 as `docs/archive/ARCHIVE.md` describes.
- **A pull request or a report**: write the verdict line, the numbers from `steps.json` (steps passed, seconds, console errors), and the evidence folder path. Never commit the video. GitHub inlines a video only when someone drags it into the web editor: leave that to a person.

Reading `steps.json`: `verdict.ok` and `verdict.line` first; then each `steps[]`: `ok`, `reason` (why it failed), `ms` (time of the gesture and its check), `check.ok` (the `until`), `consoleErrors`, `retried` (the gesture was tried twice). `warnings` says if the video is over 40 s (over 60 s: split it).

## Privacy and safety (built in, and your part)

- Record only with the fictional test user and invented data. Never a real person's page.
- It **refuses** (exit 3, writes nothing) when a visible input, the text or the address looks like a secret (a token-like string, a key prefix, a JWT, a private key, the session value) and says what kind, never the value. Do not work around it: change the data.
- It blurs `input[type=password]` and `[data-private]` (add more with `--mask`); the session cookie is read from the environment and never written, printed or shown; an address is printed without its query string.
- Do not put a URL with a query string in a caption (it is cut), and never paste a sign-in link.

## When it goes wrong

| Symptom | Do |
|---|---|
| `FAIL step N ... Timeout` on a target | the text, role or label is wrong or not yet there: `--fast` and look at `strip.png` (red frame) |
| Exit 3 `refused` | the page shows a secret-looking value: use invented data, mask it or fix the page |
| Exit 4 `playwright not found` | `DEMO_VIDEO_PLAYWRIGHT=<folder with node_modules/playwright-core>`, and `CHROMIUM=<binary>` if needed |
| No MP4, only WebM | `ffmpeg` missing or without libx264: install ffmpeg |
| Video over 60 s | a model call waits: cut steps, or split into two files |
| Page redirects to sign-in | the session expired: run through `live-session.mjs` again |
| Typing hidden behind the caption | it moves to the top by itself when the field is at the bottom |

Tests (offline): `node --test skills/demo-video/test/` in the library.
