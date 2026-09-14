const { loadEnvConfig } = require('@next/env');
const { createClient } = require('@supabase/supabase-js');

loadEnvConfig(process.cwd(), false, { info() {}, error() {} });

const required = [
  'MORI_STAGING_SUPABASE_URL',
  'MORI_STAGING_SUPABASE_ANON_KEY',
  'MORI_STAGING_SERVICE_ROLE_KEY',
  'MORI_STAGING_APP_URL',
];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) fail(`Missing staging settings: ${missing.join(', ')}`);
if (process.env.MORI_STAGING_ALLOW_DESTRUCTIVE !== 'DELETE DISPOSABLE MORI DATA') {
  fail('Refusing destructive staging drill. Set MORI_STAGING_ALLOW_DESTRUCTIVE to the documented exact phrase.');
}

const stagingUrl = new URL(process.env.MORI_STAGING_SUPABASE_URL);
if (!/^https:\/\/[a-z0-9]+\.supabase\.co$/i.test(stagingUrl.origin)) fail('MORI_STAGING_SUPABASE_URL must be a Supabase project URL.');
if (process.env.NEXT_PUBLIC_SUPABASE_URL && new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin === stagingUrl.origin) {
  fail('Staging URL matches NEXT_PUBLIC_SUPABASE_URL. Use a separate disposable staging project.');
}

