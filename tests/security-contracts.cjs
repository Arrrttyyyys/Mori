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
