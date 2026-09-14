const { loadEnvConfig } = require('@next/env');
const { spawnSync } = require('node:child_process');

loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
if (!process.env.MORI_STAGING_DATABASE_URL) {
  console.error('MORI_STAGING_DATABASE_URL is required.');
  process.exit(1);
}
if (process.env.MORI_STAGING_DATABASE_URL === process.env.DATABASE_URL) {
  console.error('Refusing to migrate the normally configured database as staging.');
  process.exit(1);
}
if (process.env.MORI_STAGING_ALLOW_DESTRUCTIVE !== 'DELETE DISPOSABLE MORI DATA') {
  console.error('Set MORI_STAGING_ALLOW_DESTRUCTIVE to the documented exact phrase before applying staging migrations.');
  process.exit(1);
}
const result = spawnSync(process.execPath, ['scripts/database.cjs', 'apply'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: process.env.MORI_STAGING_DATABASE_URL },
});
process.exitCode = result.status ?? 1;
