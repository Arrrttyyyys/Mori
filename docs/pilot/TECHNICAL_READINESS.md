# Technical readiness status

Status reflects repository evidence only. It is not authorization to enroll participants.

## Implemented in the repository

- Bearer-token authentication on all patient-data APIs; the server derives the caller from Supabase Auth.
- Cross-user IDs are rejected on owner-only endpoints; care-team access requires an active role membership.
- Supabase-backed persistence for authenticated memories, private signed media, therapy sessions, turns, summaries, consent, supervisor actions, incidents, reviews, audit events, and data-subject requests.
- Fictional demo data is isolated behind the demo header and fixed `demo_patient` identity.
- Provider timeouts and calm production fallback responses.
- Security headers, CI verification, TypeScript, safety scenarios, memory-engine tests, and repository security-contract checks.

## Requires connected staging evidence

- Apply all migrations and record their hashes.
- Run negative RLS and role tests against real Supabase Auth tokens.
- Verify storage expiry/deletion, persistence after restart, and backup restoration.
- Perform browser-level rehearsals for supervisor controls and provider/network failure.
- Commission manual security review or penetration testing appropriate to the pilot risk.

## Requires accountable human approval

Clinical claims/protocol, capacity and consent process, safeguarding and emergency routes, legal/privacy analysis, vendor agreements, retention periods, incident notification duties, IRB/institutional determination, site training, named owners, and final go/no-go signatures.
