---
name: task-card
description: "The task card and the task store: the card's parts, the rules for acceptance lines, and how a worker claims, comments, asks, reports and closes a task with the boring CLI. Replaces the card rules scattered in briefs, the report skill and platform-request. Use when you read or write a card, check its AC lines, need a person's answer, report where a task stands, or hit something only the platform can fix."
---

# The task card

One card is the whole contract. Nothing outside it binds the worker.

## The parts (nothing else is required)

| Part | Content |
|---|---|
| Title | The outcome in the user's words |
| Serves | Who, and the one number it should move (`Serves:` line of the spec) |
| Type | `feature` or `fix` |
| Contract | `- AC-n:` lines, and one reference mockup if there is a screen |
| Out of scope | What this version leaves out |
| Decisions | Dated answers to ambiguities, with who decided |
| Owner | One worker, until live |

## Rules for an AC line

Each rule comes from a failure in November 2026. A line that breaks one is sent back with the exact edit, not built.

1. **A gesture and an observable result, on a named surface.** "Dropping the same file twice gives one deposit", never "matches the mockup".
2. **Says how it is checked:** automatic test; eval with a number and its noise band (a case family, three runs); or a walkthrough gesture. A line for a person names the person and a date.
3. **No process step as an AC.** "Publish a mockup and wait for a yes" is a gate, not acceptance.
4. **Every reference resolves.** A cited case, mockup version or file exists, at the version the card means.
5. **One text wins.** When a decision reverses earlier text, edit the old text; do not leave both.
6. **At least one end-to-end line** that crosses into the neighbouring features: first use, empty state, error, phone at 390 px.
7. **Rights lines for anything touching data:** who can, who is refused, tested from the refused side.
8. **Model behaviour is an eval:** a named case family, a threshold, three runs.

Numbers never change; a new line takes the next number. Fictional data only.

## Working a card with the boring CLI

`<app>` is the app or space name, `<task>` the task's id. `boring task --help` and `boring --help` are the source of truth for flags.

| Step | Command |
|---|---|
| Read it | `boring task show <app> <task>` |
| Note progress or a decision | `boring task comment <app> <task> --text "…"` |
| A question only a person can answer | `boring task ask <app> <task> --text "<question> Sans réponse : <default>"` (add `--to admin` for Julien). Keep working on the rest. |
| Attach small evidence | `boring task attach <app> <task> <file>`: `.md .json .txt .html` up to 200 KB, images and pdf up to 10 MB; no video (say where it is) |
| Ship it | `boring ship --task <task>`: see the `ship` skill |
| Where it stands | read `boring task show`, the pull request, `boring app live`; never your memory |

A worker never types a status by hand to say "done": the store and the live commit say it. A Router-started worker already holds the task's lease; a sub-agent's conductor holds it for it.

## Reporting where things stand

Short, one screen, from the store and the live commit: **moving** (task, what it does now), **stuck** (what is wrong and why), **needs Julien** (the question, its default, your recommendation), **live since last report**. A report reads; it starts nothing.

## When only the platform can fix it

Something the app cannot do (the host, the kit, deploy, auth, a model provider), or a change that failed twice for a reason outside the app: write a card in the factory space with the evidence (the command, its output, what you expected), link it from your card, and carry on with what does not depend on it. Do not patch around the platform in the app.
