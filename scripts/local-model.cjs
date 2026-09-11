const { spawn } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
require('@next/env').loadEnvConfig(root);
const server = path.join(root, '.venv-mori/bin/mlx_lm.server');
if (!existsSync(server)) {
  console.error('Install the runtime first: python3 -m venv .venv-mori && .venv-mori/bin/pip install -r scripts/local-model-requirements.txt');
  process.exit(1);
}
const url = new URL(process.env.MORI_LOCAL_URL || 'http://127.0.0.1:8080');
if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(url.hostname)) {
  throw new Error('Use http://127.0.0.1:8080 for the local model.');
}
const child = spawn(server, [
  '--model', process.env.MORI_LOCAL_MODEL || 'mlx-community/Qwen3.5-2B-4bit',
  '--host', '127.0.0.1', '--port', url.port || '80',
  '--decode-concurrency', '1', '--prompt-concurrency', '1',
  '--prefill-step-size', '256', '--prompt-cache-size', '1',
  '--prompt-cache-bytes', '256MB', '--max-tokens', '220',
  '--chat-template-args', '{"enable_thinking":false}',
  '--allowed-origins', 'http://127.0.0.1:3010,http://localhost:3000',
  '--log-level', 'WARNING'], {
    cwd: root, stdio: 'inherit',
    env: { ...process.env, HF_HOME: path.join(root, '.local-models'), HF_HUB_DISABLE_TELEMETRY: '1' },
  });
child.on('error', () => { console.error('Could not start the MLX runtime.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code || 0; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
