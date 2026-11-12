# Inventory: every skill on the dev VM on 12 November 2026, and where it goes

Sources: `~/.agents/skills` (131 folders, installed by `npx skills add`, lock in `~/.agents/.skill-lock.json`), `~/.claude/skills` (symlinks to the former, `prompts-sync` copies from boring-factory, two real folders, eleven dangling links), and the Claude Code plugins `pstack@cursor-plugins` and `mattpocock-skills@mattpocock`.

Verdicts: **route** (boring-mode sends a worker to it at a named step), **keep** (installed and available by name, never routed), **retire** (out of the default set; removal is a second, explicit pull request, nothing is deleted here). "Ours" means hachej/boring-stack or boring-factory; the plugin column says what replaces it.

## Ours

| Skill | Source | For | Verdict | Reason |
|---|---|---|---|---|
| boring-mode | ours (boring-factory `skills/`, library `skills/`, two different copies) | worker router | retire both copies | replaced by plugin `boring-mode`; its forked playbooks give way to poteto-mode's |
| boring-pm | ours (boring-factory and library, different) | PM for masters / the expert | retire | folded into `pm` (steps, the two kinds of yes) and `task-card` (format) |
| boring-design-system | ours (library copy) | tokens, design check | retire the library copy | the kit's copy (hachej/boring-ui `skills/`) is newer and is the one routed, via `ui-kit` and `design` |
| boring-ui-build-app | ours (dangling link to a removed boring-ui folder) | building with the kit | retire | gone upstream; `ui-kit` and the kit's own skills replace it |
| platform-request | ours (library) | GitHub issue to the platform team | retire | describes the retired vendor/ and issue flow; now a factory card (`task-card`) |
| report | ours (library) | a master's status overview | retire | folded into `task-card` ("Reporting where things stand") |
| verify-this | ours (library; really cursor-team-kit's, lightly edited) | verify a claim | retire | folded into `prove-it` (the claim row) |
| reflect | ours (library) | learnings into the repo | retire | stale paths (vendor/, boring-ui-v3); pstack `correct` and `reflect` cover it |
| delegate | ours (local, `~/.agents/skills/delegate`) | conductor drives herdr workers | keep | conductor tool, not a worker skill |
| demo-video | ours (library `skills/demo-video`, PR #16) | captioned proof video | route | `prove-it`'s recorder; installed as `boring-library:demo-video`, a provider of ours that selects only this folder |
| stageshow | library (benjitaylor/skills, vendored) | faux product stills | retire from default | marketing illustration, not proof; install upstream by hand when needed |
| agentsview-finding-history | local | search agent history | keep | Julien's own tool |
| better | local | `/better` prompt deepening | keep | typed by Julien only |
| coding-grill-plan, coding-thermo-nuclear-code-quality-review | local | grilling, harsh review | keep | duplicates of Pocock `grilling` and team-kit `thermo-nuclear…`; typed by Julien only |
| campaign-challenger, multichannel-campaign-builder, reply-draft-assistant, sales-nav-search-builder | third party (LaGrowthMachine/gtm-system) | outbound sales | keep | unrelated to building; never routed |
| ten dangling links (campaign-impact-analyzer, coding-autoreview, coding-get-gemini-feedback, coding-manage-beads, coding-migrate-bd-to-br, coding-planning-workflow, coding-run-flywheel, devops-manage-skills, vibing-with-ntm, won-deal-icp-finder) | old installs | none | retire | point at nothing |

## pstack (cursor/plugins, MIT), adopted 0.15.36 at c742dd61

| Skill | For | Verdict | Reason |
|---|---|---|---|
| poteto-mode (+ playbooks) | engineering style and playbooks | route | every code route reads it in full |
| tdd, how, why, architect, interrogate, blast-radius, unslop, technical-writing, no-comments, typescript-best-practices, figure-it-out, arena, swarm | steps poteto-mode names | route (through poteto-mode) | poteto-mode loads them at its steps |
| the 24 `principle-*` | one principle each | route (through poteto-mode) | its Principles index |
| correct, reflect | encode lessons in structure | route | named in the enforcement table (DESIGN.md) |
| create-verification-skill, maintain-verification-skill, create-formal-verification-skill, maintain-formal-verification-skill, statechart | project verification | route | named in `prove-it` |
| setup-pstack, automate-me | configuration, own mode skill | keep | run by a person (setup-pstack replaced by `boring-stack models`) |
| poteto-help, in-your-own-words, sharpen, recall, ketchup, ketchup-video, bro, teach, show-me-your-work, benchmark-checklist | personal helpers | keep | typed by a person or named by poteto-mode when needed |
| make-bot-ui | Grok bot pages over Tailscale | keep | Cursor-centric; its install line pipes a download into `sh` (scan flag) |
| Copies of all of these in `~/.agents/skills` (npx, 22 and 27 October) | the same | retire | stale duplicates of the plugin; codex gets them from `export-codex` instead |

## cursor-team-kit (cursor/plugins, MIT), adopted 1.2.0 at 2b8ae2ee

| Skill | For | Verdict | Reason |
|---|---|---|---|
| control-ui, control-cli | drive a browser or a CLI for proof | route | `prove-it`, poteto bug fix step 1 |
| deslop | clean AI slop before commit | route | poteto-mode, before commit |
| fix-ci, loop-on-ci, get-pr-comments, fix-merge-conflicts, make-pr-easy-to-review, what-did-i-get-done, thermo-nuclear-code-quality-review | CI and PR chores | keep | useful by name; poteto's babysit playbook covers the routed path; not in the plugin's selection |

## Emil Kowalski (emilkowalski/skills, MIT), adopted at e8a175de

| Skill | For | Verdict | Reason |
|---|---|---|---|
| emil-design-eng | polish and review of a screen | route | `design`, the default polish pass |
| animate | build an animation | route | `design`, motion |
| review-animations | review a motion diff | route | `design`, gate on motion changes |
| improve-animations | app-wide motion audit | route | `design`, when the card is about motion |
| mobile-native | phone fixes | route | `design`, phone-first screens |
| break-ui | worst-case data | route | `design`, data screens |
| find-animation-opportunities, pick-ui-library, prototype | motion ideas, library choice, a UI prototype | keep | useful by hand; not on a card's path |

## Other third-party design skills

| Skill | Source | Verdict | Reason |
|---|---|---|---|
| shadcn | shadcn-ui/ui `skills/shadcn` (MIT), adopted 2d3f1cd4 | route (kit work only) | the registry the kit is built on |
| make-interfaces-feel-better, interaction-design | poteto/noodle (MIT; library vendored) | retire from default | overlap `emil-design-eng`; "shadows over borders" contradicts flat kit cards |
| frontend-design | Anthropic (Apache-2.0; via poteto/noodle, vendored) | retire from default | bold-aesthetic brief conflicts with kit and one accent |
| design-impeccable | pbakaus/impeccable (Apache-2.0, v2.1.1, local copy) | keep | a person may ask for `teach` or `critique`; never routed |
| minimalist-ui, redesign-existing-projects | Leonxlnx/taste-skill (MIT; vendored) | retire from default | impose fonts, palettes, textures the design check refuses |
| ui-polish | jeffreys-skills.md (paid licence; installed by `jsm`) | retire from default | not redistributable; carries a zero-width watermark (decodes to the buyer handle) |

## Matt Pocock (mattpocock/skills, MIT), plugin 1.3.2

| Skill | Verdict | Reason |
|---|---|---|
| writing-for-agents | keep | the convention this repository's skills are written to (README); not a worker step |
| diagnosing-bugs, grilling, grill-me, grill-with-docs, domain-modeling, codebase-design, research, code-review, pr, prototype, tdd, wizard, wayfinder, to-spec, to-tickets, implement, implement-spec, improve-codebase-architecture, ask-matt, retro, handoff, wait-what, to-questionnaire, triage, teach | keep | good by name; overlap pstack's playbooks, so never routed |
| setup-matt-pocock-skills, setup-pre-commit, setup-ts-deep-modules, git-guardrails-claude-code, migrate-to-shoehorn, scaffold-exercises | keep | one-off setup tools |
| chief-of-staff, claude-handoff, loop-me, writing-beats, writing-fragments, writing-shape | keep | upstream marks them in progress |
| npx copies in `~/.agents/skills` | retire | duplicates of the plugin |

## The UI kit's own skills (hachej/boring-ui `skills/`, ours, track main)

| Skill | Verdict | Reason |
|---|---|---|
| boring-ui, app-layout-and-agent, add-blocks, boring-design-system, agent-capabilities | route | `ui-kit` and `design` |
| build-agent-app | keep | a new app outside the factory |

## In numbers

About 150 names, 131 of them installed folders. Routed from `boring-mode`: 7 of ours, 6 Emil, 3 team-kit, shadcn, 5 kit skills, and pstack's poteto-mode with the skills and principles it names (about 50 names, reached through poteto-mode rather than listed to the worker). Kept, unrouted: about 60. Retired from the default set: 2 copies of `boring-mode`, 2 of `boring-pm`, `boring-design-system` (library), `boring-ui-build-app`, `platform-request`, `report`, `verify-this`, `reflect` (ours), `stageshow`, 6 third-party design skills, 10 dangling links, and the npx duplicates of pstack and Pocock (about 80 folders).
