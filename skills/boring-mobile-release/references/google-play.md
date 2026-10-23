# Google Play: setup, signed AAB and release tracks

## Bootstrap once per account/app

1. Verify the developer account is active and required identity/device/organization
   checks are complete. Create the app record in Play Console if absent: name,
   locale, app/game, free/paid and declarations. Do not infer legal answers.
2. Choose the application ID carefully before the first upload. It becomes the
   stable package identity; a store display name is a separate field. Configure
   Play App Signing and keep the upload key separate from Google's app-signing key.
   Preserve the existing signing lineage for updates; do not generate a new key
   merely because credentials are unavailable.
3. Bootstrap with the first build through Play Console as documented for the Edits
   API/fastlane. Complete required app content: privacy URL, Data safety, access
   instructions, content rating, ads, audience and any applicable health/trader
   declarations. Determine production-access testing requirements from this
   account's current console; do not assume one rule for all accounts.
4. Enable Android Publisher API in a Google Cloud project. Configure an authorized
   service account/OAuth principal with permissions for the specific app and release
   operations. Google Cloud IAM alone does not grant Play app access. Store the
   credential via the approved secret manager; never put JSON private keys in git.

## Build and verify

Use the project's Gradle wrapper and compatible JDK/SDK. Build the web bundle and
sync Capacitor before native compilation when applicable. Release signing reads
protected environment/file inputs; avoid passwords in command arguments or logs.
Set an unused, increasing integer `versionCode` and intended user `versionName`.

```bash
cd "$ANDROID_PROJECT"
./gradlew :app:bundleRelease
```

Locate the actual build output for its flavor; do not assume a default filename.
Check the AAB manifest's package/version/SDK values, release signing certificate,
permissions and included assets with Android tooling/bundletool. Upload the AAB,
not a debug APK. Keep mapping files/native symbols where applicable.

## Repeatable internal preview

Use a pinned fastlane installation or Google's official client library. After
bootstrap, a draft upload with no metadata changes can be prepared explicitly:

```bash
bundle exec fastlane supply --json_key "$PLAY_KEY_JSON" \
  --package_name "$ANDROID_APP_ID" --aab "$AAB_PATH" \
  --track internal --release_status draft \
  --skip_upload_metadata true --skip_upload_images true \
  --skip_upload_screenshots true --skip_upload_changelogs true
```

Draft means not available to testers. For a user-authorized internal rollout, use
`completed` for that internal track once the app permits it, or complete the draft
in the console. Do not interpret completed on internal as public production.
Configure the intended tester list/group and opt-in URL; an invited address must
also use the matching Google account in Play. Verify the exact version code and
track status after publishing, then install/update through the test link.
A temporary package-name `(unreviewed)` listing can precede the first review;
renaming the package to fix this would create a different app identity.

## Direct API transaction and production

Serialize releases per package. Create an edit with `edits.insert`, upload via
`edits.bundles.upload`, and read the returned version code. Read existing tracks
before updating the intended track's releases; retain unrelated releases/tracks.
Set localized listing/images/release notes if in scope, validate the edit, and
commit it. A successful upload before commit is not distributed. A `draft` release
after commit is still not distributed. Inspect review/publishing state as well as
API success: managed publishing or required review may delay availability.

Console changes and competing commits can invalidate edits. On conflict, read the
current state and reconstruct only intended changes; never blindly replay a stale
track payload. If upload/commit times out, inspect the version/edit before retrying.

For public release, satisfy production eligibility, complete store content and
policy declarations, submit for review and promote the tested version to the
explicitly requested track/audience. Choose rollout percentage intentionally.
Observe review and rollout state and test storefront availability. If defective,
halt a supported rollout or ship a higher version code; do not describe a halt as
removing builds already installed on devices.

Sources (checked 2026-10-23; recheck when releasing):
[API setup](https://developers.google.com/android-publisher/getting_started),
[Edits workflow](https://developers.google.com/android-publisher/edits),
[API reference](https://developers.google.com/android-publisher/api-ref/rest),
[Tracks](https://developers.google.com/android-publisher/tracks),
[fastlane supply](https://docs.fastlane.tools/actions/upload_to_play_store/),
[Testing setup](https://support.google.com/googleplay/android-developer/answer/9845334).
