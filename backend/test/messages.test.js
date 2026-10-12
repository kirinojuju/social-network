const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

const claims = { uid: 'trusted-firebase-uid', email: 'person@example.com' };
const other = '00000000-0000-4000-8000-000000000009';
const png = Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex');

async function withServer(run, query = async () => ({ rows: [] }), verifyToken = async () => claims) {
  const server = createApp({ query }, [], { verifyToken }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const root = `http://127.0.0.1:${server.address().port}/api/messages`;
  const request = (route, method = 'GET', body, headers = { Authorization: 'Bearer test-token' }) => fetch(root + route, {
    method, headers: { 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  try { await run(request); } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('messages require authentication and valid input before touching the database', async () => {
  await withServer(async request => {
    assert.equal((await request('/conversations', 'GET', undefined, {})).status, 401);
    assert.equal((await request('/with/not-a-uuid')).status, 404);
    assert.equal((await request(`/with/${other}?before=bad`)).status, 400);
    for (const body of [{}, { content: '   ' }, { content: 'x'.repeat(2001) }, { content: 'a\0b' },
      { content: 'hi', sender_id: 'victim' }, { image: null }, { image: { mime_type: 'image/png', base64: 'bad' } },
      { image: { mime_type: 'image/svg+xml', base64: png.toString('base64') } }]) {
      assert.equal((await request(`/with/${other}`, 'POST', body)).status, 400);
    }
  }, () => assert.fail('invalid request reached database'));
});

test('sending a message uses the verified sender and returns 404 for unknown or self recipients', async () => {
  const message = { id: 'm1', content: 'hello', from_me: true };
  for (const rows of [[message], []]) {
    await withServer(async request => {
      const res = await request(`/with/${other}`, 'POST', { content: '  hello  ' });
      assert.equal(res.status, rows.length ? 201 : 404);
      if (rows.length) assert.deepEqual(await res.json(), { message });
    }, async (sql, values) => {
      assert.match(sql, /me\.firebase_uid = \$1 AND other\.id <> me\.id/);
      assert.deepEqual(values, [claims.uid, other, 'hello', null, null]);
      return { rows };
    });
  }
});

test('a photo can be sent with or without text and is only served to the two members', async () => {
  await withServer(async request => {
    const res = await request(`/with/${other}`, 'POST', { image: { mime_type: 'image/png', base64: png.toString('base64') } });
    assert.equal(res.status, 201);
  }, async (sql, values) => {
    assert.deepEqual(values.slice(0, 4), [claims.uid, other, '', 'image/png']);
    assert.ok(png.equals(values[4]));
    return { rows: [{ id: 'm1', has_image: true }] };
  });
  const id = '00000000-0000-4000-8000-00000000000a';
  for (const rows of [[{ image_mime_type: 'image/png', image_data: png }], []]) {
    await withServer(async request => {
      const res = await request(`/images/${id}`);
      assert.equal(res.status, rows.length ? 200 : 404);
      if (rows.length) {
        assert.equal(res.headers.get('content-type'), 'image/png');
        assert.ok(png.equals(Buffer.from(await res.arrayBuffer())));
      }
    }, async (sql, values) => {
      assert.match(sql, /m\.sender_id = me\.id OR m\.recipient_id = me\.id/);
      assert.deepEqual(values, [claims.uid, id]);
      return { rows };
    });
  }
});

test('conversation history is scoped to the verified member pair and paginates', async () => {
  const rows = Array.from({ length: 51 }, (_, i) => ({ id: `m${i}` }));
  await withServer(async request => {
    const res = await request(`/with/${other}`);
    const body = await res.json();
    assert.equal(body.messages.length, 50);
    assert.equal(body.next_cursor, 'm49');
  }, async (sql, values) => {
    assert.match(sql, /m\.sender_id = pair\.me_id AND m\.recipient_id = pair\.other_id/);
    assert.deepEqual(values, [claims.uid, other, null]);
    return { rows };
  });
});

test('conversation list and read receipts act only for the verified member', async () => {
  const conversation = { id: other, display_name: 'Other', last_content: 'hi', unread_count: 2 };
  await withServer(async request => {
    const list = await request('/conversations');
    assert.deepEqual(await list.json(), { conversations: [conversation] });
    assert.equal((await request(`/with/${other}/read`, 'PUT')).status, 204);
  }, async (sql, values) => {
    assert.equal(values[0], claims.uid);
    if (/UPDATE/.test(sql)) {
      assert.match(sql, /m\.sender_id = pair\.other_id AND m\.recipient_id = pair\.me_id/);
      return { rows: [] };
    }
    return { rows: [conversation] };
  });
});
