---
name: design
description: "How a Boring screen should look and feel, and which design skill to load at which moment. Replaces the UI-work paragraph of the old boring-mode and the eleven design skills a worker used to see at once. Use for any change a person will see: a new screen, restyling, polish, motion, phone layout, or a screen that 'feels off'."
---

# Design

## Who wins

1. **The person's words** on the card (and its reference mockup).
2. **The project's design system**: the app's `DESIGN.md` and theme tokens, built with the kit's `boring-design-system` skill, checked by `npx boring-ui-blocks design`.
3. **Craft skills** (below): how to do it well inside 1 and 2. A craft skill never picks a font, a colour, a radius, a shadow, an icon set or a library; it uses the tokens and the kit parts that exist.

## The foundation (every change a person sees)

- **Simple and easy to use.** One main action per screen; the words a person would use; nothing on screen that does not help the task.
- **One accent**, used for the one primary action. Everything else is neutral.
- **« tu »** in French copy, short sentences, no internal words (ids, states, model names).
- **Kit parts and tokens only** (`ui-kit`). Phosphor icons, Geist, the kit's control heights (44 px touch floor).
- **Look at it** at 390 and 1280 px, light and dark, before the pull request; the design check is clean.

## Craft, by moment (load one, when its moment comes)

| Moment | Load | Its trigger | How it differs from its neighbours |
|---|---|---|---|
| A screen works but looks or feels off; reviewing a UI diff before the PR | `emil-design-eng` | "polish", "feels off", reviewing a screen | Emil's full craft bar and review format; the default polish pass |
| Adding motion (enter, exit, a sheet, a press, a transition) | `animate` | building any animation | Builds one animation, starting with "should this animate at all?" |
| The diff added or changed motion | `review-animations` | before the PR, whenever motion changed | Strict review of that diff; flags by default |
| The card is about the motion of a whole app ("feels slow", "make it feel better") | `improve-animations` | an app-wide motion audit | Read-only audit and a plan; does not edit |
| The screen is used on a phone | `mobile-native` | any phone-first screen, a sheet, a carousel, a full-height layout | The touch and viewport fixes (100vh, zoom on input, sticky hover, notch) |
| A list, a card or a form shows data of varying length | `break-ui` | before calling a data screen done | Worst-case data (long names, zero items, huge counts) behind a toggle |
| Working inside the kit's registry (repo boring-ui) | `shadcn` | adding or changing a registry component | The shadcn CLI and registry rules the kit is built on |

In Claude Code the Emil skills are `emil-design:<name>`.

## When not to animate

No motion on keyboard actions, on anything a person does many times a day, on numbers and data that change (show the new value at once), or to decorate. Motion explains a change of place or state, or confirms a press. Every animation ships with reduced-motion handling and a duration from the tokens. When in doubt, `animate`'s first step decides, and "no animation" is a valid result.

## Where two skills disagree

- **Shadows, borders, radii, fonts, palettes** (in `emil-design-eng`, `make-interfaces-feel-better`, any style skill): the tokens win. A card is flat (`design-card-flat`); depth is a token, never a hand-written shadow.
- **Library choice:** the kit first; another library only for what it lacks (motion, drag and drop, virtual lists), with token colours.
- **`emil-design-eng` and `review-animations`** both review motion: `review-animations` is the gate on a motion diff; `emil-design-eng` is the whole-screen pass.

## Left out of the default set

Still installed for a person who asks by name; never routed to:

- `frontend-design`, `design-impeccable`: start from a bold, distinctive aesthetic; our apps start from the kit and one accent.
- `minimalist-ui`, `redesign-existing-projects`: impose their own fonts, palettes, textures and stock imagery, which the design check refuses.
- `make-interfaces-feel-better`, `interaction-design`: overlap `emil-design-eng`, and "shadows over borders" contradicts the kit's flat cards.
- `find-animation-opportunities`, `pick-ui-library`, `prototype` (Emil's): useful by hand; a worker on a card does not need them.
- `ui-polish`: a paid, licensed bundle with a zero-width watermark; not redistributable.
