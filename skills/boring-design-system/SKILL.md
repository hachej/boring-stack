---
name: boring-design-system
description: "How every Boring app is styled: shadcn as the base, one theme file and one DESIGN.md per app, every visual value a token. Use for any UI work in a Boring app: starting a new app, adding or changing a screen or component, restyling, rebranding, dark mode, charts, chat, 'make it look like X', or fixing a design-* lint failure. Takes precedence over generic design skills on fonts, colours and libraries."
---

# Boring design system

Every Boring app is built on **shadcn/ui**. The template (`hachej/boring-app`)
starts from the default look (preset `bIkeymG`: vega, neutral, Inter, Lucide,
Base UI). An app gets its own look by changing **token values**, never by
adding styles. Install with the **shadcn** skill, which this skill depends on.

## Read first

1. **shadcn** skill, for components, composition, forms, icons, chat and CLI
   rules (`rules/`, `cli.md`, `customization.md`, `design-system.md`).
   Obey it; this skill only adds what is ours.
2. The app's `DESIGN.md` (the look and its rules) and its **theme file**
   (`web/src/index.css`): the only source of the exact token names and
   values. Do not rely on a list from memory; read the file.
3. `cd web && npx shadcn@latest info --json` before touching `web/`.

## The principle

Every visual value is a token, components read only tokens, and an app
overrides any token in its theme file. Nothing else carries a visual value.
The families:

| Family | What the tokens cover |
|---|---|
| Colours | All shadcn semantic colours (background, card, primary, muted, accent, destructive, border, input, ring, sidebar), the status colours (success, warning, info, with soft variants), the chart series |
| Typography | Font families (display, sans, mono), the size scale, weights, line heights, tracking |
| Shapes | Radius tiers, border width |
| Shadows | The shadow scale (xs to lg), mapped into Tailwind |
| Spacing and density | The base spacing unit, control heights, touch target |
| Focus | Focus ring colour, width, offset |
| Motion | Durations and easing |

Each has a neutral default in the template, so an untouched app looks like
default shadcn. A token with no shadcn slot is added the way `design-system.md`
of the shadcn skill says: variable in `:root` (and `.dark` if it changes), then
registered in `@theme inline`, in the theme file only.

The shadcn **style** (vega, nova, maia, lyra, luma, mira, rhea, sera), chosen
through the preset, is the knob for geometry that tokens cannot reach: control
padding, density, how raised the components are. Pick it with the table in
`design-system.md`; tokens do the rest.

## DESIGN.md

One per app, at the repository root: YAML frontmatter (the tokens as the
designer states them: colours light and dark, typography, rounded, spacing,
components, plus `preset`, `style`, `baseColor`, `iconLibrary`), then prose:
how the look is built, **Do**, **Don't**, known gaps. It states what the
theme file holds and why. Change both together: a value changed in one and not
the other is a bug. If someone gives you a brand spec or another DESIGN.md,
follow the shadcn skill's `design-system.md` (steps 3 to 5) to map it.

## Customising an app's look

1. Edit `DESIGN.md` (new values, and why).
2. Change token values in the theme file. Fonts: a `registry:font` item or the
   theme's font tokens, never a `<link>` or `@font-face` in a component.
3. Changing the base preset or style: `cd web && npx shadcn@latest apply <preset>`
   (`--only theme,font` to keep components). It rewrites the theme file, so
   reapply the app's token values afterwards and read the diff. Never decode a
   preset by hand.
4. A needed value has no token: add one (above), then use it everywhere.
5. Refresh the design system page and its baselines (below).

## Lint rules

`scripts/verify` (`node scripts/verify.mjs check`, and CI) enforces the rules
in `scripts/verify/ARCHITECTURE.json`; the `design-*` ids are the law.

