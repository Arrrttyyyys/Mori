# Demo protection and privacy-safe monitoring

## Required deployment configuration

Apply `202609240001_demo_protection_monitoring.sql`, then configure unique production values for `MORI_DEMO_ACCESS_CODE`, `MORI_DEMO_COOKIE_SECRET`, `MORI_MONITORING_HASH_SALT`, and `MORI_OPERATIONS_TOKEN`. Keep every value server-side. The public demo is disabled in production when its access code or signing secret is absent.

The access code is exchanged for a signed, `HttpOnly`, same-site cookie valid for four hours. A browser header alone cannot enable demo mode. Access attempts, new sessions, model turns, and resets have per-client windows and daily limits. Client network addresses are HMAC-hashed before use and are never stored directly.

The fictional demo reset in the Pilot Safety Center clears sessions, modified sample memories, profile changes, learning state, adaptive observations, consent, incidents, and audit entries. It does not affect real Supabase accounts.

## Monitoring

Operational events contain only event name, route, status, latency, provider name, fallback status, malformed-output count, identity mode, time, and an optional one-way client hash. Prompts, replies, memory titles, names, email addresses, tokens, and session transcripts are excluded.

Fetch the last 24 hours of aggregate model and database/storage metrics with:

```sh
MORI_APP_URL=https://your-demo.example MORI_OPERATIONS_TOKEN=... npm run monitor:check
```

The resource snapshot reports database size, database connections, active connections, therapy-session count, memory count, and private memory-storage bytes. Supabase CPU, memory, Disk IO budget, and platform-level alerts remain available in the Supabase infrastructure dashboard because those metrics are not exposed safely through the application database.
