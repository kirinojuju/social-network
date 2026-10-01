const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { parseSummarize } = require('../routes/ai');

async function withServer(summarize, run) {
  const server = createApp({}, [], { verifyToken: async () => ({ uid: 'u' }), summarize }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}/api/ai/summarize`); } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
const send = (url, body, auth = true) => fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer t' } : {}) },
  body: JSON.stringify(body),
});

test('summarize input validation', () => {
  assert.equal(parseSummarize({ text: ' hi ' }), 'hi');
  for (const body of [null, {}, { text: '  ' }, { text: 5 }, { text: 'x'.repeat(10001) }, { text: 'a', extra: 1 }]) {
    assert.equal(parseSummarize(body), null);
  }
});

test('summarize endpoint requires a token, validates, and maps AI failures to 502', async () => {
  await withServer(async text => `S:${text}`, async url => {
    assert.equal((await send(url, { text: 'hello' }, false)).status, 401);
    assert.equal((await send(url, { text: '' })).status, 400);
    const ok = await send(url, { text: 'hello' });
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { summary: 'S:hello' });
  });
  await withServer(async () => { throw new Error('boom'); }, async url => {
    assert.equal((await send(url, { text: 'hello' })).status, 502);
  });
});
