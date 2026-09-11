# Pilot data-management plan

## Principles

Collect only data required for the approved pilot. Separate identity, media, transcripts, inferred signals and research exports. Treat inferred engagement, recognition, affect, confusion and distress as sensitive estimates requiring caregiver review.

## Controls required before enrollment

- Supabase migrations applied and verified in staging and production
- Authenticated user, caregiver, supervisor, clinician and administrator roles
- Row-level isolation and negative authorization tests
- Private media bucket with short-lived signed access
- Encryption in transit and at rest; secrets outside source control
- No PHI in analytics, console logs, URLs or error-reporting payloads
- Vendor inventory, data-flow map, retention settings and required agreements
- Backups plus a documented restoration test
- Export, correction, restriction and deletion request workflow
- Audit events for consent, access, sharing, review, supervisor action and deletion

## Retention schedule to approve

The site and privacy lead must assign an explicit period to identity/contact data, source media, audio, transcripts, session summaries, inferred signals, audit records, incidents and de-identified analysis files. At expiry, securely delete data and verify downstream/vendor deletion. Legal holds override routine deletion only through a documented process.

## AI providers

Send the minimum necessary context. Do not send unrelated family notes or media. Disable provider training where contractually available, document retention, region and subprocessors, and obtain agreements appropriate to the deployment relationship.
