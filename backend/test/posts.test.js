const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { parsePost } = require('../routes/posts');

async function withServer(pool, run) {
  const server = createApp(pool, [], { verifyToken: async () => ({ uid: 'owner-uid' }) }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const root = `http://127.0.0.1:${server.address().port}/api/posts`;
  try { await run(root); } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('post validation accepts text or a small image and rejects unsafe input', () => {
  assert.equal(parsePost({ content: ' Hello ' }).content, 'Hello');
  const png = Buffer.from('89504e470d0a1a0a0000', 'hex').toString('base64');
  assert.equal(parsePost({ content: '', image: { mime_type: 'image/png', base64: png } }).image.data.length, 10);
  for (const body of [null, {}, { content: '  ' }, { content: 'x'.repeat(10001) },
    { content: 'hi', author_id: 'someone-else' }, { content: 'hi', visibility: 'everyone' },
    { content: '', image: { mime_type: 'image/svg+xml', base64: 'AQID' } },
    { content: '', image: { mime_type: 'image/png', base64: 'bad!' } },
    { content: '', image: { mime_type: 'image/png', base64: 'AQID' } },
    { content: '', image: { mime_type: 'image/png', base64: Buffer.alloc(2097153).toString('base64') } }]) {
    assert.equal(parsePost(body), null);
  }
});

test('post endpoints require a token and bind reads and writes to verified UID', async () => {
  const imageId = 'abbcccc0-0000-4000-8000-000000000000';
  const calls = [];
  await withServer({ async query(sql, values) {
    calls.push({ sql, values });
    if (sql.includes('SELECT m.mime_type')) return { rows: [{ mime_type: 'image/png', image_data: Buffer.from([1, 2, 3]) }] };
    if (sql.includes('WITH new_post')) return { rows: [{ id: 'post-id', content: 'Hello', image_id: null }] };
    return { rows: [{ id: 'post-id', content: 'Hello' }] };
  } }, async root => {
    for (const [method, path] of [['GET', ''], ['POST', ''], ['GET', `/${imageId}/image`]]) {
      const response = await fetch(root + path, { method, headers: { 'Content-Type': 'application/json' },
        ...(method === 'POST' ? { body: JSON.stringify({ content: 'Hello' }) } : {}) });
      assert.equal(response.status, 401);
    }
    const headers = { Authorization: 'Bearer valid', 'Content-Type': 'application/json' };
    assert.equal((await fetch(root, { headers })).status, 200);
    assert.equal((await fetch(root, { method: 'POST', headers, body: JSON.stringify({ content: 'Hello' }) })).status, 201);
    assert.equal((await fetch(`${root}/${imageId}/image`, { headers })).status, 200);
  });
  assert.equal(calls.length, 3);
  for (const call of calls) assert.equal(call.values[0], 'owner-uid');
  assert.equal(calls[1].values[1], 'Hello');
  assert.equal(calls[2].values[1], imageId);
  assert.match(calls[2].sql, /p\.visibility = 'public'/);
});

test('only an authenticated author can change post visibility', async () => {
  const id = 'abbcccc0-0000-4000-8000-000000000000';
  const calls = [];
  await withServer({ async query(sql, values) {
    calls.push({ sql, values });
    return { rows: [{ id, visibility: values[2] }] };
  } }, async root => {
    const change = (path, body, headers = { Authorization: 'Bearer valid',
      'Content-Type': 'application/json' }) => fetch(root + path, {
      method: 'PATCH', headers, body: JSON.stringify(body),
    });
    assert.equal((await change(`/${id}/visibility`, { visibility: 'public' }, {})).status, 401);
    for (const body of [{ visibility: 'everyone' }, { visibility: 'public', author: 'other' }]) {
      assert.equal((await change(`/${id}/visibility`, body)).status, 400);
    }
    const accepted = await change(`/${id}/visibility`, { visibility: 'public' });
    assert.equal(accepted.status, 200, await accepted.text());
  });
  assert.equal(calls.length, 1);
  assert.match(calls[0].sql, /u\.firebase_uid = \$1/);
  assert.deepEqual(calls[0].values, ['owner-uid', id, 'public']);
});
