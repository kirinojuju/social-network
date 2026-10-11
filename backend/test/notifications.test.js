const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

const claims = { uid: 'trusted-firebase-uid', email: 'person@example.com' };

async function withServer(run, query) {
  const server = createApp({ query }, [], { verifyToken: async () => claims }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const root = `http://127.0.0.1:${server.address().port}/api/notifications`;
  try { await run(root); } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('notifications require authentication', async () => {
  await withServer(async root => {
    assert.equal((await fetch(root)).status, 401);
  }, () => assert.fail('unauthenticated database access'));
});

test('notifications are only for the verified member and exclude their own actions', async () => {
  const rows = [{ id: 'follow:x', type: 'follow', actor_name: 'Bob' }];
  let call;
  await withServer(async root => {
    const res = await fetch(root, { headers: { Authorization: 'Bearer t' } });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await res.json(), { notifications: rows });
  }, async (sql, values) => {
    call = { sql, values };
    return { rows };
  });
  assert.deepEqual(call.values, [claims.uid]);
  assert.match(call.sql, /firebase_uid = \$1/);
  assert.match(call.sql, /l\.user_id <> me\.id/);
  assert.match(call.sql, /c\.author_id <> me\.id/);
  assert.match(call.sql, /f\.followee_id = me\.id/);
  assert.match(call.sql, /LIMIT 30/);
});
