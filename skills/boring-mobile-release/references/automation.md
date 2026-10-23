# Reproducible automation, evidence and recovery

## Implement in the app repository

First discover existing build/release scripts, fastlane lanes and CI. Extend them
rather than adding a second release system. Keep this skill generic; the consuming
app owns its identifiers, toolchain pins, runner choice and verified commands.

Expose separate operations for check, build, upload, distribute-test, submit-review,
and release-production. Build/check must not silently publish. Configure exact
platform, app identity, source SHA, artifact, build number and target track/group.
Do not let an omitted option promote "latest" to production. Choose a pinned
fastlane Gemfile.lock or supported official client library. Verify available
parameters against the installed tool before adapting the recipes.

CI should check out the candidate SHA, install locked dependencies, build local
assets, run project gates, sync native projects, sign, export and checksum the
artifact, then upload with authorized credentials. iOS archive/signing requires
a macOS/Xcode runner; Android builds can use Linux. Store signed artifacts and
symbols with access controls. Use isolated signing keychains/credential directories
and cleanup temporary copies, never the user's shared keys. Don't print secrets,
JWTs, callback codes or password-bearing commands. Retrieve secrets from the
configured manager; read access does not imply permission to rotate them.

Use per-app concurrency locks, reserve unique build numbers and retain a release
manifest. For a timeout, first inspect remote state by app/version/build before
retrying. Poll at bounded intervals until a stated deadline; if processing/review
outlasts the task, report pending with the remote ID. Schedule follow-up only if
requested. A stopped poll is not proof of failure or success.

## Release manifest

Store non-secret operational evidence privately with the app, for example:

```json
{
  "sourceSha": "full-commit-sha",
  "platform": "android",
  "applicationId": "com.example.sample",
  "version": "1.0.0",
  "buildNumber": "4",
  "artifactSha256": "sha256-of-exact-uploaded-file",
  "target": "internal",
  "remoteBuildId": null,
  "state": "built",
  "checkedAt": "ISO-8601-UTC",
  "evidence": [],
  "blockers": []
}
```

Keep one record per platform/artifact. Transition states from evidence, not intent:
`built → uploaded → processed → test-available` or
`processed → submitted → approved → released`. Record deployment of any required
backend separately. Include store URL, CI run and physical-device evidence when
available. Never put real tester lists, review passwords, enrollment/payment details
or product-private release plans in this public skill repository.

## Automation readiness report

For each store report: account active, app record exists, signing available, API
principal authorized, declarations complete, build validated, and audience enabled.
Mark each verified/pending/blocked with evidence. "We have accounts" does not mean
API credentials, distribution signing or production eligibility are configured.

For an update complaint compare the phone's installed version/build with the
released track and candidate SHA. Check tester opt-in/account, processing/review,
rollout and update propagation. Separate backend-hosted login changes from changes
bundled into a new binary. Never tell someone to reinstall to obtain a change that
has only been pushed to a PR.

## Validate the automation itself

Validate configuration and run local build/check paths without release credentials
first. Exercise the authorized internal-testing lane on a real app before claiming
end-to-end publishing works. Confirm reruns cannot duplicate uploads or overwrite
another release. Verify the exact uploaded build is available in the intended
channel; validate a device install and update. Document unexecuted submission or
production steps explicitly, rather than marking the whole pipeline complete.
