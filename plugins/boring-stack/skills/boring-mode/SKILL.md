---
name: boring-mode
description: "The Boring Factory's agent style on top of pstack's poteto-mode: our task card, UI kit, design skills, proof and ship around poteto's playbooks. Start every task with /boring-mode <app> <task-id> (or a card file). Replaces the old boring-mode router and the rules pasted into worker briefs."
argument-hint: "<app> <task-id> | <card file>"
---

# Boring mode

The task: $ARGUMENTS

Engineering is pstack's `poteto-mode`, unchanged. Read it in full before any other work: run `boring-stack where poteto-mode` and `Read` the path it prints (pstack hides it from the skill list). Its Non-negotiables, Principles, Autonomy, Subagents and Playbooks all apply. This skill adds only what is ours, in the same shape, and wins on the points in **Autonomy** below.

In Claude Code a guard holds the two reads that matter once this skill is loaded: no code edit before `poteto-mode` and a playbook were read, no commit, push or ship before `prove-it` and `ship` were loaded.

## Non-negotiables

- First message → read the card: `boring task show <app> <task-id>`, or the card file named above. Find its type (fix or feature), surface, `AC-n` lines, and whether it touches admission, identity, roles or agent credentials. Restate its goal in one line and go on without waiting.
- No AC lines, or a need that is not a card yet → `pm`, then come back here.
- A feature → start only once `~/fleet/evaluator/<product>/<card>/script.md` exists (`boring-stack:ac-reviewer` writes it). Check that it exists; never read it.
- Anything a person sees → design in this order: the app's design system first (`boring-ui-kit:boring-design-system`: tokens, kit parts, `boring-ui-blocks design`), then `design`, which sends you to Emil's skills for polish (`emil-design-eng`), motion (`animate`, `review-animations`, `improve-animations`), the phone (`mobile-native`) and worst-case data (`break-ui`).
- UI kit work or kit parts in an app → `ui-kit`.
- Touches admission, identity, roles or agent credentials → `ship`, "Risky changes".
- Changes model behaviour (a prompt, a reader, a model) → `prove-it`, "Evals".
- Before a commit → `prove-it`, then `ship`. A gesture a person makes is proven with `demo-video` (`boring-library:demo-video`).
- Load each skill at its step, not all at once (`boring-stack:<name>`; a provider's as `<provider>:<name>`).

## Routes

Open a todo list whose first items are the route's steps, in order, the way poteto-mode opens a playbook's.

| The card | Route | It ends with |
|---|---|---|
| Fix, app screen | `task-card` → poteto **Bug fix** → design (if the look changes) → `prove-it` → `ship` | the failing run before, the passing run after on the same surface, a demo video of the gesture on the live app |
| Feature, app screen | evaluator script exists → `task-card` → poteto **Feature** → `ui-kit` → design → `prove-it` → `ship` | one row per AC with evidence, a demo video, the app's scripted day green, the tester's run of the script |
| UI kit (boring-ui) | `task-card` → poteto **Feature** or **Bug fix** → `ui-kit` → design → `prove-it` → `ship` | the screen's scenario, `ux check` green, a capture strip or video |
| Platform code (boring-factory) | `task-card` → the poteto playbook that fits → `prove-it` → `ship` | tests that fail without the change, one real run of the changed path |
| Doc or skill | `task-card` → poteto **Authoring a skill** or `technical-writing` → `ship` | the repo's checks; for a skill, one fresh agent run that follows it |
| Question only | poteto **Investigation** → answer on the card (`boring task comment`) | a cited answer |
| No AC | `pm` | the card, reviewed `ready`, with its evaluator script |

## Our skills

- **task-card.** Reading, writing and reporting on a card; the words a person reads.
- **pm.** A need that is not a card yet.
- **ui-kit.** Building with the kit's parts; the kit's own skills (`boring-ui-kit:*`).
- **design.** Precedence (the person's words, then the design system, then craft) and which design skill at which step.
- **prove-it.** The evidence table, the tool per surface, evals, the evaluator.
- **ship.** Branch, pull request, the boring CLI, risky changes, live.

## Autonomy

Where this overrides poteto-mode:

- **Deploys.** A preview is a ship. Ship your own task through the boring CLI when its checks pass (`ship`).
- **A person decides two things.** What to build (the card and its AC), and risky actions: secrets, payments, real e-mail, widening someone's rights, deleting data. Ask with numbered choices, the recommended one first (`boring task ask`, with a default), and keep going on the rest.
- **The verdict is the person's.** Never set whether a line works for them. Words a person reads come from `services/tasks/ui/wording.ts` (boring-factory).
- **Fictional data only.** The test person and invented records.

## Subagents

As poteto-mode says, with our names: a whole new task goes to `boring-stack:builder` (it starts with this skill loaded); delegates inside a playbook step are `pstack:poteto-agent`; `boring-stack:ac-reviewer` judges the lines before a build, `boring-stack:tester` runs the script after a ship. Models per role: `~/.claude/rules/pstack-models.md`. A Cursor or Grok slug means: omit `model`.

## Writing the reply

poteto-mode's rules, plus: what changed for the person using the app, then the evidence per AC, then what is live (the live commit contains yours), then what is open. A task is named by its id and its title. Stop every wait and process you started (by its id, never a broad `pkill`) before you report.
