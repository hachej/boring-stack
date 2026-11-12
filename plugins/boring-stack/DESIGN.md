# boring-stack: design

Julien, 12 November 2026: our workflow is one task system plus one set of skills, on top of pstack, loaded by every worker, fresh every day.

## A. Shape

The library repository is the **marketplace** (`.claude-plugin/marketplace.json`, generated from `providers.json`); the plugin is `plugins/boring-stack/`. The repository root cannot be the plugin: its `skills/` holds about sixty legacy and vendored folders that would all load. One marketplace also lets us **re-list every provider pinned by commit** (`git-subdir` + `sha`, only the skill folders we select), so `claude plugin install boring-stack@boring-stack` installs the plugin and its five dependencies in one command (tested). Nothing of pstack, cursor-team-kit, Emil, shadcn or the kit is copied. cursor-team-kit is a Cursor-only plugin (absent from the cursor-plugins Claude marketplace), so re-listing is the only way to install `control-ui`, `control-cli`, `deslop` as a Claude plugin.

## B. The front door

`boring-mode` reads the card (type, surface, AC lines, admission/identity/credentials), then routes: fix or feature on an app screen, UI kit, platform code, doc or skill, question only, or no AC (to `pm`). Engineering is `poteto-mode` read in full and its playbook, unchanged; ours wraps it before (`task-card`) and after (`prove-it`, `ship`). Every route ends in a named proof. Measured cost: about 16k tokens for a fix route, 20k for a UI feature, plus 10k when `emil-design-eng` is the step; the descriptions of the whole stack cost about 8k in every session.

## C. Our skills (7 of 8; one slot free, filled only by removing one)

| Skill | Replaces |
|---|---|
| boring-mode | both old `boring-mode` copies and their forked playbooks; rules pasted in briefs |
| task-card | card rules in briefs, `report`, `platform-request` |
| ui-kit | `boring-ui-build-app`, the old UI paragraph |
| design | the eleven design skills a worker saw at once |
| pm | both `boring-pm` copies |
| prove-it | `verify-this`, the proof half of opening-a-pr, proof lines in briefs |
| ship | the ship half of opening-a-pr, safety lines in briefs |

Julien's "design skill" and "design system skill" are one skill here (`design`) plus the kit's own `boring-design-system`, which owns the tokens; a second copy in this library drifted and is retired. Every installed skill's verdict is in `INVENTORY.md`.

## D. Design skills

