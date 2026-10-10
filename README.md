# boring-stack

**All the skills of the Boring platform, in one public repository**, laid out
for the [skills CLI](https://github.com/vercel-labs/skills): one folder per
skill under `skills/<name>/`.

| Repository | Role |
|---|---|
| **hachej/boring-stack** (this one) | The skills: the expert's PM, the workers' stack, the maintainer's setup skill |
| hachej/boring-app | The app template: agents, tools, server, web, declared in `boring.json` |
| hachej/boring-factory | The Factory around an app: triage, workers, the gates, `init` |

## Who installs what

| Who | Command | What they get |
|---|---|---|
| The expert (their local agent) | `npx skills add hachej/boring-stack --skill boring-pm -g` | `boring-pm`: the interview, the contract, approvals, trials |
| A developer or a worker | `npx skills add hachej/boring-stack -g` (or `--skill <name>` for a list) | The whole stack, starting with `boring-mode` |
| The maintainer | `npx skills add hachej/boring-stack --skill boring-new-app -g` | `boring-new-app`: a new app repository, end to end |

The Factory's workers install the stack at run time (`npx skills add
hachej/boring-stack -y`); app repositories carry no skills.

## The skills

| Skill | For |
|---|---|
| `boring-pm` | The expert's product manager: interview, contract pull request, approval by review, builders' questions, trials |
| `boring-new-app` | The maintainer: create and wire a new app repository |
| `boring-mode` + playbooks | The workers' router: work packet, acceptance lines and their proof, playbooks (investigation, bug fix, feature, refactoring, perf, prototype, visual parity, opening a PR with the evidence table) |
| `writing-for-agents` | The maintainer: writing skills, `AGENTS.md` and `CLAUDE.md` for agents (Matt Pocock, MIT) |
| `new-agent`, `verify-app`, `verify-this`, `platform-request`, `reflect` | Working in a Boring app: capabilities, verification, platform requests, learning |
| `principle-*`, `how`, `why`, `architect`, `arena`, `blast-radius`, `interrogate`, `tdd`, `figure-it-out`, `show-me-your-work`, `teach`, `technical-writing`, `unslop`, `no-comments`, `bro`, `typescript-best-practices`, `create-verification-skill`, `maintain-verification-skill` | pstack (Lauren Tan, MIT) |
| `emil-design-eng`, `animate`, `review-animations`, `find-animation-opportunities`, `pick-ui-library`, `mobile-native`, `prototype` | Emil Kowalski's interface skills (MIT) |
| `make-interfaces-feel-better`, `interaction-design`, `frontend-design` | From poteto/noodle (MIT; `frontend-design` Apache-2.0) |

Sources and commits: `SOURCE.json`; attribution: `THIRD_PARTY.md`; each
third-party skill carries its `LICENSE`.

## Process map

From a need to a merged change: which skill does each step, and who runs it.
The expert never touches the Factory's steps; agents never merge.

| Step | Skill(s) | Who runs it |
|---|---|---|
| Interview | `boring-pm` (`discovery.md`) | The expert's agent, with the expert |
| Glossary | `boring-pm` (words asked while interviewing, written to `docs/product/CONTEXT.md` on the contract branch) | The expert's agent; the expert confirms each term |
| Escalation map | `boring-pm` (a `kind:map` issue: Destination, Decisions so far, Fog, Out of scope) | The expert's agent |
| Contract | `boring-pm` (`templates/contract.md`, `mockups.md`) | The expert's agent |
| Approval | `boring-pm` (the expert's review on the exact commit) | The expert, through their agent |
| Triage split | none (the Factory's triage; ignores `kind:map`) | The Factory |
| Bug intake | `boring-pm` (`tickets.md`: a `kind:bug` issue) | The expert's agent |
| Build | `boring-mode` and its playbooks, `new-agent`, the principles | A Factory worker (`builder:agent`), or a person (`builder:human`, their PR says `Closes #N`) |
| Tests | `tdd`, `verify-app`, `verify-this`, `principle-test-behavior-not-implementation` | The builder; CI |
| PR and evidence | `boring-mode` (`playbooks/opening-a-pr.md`, with its Merge danger line) | The builder. A human or expert-agent PR opens as a draft and is marked Ready for review when the expert says it is done |
| Review and proof | `interrogate`, `blast-radius`; the Factory's `boring/ci` and `boring/proof` checks | The Factory |
| Merge | none | The Factory bot only: merges when green, simple and low-risk, otherwise asks the maintainer |
| Learning | `reflect` | The builder or the maintainer |

A tiny, cheap-to-retry change skips the contract (the one-shot lane,
`boring-pm` `discovery.md` §1b) but not the Factory: it is a draft pull
request, checked and merged by the bot like the rest.

## Evals and checks

`evals/README.md` specifies the PM evals (process rules on every run,
interview quality against a hidden need sheet). `python3 scripts/check.py`
checks every skill offline (front matter, licences, portable links, JSON).

Original material is [MIT licensed](LICENSE). Referenced works retain their own licenses and copyrights.
