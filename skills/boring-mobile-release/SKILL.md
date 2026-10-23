---
name: boring-mobile-release
description: Build and release a Boring app for iOS App Store/TestFlight and Android Google Play, from initial store setup through signed builds, testing, submission and verified rollout. Use for mobile packaging, store readiness, release automation or diagnosing an installed app that has not updated.
---

# Build and publish a mobile app

Deliver the requested channel, not merely a successful upload. Distinguish source
merged, backend deployed, binary built, uploaded, processed, assigned to testers,
reviewed and available to install. Never report one as another.

## Start with the actual state

Read the app's AGENTS.md and release configuration. Inspect existing branches,
store records, signing setup and CI before creating anything. Preserve parallel
work; fetch main and integrate it according to repository rules, without discarding
uncommitted changes or merging unrelated drafts. Record the exact source commit.

Resolve from the repository/session: app name, stable iOS bundle ID and Android
application ID, API origin, store account/team, requested platforms and audience
(internal test, external/closed test, production), build/version numbers, and
existing secret references. Ask only for missing decisions. A preview request is
not a production rollout request. This skill adds no permission to merge code,
accept contracts, pay fees, grant access, or send invitations beyond user scope.

For a new repository, use [boring-new-app](../boring-new-app/SKILL.md) for Factory
bootstrap, then return here. That skill provisions a repo, not a finished product:
implement the approved app requirements and verify its real user journeys before
calling it store-ready. Reuse an existing native framework; for a Boring web app,
Capacitor with bundled assets is the preferred starting point, not a mandatory rewrite.

## Workflow and references

1. Read [Build and readiness](references/build.md): app implementation, native
   packaging, branding, auth, payments, privacy, signing and device acceptance.
2. For iOS read [Apple](references/apple.md); for Android read
   [Google Play](references/google-play.md). For both stores read both.
3. Follow [Automation and recovery](references/automation.md) to implement the
   repository's reproducible release commands/CI and keep release evidence.
4. Validate the artifact from the intended commit, distribute to the requested
   audience, then verify the exact version can be installed. Report remaining
   account-owner, review or device-testing blockers separately.

Do useful build/metadata preparation while account activation or review is pending.
Never fabricate privacy declarations, payment eligibility, compliance answers or
review credentials. Inspect the app's actual collection and SDK behavior.

## Browser bootstrap

For console/account setup, read [browser workflow](browser-setup/workflow.md) and
its [intake tables](browser-setup/intake.md). Then use the field-by-field
[Apple runbook](browser-setup/apple.md) or [Google Play runbook](browser-setup/google-play.md).
Keep filled intake values and checkpoints private; this public skill contains no
real account, enrollment, payment, tester or secret values.

## Automation boundary

After store bootstrap and authorized credentials, build/sign/upload, metadata,
tester assignment and many submission/rollout operations can run through CLI/API.
New-app console setup, account verification, legal agreements, payment and some
policy questionnaires are not a reliable fully headless workflow. Store review is
external; automation can submit and observe it, not guarantee approval.

Prefer official APIs and pinned CLI tooling; use the console for unsupported setup
or when it is the only available authenticated surface. Do not substitute private
browser endpoints for a supported API. Recheck current official documentation when
shipping: API coverage, SDK requirements, payments rules and eligibility change.
References below were checked on 2026-10-23; examples are recipes, not evidence of
an account being configured or a release having succeeded.
