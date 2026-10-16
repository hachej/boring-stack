# A/B testing

Compare two variants of the tested agent, not two unrelated batches. Follow the [run protocol](running.md) for isolation, call accounting, and saved evidence. No paid calls without an explicit budget.

## 1. Declare one difference

Record immutable IDs or hashes for A and B. Name the single factor that differs, such as an old versus new prompt, skill revision, agent model, or tool design. List the exact changes within that factor. If several factors differ, label the result a bundled comparison, not evidence about any one change.

Hold everything else fixed, including backend starting state, permissions, limits, player instructions, player model and sampling settings, and scorer. For an agent-model comparison, change the tested agent's model, never the player model. For a tool-design comparison, keep the underlying capabilities and world facts equivalent.

Freeze the manifest, both variants, scorer, and decision rule before evaluation. Use fresh held-out [scenarios](scenario-template.md) that have never informed either variant. Keep held-out fixtures and results out of tuning contexts. Reworded development cases and fresh repeats of inspected scenarios are not held out. After any tuning, use new untouched scenarios for the next decision.

## 2. Plan paired cells

Give each pair a stable ID. Its two cells must share:

- Persona and scenario versions, goal, private facts, and disclosure triggers.
- Backend fixture, authority, language, and starting context.
- Seed, player model, sampling settings, and repeat index.

Run both variants within the same experiment run. Start each conversation with fresh, isolated state. Never pass one variant's transcript, mutations, or private report to the other. A common seed controls starting randomness where supported. It does not guarantee identical generated dialogue. Record providers that cannot honor seeds.

Save the schedule before running. Randomize pair order across personas and goals. Randomize or counterbalance A-first and B-first within pairs, such as A1, B1, B2, A2. Keep pair members adjacent where practical. Do not run all A cells before B, or complete one persona's entire matrix first. A player-model matrix needs a separate A/B pair for each player model.

## 3. Admit complete pairs only

Estimate a conservative upper bound for both conversations, including agent and player calls, terminal messages, private reports, extraction, judging, and bounded retries. Use enforceable turn, tool-step, timeout, and output limits. Reserve closure and reporting costs too.

Before starting either member, atomically reserve the entire pair allowance under the total ledger cap. Never start A without budget for B, or B without budget for A. Keep the partner's allowance unavailable to other pairs. At admission, require:

```text
settled_cost + in_flight_reservations + unspent_pair_allowances
  + new_pair_allowance + unspent_closure_allowance <= total_cap
```

Move money from the pair allowance into each pending call reservation, then settle it as described in the run protocol. Do not count the same reservation twice. Charge interrupted calls at their full reservation unless reliable usage establishes another cost. Persist spending and reservations across restarts. A retry cannot consume the partner's allowance.

If the matrix cannot fit, reduce coverage before opening held-out results. Stop admissions between pairs, not after spending one arm's budget. Provider failures can still leave incomplete pairs despite reservations. Preserve both members' evidence and costs, report the incomplete pair, and exclude its lone score from paired inference. Never fill gaps with historical A results. Use only predeclared, bounded recovery rules, not retries selected by outcome.

## 4. Choose metrics and thresholds first

Predeclare one primary metric, its direction, aggregation, confidence level, analysis method, minimum usable coverage, and non-inferiority margin. Examples are ground-truth goal success or the proportion of conversations with an audited honesty violation. Do not switch metrics after seeing which favors B.

Predeclare guardrails for private frustration, turns, tokens, and cost. Specify scales, denominators, missing-data rules, allowed regression thresholds, and hard safety failures. Use zero as the allowed regression unless an explicit tolerance is justified before the run. Keep token counts separate from monetary cost. Lower cost or fewer turns cannot compensate for worse outcomes or honesty.

## 5. Audit each pair before deciding

Use the [scoring checklist](scoring-checklist.md) to inspect ordered records and transcripts for both members. Keep raw verdicts and record each finding separately as an agent failure, player failure, evaluator error, or infrastructure/budget interruption. Blind the auditor to variant labels where practical.

A completed conversation with an agent failure remains a scored failure. Do not exclude refusals, bad outcomes, or honesty violations just because they hurt B. An invalid extraction or comparator false positive is an evaluator error, not agent dishonesty or success.

