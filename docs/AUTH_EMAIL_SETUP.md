# Mori authentication email setup

Mori now requests an email confirmation during signup and handles the returned
Supabase session at `/auth/confirm`. Complete the following dashboard settings
before enabling public signup.

## Supabase URL configuration

In **Authentication → URL Configuration**:

1. Set **Site URL** to the production Mori URL, for example
   `https://your-project.vercel.app`.
2. Add these redirect URLs:
   - `http://localhost:3000/auth/confirm`
   - `https://your-project.vercel.app/auth/confirm`
   - Any intentional preview-domain pattern used during testing.

Mori passes the current application origin as `emailRedirectTo`, so Supabase
must allow every origin used for signup.

## Email provider

The built-in Supabase sender is suitable only for development and may deliver
only to project-team addresses. In **Authentication → SMTP Settings**, enable a
custom provider and enter its SMTP host, port, username, password, sender name,
and sender email.

Use a dedicated authentication sender such as `Mori <no-reply@auth.example.com>`.
Configure SPF, DKIM, and DMARC with the email provider before inviting users.
Keep SMTP credentials in Supabase, never in this repository or Vercel browser
environment variables.

## Provider and template settings

1. In **Authentication → Providers → Email**, enable email/password signup and
   require email confirmation.
2. In **Authentication → Email Templates → Confirm signup**, keep the action
   connected to `{{ .ConfirmationURL }}`. Suggested copy:

   - Subject: `Confirm your Mori account`
   - Heading: `Confirm your email`
   - Body: `Use the button below to confirm your email and continue setting up Mori.`
   - Button: `Confirm email`

3. Do not enable click tracking for authentication emails because rewriting the
   confirmation URL can break verification.

## Verification

Test with a disposable address before launch:

1. Create an account and choose a relationship to Mori.
2. Confirm that signup shows the destination email address.
3. Open the email and select the confirmation button.
4. Confirm that `/auth/confirm` establishes the secure cookies and redirects to
   `/room/profile`.
5. Confirm that refreshing the profile page remains authenticated.
6. Check **Authentication → Users** for a confirmation timestamp and inspect
   **Logs → Auth Logs** for delivery errors.

The relationship selected during signup is descriptive metadata only. It does
not grant access to another person’s workspace, pilot controls, or professional
permissions. Those continue to require explicit database memberships.
