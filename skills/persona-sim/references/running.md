# Run protocol

Use any runner that can keep contexts separate, isolate test state, enforce limits, and save ordered evidence. This skill requires no particular provider, SDK, server, or product tooling. Do not start paid calls without an explicit budget.

## Plan and freeze

1. Write an experiment manifest with agent version, prompt hashes, tool and scorer versions, persona and goal versions, model IDs, sampling settings, planned cells, repetitions, concurrency, limits, price snapshot, and budget.
2. Split development cases from untouched held-out cells. Keep held-out fixtures and results out of tuning contexts. Predeclare the split and freeze all evaluated artifacts before opening held-out results. Historically inspected cases are not newly held out because their wording changed.
3. Reserve money for closure, extraction, and scoring, plus the held-out phase. Use separate phase allowances under one total cap. Reduce the matrix if the minimum useful coverage cannot fit. Worst-cell diagnostic repeats need their own allowance and are not held-out confirmation.
4. Test the host offline with scripted model responses. Prove isolation, schema rejection, terminal acceptance delivery, turn limits, state reset, budget admission, and interruption recovery before a paid pilot. Verify that the scorer detects missing outcomes and forbidden effects.
5. Run availability probes and a small development pilot within the same ledger. Do not silently substitute unavailable models. Correct host bugs before freezing the real comparison. Preserve excluded pilot records and their costs.

A small example is four personas × three goals × two player models × two repeats, or 48 conversations per agent version. These are exploratory counts, not a statistical power claim. If comparing agent versions, match identical starting facts, tools, and player models. Give each run a fresh conversation and isolated state. Randomize or counterbalance version order where possible and record the schedule.

## Schedule with bounded concurrency

Interleave personas and goals, with player models paired nearby. Do not exhaust the budget on every beginner case before reaching an expert. Record planned cells before starting and persist each transition to started, completed, interrupted, or not started.

Set a fixed worker count, for example two conversations. Keep extractor and judge work inside those worker slots or under another explicit bounded queue sharing the same ledger. Bound per-call timeouts, agent turns, tool steps, and retries independently. Do not retry a failing provider forever.

Keep state, conversation IDs, private profiles, and output files separate between workers. Use one ledger owner for budget admission and one artifact writer, or transactional equivalents. Never let concurrent calls independently inspect the same remaining balance and both spend it.

## Account for every call

Before admitting a call, require:

```text
settled_cost + all_in_flight_reservations + new_reservation <= total_cap
```

Reserve conservative uncached input cost and the enforceable maximum output cost, including reasoning tokens. If the provider ignores requested output limits, reserve its documented full maximum. Include tool definitions and structured-output instructions in input estimates. Reject unknown prices or unsupported bounds rather than guessing a small expected response.

Persist a pending ledger entry before dispatch. Record call ID, cell, phase, role, exact model, price version, reservation, status, usage, and cost. Charge probes, pilots, tested-agent calls, players, repairs, retries, extraction, judging, and report-only closure calls.

For successful calls with valid usage, replace the reservation with the usage-based cost. Do not add both. Charge failed, interrupted, or missing-usage calls at their full reservation unless reliable usage establishes a different cost. Keep unknown tokens unknown. A budget denial before dispatch is not a charged model call.

Checkpoint pending entries and transcripts atomically after tool actions and paid completions. On restart, conservatively settle unresolved pending calls and carry the cumulative ledger forward. Never reset spending by renaming a results file. Link reconciled calls by ID so usage is not counted twice. Pause admissions while reservations consume remaining capacity. Stop when settled spending leaves insufficient room for a new call, even if some nominal allowance remains.

Publish both usage-based charges and conservative unknown-usage charges. Price-equivalent subscription estimates are not invoices. Reservations and provider limits do not guarantee a hard billing cap. Use provider-side spend limits where available.

## Preserve and report

Save the manifest, frozen hashes, planned matrix, actual model identities, ordered public messages, ordered tool arguments and results, final state, private controls, reports, raw scorer outputs, stop reasons, errors, and cost ledger. Redact credentials before saving. Use fictional data and exclude raw private artifacts from public publication unless reviewed as safe.

Regenerate summaries offline from saved artifacts. Report these separately:

- Planned cells, started attempts, completed conversations, interrupted attempts, unscored attempts, and cells never started.
- Outcome and honesty denominators, evaluator errors, private-report validity, player failures, and advisory judge availability.
- Matched agent and player-model comparisons, unmatched coverage, language or domain confounding, and sampling limits.
- Per-role cost, interrupted-call charges, carried pilot spending, and unused allowance that reservations prevented spending.

Deliver final acceptance before ending a conversation. Obtain a private report after the agent's response, as described in the [player host contract](player-prompt-template.md). If the budget cannot finish that sequence, report an incomplete conversation even when a partial record already contains the desired outcome.

Inspect failures using the [scoring checklist](scoring-checklist.md) before changing the agent. Diagnose selected worst cells with fresh conversations, but label their selection bias. After tuning on any inspected result, freeze the next version and use untouched held-out cells. Neither a fresh transcript of the same inspected cell nor a corrected scoring pass restores held-out status.
