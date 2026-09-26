const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')
const apiFiles = [
  'app/api/life/route.ts',
  'app/api/family/route.ts',
  'app/api/insights/route.ts',
  'app/api/archive/route.ts',
  'app/api/memory-context/route.ts',
  'app/api/therapy/session/route.ts',
  'app/api/therapy/sessions/route.ts',
  'app/api/user/[userId]/memories/route.ts',
  'app/api/user/[userId]/memories/[memoryId]/route.ts',
  'app/api/user/[userId]/family-space/route.ts',
  'app/api/user/[userId]/reviews/route.ts',
  'app/api/user/[userId]/data-requests/route.ts',
  'app/api/pilot/[userId]/route.ts',
  'app/api/pilot/[userId]/sessions/[sessionId]/route.ts',
  'app/api/storage/memories/route.ts',
]

for (const file of apiFiles) {
  assert.match(read(file), /requireRequestIdentity\(/, `${file} must authenticate requests`)
}

const auth = read('lib/auth/server-auth.ts')
assert.match(auth, /requestedUserId !== data\.user\.id/, 'user-scoped routes must reject path/body impersonation')
assert.match(auth, /pilot_memberships/, 'care-team access must require an active role grant')
assert.match(auth, /request\.cookies\.get\(ACCESS_COOKIE\)/, 'APIs must accept the server-managed access cookie')
assert.match(auth, /Request origin could not be verified/, 'state-changing cookie requests must verify their origin')
assert.match(auth, /hasValidDemoAccess\(request\)/, 'a browser header alone must not authorize demo mode')

const demoAccess = read('lib/operations/demo-access.ts')
assert.match(demoAccess, /httpOnly: true/, 'demo access must use an HttpOnly cookie')
assert.match(demoAccess, /timingSafeEqual/, 'demo secrets must use constant-time comparison')
const monitoring = read('lib/operations/monitoring.ts')
for (const sensitive of ['user_message', 'spoken_response', 'memory_title', 'email']) {
  assert.doesNotMatch(monitoring, new RegExp(sensitive), `monitoring must not record ${sensitive}`)
}
const operationsRoute = read('app/api/operations/metrics/route.ts')
assert.match(operationsRoute, /MORI_OPERATIONS_TOKEN/, 'operations metrics must require a separate server token')
const demoMigration = read('supabase/migrations/202609240001_demo_protection_monitoring.sql')
assert.match(demoMigration, /consume_mori_demo_quota/, 'demo usage limits must be enforced atomically in the database')
assert.match(demoMigration, /enable row level security/, 'operational tables must have RLS enabled')

const authCookies = read('lib/auth/cookies.ts')
assert.match(authCookies, /httpOnly: true/, 'auth cookies must be inaccessible to browser JavaScript')
assert.match(authCookies, /sameSite: 'lax'/, 'auth cookies must restrict cross-site use')
assert.match(authCookies, /secure: process\.env\.NODE_ENV === 'production'/, 'auth cookies must require HTTPS in production')

const migration = read('supabase/migrations/202608220001_initial_mori_schema.sql')
for (const table of ['memories', 'family_notes', 'therapy_sessions', 'session_turns', 'session_summaries', 'safety_events']) {
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`), `${table} must have RLS enabled`)
}
assert.match(migration, /values \('memories', 'memories', false\)/, 'memory storage bucket must be private')

const storage = read('lib/supabase/storage.ts')
assert.doesNotMatch(storage, /getPublicUrl/, 'private memory media must not use public URLs')
assert.doesNotMatch(storage, /getSupabaseBrowserClient/, 'browser media code must not receive the Supabase session')
const storageRoute = read('app/api/storage/memories/route.ts')
assert.match(storageRoute, /createSignedUrl/, 'private memory media must use signed URLs')
assert.match(storageRoute, /consume_mori_upload_quota/, 'uploads must use a persistent account rate limit')
assert.match(storageRoute, /MAX_ACCOUNT_STORAGE_BYTES/, 'uploads must enforce an account storage quota')
const uploadSecurity = read('lib/uploads/security.ts')
assert.match(uploadSecurity, /limitInputPixels: 40_000_000/, 'image decoding must limit pixel count')
assert.match(uploadSecurity, /\.resize\(/, 'images must be resized before storage')
assert.match(uploadSecurity, /\.webp\(/, 'images must be re-encoded without source metadata')
assert.match(uploadSecurity, /Audio and video uploads require the private file scanner/, 'unscanned audio and video must fail closed')
const uploadMigration = read('supabase/migrations/202609250002_upload_and_legal_security.sql')
assert.match(uploadMigration, /consume_mori_upload_quota/, 'upload rate limits must be atomic in the database')
assert.match(uploadMigration, /legal_acceptances/, 'policy acceptance must have a durable audit record')

const signupRoute = read('app/api/auth/signup/route.ts')
assert.match(signupRoute, /acceptTerms !== true/, 'signup must require explicit terms acceptance')
assert.match(signupRoute, /acceptPrivacy !== true/, 'signup must require explicit privacy acknowledgement')
assert.match(signupRoute, /legal_acceptances/, 'signup must persist policy versions')

const nextConfig = read('next.config.js')
assert.match(nextConfig, /Content-Security-Policy/, 'responses must include a content security policy')
assert.match(nextConfig, /script-src-attr 'none'/, 'inline event-handler scripts must be blocked')

const therapyRoute = read('app/api/therapy/session/route.ts')
assert.doesNotMatch(therapyRoute, /details: error instanceof Error/, 'API errors must not expose internal details')

const dataRequests = read('app/api/user/[userId]/data-requests/route.ts')
assert.match(dataRequests, /DELETE MY MORI ACCOUNT/, 'account deletion must require an exact confirmation phrase')
assert.match(dataRequests, /storage\.from\('memories'\)\.remove/, 'account deletion must remove private media')
assert.match(dataRequests, /admin\.auth\.admin\.deleteUser/, 'account deletion must remove the Auth user and cascade owned rows')

const familyRoute = read('app/api/family/route.ts')
assert.match(familyRoute, /withdraw-sharing/, 'owners must be able to withdraw all sharing')
assert.match(familyRoute, /caregiver_sharing_allowed: false/, 'sharing withdrawal must update consent immediately')

console.log(`Security contract checks passed (${apiFiles.length} authenticated API routes)`)
