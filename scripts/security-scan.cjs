const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
const secretPatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|DATABASE_URL)[ \t]*=[ \t]*[^\s#][^\r\n]*/,
  /\bsb_secret_[A-Za-z0-9_-]{20,}/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}/,
  /postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@/i,
];
const findings = [];
for (const file of files) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch { continue; }
  for (const pattern of secretPatterns) if (pattern.test(text)) findings.push(file);
}
if (findings.length) {
  console.error(`Potential credential material found in tracked files: ${[...new Set(findings)].join(', ')}`);
  process.exitCode = 1;
} else {
  console.log(`Secret scan passed (${files.length} repository files).`);
}
