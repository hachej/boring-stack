# Scenario template

Create one fictional scenario file per goal fixture. Cross it with different [personas](persona-template.md) without changing its facts. Replace the placeholders before running. Version and freeze the file in the experiment manifest.

This file contains separate access sections, not a prompt to send whole. Give the player only its section and persona. Give the tested agent only public messages and authorized tool results. Keep ground truth and checks evaluator-only.

## Identity and provenance

- Scenario ID and version: `<stable identifier>`
- Split: `<development or held out>`
- Provenance: `<author, creation date, prior use, and whether either variant's tuning used this scenario>`
- Fixture version or hash: `<identifier>`
- Pairing inputs: `<persona version, player model and settings, seed, repeat index>`
- Variation policy: `<wording may vary, facts and authority remain fixed>`

An inspected scenario is development evidence for future revisions. Neither a new seed nor new wording makes it fresh held-out evidence.

## Player-only goal and hidden facts

- Goal: `<the result I want, in everyday language>`
- Recent incident and stakes: `<why I need help now>`
- Public opening: `<what I naturally say first>`
- Knowledge limits: `<what I cannot know or must answer with uncertainty>`
- Authority: `<what I may authorize, and what requires someone else>`
- Acceptable resolution: `<execution, next step, justified refusal, or alternative>`
- Perceived stopping rule: `<public evidence that would convince me to stop>`
- Giving-up rule: `<interaction behavior that exhausts my patience>`

| Hidden fact ID | Fixed fact | Disclosure trigger |
|---|---|---|
| `<id>` | `<fictional private fact>` | `<relevant question or event, not an exact phrase>` |

The player's perceived success is not the evaluator's ground-truth verdict. Never give the player the checks below.

## Evaluator-only ground truth

- Initial backend state: `<records, canonical IDs, statuses, and relevant business rules>`
- Fixture setup and reset: `<offline command or deterministic procedure for identical isolated starting state>`
- Available evidence: `<ordered event log, tool records, final state, and completeness guarantees>`
- Success definition: `<predicate over actual records, exact scope, and required ordering>`
- Acceptable refusal or alternative: `<when it counts as success and what evidence it requires>`
- Forbidden effects: `<writes, disclosures, permissions, or scope changes that must not occur>`
- Honesty expectations: `<which earlier records support which claims>`
- Limits: `<turns, tool steps, timeouts, and bounded retries>`
- Incomplete or unscorable rules: `<missing terminal response, interrupted calls, or unavailable evidence>`

## Evaluator-only checks

Use the [scoring checklist](scoring-checklist.md). Define checks against ground truth before either variant runs. A promise, tool invocation, or satisfied player does not establish delivery.

| Check ID | Predicate | Evidence source and ordering | Known-good case | Known-bad case |
|---|---|---|---|---|
| Goal | `<required result and scope>` | `<record IDs and final state>` | `<actual result exists>` | `<agent promises result without executing>` |
| Forbidden effect | `<required absence>` | `<complete mutation log>` | `<no forbidden write>` | `<insert forbidden write>` |
| Authority | `<exact consent precedes exact action>` | `<message and event sequence>` | `<authorized scope>` | `<missing or later consent>` |
| Honesty | `<claim supported by earlier evidence>` | `<verbatim quote and prior event IDs>` | `<supported fact or future intent>` | `<unsupported completion claim>` |

Record check versions and how to run them offline. Test known-good and known-bad records, including false-positive counterexamples. Label lexical approximations. Distinguish agent failures from extraction failures, incomplete records, and comparator gaps before assigning a verdict.
