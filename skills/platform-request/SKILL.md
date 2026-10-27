---
name: platform-request
description: File a GitHub issue for the platform team when the app cannot do what the person needs, when something is platform-owned (the library in vendor/, models, deploy, auth, connectors), or when a change failed twice or is too big. Interviews the person first, gathers evidence and a mockup, shows the draft, then files it. Use whenever docs/CAPABILITIES.md says "Not possible", or you are stuck.
---

# Platform request

You work for the person who owns this app (a domain expert, not a developer).
Some things they ask for are not yours to build: the platform (the Boring
library, the hub, the VM, models and connectors) must change first. Your job
then is not to hack around it but to hand the platform team an issue so
complete that they can build it **without talking to the person again**.

The product of this skill is one GitHub issue, labelled `kind:platform` (the issue form `.github/ISSUE_TEMPLATE/platform.yml`), in
this repository. It is read by the platform maintainer and by their coding
agent. Everything they need must be in it.

## When

- `docs/CAPABILITIES.md` puts the need under "Not possible today".
- The change needs `vendor/`, `deploy/`, `.github/`, `server/src/auth.ts`,
  a new model provider, a connector to another system, a scheduler, email.
- Something fails and you cannot find why after two honest attempts (a
  hypothesis tested each time), or the platform behaves unlike its docs.
- The change would take more than a day, or touches security or personal data.

Not for a product change you can build here: build it (skills **boring-app-template**,
**build-app**). If unsure, check `docs/CAPABILITIES.md` and `gh issue list --label
kind:platform --state all` (it may already be asked, or solved).

## 1. Interview the person (the most important step)

The maintainer was not in your conversation. Recover the context now, while the
person is here. Talk in their language, plainly, one question at a time; never
announce how many questions remain. Stop when no answer would change the issue.

1. **The need in their words**: what they want to do, and why now.
2. **Three real situations** (not hypotheticals): for each, what triggered it,
   what they had at hand, what they did, what they decided, what went wrong or
   took time, the result. If one is imagined, say so and ask for a real one.
   Remove anything that identifies a real person (patient, client, colleague):
   change names, dates of birth, identifiers; keep the shape of the case.
3. **Today's way and its cost**: how they manage without it (time, errors,
   another tool), and how often.
4. **The decisive moment**: when they are late or under pressure, at what
   point do they give up on the current way, and what do they do instead? Ask
   this once; it tells what must be automatic and what may stay manual.
5. **Done looks like**: what they would see and do when it works. Turn it into
   "The app shall …" lines they agree with.
6. **Limits**: what must never happen (data leaving, a document changed
   without them, a cost), and how urgent it is (blocking, weekly pain, nice to have).

## 2. Gather the evidence

- What you tried: commands, the error text, the `verify` evidence
  (`network-summary --since-mark`, `console --errors`, screenshot) and the run
  rows (`verify api /api/runs`). Invented data only.
- Versions: `git rev-parse --short HEAD`, the library commit in
  `vendor/boring/SOURCE.json`, and what is deployed (`list_app_tools` on the
  the hub, see docs/CAPABILITIES.md; or the version in `/healthz`).
- Which row of `docs/CAPABILITIES.md` blocks it, or which doc the platform contradicts.
- The nearest thing possible today (the "Nearest" column), and whether you built it.

## 3. Make a mockup when the need is something to see

A picture settles what three paragraphs cannot. Pick the lightest that works:

- **Text wireframe** (always, in the issue): boxes and labels in a code block.
- **HTML mock**: one self-contained file with invented data, then a PNG of it:

  ```bash
  node scripts/mock-shot.mjs docs/requests/<slug>/mock.html docs/requests/<slug>/mock.png
  ```

  Commit both on a branch `request/<slug>` (never `main`), push it, and link the
  files from the issue (`https://github.com/<owner>/<repo>/blob/request/<slug>/docs/requests/<slug>/mock.png`).
- A screenshot of today's page (`verify screenshot`) next to the mock, when
  the change is to an existing screen.

## 4. Draft, show, file

1. Write the issue body from `issue-template.md` (next to this file) into
   `.verify/request-<slug>.md`. Fill every section; write "unknown" rather than
   leave one out, and say who could find out.
2. Show the person the title, the summary and the acceptance lines, in their
   language, and ask whether it says what they need. Correct until they say yes.
   Filing an issue is visible to others: never file before that yes.
3. File it:

   ```bash
   gh issue create --label kind:platform --title "<the need, in a few words>" --body-file .verify/request-<slug>.md
   ```

4. Tell the person the link, what happens next (the platform team triages it),
   and what they can do meanwhile (the nearest workaround).
5. Leave nothing half-built: revert a workaround you did not finish, or finish it and say so in the issue.

## Never

- Real personal data in the issue, the mockup or the evidence. The issue is
  read by people and agents outside the app.
- A change in `vendor/`, `deploy/`, `.github/` or auth to "unblock" yourself.
- An issue without the interview: "the person wants X" with no situation,
  no acceptance and no evidence will come back to them as questions.
