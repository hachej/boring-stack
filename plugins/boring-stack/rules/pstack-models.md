# pstack model configuration for the Boring Factory (boring-stack 0.1.0). One line per role. Delete a line to fall back to the skill default.
# Written by `boring-stack models --write` to ~/.claude/rules/pstack-models.md, the file pstack's Claude Code adapter reads. Never edited by hand on a machine: change it here, by pull request.
# Rule: code on Sonnet; judgment, prose and review panels on Opus; bounded searches and chores on Haiku; `inherit-parent` = the session's own model (a conductor's judgment).
# boring-stack's own agents pin their model: ac-reviewer and tester on opus (judgment), builder on sonnet. Sol (a Codex worker) is the alternative for the tester; not chosen yet.
# Codex Sol is not reachable through the Agent tool: when Julien asks to spend that subscription, start a Codex worker (`boring-stack export-codex`, then `codex exec -m gpt-6.1-sol`), not a role line.
# budget: medium (high)
feature, refactoring: sonnet high
bug-fix: sonnet high
perf-issue: sonnet high
hillclimb: sonnet high
judgment and prose: opus high
hardest tasks: opus xhigh
how explorer: haiku high
how explainer: opus high
why investigators: haiku high
why synthesizer: opus high
reflect tooling: sonnet high
reflect judgment, divergent, synthesizer: opus high
arena runners: opus high, sonnet high
arena cross-judge pool: opus high, fable high
swarm workers: sonnet medium
architect runners: opus high, sonnet high
interrogate reviewers: opus high, sonnet high
