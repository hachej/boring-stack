# Apple: setup, signing, TestFlight and public release

## Bootstrap once per account/app

1. Refresh the developer account status. Enrollment, paid order and active
   membership are different states. If payment is processing, do not pay again;
   use Apple's displayed status and timing. Account-holder legal acceptance and
   identity verification remain owner actions when the execution policy requires it.
2. Identify the organization/team, register the bundle ID and needed capabilities,
   and create the app record in App Store Connect with the matching bundle ID,
   name, primary locale and SKU. Inspect for an existing record first. Use the
   console for app creation: the public Apps resource documents existing-app
   management, not creation. Verify current API coverage before assuming otherwise.
3. Establish signing: Apple Distribution certificate with its private key and a
   matching App Store provisioning profile, or authorized Xcode-managed signing.
   An App Store Connect API key is not a signing certificate. Capture the team,
   key ID, issuer ID and secret reference; never commit `.p8`, `.p12` or passwords.
   API access/roles and new credential creation need the appropriate owner authority.
4. Use a supported Xcode/macOS runner and resolve dependencies. Pin toolchain
   versions compatible with Apple's current submission requirements. Do not assume
   a simulator build can be uploaded as a device archive.

## Reproducible build

Discover the actual project/workspace and shared scheme (`xcodebuild -list`), then
record them in the app's build script. Example for a workspace-backed project:

```bash
xcodebuild -workspace "$IOS_WORKSPACE" -scheme "$IOS_SCHEME" \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$ARCHIVE_PATH" archive
xcodebuild -exportArchive -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" -exportPath "$EXPORT_DIR"
```

For a project without a workspace use `-project`. Generate ExportOptions.plist for
the installed Xcode's App Store Connect export method (`xcodebuild -help`); set
team and signing policy deliberately. Use automatic provisioning only when
credential/certificate creation is authorized. Validate CFBundleIdentifier,
CFBundleShortVersionString and CFBundleVersion in the archive and exported IPA.
Keep build numbers unique and valid for the release train. Retain archive/dSYMs.

## Upload and beta distribution

Prefer a pinned fastlane installation (`Gemfile.lock`, `bundle exec`) using App
Store Connect API authentication, or official Transporter. A prepared credential
JSON is a secret file, not a repo asset. An upload-only example:

```bash
bundle exec fastlane pilot upload --ipa "$IPA_PATH" \
  --api_key_path "$ASC_API_KEY_JSON" --skip_submission
```

Inspect the exact version/build's processing status before selecting it for a
TestFlight group. Set beta description, feedback contact, test notes, review access
and export compliance from actual app facts. Do not accept a tool's default
non-exempt-encryption answer without checking it. API key permissions sufficient
for upload may not permit tester/build management.

Internal groups contain eligible App Store Connect users. External testers are a
separate flow with beta-review requirements. For external distribution, fastlane's
`upload_to_testflight`/`pilot distribute` accepts explicit `app_version`,
`build_number`, `groups`, `distribute_external`; do not select implicit "latest" or
notify/invite recipients outside the authorized audience. Confirm the build is
assigned and available, then test the install link/account on a device.

Apple now also documents `POST /v1/buildUploads`. If using direct HTTP instead of
Transporter, implement the current build-upload/file/transfer/finalization schema
and processing checks from Apple's specification. Creating a buildUploads record
alone does not transfer an IPA. Older overview pages can lag this API; do not
claim all binary uploads are impossible via API.

## Public App Store release

Create/update the intended version/localizations, screenshots, description, URLs,
privacy responses, age rating, availability/pricing and review contact/access.
Verify applicable agreements and commerce setup. Select the tested, processed
build explicitly. Prepare a review submission through supported API/CLI or console;
submit only within the requested release scope. Choose manual/automatic/phased
release deliberately, not the tool's default. Review submission is not approval.
Observe review state and rejection reasons; after approval/release verify storefront
availability and install/update. A replacement binary requires a new build number.

Sources (checked 2026-10-23; recheck when releasing):
[Create app record](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app),
[Apps API](https://developer.apple.com/documentation/appstoreconnectapi/apps),
[Build Upload API](https://developer.apple.com/documentation/appstoreconnectapi/post-v1-builduploads),
[API overview](https://developer.apple.com/app-store-connect/api/),
[fastlane TestFlight](https://docs.fastlane.tools/actions/upload_to_testflight/),
[fastlane App Store](https://docs.fastlane.tools/actions/upload_to_app_store/).
