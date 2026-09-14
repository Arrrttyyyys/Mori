const { loadEnvConfig } = require('@next/env');
const { spawnSync } = require('node:child_process');

loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const source = process.env.MORI_STAGING_DATABASE_URL;
const restored = process.env.MORI_RESTORE_DATABASE_URL;
if (!source || !restored) {
  console.error('Set MORI_STAGING_DATABASE_URL and MORI_RESTORE_DATABASE_URL to separate disposable projects.');
  process.exit(1);
}
if (source === restored) {
  console.error('Restore verification requires two different database URLs.');
  process.exit(1);
}

function query(url, sql) {
  const parsed = new URL(url);
  const result = spawnSync('psql', ['-X', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1'], {
    input: sql,
    encoding: 'utf8',
    env: {
      ...process.env,
      PGHOST: parsed.hostname,
      PGPORT: parsed.port || '5432',
      PGUSER: decodeURIComponent(parsed.username),
      PGPASSWORD: decodeURIComponent(parsed.password),
      PGDATABASE: parsed.pathname.slice(1) || 'postgres',
      PGSSLMODE: 'require',
      PGCONNECTTIMEOUT: '15',
    },
  });
  if (result.status !== 0) throw new Error('Database comparison command failed.');
  return result.stdout.trim();
}

const inventorySql = `
select tablename || '=' || (xpath('/row/count/text()', query_to_xml(format('select count(*) as count from public.%I', tablename), false, true, '')))[1]::text
from pg_tables
where schemaname='public' and tablename <> 'mori_schema_migrations'
order by tablename;
select 'migration=' || name from public.mori_schema_migrations order by name;
`;

try {
  const expected = query(source, inventorySql);
  const actual = query(restored, inventorySql);
  if (expected !== actual) {
    console.error('Restore verification failed: public table counts or migration records differ.');
    process.exit(1);
  }
  console.log('Restore verification passed: public table counts and migration records match.');
  console.log('Complete the documented RLS, storage-hash, and signed-URL checks before approving the restore drill.');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
