# Staging privacy and recovery evidence

Use only disposable fictional users in a Supabase project that is separate from development and production.

## Environment

- Date/time:
- Operator:
- Application commit:
- Staging project reference:
- Restored project reference:
- Applied migration names/hashes:
- Application URL:

## Automated privacy drill

Command: `npm run test:staging-privacy`

- Disposable owner and caregiver created: [ ]
- Caregiver could read approved shared memory before withdrawal: [ ]
- Existing caregiver token could not read it after withdrawal: [ ]
- Membership became inactive and consent prohibited sharing: [ ]
- Synthetic orphaned object was detected and removed: [ ]
- Account deletion removed the Auth user: [ ]
- Owner rows were absent from every listed application table: [ ]
- Owner storage prefix was empty: [ ]
- Test cleanup completed after pass or failure: [ ]
- Sanitized output/evidence location:
- Result and corrective actions:

## Backup and restore

- Backup method and provider backup identifier:
- Backup start/completion:
- Restore destination was isolated: [ ]
- Restore completion and elapsed recovery time:
- `npm run verify:staging-restore` passed: [ ]
- Private storage inventory and hashes matched separately: [ ]
- Owner and caregiver RLS checks passed: [ ]
- Signed URLs worked only for authorized users and expired: [ ]
- Differences and corrective actions:

## Approval

- Technical owner / date:
- Privacy owner / date:
- Pilot lead / date:
