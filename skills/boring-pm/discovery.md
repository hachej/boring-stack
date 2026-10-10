# Discovery: from a need to an approved contract

Output: `features/F-<n>.md`, valid, approved by the expert's review on the
contract pull request's exact head. Not output: code, a build, a promise.

## 1. Read before asking

- The feature issue `#<n>`: `gh issue view <n> --comments`. No issue yet: file
  one first ([tickets.md](tickets.md)); its number is the feature's `F-<n>`.
- The contract on the default branch (`git fetch origin && git show origin/HEAD:features/F-<n>.md`)
  and on its branch if a discovery is under way (`git show origin/contract/F-<n>:features/F-<n>.md`).
- The project's `docs/product/` (with its glossary, `CONTEXT.md`), `CAPABILITIES.md` (what the app can and cannot
  do) and `decisions/`.
- If the contract has a `next_question`, resume there. Never restart an
  interview; never ask what is already written.

## 1b. Simple or complex: size the interview to the change

Judge how much the need requires before asking anything.

- **A simple change** is one the expert can judge by looking: how something
  looks, reads or is placed on a screen. It needs no interview. Say in one
  sentence what you will show, show it (a preview of the app when one is
  available, otherwise a mockup, [mockups.md](mockups.md)), and let the expert
  accept or adjust what they see. The acceptance lines are the exact changes
  they accepted. Leave out the sections that do not apply rather than filling
  them with "not specified".
- **A complex change** touches behaviour, data, a workflow or safety. Use the
  interview below, but ask only the questions whose answers would change the
  contract, and show what can be shown as early as you can.
- **A one-shot change** is a simple change that is also tiny and cheap to get
  wrong: the diff is a few lines, the result is quick to judge, and trying again
  costs almost nothing (no personal data, authentication, money or migration).
  There is no contract. Make the change yourself on a branch and open it as a
  **draft** pull request, titled in the expert's words, with an evidence section
  in the body: what changed, how it was checked. Show the result, and mark it
  "Ready for review" (`gh pr ready <pr>`) only when the expert says it is done;
  align after they have seen the diff, not before. The Factory then checks it
  and merges it, or asks the maintainer. You never merge it. If the change turns
  out bigger than it looked, stop, close the draft, and take the contract path.
- Listen to the expert: when they would rather see something than answer
  questions, show your best reading and let them correct it.
- When open questions keep multiplying, or a second need keeps surfacing, the
  work is too big for one contract: see §3b.

## 2. The person first

When you do not know it yet, the first question is about them, not the
feature: "What are you comfortable doing with software today: using apps,
setting up tools, writing code?" Then, when it matters, how involved they
want to be (try things themselves, review mockups, only accept the result).
Adapt your explanations to the answer: everyday examples for some, fields and
flows for others. Keep it in the conversation: a profile of a person is never
written to the repository. Domain expertise, software skill and willingness to
maintain things are different; never infer one from another.

## 3. The interview

- One question per message, in the project's language. Ask only what could
  change behaviour, scope, safety, acceptance or priority (see 1b: a simple
  change gets no interview).
- Start from a **recent real case**, told anonymously: what triggered it, what
  they did, what was hard, what it cost. Then probe the cues they use, the
  exceptions, and what a newcomer would miss. Do not turn a judgement into an
  invented numeric rule: an unknown threshold stays an open question.
- In this order when useful: today's workaround; the simplest useful behaviour
  versus the desired later one; failure, uncertainty and the expert's override;
  what must stay unchanged; whether existing work is affected
  (`existing_work`); how fast the first useful result must come (`latency`).
- Separate what the software should do, what it should suggest, and what the
  expert keeps deciding.
- **Facts are your job.** What the repository, `docs/product/`, `CAPABILITIES.md`
  or `decisions/` can tell you, you find yourself; the expert is asked only for
  what they alone know.
- **Recommend an answer** when the question is about a fact or a wording, so
  that "oui" accepts it: "Je note « fiche de suivi ». C'est bien ça ?". Never
  for a trade-off: you give the options, the expert decides. Still one question
  per message.
- **Reformule simplement.** When the expert seems lost, or says so, stop and
  re-explain the current point in plain words, with a little context and the
  glossary's terms, then repeat the one question.

### Words: the glossary while you ask

`docs/product/CONTEXT.md` is the project's glossary: the expert's words, each
with a short definition and the synonyms to avoid (`_Avoid_`). Read it in §1.

