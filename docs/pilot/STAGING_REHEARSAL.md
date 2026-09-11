# Staging rehearsal and evidence record

Do not use real participant information during rehearsal. The accountable owner records links, dates, versions, participants, failures, and corrective actions for every run.

## Environment preparation

1. Create an isolated Supabase staging project.
2. Configure the variables listed in `.env.example` in the deployment secret manager.
3. Link the Supabase CLI and run `supabase db push`.
4. Confirm the `memories` bucket is private and all migrations are present.
5. Create separate fictional accounts for patient, caregiver, supervisor, clinician, administrator, and an unrelated user. Grant roles only through an administrator-run SQL/operations process.
6. Deploy the exact commit under review and record its commit SHA, model name, prompt version, and scoring version.

## Required rehearsal scenarios

- Patient A cannot read or mutate Patient B memories, sessions, notes, consent, reviews, incidents, audit events, or data requests.
- An unrelated user cannot grant themselves a pilot role. A caregiver cannot perform supervisor-only actions.
- Private photo URLs expire, and deleting a memory deletes its database record and storage object.
- Refreshing/restarting the app preserves sessions, turns, summaries, consent, controls, incidents, and requests.
- Pause, resume, remove-stimulus, distress, and stop are exercised during a live fictional session.
- Withdrawn assent prevents supervised continuation according to the approved operating protocol.
- Provider timeout, invalid credentials, malformed model output, and network loss produce a calm fallback without exposing internal errors or repeatedly looping.
- A caregiver records approval, correction, sensitivity, rejection, and deletion-request decisions; the audit trail identifies the actor.
- Export, correction, restriction, and deletion requests can be opened and tracked without automatic destructive deletion.
- Restore a backup into a separate project and compare expected record counts and a sample of relational links.
- Execute the incident-response drill with fictional data and verify all named contacts.

## Automated baseline

Run `npm ci`, `npm run test:pilot`, and `npm run build`.

Automated checks are necessary but do not constitute clinical, privacy, penetration-test, backup-restoration, or pilot-site approval.

## Evidence

- Staging URL:
- Commit SHA:
- Migration list/hash:
- Test run:
- Authorization-test report:
- Backup/restore report:
- Incident-drill report:
- Model/prompt/scoring versions:
- Rehearsal participants/date:
- Open corrective actions:
- Technical owner approval/date:
