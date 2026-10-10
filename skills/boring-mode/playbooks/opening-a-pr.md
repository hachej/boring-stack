### Opening a PR

Invoked at the end of every other playbook. Adapted from pstack's Opening a PR (Lauren Tan, MIT) for the Boring Factory.

**Branch.** Work on the task branch the work packet names (`boring/T<n>`). One task, one pull request, opened ready (never a draft), into the default branch.

**Before you push.** Run the project's check command (`project.md` `check:`) and make it pass. Run **unslop** over the diff's prose and **no-comments** over its comments. Keep commits small and ordered (**principle-sequence-verifiable-units**).

**Proof (nothing merges without it).**

- Put the artefacts under `.verify/proof/T<n>/` and commit them: screenshots, the verify CLI's `report`, logs, test output.
- The body's evidence table (the template's) has one row per acceptance line of the task:

| AC | Evidence | Kind | Candidate | Result | Limitations |
|----|----------|------|-----------|--------|-------------|
| AC-1 | `.verify/proof/T52/ac1.png`, `test/e2e/video.spec.mjs` "proposes a video" | driven-ui | <head sha> | pass | the real model's wording |

  The kind must be at least the contract's `proof_required` for that line (test < driven-ui < real-model). Never claim `expert`, and never a kind stronger than what ran.

**Merge danger.** Add one line to the evidence: is the change a one-way or a two-way door (can it be undone by reverting the pull request, or does it leave data, a migration or an external effect behind), and its blast radius (what else it can break; see **blast-radius**). The Factory bot merges only what is green, simple and low-risk; this line is what it reads.

**Body.** Follow `.github/pull_request_template.md`. The first line is `Refs #<feature> · Closes #<task>`; never close the feature. Write it with **technical-writing** and **unslop**: why, scope, the evidence table, known issues as issues with an owner.

**After opening.** The CI job runs the check command; the triage agent reviews your proof on the head. A failure comes back as one comment saying what is missing: fix it on the same branch. A question for a person is a `boring:ask` comment. Never merge, approve, or touch another task's branch.
