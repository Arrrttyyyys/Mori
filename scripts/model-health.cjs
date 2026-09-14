const { existsSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('@next/env').loadEnvConfig(root);

const expectedModel = process.env.MORI_LOCAL_MODEL || 'mlx-community/Qwen3.5-2B-4bit';
const base = new URL(process.env.MORI_LOCAL_URL || 'http://127.0.0.1:8080');
if (base.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(base.hostname)) {
  throw new Error('The local model health check accepts loopback HTTP only.');
}
const executable = path.join(root, '.venv-mori/bin/mlx_lm.server');
if (!existsSync(executable)) throw new Error('The pinned MLX runtime is not installed.');

(async () => {
  const response = await fetch(new URL('/v1/models', base), { signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`Model server returned ${response.status}.`);
  const body = await response.json();
  const ids = (body.data || []).map((model) => model.id).filter(Boolean);
  if (!ids.some((id) => id === expectedModel || id.endsWith(expectedModel))) {
    throw new Error(`Expected model ${expectedModel} is not loaded.`);
  }
  console.log(`Mori model ready: ${expectedModel} at ${base.origin}`);
})().catch((error) => {
  console.error(`Mori model unavailable: ${error.message}`);
  process.exitCode = 1;
});
