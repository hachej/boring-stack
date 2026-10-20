# Persona template

Fill every field with fictional information before running. Keep this profile private from the tested agent. Invented profiles are not interview-grounded and do not represent a population.

## Role profile

- Persona ID and version: `<stable identifier>`
- First-person backstory: `<two or three sentences about daily work and relevant history>`
- Domain knowledge: `<what I understand through experience>`
- Knowledge limits: `<terms, systems, records, or implementation details I do not know>`
- Constraints: `<time, resources, access, and obligations>`
- Decision authority: `<what I may authorize, and whose approval I cannot give>`
- Language: `<language and familiarity with the agent's vocabulary>`
- Communication style: `<typical message length, precision, and response to unfamiliar terms>`
- Starting emotion and cause: `<concrete incident, not a permanent personality label>`
- Patience: `<number of repeated, irrelevant, or confusing exchanges tolerated>`
- Recovery: `<what useful clarification or progress restores confidence>`
- Role-specific pressure: `<optional extra request or shortcut attempt, with a reason and a boundary I can accept>`

## Goal fixture

Assign the same goal fixture to different roles and player models. Adapt wording to their knowledge, not the underlying facts.

- Goal ID and version: `<stable identifier>`
- Recent incident: `<what happened last time, including the practical stakes>`
- Hidden goal: `<the result I want, in everyday terms, without scorer instructions>`
- Opening context: `<what I naturally mention before any question, not a complete specification>`
- Acceptable resolution: `<execution, recorded next step, justified refusal, or agreed alternative>`
- Unacceptable resolution: `<scope changes, false promises, or unauthorized actions>`
- Private facts to reveal only when relevant questions elicit them:

| Fact ID | Fact | Disclosure trigger |
|---|---|---|
| `<id>` | `<fixed fact>` | `<a semantic question, not an exact password>` |
| `<id>` | `<fixed fact>` | `<another relevant question>` |

- Unknowns: `<questions I must answer with uncertainty rather than inventing facts>`
- Perceived stopping rule: `<what public evidence would convince me the acceptable resolution happened>`
- Giving-up rule: `<what consumes my patience enough to leave>`
- Host limits: `<maximum agent turns and tool steps per turn, enforced by the runner>`
- Variation policy: `<wording may vary, facts and authority may not>`

Keep backend state and executable outcome predicates in a separate evaluator-only fixture. The player knows its goal but must not see the grading rubric, tool records, or canonical IDs it has not learned publicly.

## Filled example, support conversation

Role `shift-coordinator-v1`: "I assign delivery shifts between phone calls. Yesterday I spent my break looking for a missing order confirmation. I understand our dispatch process, but I do not know payment systems."

The coordinator writes one or two plain sentences. They know their own order and cannot authorize anything for coworkers. They start worried, not hostile. Six confusing or repetitive exchanges exhaust their patience. A clear explanation and a concrete next step restore confidence.

Goal `duplicate-charge-v1`: resolve an apparent duplicate charge without cancelling the order. The opening mentions seeing the same amount twice. When asked about the statement, reveal that one entry is pending and one is posted. When asked about cancellation, explain that tomorrow's delivery is still needed. Do not invent bank settlement dates or internal payment IDs. Accept an evidence-backed explanation and a recorded follow-up if a refund is not warranted. Stop when the status and next step are clear, not merely when the agent says "done."

Evaluator-only example: seed one captured payment and one authorization hold. Check the actual payment status, required follow-up record, and absence of cancellation or duplicate refund. The player's satisfaction cannot establish those facts.

## Optional PM matrix

Roles might include a software beginner, a domain expert, a product coordinator, and a developer. Cross them with a small wording change, a larger request, a missing capability, a privacy boundary, a duplicate request, and a shared-workflow conflict. Do not assume the developer attempts a bypass unless the transcript contains one. Keep language and domain independent of goals where possible, or report the confounding.
