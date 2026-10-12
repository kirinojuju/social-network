const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { parsePost, parseComment } = require('../routes/posts');

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
  const photo = { mime_type: 'image/png', base64: png };
  assert.equal(parsePost({ content: '', image: photo }).images[0].data.length, 10);
  assert.equal(parsePost({ content: '', images: Array(10).fill(photo) }).images.length, 10);
  assert.deepEqual(parsePost({ content: 'Hi', images: [] }).images, []);
  for (const body of [null, {}, { content: '  ' }, { content: 'x'.repeat(10001) },
    { content: 'hi', author_id: 'someone-else' }, { content: 'hi', visibility: 'everyone' },
    { content: '', image: { mime_type: 'image/svg+xml', base64: 'AQID' } },
    { content: '', image: { mime_type: 'image/png', base64: 'bad!' } },
    { content: '', image: { mime_type: 'image/png', base64: 'AQID' } },
    { content: '', image: { mime_type: 'image/png', base64: Buffer.alloc(2097153).toString('base64') } },
    { content: '', images: Array(11).fill(photo) }, { content: '', images: [] }, { content: 'Hi', images: photo },
    { content: '', images: [photo, { mime_type: 'image/svg+xml', base64: 'AQID' }] },
    { content: '', image: photo, images: [photo] }]) {
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
});

test('saving binds to the verified member, only for visible posts, and the saved list re-checks visibility', async () => {
  const postId = '00000000-0000-4000-8000-000000000002';
  const calls = [];
  await withServer({ async query(sql, values) {
    calls.push({ sql, values });
    return { rows: [{ id: postId, saved: true }] };
  } }, async root => {
    const headers = { Authorization: 'Bearer valid' };
    for (const method of ['PUT', 'DELETE']) {
      const response = await fetch(`${root}/${postId}/save`, { method, headers });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).post.saved, true);
    }
    assert.equal((await fetch(`${root}/not-a-uuid/save`, { method: 'PUT', headers })).status, 404);
    assert.equal((await fetch(`${root}?scope=saved`, { headers })).status, 200);
  });
  assert.equal(calls.length, 5);
  for (const call of calls) assert.equal(call.values[0], 'owner-uid');
  assert.match(calls[0].sql, /INSERT INTO public\.saved_posts \(post_id, user_id\) SELECT id, user_id FROM target/);
  assert.match(calls[0].sql, /p\.visibility = 'public' OR owner\.id = viewer\.id/);
  assert.match(calls[2].sql, /DELETE FROM public\.saved_posts/);
  assert.match(calls[4].sql, /saver\.firebase_uid = \$1 AND \(p\.visibility = 'public' OR u\.firebase_uid = \$1\)/);
  assert.deepEqual(calls[4].values, ['owner-uid']);
});

test('profile posts show the author\'s public posts, plus private ones only to the author', async () => {
  const author = '00000000-0000-4000-8000-000000000001';
  const calls = [];
  await withServer({ async query(sql, values) {
    calls.push({ sql, values });
    return { rows: [{ id: 'post-id' }] };
  } }, async root => {
    const headers = { Authorization: 'Bearer valid' };
    const response = await fetch(`${root}?author=${author}`, { headers });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { posts: [{ id: 'post-id' }] });
    for (const bad of ['not-a-uuid', `${author}&author=${author}`]) {
      assert.deepEqual(await (await fetch(`${root}?author=${bad}`, { headers })).json(), { posts: [] });
    }
  });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].values, ['owner-uid', author]);
  assert.match(calls[0].sql, /WHERE u\.id = \$2 AND \(p\.visibility = 'public' OR u\.firebase_uid = \$1\)/);
});


test('image size validation accepts exactly 2 MiB and rejects a larger image with a valid signature', () => {
  for (const [size, allowed] of [[2 * 1024 * 1024, true], [2 * 1024 * 1024 + 1, false]]) {
    const data = Buffer.alloc(size);
    Buffer.from('89504e470d0a1a0a', 'hex').copy(data);
    const result = parsePost({ content: '', image: { mime_type: 'image/png', base64: data.toString('base64') } });
    assert.equal(Boolean(result), allowed);
    if (allowed) assert.equal(result.images[0].data.length, size);
  }
});

test('comments reject forged authors, blank, oversized and null-containing text', () => {
  assert.equal(parseComment({ content: '  สวัสดีครับ  ' }), 'สวัสดีครับ');
  assert.equal(parseComment({ content: '😀'.repeat(2000) }), '😀'.repeat(2000));
  for (const input of [null, [], {}, { content: '  ' }, { content: '\0' },
    { content: 'a'.repeat(2001) }, { content: 'x', author_id: 'forged' }]) {
    assert.equal(parseComment(input), null);
  }
});

test('interaction endpoints require auth before validation or database access', async () => {
  await withServer({ query() { throw new Error('Must not query'); } }, async root => {
    for (const [method, path] of [['PUT', '/invalid/like'], ['DELETE', '/invalid/like'],
      ['PUT', '/invalid/save'], ['DELETE', '/invalid/save'], ['GET', '?scope=saved'],
      ['GET', '/invalid/comments'], ['POST', '/invalid/comments'],
      ['DELETE', '/invalid/comments/invalid'], ['PATCH', '/invalid/visibility'], ['POST', '/import']]) {
      assert.equal((await fetch(root + path, { method })).status, 401);
    }
  });
});
