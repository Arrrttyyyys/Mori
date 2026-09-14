const { loadEnvConfig } = require('@next/env');
const { spawn } = require('node:child_process');

loadEnvConfig(process.cwd(), false, { info() {}, error() {} });
const required = ['MORI_STAGING_SUPABASE_URL', 'MORI_STAGING_SUPABASE_ANON_KEY', 'MORI_STAGING_SERVICE_ROLE_KEY'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing staging settings: ${missing.join(', ')}`);
  process.exit(1);
}
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL === process.env.MORI_STAGING_SUPABASE_URL) {
  console.error('Refusing to treat the normal configured project as disposable staging.');
  process.exit(1);
}
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', '3011'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: process.env.MORI_STAGING_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.MORI_STAGING_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.MORI_STAGING_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.MORI_STAGING_DATABASE_URL || '',
  },
});
child.on('exit', (code, signal) => process.exitCode = code ?? (signal ? 1 : 0));
