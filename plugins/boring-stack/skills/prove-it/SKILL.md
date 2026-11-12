---
name: prove-it
description: "Proof that a change works for a person, with the factory's own tools: the evidence table, the demo video, the live test person, the app's scripted day, the kit's scenarios, evals, and the independent walkthrough. Replaces verify-this, the proof parts of the old opening-a-pr playbook, and the proof lines pasted in briefs. Grounds pstack's prove-it-works. Use before calling any task done."
---

# Prove it

Done means a person could see it work: every AC line passes on the real surface, and the evaluator's script, written before the build and run after the ship by an agent that built nothing, found no blocking or wrong-result defect. The person's own try comes after. Green CI and your own report are not proof.

## 1. One row per AC line

Keep raw evidence in `.agent-handoff/` (never in git). The pull request body and the card carry this table:

| AC | Evidence | Kind | Head | Result | Limits |
|---|---|---|---|---|---|
| AC-1 | `.agent-handoff/ac1-before.txt`, `ac1-after.txt`, test "one deposit per file" | test | `<sha>` | pass | fictional data |

Kind is `test`, `driven-ui`, `eval` or `walkthrough`; never claim a stronger kind than what ran. A fix shows the failing run before the passing one, on the same surface.

## 2. The tool for each surface

| Surface | Tool |
|---|---|
| A live app, signed in | `node evals/e2e/live-session.mjs <app> -- <your command>` in boring-factory: the test person's session in the child's environment only. Never sign in yourself (codes are rate-limited), never print or copy the cookie. |
| A gesture a person makes | `boring-library:demo-video` (`node "$(dirname "$(boring-stack where demo-video)")"/scripts/record.mjs --steps flow.json`; `--fast` as a check): captions, a pass or fail verdict, `strip.png`, `steps.json`. Videos go to `/home/ubuntu/fleet/evidence/<app>/<task>/`, never in git; attach `strip.png` and `steps.json` to the card. |
| An app's day of use | the app's scripted day when it has one (Coach Max: `node test/evals/day/run.ts`, part of `npm test`; `--live` only with the test person, and it clears what it wrote) |
| A kit screen or component | its scenario: `node ux/runner/cli.mjs check --target <t>` and `capture` (see `ui-kit`) |
| A CLI or a TUI | `control-cli` |
| A browser bug to reproduce | `control-ui` |
| A claim to settle (did this fix it?) | restate it so it can fail, capture before and after, compare: VERIFIED, NOT VERIFIED or INCONCLUSIVE |
| Code the tests cannot reach (a race, a state machine) | pstack `create-formal-verification-skill` |

A project with no scripted way to drive the app gets one first: pstack `create-verification-skill`.

## 3. Evals (model behaviour)

A named case family, a threshold, three runs in a row, sentences as people really write them (several items, corrections, sequences), not one clean sentence at a time. Evals use the evals key (Vault `agent/anthropic-evals` once it exists), never the production key: on 12 November test traffic on the production key took a live app's model down for an hour. If only the production key exists, stop and ask (`task-card`).

## 4. The evaluator: script before build, run after ship

Two fixed moments, two agents, neither of them the builder:

1. **Before the build** (features): `boring-stack:ac-reviewer` reads the card cold, judges the lines and writes the script to `~/fleet/evaluator/<product>/<card>/script.md`, extending the app's scripted day or kit scenario where one exists. No builder starts until it exists. The builder knows the folder exists and never reads it: a proof written to pass a known script proves nothing.
2. **After the ship**: a fresh `boring-stack:tester` runs that script on the live app at 390 and 1280 px, wanders as the person, and writes `verdict.json` beside it: steps without a hitch out of N, defects by severity (blocks the job, wrong result, confusing, cosmetic), up to five places that are "not simple". A "blocks" or "wrong result" defect reopens the task for the same owner.

**Hard rule: the verdict is the person's.** Whether a line works for them (« Ça marche », « Ça ne marche pas », « Pas pu essayer ») is set by the person, in Studio, never by an agent and never from an app's own origin. The builder's evidence and the tester's result sit beside it, labelled as theirs (« Preuve du développeur », « Test de l'agent »). Words a person reads come from `services/tasks/ui/wording.ts` (boring-factory): « n sur m réussis » only once something was tried, never « recette », « KO » or a bare "3 / 6".

## 5. Say what you did not prove

A limit you name (fictional data only, desktop only, no real model on previews) is fine. A limit you hide is a defect.
