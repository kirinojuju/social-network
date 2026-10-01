const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

const claims = { uid: 'trusted-firebase-uid', email: 'Person@Example.com', email_verified: true };
const valid = { username: 'test_person', display_name: 'Test Person' };

async function withServer(run, query = async () => ({ rows: [] }), verifyToken = async () => claims) {
  const server = createApp({ query }, [], { verifyToken }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const root = `http://127.0.0.1:${server.address().port}/api/users`;
  const request = (route, body, headers = { Authorization: 'Bearer test-token' }) => fetch(root + route, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  try { await run(request, root); } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('both profile endpoints require authentication and do not query the database', async () => {
  await withServer(async request => {
    for (const [route, body] of [['/me', undefined], ['/sync', valid]]) {
      const res = await request(route, body, {});
      assert.equal(res.status, 401);
      assert.deepEqual(await res.json(), { error: 'Unauthorized' });
    }
  }, () => assert.fail('unauthenticated database access'));
});

test('sync validates all fields and rejects identity spoofing', async () => {
  const invalid = [null, [], {}, { ...valid, username: 'UPPER' }, { ...valid, username: "' OR 1=1--" },
    { ...valid, display_name: ' ' }, { ...valid, display_name: 'x'.repeat(101) },
    { ...valid, bio: 1 }, { ...valid, bio: 'x'.repeat(2001) }, { ...valid, bio: '\0' },
    { ...valid, avatar_url: 'http://example.com/a' }, { ...valid, avatar_url: 'https://u:p@example.com/a' },
    { ...valid, faculty_id: 'not-a-uuid' }, { ...valid, major_id: '00000000-0000-4000-8000-000000000001' },
    { ...valid, firebase_uid: 'victim' }, { ...valid, email: 'victim@example.com' }, { ...valid, password: 'secret' }];
  await withServer(async request => {
    for (const body of invalid) assert.equal((await request('/sync', body)).status, 400);
  }, () => assert.fail('invalid input reached database'));
});

test('sync accepts unverified Firebase email but requires a valid email', async () => {
  await withServer(async request => assert.equal((await request('/sync', valid)).status, 200),
    async () => ({ rows: [{ id: 'new-profile' }] }), async () => ({ ...claims, email_verified: false }));
  for (const identity of [{ uid: 'anonymous' }, { ...claims, email: 'bad' }]) {
    await withServer(async request => assert.equal((await request('/sync', valid)).status, 403),
      () => assert.fail('invalid email reached database'), async () => identity);
  }
});

test('sync binds trusted identity and all profile values to a UID-only upsert', async () => {
  const profile = { ...valid, bio: "Robert'); DROP TABLE users;--" };
  let calls = 0;
  await withServer(async request => {
    for (let i = 0; i < 2; i++) {
      const res = await request('/sync', profile);
      assert.equal(res.status, 200);
      assert.equal(res.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await res.json(), { user: { id: 'stable-id', ...profile } });
    }
    assert.equal(calls, 2);
  }, async (sql, values) => {
    calls++;
    assert.match(sql, /ON CONFLICT \(firebase_uid\) DO UPDATE/);
    assert.ok(!sql.includes(profile.bio));
    assert.deepEqual(values, [claims.uid, 'person@example.com', valid.username, valid.display_name, profile.bio, null, null, null]);
    return { rows: [{ id: 'stable-id', ...profile }] };
  });
});

test('me queries only the verified UID and returns profile or 404', async () => {
  for (const rows of [[], [{ id: 'own-profile' }]]) {
    await withServer(async request => {
      const res = await request('/me');
      assert.equal(res.status, rows.length ? 200 : 404);
      assert.deepEqual(await res.json(), rows.length ? { user: rows[0] } : { error: 'Profile not found' });
    }, async (sql, values) => {
      assert.match(sql, /WHERE firebase_uid = \$1/);
      assert.deepEqual(values, [claims.uid]);
      return { rows };
    });
  }
});

test('ensure creates an initial profile for an unverified account and preserves the UID', async () => {
  await withServer(async request => {
    const response = await request('/ensure', { display_name: 'New User' });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { user: { id: 'auto-profile' } });
  }, async (sql, values) => {
    assert.match(sql, /ON CONFLICT \(firebase_uid\) DO UPDATE SET email/);
    assert.equal(values[0], claims.uid);
    assert.equal(values[1], 'person@example.com');
    assert.match(values[2], /^person_[a-f0-9]{8}$/);
    assert.equal(values[3], 'New User');
    return { rows: [{ id: 'auto-profile' }] };
  }, async () => ({ ...claims, email_verified: false }));
});

test('database failures return safe conflict, validation, or internal errors', async () => {
  for (const [code, status, message] of [
    ['23505', 409, 'Email or username already in use'],
    ['23503', 400, 'Invalid profile fields'], ['23514', 400, 'Invalid profile fields'],
    ['XX000', 500, 'Internal server error'],
  ]) {
    await withServer(async request => {
      const res = await request('/sync', valid);
      assert.equal(res.status, status);
      assert.deepEqual(await res.json(), { error: message });
      if (status === 500) {
        const me = await request('/me');
        assert.equal(me.status, 500);
        assert.deepEqual(await me.json(), { error: message });
      }
    }, async () => { throw Object.assign(new Error('SECRET postgres credentials'), { code }); });
  }
});

test('malformed JSON and oversized bodies return safe errors', async () => {
  await withServer(async (request, root) => {
    for (const [body, status] of [['{', 400], [JSON.stringify({ bio: 'x'.repeat(4 * 1024 * 1024) }), 413]]) {
      const res = await fetch(root + '/sync', { method: 'POST',
        headers: { Authorization: 'Bearer test-token', 'Content-Type': 'application/json' }, body });
      assert.equal(res.status, status);
      assert.ok(!(await res.text()).includes('SyntaxError'));
    }
  });
});
