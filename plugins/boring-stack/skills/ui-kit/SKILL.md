---
name: ui-kit
description: "Building screens from the Boring UI kit (@hachej/boring-ui-kit, its registry blocks and AppShell). Replaces boring-ui-build-app and the UI paragraph of the old boring-mode. Use for any app screen or component, any change inside the kit (repo boring-ui), and before writing layout code, a dialog, a list, a chat or a file picker by hand."
---

# The UI kit

Compose screens from the kit. The kit owns how parts look and behave; the app owns its words, its data and its theme values. A part the app rebuilds by hand drifts, and the design check refuses it.

## In an app

1. **Find it before you build it.** The kit's own skills hold the catalogue; load the one the step needs:
   - `boring-ui` (the packages and which kit skill is next),
   - `app-layout-and-agent` (AppShell, navigation, list and detail, where the agent sits, the phone sheet),
   - `add-blocks` (install, update or check a registry block; never edit an installed block file),
   - `boring-design-system` (tokens, the need-to-block table, the design check),
   - `agent-capabilities` (tools, approvals, questions for the in-app agent).
   In Claude Code they are `boring-ui-kit:<name>`. The kit's feature map, `features/README.md` in hachej/boring-ui, says what exists, by id.
2. **Use the block that exists.** Dialog, sheet, drawer, file pick, file tree, table cell, toolbar row, chat, voice, attachments, settings rows: each has a kit part. Their props and the theme tokens are the only knobs.
3. **A part the kit lacks** is a kit change, not app CSS: write a card on boring-ui (`task-card`, "When only the platform can fix it") with the screen, the need and a mockup, and build the app with the closest existing part meanwhile. The same need in three apps becomes a token, a prop or a block.
4. **Check it:** `npx boring-ui-blocks check --design web/src` (the verifier runs the same) and look at the screen at 390 and 1280 px, light and dark.

## In the kit (repo boring-ui)

- Read the repo's `AGENTS.md` and `INVARIANTS.md` first. Blocks are shadcn registry items on Base UI (`base-nova`); the `shadcn` skill covers the registry and CLI.
- **A new or changed screen or component gets a scenario**: `ux/scenarios/<kind>-<name>.json` (3 to 6 states, 2 to 4 flows, invented French content) and a fixture in `ux/fixtures/`, per `ux/README.md` (the harness is not on boring-ui main yet on 12 November 2026: until it merges, say so in the pull request and prove the screen with `prove-it` alone). Then `node ux/runner/cli.mjs list`, `capture`, look at the pictures, `check`. A step the kit cannot do yet carries `gap: "why"`; never invent a component in a scenario.
- A kit change reaches apps through a kit release and an app rebuild (slow: tens of minutes). Say in the pull request which apps it changes and check one of them after the release.
