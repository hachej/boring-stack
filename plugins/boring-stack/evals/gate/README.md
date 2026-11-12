# The gate: one fixed card through a fresh worker

`boring-stack gate` (and `boring-stack update` when a provider has a candidate) copies `fixture/` into a temporary folder, makes it a git repository, and starts a fresh headless Claude Code worker there with only this plugin and the candidate providers loaded for that run (`--plugin-dir`; nothing is installed or enabled on the machine). The prompt is `prompt.md`: it starts with `/boring-stack:boring-mode CARD.md`, the way a conductor starts a task.

The fixture is a tiny day-of-meals module with three seeded defects (the total concatenates strings, removing a line removes every line after it, an empty day shows no total) and a card, `fixture/CARD.md`, with three acceptance lines. No production app, key or person is touched.

**Pass** means every fact below holds, read by the gate from the files and the transcript, not from the worker's reply (`lib/gate.mjs`, `grade`):

1. it loaded `boring-mode`;
2. it read `poteto-mode` in full;
3. it followed a poteto playbook (Bug fix or Feature);
4. it loaded `prove-it` and `ship`;
5. `node --test` passes when the gate runs it afterwards;
6. `.agent-handoff/proof.md` records a failing run and a passing one;
7. it has one evidence row per AC line;
8. it shipped: a commit naming G-1 on a branch other than main;
9. it wrote no settings file and no `CLAUDE.md`.

Not covered: the demo video (`boring-library:demo-video` is installed and routed from `prove-it`, but a recording needs Chromium and ffmpeg in every gate run) and the independent walkthrough (a tester run doubles the cost; it runs on real cards).
