const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

test('frontend profile client works through Express across an API restart', async () => {
  const { createProfileClient } = await import('../../frontend/src/auth/profile.js');
  let stored = null;
  const pool = {
    async query(sql, values) {
      if (sql.includes('SELECT') && sql.includes('FROM public.users')) {
        assert.deepEqual(values, ['integration-test-uid']);
        return { rows: stored ? [stored] : [] };
      }
      assert.match(sql, /ON CONFLICT \(firebase_uid\) DO UPDATE/);
      stored = {
        id: stored?.id || 'stable-database-id',
        firebase_uid: values[0], email: values[1], username: values[2],
        display_name: values[3], bio: values[4], avatar_url: values[5],
        faculty_id: values[6], major_id: values[7],
      };
      return { rows: [stored] };
    },
  };
  const verifyToken = async token => {
    assert.equal(token, 'integration-test-token');
    return { uid: 'integration-test-uid', email: 'Test@Example.com', email_verified: true };
  };
  const user = { getIdToken: async () => 'integration-test-token' };

  async function withServer(run) {
    const server = createApp(pool, [], { verifyToken }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
      const client = createProfileClient({ baseUrl: `http://127.0.0.1:${server.address().port}` });
      await run(client);
    } finally {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
  }

  await withServer(async client => {
    assert.equal(await client.load(user), null);
    const created = await client.syncAndRead(user, {
      username: 'integration_user', display_name: 'Integration User',
    });
    assert.equal(created.id, 'stable-database-id');
    assert.equal(created.email, 'test@example.com');
  });

  await withServer(async client => {
    const restored = await client.load(user);
    assert.equal(restored.id, 'stable-database-id');
    assert.equal(restored.username, 'integration_user');
  });
});
