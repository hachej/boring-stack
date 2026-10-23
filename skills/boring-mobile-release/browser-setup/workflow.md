# Browser execution contract

Use this when API bootstrap is incomplete or an operation exists only in a store
console. Read [intake](intake.md), then [Apple](apple.md) or [Google Play](google-play.md).
The browser tool's current permissions/confirmation rules take precedence here.
These instructions describe how to act; they do not authorize external actions.

1. Select the user's requested browser/account. Inspect the visible page and
   account selector. Reuse an existing app/enrollment before creating a new one.
   Refresh stale status pages when necessary; capture the current blocker verbatim.
2. Map each visible field to a verified intake value. Use labels/roles from the
   current DOM/accessibility snapshot, not stored coordinates or guessed selectors.
   Enter ordinary fields that are in scope; reread the form after each logical step.
   Resolve validation errors from the displayed message. Do not cycle guessed values.
3. Treat legal checkboxes separately from form completeness. Inspect their text and
   agreement links. If the final button includes legal acceptance, obtain the
   action-time confirmation required by the tool or hand over; an earlier "do the
   rest" is not permission to bypass this requirement. Likewise follow current
   rules for payment, identity-document transmission, CAPTCHA and access grants.
4. Do not scrape a password manager or logs for credentials. Use the approved
   credential flow. If owner authentication/2FA/identity verification is required,
   leave the right page ready and state exactly what the owner needs to complete.
   Never weaken verification or create substitute accounts to bypass it.
5. Before irreversible identity choices, uploads or distribution, compare the
   selected account/app, package/bundle ID, artifact version and audience with intake.
   Submit only within the user's scope. Follow any tool requirement to capture
   evidence at confirmation. Do not expose secrets or identity documents in evidence.
6. After each mutation, inspect success/error state. Record app ID, step completed,
   UTC check time, next action and blocker in the private task record. "Clicked"
   is not success. If the UI times out, inspect account/app state before retrying;
   a created app, paid order or uploaded version must not be duplicated.
7. When blocked by activation/review, complete independent preparation. Report a
   concrete pending step and owner action; don't poll indefinitely, promise a
   deadline, or schedule monitoring without a request.

## Handoff wording

Name the exact site, organization, action and reason. Example:
"The enrollment form is filled for the selected organization. Apple now requires
acceptance of the displayed Program License Agreement. The browser tool requires
confirmation at this step; please review it before acceptance."

For payment, show the amount/currency and merchant currently displayed; never
hard-code a remembered fee. After the owner pays, read status/receipt and avoid
repurchasing if the portal still shows a processing banner.

## Resume

Reopen the saved app/enrollment URL, inspect fresh status, and continue from the
first incomplete step. Owner saying "done" is a cue to verify, not evidence that
all downstream activation or processing has finished. Do not ask again for already
supplied information or reapprove unchanged routine actions. Preserve any per-action
confirmation requirements imposed by the browser tool.
