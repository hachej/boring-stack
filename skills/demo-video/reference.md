# demo-video: reference

## Gestures (`do`)

The vocabulary of the UI kit harness, plus `hover`, `select`, `goto`, `caption`.

| `do` | Needs | What it does |
|---|---|---|
| `tap` / `click` | a target | pointer glides there (mouse) or a touch dot shows (phone), then taps |
| `type` | `text`; optional target | taps the target, types at human speed (the page's own `text` is the text to type) |
| `press` | `key` (`Enter`, `Escape`, `Échap`, `Tab`, `ArrowDown`; several separated by spaces) | a key |
| `select` | a target, `option` | a native `<select>` |
| `hover`, `focus` | a target | |
| `hold` / `release` | a target / none | press and keep pressing, then let go |
| `scroll` | `to` (px), optional target | smooth scroll |
| `drag` | `from`, `to` | mouse drag between two targets |
| `swipe` | a target, `dir` up/down/left/right | a real touch swipe on a phone viewport |
| `drop`, `attach` | `file` (a name; a fake file is made), target | drop a file / choose one in the picker |
| `wait` | `ms` (or `pause`) | a pause |
| `fixture` | `name`, `arg` | `window.__ux[name](arg)` (kit fixtures) |
| `goto` | `path` | same site only |
| (none) | `caption`, `until`, `pause` | a caption card step: shows the words, checks, pauses |

A target is one of: `testid`, `target` (a test id when it is one word, otherwise a CSS selector; a map `{ "390": "...", "1440": "..." }` differs by viewport), `role` + `name`, `label`, `placeholder`, `text` (on `type`, `text` is the text to type), `choice` (kit). The first **visible** match is used.

## Checks (`until`, or a checkable `expect`)

Joined with ` & `: `see:<text>` and `nosee:<text>` (the page shows it, any case, spaces collapsed), `visible:<t>` `gone:<t>` (`a|b` = either), `focus:<t>`, `value:<t>~text`, `text:<t>~text` (empty `<t>` = the whole page), `count:<t>>=N` (also `<=`, `==`, `>`, `<`), `eval:<js expression>`. `expect` may be a sentence (kept in `steps.json`, not checked) or one of these. Checks run inside `--child-frame` when set.

## Other step keys

`caption` (or `say`), `pause` (ms after the step, default about 0.9 s and long enough to read the caption), `timeout` (ms, for the gesture and the check), `only` / `skip` (a viewport name, scenario files). Settings in the file: `title`, `app`, `version`, `lang`, `viewport`, `url`, `childFrame`, `mask`, `ready`.

## Result files

- `demo.mp4`, `demo.webm`: title card, steps with burned-in captions, end card. Phone videos are 780x1688 (2x), desktop 1440x900.
- `strip.png`: one frame per step, caption and seconds under it, failed steps with a red frame.
- `steps.json` (`schema: "demo-video/1"`): `verdict {ok, failedStep, line}`, `steps[] {n, do, caption, ms, ok, reason, check {condition, ok}, expect, consoleErrors, retried}`, `durationMs`, `warnings`, `files`. The address is kept without query string or path to a local file; no session value.

## Kit scenario files

`--scenario FILE --flow F01 --viewport 390|1440 --url <built fixture page>`. The query the harness puts after the page (`demo=1`, `fixture.query`, `queryBy`, the flow's `query`, `pace=real`) is added; `states` are not recorded (the harness's own capture takes pictures of them); `watch`, `thresholds`, `settleMax` and `gap` are ignored (the harness's `check` measures them). A `gap` step still plays and fails honestly when the kit cannot do it.
