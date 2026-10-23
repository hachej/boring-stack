# Google Play browser setup runbook

Read [intake](intake.md) and [browser execution rules](workflow.md). Start at
[Play Console](https://play.google.com/console/), verify the developer selector and
inspect existing app records. Account registration and app creation are separate.

## A. Account bootstrap

If no developer account exists, use the visible registration flow. Fill the
confirmed account type, legal entity, country/address, organization identifiers
(such as D-U-N-S where requested), website and contact information from intake.
Distinguish private verification contacts from public developer contact fields.
The owner completes required identity/device/phone verification, legal acceptance
and payment under the browser policy. Read the current dashboard's remaining
requirements; payment alone is not proof the account is verified or eligible.

## B. Create app

Choose **Home → Create app**, only if the intended package/app is absent.

| Field / control | What to enter |
|---|---|
| App name | Approved display name |
| Package name, if shown | Exact Android application ID; inspect ownership status, never invent a replacement |
| Default language | Approved listing locale |
| App or game | Product's actual classification |
| Free or paid | Confirmed download-price model; distinguish in-app purchases |
| Contact email, if requested | Approved user-support address |
| Declarations / terms | Read each policy, export and Play App Signing statement; obtain required confirmation before acceptance |

If package ownership proof is requested, use the project's existing signing
identity and documented verification path; don't rotate keys or create a new
package to evade it. After creation verify the dashboard name, app ID and package.
Console layouts may ask for package identity at creation or at initial upload;
follow the observed flow and current developer-verification requirements.

## C. App content and listing

Work through the dashboard setup checklist, not a remembered order. Under store
presence/main store listing fill localized app name (currently 30 characters),
short description (80), full description (4000), icon, feature graphic and relevant
device screenshots. Validate current field/asset constraints in the console.
Set app category/tags and support contacts. Confirm draft saves before navigating.

Under App content complete required privacy policy, ads, app access, audience,
content rating, Data safety and any health/financial/trader declarations. Enter
review credentials only through the approved private workflow. Answer from the
actual app/SDK inventory and owner decisions. Do not select "no data collected"
because health data is kept in Europe or because the app has no advertising.
Pricing, countries and production-access requirements must match the requested scope.

## D. First internal release

Open **Test and release → Testing → Internal testing** (or its current equivalent).
Create/edit the intended draft; configure Play App Signing with the correct key
policy, handling any legal-acceptance requirement at that point. Upload the verified
signed AAB via the browser's supported file-upload API. Wait for validation and
inspect package, version code, version name and reported errors. Fill release name
and localized release notes. Resolve blockers, then review the release summary.

Upload-only request: save draft and report it as draft. Authorized internal test:
complete the displayed rollout action for internal testing and verify its resulting
status. In Testers choose the authorized list/group, save, and obtain the opt-in
link. A tester must opt in with the same Google account used in Play. Do not
silently broaden a list, send invitations or switch to production.

Package-name `(unreviewed)` text may be temporary before first review. Check store
listing/review state; it is not a reason to recreate the app. Confirm availability
using the exact released version code, including an install/update from the test
link. Explain any review/processing delay without promising an invented ETA.

## E. API bootstrap and public review

Follow [API setup](https://developers.google.com/android-publisher/getting_started):
select/create the intended Google Cloud project, enable Android Publisher API,
create/use the authorized service account, then grant it the needed app-scoped
Play Console permissions via Users and permissions. Security-sensitive grants and
key creation follow action-time policy. Store any credential file in the approved
secret destination and verify a read-only lookup. Cloud IAM permissions by
 themselves do not grant access to the Play app.

For public release, inspect this account's testing/production-access requirements,
complete outstanding declarations and review the publishing overview. Submit the
requested changes for review and choose managed publishing/rollout intentionally.
Review submission, review approval and public rollout are distinct checkpoints.
Continue through [Google release](../references/google-play.md) for API releases.

Sources: [App setup and fields](https://support.google.com/googleplay/android-developer/answer/9859152),
[Testing](https://support.google.com/googleplay/android-developer/answer/9845334),
[Developer verification changes](https://developer.android.com/developer-verification/assets/pdfs/updates-to-play-console-for-android-developer-verification.pdf).
