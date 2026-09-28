# Waitlist setup

The waitlist implementation is intentionally local until it has been reviewed. It includes the landing-page form, `POST /api/waitlist`, duplicate-safe storage, explicit contact consent, a bot honeypot, same-origin enforcement, validation, and database-backed client and email rate limits.

Before deployment:

1. Review the fields and consent language.
2. Apply `supabase/migrations/202609270001_waitlist.sql` to the intended Supabase project.
3. Submit a fictional address locally and confirm a row appears in `waitlist_signups`.
4. Verify duplicate submissions update one record rather than creating duplicates.
5. Choose an email provider and unsubscribe process before sending any waitlist message.
6. Update the privacy-policy effective date when the revised notice is approved for publication.

The public browser cannot read the waitlist table. The API writes through the server-only Supabase service role. Do not expose or export waitlist addresses into client code or application logs.
