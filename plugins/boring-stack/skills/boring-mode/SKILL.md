---
name: boring-mode
description: "The front door for every worker in the Boring Factory. Replaces the old boring-mode router and the rules pasted into worker briefs. Use at the start of every task card (a feature, a fix, a kit or platform change, a doc): reads the card, picks the route (which skills, which pstack playbook, which proof), and holds the house rules."
---

# Boring mode

You own one task card from start to live: one card, one branch, one owner, proof a person can see. Engineering is pstack's `poteto-mode`, unchanged; this skill adds what is ours around it.

## 1. Read, in this order

1. The card: `boring task show <app> <task>`, or the card file your brief names. Find its **type** (feature or fix), its **surface**, its **acceptance lines** (`AC-n`), and whether it touches **admission, identity, roles or agent credentials**.
2. `poteto-mode` in full, before any edit: run `boring-stack where poteto-mode`, then `Read` the path it prints (pstack keeps this skill out of the skill list, so the Skill tool cannot load it). Then `Read` the playbook your route names, from its `playbooks/` folder. Follow its Non-negotiables and Principles. Where it and this file disagree, this file wins on the points in section 4.
3. Open a todo list whose first items are your route's steps from section 2, one per skill or playbook, in order. Load each skill when its item comes (the Skill tool, `boring-stack:<name>`), not all at once, and tick an item only after you loaded it and did what it says. A small or obvious task follows the same route: the route is what makes the proof and the ship right.

In Claude Code a guard enforces the two loads that matter: after `boring-mode`, a code edit is refused until `poteto-mode` was read, and a commit, push or ship until `prove-it` and `ship` were loaded.

## 2. Pick the route

| The card | Route (load in this order) | It ends with this proof |
|---|---|---|
| **Fix**, app screen | `task-card` → poteto **Bug fix** → `design` only if it changes how a screen looks → `prove-it` → `ship` | the failing run before, the passing run after on the same surface, a demo video of the gesture on the live app |
| **Feature**, app screen | start only when `~/fleet/evaluator/<product>/<card>/script.md` exists (written by `boring-stack:ac-reviewer`; never read it) → `task-card` → poteto **Feature** → `ui-kit` → `design` → `prove-it` → `ship` | one row per AC with its evidence; a demo video; the app's scripted day still green; the tester's run of the evaluator's script |
| **UI kit** (repo boring-ui) | `task-card` → poteto **Feature** or **Bug fix** → `ui-kit` (kit section) → `design` → `prove-it` → `ship` | a scenario for the screen, `ux check` green, a capture strip or video |
| **Platform code** (repo boring-factory) | `task-card` → the poteto playbook that fits → `prove-it` → `ship` | tests that fail without the change; one real run of the changed path on the live system |
| **Doc or skill** | `task-card` → poteto **Authoring a skill** or pstack `technical-writing` → `ship` | the repo's own checks; for a skill, one fresh agent run that follows it |
| **Question only** (how, why, are we sure) | poteto **Investigation** → answer on the card with `boring task comment` | a cited answer, every claim with its evidence |
| **No AC lines**, or a need that is not a card yet | `pm`: write the card, have it reviewed (`boring-stack:ac-reviewer`), then come back here | the card, reviewed `ready`, with its evaluator script |

Two modifiers add to any route:

- **Touches admission, identity, roles or agent credentials** → `ship` section "Risky changes": one real in-app agent turn before and after the deploy, on an app with a real person and no special grant.
- **Changes model behaviour** (a prompt, a reader, a model) → `prove-it` section "Evals": a named case family, three runs, the evals key.

Budget (measured with `claude plugin details`): a fix route loads `boring-mode`, `poteto-mode`, one playbook, `task-card`, `prove-it` and `ship`, about 16k tokens; a UI feature adds `ui-kit`, `design` and one kit skill, about 20k, and `emil-design-eng` adds 10k more when polish is the step. The skill descriptions of the whole stack cost about 8k tokens in every session. A design or provider skill loads only at the step that names it; never load every skill "to be safe".

## 3. House rules (how Julien works)

- **Simple.** The smallest change that meets the AC. Fewer rules, files and screens. Delete mess on sight once a grep proves nothing uses it; say what you deleted.
- **One owner to live.** You build, prove and ship. No hand-off between spec, build, check and ship. A task is done when it is live and proven, not when the pull request is open.
- **Never block on a person** for what you can observe by running something. A question only a person can answer: `boring task ask` with a default ("Sans réponse : …"), then keep going on everything that does not depend on it.
- **A person decides only two things:** what to build (the card and its AC), and risky actions: secrets, payments, real e-mail, widening someone's rights, deleting data. Everything else goes ahead and is reported in one batch.
- **Ask with numbered choices,** the recommended one first, all questions in one message. Short replies are the answers ("1", "oui").
- **Status from facts:** the pull request, the live commit (`boring app live`), the AC results. Say "live" only when the live commit contains yours. "Unknown" is a valid answer.
- **The verdict is the person's.** You never set whether a line works for them, never from the app's own origin; your evidence sits beside it. Words a person reads come from `services/tasks/ui/wording.ts` (boring-factory): never « recette », « KO » or a bare "3 / 6".
- **Short replies in plain words.** What changed for the person using the app, then the evidence, then what is open. Name a task with its id and title, never a bare id.
- **Root causes.** A bug in one app is checked in the others that share the code; a fix in the shared kit beats the same fix in two apps.
- **Fictional data only.** The test person (`hub-e2e@`) and invented records; never a real person's data on screen, in a video or in a log.

## 4. Where this overrides poteto-mode

- **Deploys.** poteto-mode pauses on every deploy. Here a preview is a ship and you ship your own task through the boring CLI when its checks pass (`ship`). Pause only for the risky actions above.
- **Models.** Roles map to models in `~/.claude/rules/pstack-models.md` (the plugin's `rules/pstack-models.md`). A Cursor or Grok slug in a pstack skill means: omit `model`, run on the session's model.
- **Sub-agents.** Delegates inside a playbook are `pstack:poteto-agent`, as poteto-mode says. A whole new task goes to `boring-stack:builder`. The evaluator is two agents that never build: `boring-stack:ac-reviewer` judges the lines and writes the script before the build; `boring-stack:tester` runs it after the ship.
- **Cursor-only steps** (Bugbot, Automations, cloud agents): skip with one line, as pstack's Claude Code adapter says.
- **Evidence** stays out of git: `.agent-handoff/` while you work, `/home/ubuntu/fleet/evidence/<app>/<task>/` for videos.

## 5. Before you report

Stop every background wait and process you started (by its own id, never a broad `pkill`). Then report: the goal in one line, what changed for the person, the evidence per AC, what is live, what is open (as cards with an owner).

## Harness notes

Claude Code names our skills `boring-stack:<name>` and pstack's `pstack:<name>`. In Codex (`boring-stack export-codex`) the same skills sit in `.agents/skills/<name>`; read `poteto-mode` from there.