- When the expert uses a fuzzy word, or one that conflicts with `CONTEXT.md`,
  the one question is "X ou Y ?": "Vous dites « client » : le patient ou
  l'entreprise qui paie ?" Propose the precise term yourself.
- When a term is settled, write it in `CONTEXT.md` right then, on the contract
  branch (§4), in the expert's language: the term, a definition, `_Avoid_`.
  Do not batch them. The approval covers the glossary as well as the contract.
- The glossary holds words only: no tables, screens, endpoints or other
  implementation details, no decisions, no scenarios.

## 3b. When one contract is not enough: a map

Stop the contract when open questions keep growing, or a second need keeps
surfacing that does not fit this feature. Say so, and open a **map** issue:

```
gh issue create --title "[carte] <the destination, in the expert's words>" \
  --label kind:map --label by:pm-agent --body "<body>"
```

The body has four sections, and the map is an index, never a store: a decision
lives in its own feature issue, the map only gives its gist and a link.

- `### Destination`: what reaching the end looks like, one or two lines.
- `### Décisions prises`: one line per settled item, its title linked, with the
  gist of the answer.
- `### Brouillard`: what you can see coming but cannot yet put as a sharp
  question; it becomes a feature when it can.
- `### Hors périmètre`: what is ruled out of this effort, and why.

Each decision to take is its own feature issue (`kind:feature`) and its own
contract `F-<n>`; link it from the map. Work one decision per session, and
refer to every item by its title, never by a number alone. These are features,
not "tasks": that word belongs to the Factory. The Factory ignores `kind:map`
issues.
- Test your understanding with a fictional scenario or a mockup
  ([mockups.md](mockups.md)) before asking for approval. Exploring is not
  building: an idea can get a mockup without becoming a contract.

## 4. Write the contract on its branch

```
git fetch origin
git switch contract/F-<n> 2>/dev/null || git switch -c contract/F-<n> origin/HEAD
```

Write `features/F-<n>.md` from [templates/contract.md](templates/contract.md):
`feature: F-<n>`, `product_owner: person:<the expert's login>`, then `need`,
`current_workaround`, fictional `scenarios`, `in_scope`,
`not_in_this_version`, `invariants`, `acceptance` (each `AC-<k>` with
given / when / then and the `proof_required`: test, driven-ui, real-model or
expert), `latency`, `existing_work`, `failure_and_recovery`, `mockups` (path
and commit), `open_questions`, `next_question`, and the body "Ce qui change
pour vous". Leave `risk` and `release_mode` null: the Factory sets them.

Versions: a new contract is `contract_version: 1`. If the contract is already
on the default branch (approved earlier) and you change anything the expert
approved, the version becomes the next number, and you say plainly that the
earlier approval no longer holds.

The branch holds only `features/F-<n>.md`, `docs/product/CONTEXT.md` when a term
changed, and files under `mockups/`. Commit and
push: `git add features/F-<n>.md mockups/ && git commit -m "contract: F-<n> v<k>" && git push -u origin contract/F-<n>`
(add `docs/product/CONTEXT.md` to the `git add` when a term changed).

The Factory opens the pull request "contract: F-<n>" for you (you cannot
approve a pull request you opened yourself). Find it:
`gh pr list --head contract/F-<n> --json number,headRefOid,url`. Within a minute
the Factory comments if the contract is invalid; read it with
`gh pr view <pr> --comments` and fix what it lists.

## 5. The approval

Only when the contract is complete and the pull request shows your last push:

1. Show the expert, in their language: the summary ("Ce qui change pour vous"),
   the scenarios, every acceptance line, what is not in this version, the terms
   added to the glossary, and the exact commit:
   `gh pr view <pr> --json headRefOid --jq .headRefOid` (it must equal
   `git rev-parse HEAD`).
2. Ask: "Do you approve this exact version (commit `<first 7 characters>`)?"
3. Only after an explicit yes to that question, in this session:
   `gh pr review <pr> --approve --body "<one line in their words>"`. The
   permission prompt asks them once more; that is expected.
4. Anything else ("change X first", silence, a vague "ok for now"): do not
   submit. Changes requested: edit, push, and ask again; a new commit needs a
   new approval.

The Factory merges the contract when the product owner's approval is on the
current head, and the feature becomes "Prêt à développer". Tell the expert what
happens next: the Factory splits it into tasks and builds them; you will
bring back questions and, when it is ready, something to try.

## 6. Pausing

Before the session ends, save `next_question` (and `open_questions`) in the
contract on its branch and push, so the next session resumes there. Then the
end-of-session summary ([tickets.md](tickets.md)).
