---
name: persona-sim
description: "Stress-test a conversational agent with LLM-played people. Use for persona simulations, hidden-goal conversation evals, player-model comparisons, A/B testing agent variants, or testing how a PM, assistant, or support bot handles different people."
---

# Persona sim

Use fictional people to find failures in a conversational agent's discovery, execution, boundaries, and explanations. Deliver a reproducible experiment and an evidence-backed report, not a claim about human users. Plausible dialogue is not user research. See [sources and limits](references/sources.md).

## 1. Define the experiment

Identify the agent under test, its instructions, tools, observable records, and acceptable outcomes. Use an isolated test environment with fictional data. Never authorize real purchases, deployments, messages, or access to private records through simulated consent.

Separate tuning cases from fresh held-out cells before testing. Freeze the agent, tools, personas, prompts, scorer, and model settings before opening held-out results. A cell combines a persona, goal, player model, and repeat. New wording on a tuning case does not make it held out. Any inspected cell is development evidence for future revisions, never reusable held-out proof.

## 2. Define people and goals separately

Fill in the [persona template](references/persona-template.md) and [scenario template](references/scenario-template.md). Keep ground-truth success checks separate from player-visible facts. Include a first-person backstory, recent incident, practical stakes, domain knowledge, explicit knowledge limits, hidden goal, private facts with disclosure triggers, constraints, decision authority, language, style, starting emotion, patience, and stopping rule.

Cross roles with goals rather than equating expertise with temperament. A software beginner can understand their work. An expert can be friendly. Use incidents to explain resistance instead of ordering a player to stay angry. Keep facts stable across repeats. Define acceptable refusals or alternatives before scoring.

## 3. Isolate the player

Fill in the [player prompt](references/player-prompt-template.md). Give the player only its private profile and public dialogue, never backend records or the evaluator's rubric. Give the tested agent only the player's public `message`, never the profile, hidden goal, controls, or self-report.

Require ordinary in-character chat, answers limited to the question asked, no unsolicited fact dump, no automatic praise or approval, and no invented knowledge or permissions. The player must not optimize the agent's score or disclose its instructions. Emotions follow the interaction. Helpful clarification can restore confidence.

Validate the [response envelope](references/player-response.schema.json) and [private self-report](references/self-report.schema.json). Keep perceived success, understood status, feeling misled, frustration, and the reason private. They are perceptions, not ground truth. Enforce turn and tool-step limits outside the player. Deliver a final acceptance or instruction before stopping, let the agent respond, then refresh the private report without reopening the conversation.

## 4. Score evidence before opinions

Use the [scoring checklist](references/scoring-checklist.md) in this order:

1. Check the ground-truth outcome and forbidden side effects against ordered records. A promise is not execution, and acceptance is not delivery.
2. Apply deterministic protocol and safety checks. Label lexical heuristics as approximations.
3. Check factual claims against evidence available before each message. Separate unsupported claims from extraction failures and comparator gaps.
4. Ask an advisory judge about agent adaptation and player fidelity separately. Neither the judge nor the self-report can override recorded outcomes or honesty checks.

## 5. Run a bounded matrix

Follow the [run protocol](references/running.md). Cross personas × goals × at least two available player models, with repeats where affordable. Compare matched cells with the same facts, not identical generated dialogue. Report unavailable models rather than substituting silently.

Bound concurrency across agent, player, extractor, and judge calls. Interleave roles and goals so an early budget stop does not erase a whole role. Reserve allowance for scoring and fresh held-out evaluation before tuning.

Use one durable ledger for probes, pilots, retries, all model roles, and interrupted calls. Admit a call only if spent plus in-flight reservations plus its conservative reservation fits the cap. Unknown prices fail closed. Charge unknown usage at the full reservation. Preserve costs across restarts. Estimated prices are not a billing guarantee.

## A/B testing

To compare two agent prompts, skills, models, or tool designs, follow the [A/B testing protocol](references/ab-testing.md). Declare one changed factor, freeze both variants, and use fresh held-out scenarios. Run paired cells in the same run with identical personas, goals, private facts, seeds, and player models. Interleave A and B and reserve budget for complete pairs before starting either variant.

Choose the primary metric, non-inferiority margin, and guardrails before running. Audit agent failures separately from evaluator errors in each pair. Report paired differences and uncertainty, including "no detectable difference" when warranted. Ship B only when the primary meets the declared margin and no guardrail regresses.

## 6. Read failures before changing anything

Inspect transcripts and ordered records. Classify each finding as an agent failure, player failure, evaluator error, or infrastructure/budget interruption. Preserve raw verdicts and annotate corrections separately. Fix a broken evaluator instead of teaching the agent to satisfy a false positive.

Report planned, attempted, completed, interrupted, and unscored cells; matched comparisons; costs; stop reasons; private perceptions; and advisory fidelity separately. Missing cells are not passes. Worst-cell repeats diagnose failures but are not unbiased reliability estimates or fresh held-out cells. Fewer tokens, questions, or turns alone do not prove a better experience. Recommend changes only after this audit, then evaluate the next frozen version on untouched cells.
