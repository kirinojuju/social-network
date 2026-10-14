const { execFileSync } = require('node:child_process');

// Print locations only. Never print a matching credential or file content.
const patterns = [
  ['OpenRouter key', /sk-or-v1-[a-fA-F0-9]{32,}/g],
  ['OpenAI key', /sk-proj-[A-Za-z0-9_-]{30,}/g],
  ['Neon password', /npg_[A-Za-z0-9]{12,}/g],
  ['GitHub token', /(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,})/g],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
];
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

function scanText(content, filename) {
  const findings = [];
  for (const [kind, pattern] of patterns) {
    pattern.lastIndex = 0;
    for (const match of content.matchAll(pattern)) {
      findings.push(`${filename}:${content.slice(0, match.index).split('\n').length}: ${kind}`);
    }
  }
  return findings;
}

function main() {
  const staged = process.argv.includes('--staged');
  const files = (staged ? git('ls-files', '-z') : git('ls-tree', '-r', '--name-only', '-z', 'HEAD'))
    .split('\0').filter(Boolean);
  const findings = [];
  for (const filename of files) {
    if (/(?:^|\/)\.env(?:\..*)?$/.test(filename) && !filename.endsWith('.example') ||
        /(?:^|\/)(?:secrets|credentials)\//i.test(filename) ||
        /(?:service[-_]?account|firebase-adminsdk).*\.json$/i.test(filename) ||
        /\.(?:pem|key|p12|pfx)$/i.test(filename)) {
      findings.push(`${filename}: private configuration must not be tracked`);
    }
    // Both modes read Git blobs, avoiding ignored local .env files entirely.
    const content = git('show', staged ? `:${filename}` : `HEAD:${filename}`);
    findings.push(...scanText(content, filename));
  }
  if (findings.length) {
    console.error(`Secret check failed:\n${findings.join('\n')}`);
    process.exitCode = 1;
  } else console.log(`Secret check passed: ${files.length} tracked files (known credential patterns).`);
}

if (require.main === module) main();
module.exports = { scanText };
