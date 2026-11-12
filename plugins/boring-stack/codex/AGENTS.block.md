## Boring Factory workers (boring-stack)

At the start of every task, read `.agents/skills/boring-mode/SKILL.md` (or `~/.agents/skills/boring-mode/SKILL.md`) in full and follow it: it reads the task card, picks the route and names the proof. Then read `poteto-mode/SKILL.md` from the same skills folder in full: it is the engineering style every route uses. Load the other skills only at the step that names them.

Skills of this stack: boring-mode, task-card, ui-kit, design, pm, prove-it, ship (ours); poteto-mode and the pstack skills it names; control-ui, control-cli, deslop (cursor-team-kit); emil-design-eng, animate, review-animations, improve-animations, mobile-native, break-ui (Emil Kowalski); shadcn; boring-ui, app-layout-and-agent, add-blocks, boring-design-system, agent-capabilities, build-agent-app (the UI kit).

Where a skill says `subagent_type`, `model` or a Claude Code tool name, use Codex's own equivalents on the model you run on. Never print a secret; never run a broad `pkill`.
