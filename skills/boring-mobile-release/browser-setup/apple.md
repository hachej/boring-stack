# Apple browser setup runbook

Read [intake](intake.md) and [browser execution rules](workflow.md) first. UI labels
below are navigation hints: inspect the live page before acting. Use the public
Apple Developer Program for App Store distribution, not Enterprise enrollment.

## A. Enrollment and activation

Open [Apple Developer account](https://developer.apple.com/account/). Check the
selected organization and membership status. If already active, skip enrollment.
For a new enrollment, follow the visible enrollment flow:

| Screen / field | Input / action | Verify before continuing |
|---|---|---|
| Account sign-in | Owner's existing Apple Account via approved login | Correct person/team; owner completes required 2FA |
| Entity type | Confirmed individual/organization choice | Legal seller identity matches intended publisher |
| Organization | Legal entity name, D-U-N-S, address if requested | Exact company records, not app branding |
| Contact / authority | Website, phone, work email, role, authorized contact if requested | Actual authority; no invented reference |
| Documents / verification | Only specifically requested owner documents | Correct destination, approved disclosure; owner handles identity challenges |
| Review enrollment | Compare all values to intake | Record submitted/pending state and enrollment reference privately |
| Program License Agreement | Read current agreement and displayed acceptance control | Required action-time confirmation or owner handoff |
| Purchase membership | Owner completes authorized payment flow | Displayed fee/currency; receipt recorded; no duplicate order |
| Account home | Refresh after completion | Active membership/resources, not merely paid order or "Pending" |

Apple may request additional verification. Record the actual request and let the
owner supply evidence. Do not infer activation from elapsed time. If the portal
states purchase processing can take a given period, report that displayed period.

## B. Register identity and create app

With membership active, open Certificates, Identifiers & Profiles. Look for the
exact bundle ID. If absent, register an App ID with its description, explicit
bundle ID and only the required capabilities; confirm authority for credential or
security-sensitive changes under the tool policy. Verify team/ID/capabilities in
the resulting details. Signing setup is in [Apple release](../references/apple.md).

Open [App Store Connect](https://appstoreconnect.apple.com/), select the correct
team, then Apps. Search existing apps before using **+ → New App**. Fill:

| Field | Input |
|---|---|
| Platforms | Requested iOS platform and any explicitly supported additional platforms |
| Name | Approved app display name; resolve conflicts with owner, not a silent rename |
| Primary language | Approved listing locale |
| Bundle ID | Exact registered bundle ID from release configuration |
| SKU | Approved unique internal SKU |
| User Access | Intended existing team scope; avoid expanding access by default |

If an agreement blocks app creation, return to the holder's agreement step. After
Create, verify the app details and record the numeric App Store Connect app ID.
"Prepare for Submission" is a created record, not a public app.

## C. Listing, TestFlight and automation access

Use App Information and the version page for categories, age rating, localized
name/descriptions, URLs, screenshots, review access/contact, availability/pricing
and build selection. Read each current required field and map to intake. Use App
Privacy for the verified data inventory. Complete export compliance for the actual
binary. Business/trader/tax/banking fields are owner matters where required; don't
invent or accept declarations to clear warnings.

For API automation, use Users and Access / Integrations / App Store Connect API
where exposed for this account. Request/enable API access and generate a key only
with the required authorization. Set the necessary role, capture issuer/key IDs,
and store the downloaded private key directly in the approved secret destination.
Never paste it into the skill, PR, screenshots or chat. Verify access by a read-only
app lookup before configuring releases. Keys and signing identities are distinct.

After upload processing, open TestFlight, select the exact version/build, resolve
compliance/test information, and assign the intended internal or external group.
External testing may require beta review. Verify status and install eligibility;
copy the appropriate test link privately. Do not create App Store Connect users
just to bypass external-beta requirements. Public review is a separate submission.

Sources: [Enrollment](https://developer.apple.com/help/account/membership/program-enrollment),
[New app](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app),
[API overview](https://developer.apple.com/app-store-connect/api/).