const admin = createClient(stagingUrl.origin, process.env.MORI_STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const appUrl = process.env.MORI_STAGING_APP_URL.replace(/\/$/, '');
const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const password = `Mori-${crypto.randomUUID()}-9a!`;
const ownerEmail = `mori-staging-owner-${runId}@example.invalid`;
const caregiverEmail = `mori-staging-caregiver-${runId}@example.invalid`;
let ownerId;
let caregiverId;
const createdPaths = [];

function fail(message) {
  console.error(message);
  process.exit(1);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function createUser(email) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user.id;
}

async function tokenFor(email) {
  const client = createClient(stagingUrl.origin, process.env.MORI_STAGING_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error || new Error('No staging session returned.');
  return { token: data.session.access_token, client };
}

async function appRequest(path, token, body) {
  const response = await fetch(`${appUrl}${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Staging app request failed (${response.status}): ${payload.error || 'unknown error'}`);
  return payload;
}

async function deleteAccount(token) {
  const response = await fetch(`${appUrl}/api/user/${ownerId}/data-requests`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ confirmation: 'DELETE MY MORI ACCOUNT' }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Account deletion failed (${response.status}): ${payload.error || 'unknown error'}`);
  assert(payload.deleted === true, 'Deletion endpoint did not report completion.');
}

async function count(table, column, value) {
  const { count: total, error } = await admin.from(table).select('*', { count: 'exact', head: true }).eq(column, value);
  if (error) throw new Error(`${table} verification failed: ${error.message}`);
  return total || 0;
}

async function main() {
  console.log(`Starting disposable staging privacy drill for ${stagingUrl.hostname}.`);
  ownerId = await createUser(ownerEmail);
  caregiverId = await createUser(caregiverEmail);
  const ownerAuth = await tokenFor(ownerEmail);
  const caregiverAuth = await tokenFor(caregiverEmail);

  const memoryPath = `${ownerId}/privacy-drill-${runId}.txt`;
  const orphanPath = `${ownerId}/orphan-${runId}.txt`;
  createdPaths.push(memoryPath, orphanPath);
  let result = await admin.storage.from('memories').upload(memoryPath, Buffer.from('synthetic staging memory'), { contentType: 'text/plain' });
  if (result.error) throw result.error;
  result = await admin.storage.from('memories').upload(orphanPath, Buffer.from('synthetic orphan'), { contentType: 'text/plain' });
  if (result.error) throw result.error;

  const { data: memory, error: memoryError } = await admin.from('memories').insert({
    owner_id: ownerId,
    title: 'Synthetic privacy drill',
    description: 'Fictional staging-only content',
    storage_path: memoryPath,
    media_kind: 'photo',
    safety: 'safe',
  }).select('id').single();
  if (memoryError) throw memoryError;
  const { error: membershipError } = await admin.from('family_memberships').insert({ owner_id: ownerId, member_id: caregiverId, role: 'caregiver', active: true });
  if (membershipError) throw membershipError;
  const { error: consentError } = await admin.from('pilot_consents').upsert({ patient_id: ownerId, caregiver_sharing_allowed: true }, { onConflict: 'patient_id' });
  if (consentError) throw consentError;

  const before = await caregiverAuth.client.from('memories').select('id').eq('id', memory.id);
  if (before.error) throw before.error;
  assert(before.data.length === 1, 'Caregiver could not access the shared memory before withdrawal.');

  await appRequest('/api/family', ownerAuth.token, { action: 'withdraw-sharing' });
  const after = await caregiverAuth.client.from('memories').select('id').eq('id', memory.id);
  if (after.error) throw after.error;
  assert(after.data.length === 0, 'Caregiver retained access after sharing withdrawal.');
  assert(await count('family_memberships', 'owner_id', ownerId) === 1, 'Expected membership was not retained for audit.');
  const { data: inactive } = await admin.from('family_memberships').select('active').eq('owner_id', ownerId).single();
  assert(inactive && inactive.active === false, 'Sharing withdrawal did not deactivate membership.');
  console.log('PASS: sharing withdrawal blocked the next caregiver read.');

  const { data: objects, error: listError } = await admin.storage.from('memories').list(ownerId, { limit: 100 });
  if (listError) throw listError;
  const referenced = new Set([memoryPath]);
  const orphans = (objects || []).map((item) => `${ownerId}/${item.name}`).filter((path) => !referenced.has(path));
  assert(orphans.includes(orphanPath), 'Synthetic orphan was not detected.');
  const { error: orphanDeleteError } = await admin.storage.from('memories').remove([orphanPath]);
  if (orphanDeleteError) throw orphanDeleteError;
  createdPaths.splice(createdPaths.indexOf(orphanPath), 1);
  console.log('PASS: orphaned storage object was detected and removed.');

  await deleteAccount(ownerAuth.token);
  const { data: deletedUser } = await admin.auth.admin.getUserById(ownerId);
  assert(!deletedUser.user, 'Owner still exists in Supabase Auth after deletion.');
  const ownerTables = [
    'memories', 'patient_profiles', 'therapy_sessions', 'session_turns', 'session_summaries',
    'safety_events', 'stimuli', 'stimulus_observations', 'memory_graph_edges',
    'longitudinal_memory_states', 'life_records', 'selection_decisions', 'family_notes',
    'family_memberships', 'family_invitations', 'pilot_consents', 'pilot_memberships',
    'supervisor_actions', 'pilot_incidents', 'caregiver_reviews', 'audit_events',
    'data_subject_requests',
  ];
  for (const table of ownerTables) {
    const column = table === 'pilot_consents' || table === 'pilot_memberships' || table === 'supervisor_actions' || table === 'pilot_incidents' || table === 'caregiver_reviews' || table === 'audit_events' || table === 'data_subject_requests' ? 'patient_id' : 'owner_id';
    assert(await count(table, column, ownerId) === 0, `${table} retained owner rows after deletion.`);
  }
  const remaining = await admin.storage.from('memories').list(ownerId, { limit: 100 });
  if (remaining.error) throw remaining.error;
  assert((remaining.data || []).length === 0, 'Storage objects remain after account deletion.');
  createdPaths.length = 0;
  ownerId = undefined;
  console.log('PASS: account deletion removed Auth, database, membership, audit, and storage data.');
  console.log('Staging privacy drill passed. Record this run in docs/pilot/STAGING_PRIVACY_EVIDENCE.md.');
}

main().catch(async (error) => {
  console.error(`Staging privacy drill failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  process.exitCode = 1;
}).finally(async () => {
  if (createdPaths.length) await admin.storage.from('memories').remove(createdPaths);
  if (ownerId) await admin.auth.admin.deleteUser(ownerId);
  if (caregiverId) await admin.auth.admin.deleteUser(caregiverId);
});