Correct evaluator errors against saved evidence and re-score both variants with the same version. Publish raw and corrected results separately. If a metric remains unscorable for either member, exclude the whole pair from that metric, not just the affected arm. List excluded pair IDs, affected variants, reasons, and counts. Preserve any independently verified safety finding. Never silently convert missing evidence into a pass.

Report interruptions and exclusions by variant and scenario. Completion-only estimates can hide systematic failures. If missing pairs could reverse the decision, mark the result inconclusive rather than shipping. An evaluator correction does not restore held-out status for subsequent tuning.

## 6. Analyze paired differences

For each usable pair, compute `d = B - A` on the declared metric. Report the mean difference in the metric's units, such as percentage points for binary outcomes. Do not compare unpaired aggregate rates.

For small samples, use the predeclared paired bootstrap confidence interval by resampling whole pairs, never individual arms. Save its seed, resample count, interval method, and confidence level. If repeats share a scenario, resample scenario clusters with their pairs rather than treating correlated repeats as independent scenarios.

An exact paired sign test can instead assess directional evidence. Report B wins, A wins, ties, the non-tied denominator, and the two-sided p-value. It does not estimate effect magnitude or establish a non-inferiority margin by itself.

Small samples, sparse discordant outcomes, or too few independent scenarios can make inference uninformative. A degenerate bootstrap interval from identical observed outcomes does not prove zero risk. Report descriptive counts and the limitation. Say "no detectable difference" when the data do not distinguish the variants. This does not mean equivalence or prove non-inferiority.

## 7. Apply the frozen decision rule

Ship B only if the primary is not worse beyond the declared margin and no guardrail regresses beyond its predeclared threshold. For a higher-is-better primary, require the lower confidence bound for `B - A` to be at least `-margin`. For a lower-is-better primary, require the upper bound to be at most `margin`.

Require usable uncertainty estimates, minimum coverage, and the declared guardrail checks. For a lower-is-better guardrail, require the upper confidence bound for `B - A` to stay within its allowed regression. Treat unresolved guardrail evidence as inconclusive. A verified hard safety failure blocks shipping regardless of the average. Otherwise retain A and report either a regression or insufficient evidence. Do not treat a nonsignificant sign test as permission to ship.

## Report template

- Run ID, manifest, variant hashes, and single changed factor: `<links and description>`
- Held-out provenance, frozen versions, seeds, and saved schedule: `<evidence>`
- Primary, direction, margin, guardrail thresholds, and minimum coverage: `<frozen rule>`
- Planned / attempted / completed / usable / incomplete pairs: `<counts and reasons>`
- Analysis method, independent scenario count, confidence level, and resampling details: `<settings>`

Use the same usable pairs for A, B, and the difference within each row. Different metrics may have different usable denominators. Label units and whether higher or lower is better.

| Metric | Usable pairs | A | B | Difference B - A | CI | Evaluator-excluded pairs | Cost A / B |
|---|---:|---:|---:|---:|---|---|---|
| Primary `<unit>` | `<n>` | `<value>` | `<value>` | `<delta>` | `<bounds or unavailable>` | `<count, IDs, reasons>` | `<amounts>` |
| Frustration `<scale>` | `<n>` | `<value>` | `<value>` | `<delta>` | `<bounds>` | `<count>` | `<same run>` |
| Turns | `<n>` | `<value>` | `<value>` | `<delta>` | `<bounds>` | `<count>` | `<same run>` |
| Tokens | `<n>` | `<value>` | `<value>` | `<delta>` | `<bounds>` | `<count>` | `<same run>` |
| Cost `<currency>` | `<n>` | `<value>` | `<value>` | `<delta>` | `<bounds>` | `<count>` | `<amounts>` |

Also report win/loss/tie counts, agent failures, evaluator corrections, player failures, and interruptions by variant with pair-level evidence links. Publish all-attempt cost separately from paired costs, including excluded pairs, pilots, retries, interrupted calls, unknown-usage charges, and unused reservations. End with the frozen rule's result: ship B, retain A for regression, or inconclusive. State that simulated personas do not establish real-user effects.
