# App implementation and release readiness

## App and native shell

For a new app, implement the approved product with working backend environments,
authentication, account lifecycle, domain journeys and error states. Use the
existing Boring design system. Separate public client configuration from backend
credentials. A native shell is not a substitute for the product or its tests.

For Capacitor, install compatible, pinned core/CLI/platform/plugin versions and
commit the lockfiles. Configure `appId`, `appName`, and `webDir` pointing at the
actual production bundle. Add each platform once (`npx cap add ios`,
`npx cap add android`); thereafter build web assets first and run `npx cap sync`.
Run commands inside the directory owning the Capacitor config and use its pinned
CLI. Adapt the scripts to the repository rather than guessing its output path.

Release configuration must load bundled HTML, JS, CSS, fonts and startup images.
Remove development `server.url` and broad navigation allowlists. Check the packaged
archive, not only source config, for remote scripts, dev URLs and fallback redirects.
The API origin remains remote and HTTPS. Local UI does not imply offline data:
state precisely which features require a connection and do not invent health-data
caches just to mask network failures. Preserve binary audio, streaming, cookies,
request cancellation and origin checks in any native HTTP bridge.

Commit native projects or deterministic generation/overlay scripts, per repository
convention. Regenerate from scratch once to prove icons, entitlements, plugins,
permissions, URL handlers and privacy manifests survive regeneration. Set native
display names, splash screens and store names independently of immutable IDs.
Use the app's branding on login/email/consent surfaces where supported; a browser
or OS may still show the authentication domain. Do not promise to hide security UI.

## Authentication UX

Reuse valid sessions on launch. A background API failure must not repeatedly open
and immediately close a browser. Show an in-app reconnect action; preserve the
current view/draft when possible. Open the system authentication session on an
explicit action, allow cancellation and retry, and share one in-flight login.
Use PKCE and state, exact callback validation and short-lived one-use code
redemption. Do not place backend secrets in the app, weaken callback checks, or
move provider login into an embedded WebView just to hide browser chrome.
Test signed-out launch, expired session, browser already signed in, cancellation,
wrong callback, duplicate callback, logout and relaunch on both platforms.

## Account, privacy and commerce

Produce accurate privacy/support pages with reachable URLs and responsible entity
contact details; verify any required address/trader disclosures for the selected
stores and regions. Inventory actual data, processors, retention/deletion and
permissions. EU residency is a verified property of storage, backups and each
processor path, not a sentence inferred from the app's primary hosting region.
Complete Apple App Privacy and Google Data safety from that inventory. Provide
account deletion where required, including backend/session cleanup, not only UI.

Check current Apple/Google payment rules for the exact goods, region and program
before choosing native billing or external checkout. Existing web checkout does
not establish native-store compliance. For digital purchases, implement the
applicable store billing flow, server verification, restore/entitlements, expiry,
refund/revocation and sandbox testing. Configure products in the correct store
account. Do not silently hide paid functionality to obtain approval.

For microphone/camera/health access, declare only used permissions and explain them
at point of use. Verify runtime grants/denials, settings recovery and actual audio
transcription, not just a mocked response. Inspect third-party SDK privacy manifests
and required-reason APIs for Apple; confirm current target SDK rules for Android.

## Build and device evidence

- Run project checks on the candidate commit. Record relevant limitations.
- Build release artifacts with production API settings and unique build numbers.
- Check app ID, version, signing identity, entitlements, icons and packaged assets.
- Test clean install and update from the previous store build on real devices:
  startup, login/reconnect, core journey, keyboard/safe areas, permission denial,
  network loss, voice/streaming, payment restore, logout and account deletion.
- A simulator build, browser mock or successful upload is not proof of device
  cookies, hardware permissions, purchase behavior or store installation.

Sources to check at release time:
[Capacitor configuration](https://capacitorjs.com/docs/config),
[Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/),
[Google Play policies](https://play.google.com/about/developer-content-policy/).