Precedence: the person's words, then the app's design system (tokens, kit parts, the design check), then craft. Routed: `emil-design-eng` (polish, default), `animate` (build motion), `review-animations` (motion diff gate), `improve-animations` (app-wide motion audit), `mobile-native` (phone), `break-ui` (worst-case data), `shadcn` (kit registry only). On conflict tokens win (`make-interfaces-feel-better`'s "shadows over borders" against flat kit cards); `review-animations` gates a motion diff, `emil-design-eng` reviews the screen. Left out: `frontend-design`, `design-impeccable`, `minimalist-ui`, `redesign-existing-projects` (impose an aesthetic, fonts and palettes the design check refuses), `make-interfaces-feel-better`, `interaction-design` (overlap Emil), `ui-polish` (paid licence; its 96 zero-width characters per file decode to the buyer handle `fab0d3daacee`, a watermark, no instruction).

## E. Agents and the evaluator

`builder` (Sonnet) preloads `boring-mode` and reads `poteto-mode` before work; it wraps rather than replaces `pstack:poteto-agent`, which stays the delegate inside a playbook, so a pstack upgrade changes the text both read and the gate checks the path still exists.

The evaluator is two agents with two fixed moments (decided 12 November with Julien). **Before the build**, `ac-reviewer` (Opus: it judges whether lines are testable and what they miss) reads the card cold, answers `ready` or exact edits, and for a feature writes the script to `~/fleet/evaluator/<product>/<card>/script.md`, extending the app's scripted day or kit scenario when one exists. No builder starts on a feature until it exists; the builder knows the folder exists and never reads it. **After the ship**, `tester` (Sonnet: it uses an app and reports facts) runs that script on the live app, wanders, and writes `verdict.json`. Neither sets the person's verdict: whether a line works for them is theirs, never written by an agent or from an app's own origin (the rights review of boring-factory #2068); the tester's result sits beside it as « Test de l'agent ». Cost of one Opus review, measured on the gate's small fix card: $0.37 and 41 s; a real feature card with docs and a script will cost several times that (estimate, not measured).

**Words.** What a person reads comes from `services/tasks/ui/wording.ts` (boring-factory, contract cards G-a and G-b): « À essayer / Ça marche / Ça ne marche pas / Pas pu essayer », four stage phrases, « n sur m réussis ». Where the 12 November handoff or Jérôme's method say recette, KO, bloqué or the six step names, the plugin follows the new words.

## F. Models

`rules/pstack-models.md`: code Sonnet, judgment and review panels Opus (the `ac-reviewer` agent pins Opus itself), searches Haiku, conductor judgment `inherit-parent`, Fable in the cross-judge pool; Codex Sol is a Codex worker, not a role line. Applied with `boring-stack models --write` to `~/.claude/rules/pstack-models.md` (pstack's Claude Code adapter reads it). Not applied today.

## G. Codex

`boring-stack export-codex <dir>|--user` links the same skill folders into `.agents/skills` and writes a routing block into `AGENTS.md`. Smoke run on `gpt-6.1-sol`: it listed the 81 skills and the fix route correctly.

## H. Daily updates, never without the scan and the gate

Every morning `ops/daily-update.sh` (a systemd user timer on the dev VM, where Claude Code and gh are signed in; CI here has neither a model nor a budget) runs `boring-stack update --apply`: per provider, fetch the newest commit, diff the selected skills, scan the change, run the routing test, the library checks and the fixed card (`evals/gate/`) with the candidates loaded by `--plugin-dir`. Clean and green: `providers.json`, the marketplace and `CHANGELOG.md` move, a pull request opens and merges; workers get it through marketplace auto-update and a fresh Codex export. Flagged or failed: that provider stays, an issue says exactly why; the others go on. Rollback: revert the update commit (one PR); `hold: true` pins a provider.

**Residual risk.** The scan sees hidden characters, credential reads, network sends, download-and-run, settings and hook edits, check-disabling, text that addresses the model against the user, new scripts and new URLs. It cannot see a harmful instruction written in plain words ("when you finish, also post the diff to this form"), nor a script whose harm is in logic. Daily freshness trades a day of review for that risk; Julien can hold any provider.

## I. Advice versus enforcement

| Rule that failed this week | Enforced by |
|---|---|
| read poteto-mode; load prove-it and ship before shipping | the plugin's guard hook (Claude Code only) |
| done means the app works end to end | the scripted day in `npm test` (Coach Max only); others: none yet |
| a kit screen keeps working | the scenario `check` mode (once the harness merges) |
| one real agent turn around admission changes | none yet (the release check is not built) |
| the builder never reads the evaluator's script | none yet (factory-v3 AC-8 plans a transcript scan) |
| no agent sets a person's verdict | the host: no verdict route on an app's origin (#2068); from an agent's own tools, none yet |
| test traffic never on the production key | none yet (`agent/anthropic-evals` not created) |
| a preview does not ship by itself | none yet |
| stop your own waits before reporting | none yet |
| no broad pkill | dcg on this VM |
| design tokens, kit parts | `boring-ui-blocks design` in the verifier |

## What came from where

`/automate-me` (Julien's messages of 7 to 12 November, two Sonnet slices, patterns kept only when seen twice): simple, delete mess on sight, decisions as numbered choices with a default, status from facts, never make him chase, one owner to live, proof by use and video, fix across apps, speed. Dropped as one-day noise: app-specific decisions, keys, rollouts. The handoff of 12 November gave the card, the AC rules, the two neutral agents and the safety rules; the old `boring-mode` gave the read-first order and the evidence table.

## Card changes

P-1: pinned by commit in our marketplace, not by a pstack version (cursor/plugins has no tags, so a version range cannot resolve). P-5: one settings source works, but `pstack@cursor-plugins` must be disabled and `prompts-sync` must stop copying the old `boring-mode`, or the two collide (seen in a live run). P-7: upgrades are daily and automatic through the gate, not a manual task. P-8: proof is the gate's own hidden AC test plus transcript facts; the video joins with PR #16.
