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
2. The app's `DESIGN.md` (the look and its rules) and its **core theme file**
   (`web/src/theme.core.css`, with `theme.derived.css`): the only source of the exact token names and
   values. Do not rely on a list from memory; read the file.
3. `cd web && npx shadcn@latest info --json` before touching `web/`.

## Set the core, never the derived

An app sets a **small set of core tokens** (the roles of the shadcn skill's
`design-system.md`, "Step 4: Map Tokens to the Theme": canvas, ink, primary
CTA, soft band, menu highlight, hairline, focus, error, status, shape, faces,
shadows) in **`web/src/theme.core.css`**, the one file an app edits, light in
`:root` and dark in `.dark`. Everything else (`--card`, `--popover`,
`--secondary`, `--muted-foreground`, `--input`, all `--sidebar-*`, the status
`-foreground` / `-soft` / `-soft-foreground`, `--chart-1..5`, the radius
steps) is **derived** from the core with `var()` and `color-mix()` in
`web/src/theme.derived.css`, which is the template's, hash-checked, and never
edited. The shadcn skill makes the role mapping a manual step; our template
makes it automatic: edit a role and every variable it maps to follows, the
sidebar included. Never set a derived token; in the rare case one must differ,
pin it in the `=== EXCEPTIONS ===` block of `theme.core.css` with a comment
giving the reason and an entry under `exceptions:` in `DESIGN.md`
(`design-theme-core-only`). Read `DESIGN.md` for the current list; do not
trust a list from memory. A `shadcn apply` rewrites `index.css` with default
colour variables: move the values into the core file and delete them from
`index.css`.

## The principle

Every visual value is a token, components read only tokens, and an app
sets the core tokens. Nothing else carries a visual value.
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

## The process

Minimum effort, high quality: the shadcn skill's `design-system.md` flow with
the role mapping automated, and invariants that fail on the usual LLM mistakes.

1. **Inputs.** The DESIGN.md roles (canvas, ink, primary, accent, soft band,
   hairline, focus, error, status, sidebar) and the shadcn **style** (preset)
   whose geometry is closest to the brand.
2. **Scaffold.** A new app starts from the template (already shadcn, vega,
   neutral). To change style: `cd web && npx shadcn@latest apply <preset>
   --only theme,font`, then reapply the core values and delete the colour
   variables `apply` wrote into `index.css`.
3. **Set only the roles.** Write them in `DESIGN.md`, then in
   `web/src/theme.core.css` (light and dark). The derived layer is automatic.
4. **Recipes to variants.** A look the components lack (a hover, a size, a
   pill) is a variant or a registry item, never ad hoc classes in a screen.
5. **The `/design-system` page** shows the core next to what it derives and
   every component; a new component goes on it.
6. **Verify.** `node scripts/verify.mjs check` (the `design-*` rules), and the
   Playwright design-system test: screenshots in light, dark and phone width,
   WCAG AA contrast of every role pair in both modes, and the fonts named by
   the font tokens actually loaded. Refresh the baselines on purpose
   (`--update-snapshots`), look at every image.
7. **Report.** In the PR: the roles changed and why, the baselines changed,
   the rules that fired and how they were fixed.

A **new app**: pick a style, write the DESIGN.md roles, set the core, verify,
done. A **change**: edit the roles, re-run the checks, refresh the baselines
on purpose.

## DESIGN.md

One per app, at the repository root: YAML frontmatter (the tokens as the
designer states them: colours light and dark, typography, rounded, spacing,
components, plus `preset`, `style`, `baseColor`, `iconLibrary`), then prose:
how the look is built, **Do**, **Don't**, known gaps. It states what the
theme file holds and why. Change both together: a value changed in one and not
the other is a bug. If someone gives you a brand spec or another DESIGN.md,
follow the shadcn skill's `design-system.md` (steps 3 to 5) to map it.

## Customising an app's look

1. Edit `DESIGN.md` (the roles, and why).
2. Change the **core** token values in `web/src/theme.core.css`, nothing else.
   Fonts: a `registry:font` item or the font tokens, never a `<link>` or
   `@font-face` in a component.
3. Changing the base preset or style: the process above, step 2.
4. A needed value has no token: add it to the core file, register it in
   `@theme inline`, use it everywhere.
5. Refresh the design system page and its baselines (below).

## Lint rules

`scripts/verify` (`node scripts/verify.mjs check`, and CI) enforces the rules
in `scripts/verify/ARCHITECTURE.json`; the `design-*` ids are the law.

| Rule | Fix |
|---|---|
| `design-semantic-colors` | No hex, `rgb()`, `oklch()` literal or palette class (`bg-blue-500`, `text-white`) in app code. Use a semantic class (`bg-primary`, `text-muted-foreground`); if none fits, add a token |
| `design-no-dark-overrides` | No `dark:` colour. The tokens switch with `.dark`; set the dark value in the theme file |
| `design-gap-not-space` | No `space-x-*` or `space-y-*`. Use `flex` and `gap-*` |
| `design-theme-one-file` | No `@theme` or theme variable outside the three theme files (`theme.core.css`, `theme.derived.css`, `index.css`). Move it there |
| `design-theme-core-only` | Set only core tokens in `theme.core.css`; `theme.derived.css` is hash-checked; a derived token is pinned only in the commented, DESIGN.md-listed EXCEPTIONS block |
| `design-theme-roles-both-modes` | Every colour role is defined in `:root` and `.dark` |
| `design-size-not-wh` | `w-4 h-4` (equal) becomes `size-4` |
| `design-no-overlay-z-index` | No `z-*` on Dialog, Sheet, Popover, DropdownMenu, Tooltip…; they stack themselves |
| `design-overlay-has-title` | Every DialogContent / AlertDialogContent / SheetContent / DrawerContent has its Title in the file (`sr-only` to hide it) |
| `design-icon-in-button` | An icon in a Button takes `data-icon`, no `size-*` / `w-*` / `h-*` |
| `design-no-raw-controls` | No `<button>`, `<input>`, `<select>`, `<textarea>` with a `className`: use the shadcn component |
| `design-no-inline-color` | No literal colour in `style={{ }}`; use a class or `var(--token)` |
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
3. Core file (`theme.core.css`), values only: `--primary` indigo with its foreground,
   `--accent` lime, `--ring` indigo (the sidebar, `accent-foreground` and
   charts follow by themselves); the dark values in `.dark`; `--radius` at 0.25rem (every step follows); the border
   width token set to 2px; the shadow scale set to hard offsets
   (`4px 4px 0 0 var(--foreground)` style, zero blur); display, sans and mono
   font tokens to the three families, loaded as fonts in the theme; the status colours retuned
   to the palette (their soft variants follow).
4. Screens keep `bg-primary`, `rounded-lg`, `shadow-md`, `font-display`
   (names as in the theme file). Run `verify check`: no rule fires.
5. Update the `/design-system` baselines and review each image in light and
   dark. Chats and feedback follow without any change.

If the look needs something no token expresses, add the token (theme file and
`DESIGN.md`) rather than a one-off style.
