# boring-stack

The one plugin every worker of the Boring Factory loads: pstack's engineering (`poteto-mode`, unchanged) plus our way of working, one task system and seven skills. The front door is `boring-mode`; a worker is told to load that skill and nothing else. Why it is shaped this way: [DESIGN.md](DESIGN.md). Every skill on the machine and where it goes: [INVENTORY.md](INVENTORY.md).

## Install (one command each)

```sh
claude plugin marketplace add hachej/boring-stack
claude plugin install boring-stack@boring-stack          # also installs pstack, cursor-team-kit, emil-design, shadcn, boring-ui-kit
boring-stack export-codex --user                          # Codex: skills into ~/.agents/skills, routing into ~/.codex/AGENTS.md
```

On a machine that already has `pstack@cursor-plugins`, disable it first (`claude plugin disable pstack@cursor-plugins`): two plugins named `pstack` collide and boring-stack then fails its dependency. Remove the old `boring-mode` and `boring-pm` copies from `~/.claude/skills` too (boring-factory's `prompts-sync` writes them), or a worker may load the old router. Both are switch-over steps for the factory review, not done here.

For one session only, without installing: `claude --plugin-dir plugins/boring-stack --plugin-dir <each provider folder>` (that is what the gate does).

## What a worker loads

1. `boring-stack:boring-mode` (its start instructions name only this).
2. pstack's `poteto-mode` in full and the playbook the route names (`boring-stack where poteto-mode` prints the path).
3. Our skills at the step that needs them: `task-card`, `ui-kit`, `design`, `pm`, `prove-it`, `ship`.
4. A provider skill only when a step names it (`emil-design:animate`, `cursor-team-kit:control-ui`, `boring-ui-kit:add-blocks`, ...).

In Claude Code a guard hook enforces the reads that matter, only in sessions that loaded `boring-mode`: no code edit before `poteto-mode` and a playbook were read; no commit, push or ship before `prove-it` and `ship` were loaded.

Agents: `boring-stack:builder` (one card to live), `boring-stack:tester` (independent walkthrough), `boring-stack:ac-reviewer` (AC lines before build).

## The command

`bin/boring-stack` is on the PATH while the plugin is enabled:

| Command | Does |
|---|---|
| `where <skill>` | the SKILL.md path of any skill of the stack |
| `export-codex <dir>` or `--user` | the Codex export (links, nothing copied) |
| `update [--apply] [--provider p] [--no-live]` | the provider update: fetch, diff, scan, gate; `--apply` adopts what passed |
| `scan --baseline [dirs]` | scan the adopted provider trees (and any skill folders) in full |
| `gate` | the fixed card once on the adopted versions |
| `marketplace` | regenerate `.claude-plugin/marketplace.json` from `providers.json` |
| `models [--write]` | the pstack role rule, written to `~/.claude/rules/pstack-models.md` with `--write` |

Tests: `node --test plugins/boring-stack/test/*.test.mjs`; library checks: `python3 scripts/check.py`; manifest: `claude plugin validate plugins/boring-stack`.

## Providers and daily updates

`providers.json` lists each upstream (repository, path, selected skills, licence, adopted commit). pstack is adopted at 0.15.36 (`c742dd61`), adopted on 12 November 2026.

Daily updates run `ops/daily-update.sh` from a systemd user timer on the dev VM. They are **off** until Julien turns them on:

```sh
systemctl --user link ~/fleet/boring-stack-upstream/plugins/boring-stack/ops/boring-stack-update.{service,timer} && systemctl --user enable --now boring-stack-update.timer
```

(The script clones the library to `~/fleet/boring-stack-upstream` on its first run; clone it once by hand before linking.) Each run adopts only providers whose change is clean on the safety scan and whose gate passes; it opens and merges one pull request with the report, and files an issue for anything held. To roll a bad day back, revert that pull request; to stop a provider moving, set `"hold": true` on it. Upgrading pstack by hand is the same command: `boring-stack update --provider pstack --apply`, then read the report.

## Changing the plugin

- **Add or remove one of our skills:** at most eight. Adding one means removing one; give its first line "Replaces …", route to it from `boring-mode`'s table, update `INVENTORY.md`, and run the gate.
- **Add or drop a provider skill:** edit its `plugin.skills` and `routes` in `providers.json`, run `boring-stack marketplace`, route to it from the skill that needs it, run the gate.
- Write skills for agents (`mattpocock-skills:writing-for-agents`): short, steps first, one meaning in one place.
