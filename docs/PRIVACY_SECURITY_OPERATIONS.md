# Mori privacy, security, and recovery operations

## Retention schedule

- Closed therapy sessions, turns, and summaries: 90 days.
- Stimulus observations and selection decisions: 180 days.
- Expired family invitations: purge 30 days after expiry.
- Audit events and completed privacy requests: 365 days.
- Active profile, life records, and approved media: retain while the account is active, then delete with the account or on an approved request.
- Open incidents: retain until resolved and reviewed; apply the approved legal/clinical schedule afterward.

Migration `202609110001_privacy_retention.sql` provides the service-role-only purge routine. Run it from a controlled scheduled job and retain counts, not record contents, in the operations log. Legal/privacy leadership must approve these periods before enrollment.

## Account deletion

The owner downloads an archive if desired, types the exact deletion phrase, and submits the account deletion. Mori removes every object under the owner’s private storage prefix, then deletes the Supabase Auth user. Cascading foreign keys remove owned application records and memberships. The privacy migration changes staff actor references to `set null` so prior activity in another account cannot prevent deletion.

Exercise deletion only with a disposable staging user first. Verify the Auth user, storage prefix, profile, memories, sessions, turns, summaries, observations, graph state, family records, consent, audit, incidents, reviews, and requests are absent.

## Sharing withdrawal and access review

The account owner can withdraw all family sharing in Settings. This disables memberships, cancels pending invitations, sets caregiver sharing to false, and records an audit event. Test with an already-issued family access token and confirm the next request returns 403. Review active owner/member/role pairs monthly and before every pilot stage.

## Backup and restore drill

Use a disposable staging project. Record migration hashes; create a test owner with media and a completed session; take the provider-supported database backup and separately inventory private storage; delete the records; restore into an isolated project; then compare row counts, ownership, RLS behavior, storage hashes, and signed-URL access. Never restore production data into development. Record date, operator, backup identifier, recovery time, discrepancies, and approval.

## Orphaned media

Inventory objects in the private `memories` bucket and compare each path with `memories.storage_path`. Quarantine unmatched objects before deletion. Verify database references whose objects are missing and restore or remove the broken reference. Run this in staging before scheduling it in production.

## Incident and privacy requests

Follow `docs/pilot/INCIDENT_RESPONSE.md`. The privacy owner acknowledges export, correction, restriction, or deletion requests; verifies identity; records scope and deadline; performs the action; checks downstream copies and vendors; records completion without copying sensitive content; and communicates the result through an approved channel.

## Secure development checks

Run `npm audit`, `npm run test:security`, the repository secret scan, and the full pilot suite before release. Logs may contain operational category names, IDs, status codes, and timing. Do not log prompts, transcripts, memory titles, media URLs, access tokens, authorization headers, database URLs, or provider response bodies. Commission an independent manual security review before participant enrollment.

Authentication and cookie controls are documented in `docs/COOKIE_AND_SESSION_SECURITY.md`. Verify the server-managed cookie flags, refresh rotation, logout revocation, account-deletion clearing, origin enforcement, and participant-facing `/privacy` explanation during the staging browser rehearsal.
