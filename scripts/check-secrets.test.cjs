const test = require('node:test');
const assert = require('node:assert/strict');
const { scanText } = require('./check-secrets.cjs');

test('secret scanner reports only credential type and location, never the value', () => {
  const key = ['sk', 'or', 'v1', 'a'.repeat(64)].join('-');
  const result = scanText(`config\nKEY=${key}`, 'config.js');
  assert.deepEqual(result, ['config.js:2: OpenRouter key']);
  assert.ok(!JSON.stringify(result).includes(key));
  assert.deepEqual(scanText('OPENROUTER_API_KEY=\nVITE_FIREBASE_API_KEY=public', '.env.example'), []);
});
