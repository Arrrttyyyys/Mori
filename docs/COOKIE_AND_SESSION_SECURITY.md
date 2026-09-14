# Cookie and session security

Mori uses two first-party cookies solely to authenticate an account. It does not add advertising or cross-site tracking cookies.

## Authentication cookies

- `mori_access_token`: short-lived Supabase access token.
- `mori_refresh_token`: refresh credential with a maximum browser lifetime of 30 days.

Both cookies are set by Mori's server with `HttpOnly`, `SameSite=Lax`, `Path=/`, and high priority. `Secure` is enabled in production, where HTTPS is required. Browser JavaScript cannot read either token. Authentication responses and all API responses use `Cache-Control: private, no-store`.

The server refreshes an expiring access token and rotates the cookies. Logout revokes the current Supabase session where possible and expires both cookies. Full account deletion also expires them.

## Request protection

- Every sensitive API request validates the session with Supabase Auth and relies on row-level security for caller-scoped database access.
- State-changing cookie-authenticated requests must have an `Origin` matching Mori's own origin.
- Cross-site cookies are not used.
- Participant content, names, memory text, roles, and workspace selections are not stored in authentication cookies.
- Media uploads and deletions pass through authenticated Mori API routes, so the browser does not need direct access to the Supabase token.

## Non-sensitive local preferences

The fictional demo flag and currently selected workspace identifier may be stored in local browser storage. They are not authentication credentials and the server never trusts them without an authenticated authorization check. Clear them during logout and when using a shared device.

## Deployment requirements

- Serve production only over HTTPS.
- Preserve `Set-Cookie` headers through the hosting proxy or CDN.
- Do not cache `/api/*` responses.
- Test login, refresh, logout, account deletion, multiple tabs, expired sessions, and revoked family access in staging.
- Revoke all sessions after suspected token theft or a lost participant device.
- Describe these strictly necessary cookies in the approved privacy notice. Privacy counsel must decide whether any jurisdiction-specific notice or consent presentation is required.
