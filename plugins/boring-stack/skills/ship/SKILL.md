---
name: ship
description: "Opening the pull request and putting a change live safely in the Boring Factory. Replaces the old opening-a-pr playbook and the ship and safety lines pasted in briefs. Use when the change is proven and ready to go live, and before any merge or deploy that touches admission, identity, roles, agent credentials or model keys."
---

# Ship

Follow poteto-mode's **Opening a PR** (worktree, small ordered commits, `deslop`, `no-comments`, `technical-writing`, `unslop`), with these additions. Its "always pause for deploys" does not apply to your own task: you ship it.

## The pull request

- Ready, never a draft. Title per poteto-mode. The body names the card (id and title), its `Serves:` line, then poteto's sections, the evidence table from `prove-it`, and one **Merge danger** line: one-way or two-way door (does a revert undo it, or does data, a migration or an outside effect stay?) and the blast radius.
- One task, one branch, one pull request. Never touch another task's branch. Every commit message names the card's id (`D-n`), so the log says which task each change serves.

## Going live

- **App repos** (Cloudflare Artifacts): `boring contract` before every push, then `boring ship --task <task>` (save, preview, sealed verify, ship, health check, mark the request). Never `npm install` to run checks the verifier runs.
- **A preview is a ship.** `boring change preview` on a passing change can go live by itself minutes later. Preview only what you would ship.
- **Platform and kit repos** (GitHub): merge when every check is green, if your brief's `Merge authority:` line allows it; otherwise open the PR and stop. Cancel superseded CI runs. The release path deploys; check the changed path live afterwards.
- **App repos are merged by the Factory bot only**; never `gh pr merge` in a `boring-<hub>-<app>` repo.
- After a ship, `boring app live` must show your commit before you say "live".

## Risky changes

- **Admission, identity, roles, agent credentials:** one real in-app agent turn before and after the deploy, on an app with a real person and no special grant, and both results on the card. In a cleanup, such a pull request is closed or handed to an owner, never merged because it is green.
- **Secrets, payments, real e-mail, widening rights, deleting data:** Julien's yes first (`boring task ask … --to admin`, tagged with the risk). Nothing else waits for a person.
- **Keys:** test traffic never runs on the production model key. Secrets come from Vault on stdin; never print one, never put one in a URL, an argument, a log or a commit.

## Process hygiene

- Kill only what you started, by its pid or session id. Never a broad `pkill` or `killall`.
- To wait, wait inside one blocking command (a `--wait` flag, a loop with a timeout), not by ending your turn and polling.
- Before your final report, stop your own background waits, watchers and dev servers: a leftover watcher wakes your conductor (the most expensive model) on every event.
- Worktrees: copy `.agent-handoff/` out before `git worktree remove` (it deletes ignored files).

## After live

Hand the evaluator's script to `boring-stack:tester` (`prove-it` section 4). You never mark a line as working for the person: "mark the request shipped" (`boring ship --task`) records the ship, not the person's verdict. Report as `boring-mode` says (Writing the reply).
