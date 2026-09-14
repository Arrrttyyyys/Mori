# Mori Supabase database

The migrations in this directory are the source of truth for Mori's persistent
data model. The initial migration creates private, per-user storage for memories,
therapy sessions, turns, summaries, family notes, and safety events.

## Apply the migration

Using a linked Supabase CLI project:

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

If the CLI is unavailable, paste the migration into the Supabase SQL editor and
run it once. Do not run it with a client-side API key.

The `memories` Storage bucket is private. Application code must use authenticated
downloads or short-lived signed URLs rather than permanent public URLs.

The privacy retention migration adds a service-role-only purge function and makes
staff actor references compatible with account deletion. Review the retention
schedule in `docs/PRIVACY_SECURITY_OPERATIONS.md` and rehearse it in a disposable
staging project before applying it to participant data.

## Environment variables

The browser continues to use:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Server-only workflows that create summaries or safety events will also require:

```text
SUPABASE_SERVICE_ROLE_KEY=
```

Never prefix the service-role key with `NEXT_PUBLIC_` or commit it to Git.