| Rule | Fix |
|---|---|
| `design-semantic-colors` | No hex, `rgb()`, `oklch()` literal or palette class (`bg-blue-500`, `text-white`) in app code. Use a semantic class (`bg-primary`, `text-muted-foreground`); if none fits, add a token |
| `design-no-dark-overrides` | No `dark:` colour. The tokens switch with `.dark`; set the dark value in the theme file |
| `design-gap-not-space` | No `space-x-*` or `space-y-*`. Use `flex` and `gap-*` |
| `design-theme-one-file` | No `@theme` or theme variable outside the theme file. Move it there |
| `design-tokens-only` | No arbitrary value (`text-[..]`, `rounded-[..]`, `shadow-[..]`). Use a scale step, or add a token |

Fix the code, not the rule: never add an `allow` entry to pass. Exempt today:
`components/ui/` (CLI-owned) and the vendored `components/feedback/`.

## The /design-system page

`/design-system` renders every installed component and the chat components,
in light and dark; a Playwright test holds screenshot baselines
(`test/e2e/design-system.spec.mjs`). A new component goes on the page too
(`showcase-coverage.mjs` of the shadcn skill lists the missing ones).
When the theme changes **on purpose**, update the baselines in the same pull
request (`--update-snapshots`), look at every changed image, and say in the
PR what changed and why. A baseline diff you did not intend is a bug.

## Chats and feedback inherit the theme

The shared chat kit (boring-ui) and the in-app feedback read only the
tokens and follow `.dark`. Restyle them by changing tokens, never with kit
CSS. Compose the shadcn chat components (`MessageScroller`, `Message`,
`Bubble`, `Attachment`, `Marker`). Charts take `--chart-1..5`.

## Never

- A raw colour, a `dark:` colour override, `space-x/y`, an arbitrary value.
- Per-component CSS or a `<style>` for looks; a second stylesheet of tokens.
- Another UI library (MUI, Chakra, Mantine, Ant) or hand-rolled dialog,
  dropdown, toast, spinner, bubble: compose shadcn; search registries first.
- Hand-editing `components/ui/` for a one-off (change a token, the preset, or
  wrap the component) or forking a kit file (fix it upstream).
- Putting a theme variable anywhere but the theme file.

## Precedence over other design skills

For a Boring app these hold even when another skill says otherwise:
`frontend-design` (avoid Inter, pick unexpected fonts and palettes, vary per
project) means: express the distinctive look through tokens and `DESIGN.md`;
`pick-ui-library` means: shadcn first (it only covers what shadcn lacks, such
as motion, charts beyond shadcn's, drag and drop, virtualization; wire it
with token colours); `emil-design-eng`, `make-interfaces-feel-better`,
`interaction-design`, `animate`, `mobile-native`, `prototype`: craft and
motion rules stay, but values (radii, shadows, easing, durations, fonts) come
from tokens, and `prototype` variants use the app's tokens.

## Worked example: a strong brand through tokens only

Fitness wants indigo and lime, Barlow Condensed headings, Hanken Grotesk
body, JetBrains Mono numbers, 2 to 4px radii, 2px borders, hard offset
shadows. No component changes:

1. `DESIGN.md`: record the palette, fonts, radii, border width, shadows,
   and the Do/Don't ("lime only for the single primary action", "no soft
   shadows").
2. Style: boxy and sharp, so `npx shadcn@latest apply lyra --only theme,font`
   if the base is still the default; check the diff.
3. Theme file, values only: `--primary` indigo with its foreground,
   `--accent` lime with its foreground, `--ring` indigo; the dark values in
   `.dark` (not in components); radius tiers pinned to 2 to 4px; the border
   width token set to 2px; the shadow scale set to hard offsets
   (`4px 4px 0 0 var(--foreground)` style, zero blur); display, sans and mono
   font tokens to the three families, loaded as fonts in the theme; status and
   chart colours retuned to the palette.
4. Screens keep `bg-primary`, `rounded-lg`, `shadow-md`, `font-display`
   (names as in the theme file). Run `verify check`: no rule fires.
5. Update the `/design-system` baselines and review each image in light and
   dark. Chats and feedback follow without any change.

If the look needs something no token expresses, add the token (theme file and
`DESIGN.md`) rather than a one-off style.
