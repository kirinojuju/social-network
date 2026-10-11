const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { parseSummarize, parseChat } = require('../routes/ai');

async function withServer(summarize, run, chat) {
  const server = createApp({}, [], { verifyToken: async () => ({ uid: 'u' }), summarize, chat }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}/api/ai`); } finally {
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
    assert.equal((await send(url + '/summarize', { text: 'hello' }, false)).status, 401);
    assert.equal((await send(url + '/summarize', { text: '' })).status, 400);
    const ok = await send(url + '/summarize', { text: 'hello' });
    assert.equal(ok.status, 200);
    assert.deepEqual(await ok.json(), { summary: 'S:hello' });
  });
  await withServer(async () => { throw new Error('boom'); }, async url => {
    assert.equal((await send(url + '/summarize', { text: 'hello' })).status, 502);
  });
});

test('chat validation and endpoint', async () => {
  const ok = { messages: [{ role: 'user', content: 'hi' }], context: 'post' };
  assert.deepEqual(parseChat(ok), { messages: [{ role: 'user', content: 'hi' }], context: 'post' });
  for (const body of [null, {}, { messages: [] }, { messages: [{ role: 'system', content: 'x' }] },
    { messages: [{ role: 'assistant', content: 'x' }] }, { messages: [{ role: 'user', content: ' ' }] },
    { ...ok, extra: 1 }, { ...ok, context: 5 }]) {
    assert.equal(parseChat(body), null);
  }
  await withServer(async () => '', async url => {
    assert.equal((await send(url + '/chat', ok, false)).status, 401);
    assert.equal((await send(url + '/chat', { messages: [] })).status, 400);
    const res = await send(url + '/chat', ok);
    assert.deepEqual(await res.json(), { reply: 'R:post:hi' });
  }, async (messages, context) => `R:${context}:${messages[0].content}`);
  await withServer(async () => '', async url => {
    assert.equal((await send(url + '/chat', ok)).status, 502);
  }, async () => { throw new Error('boom'); });
});
