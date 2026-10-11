const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { likePattern } = require('../routes/search');

const claims = { uid: 'trusted-firebase-uid', email: 'person@example.com' };

async function withServer(run, query = async () => ({ rows: [] }), verifyToken = async () => claims) {
  const server = createApp({ query }, [], { verifyToken }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const root = `http://127.0.0.1:${server.address().port}/api/search`;
  const request = (q, headers = { Authorization: 'Bearer test-token' }) =>
    fetch(q === undefined ? root : `${root}?q=${encodeURIComponent(q)}`, { headers });
  try { await run(request); } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('search requires authentication and a valid query before touching the database', async () => {
  await withServer(async request => {
    assert.equal((await request('notes', {})).status, 401);
    for (const q of [undefined, '', '   ', 'x'.repeat(101), 'a\0b']) {
      const res = await request(q);
      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { error: 'Invalid search' });
    }
  }, () => assert.fail('invalid search reached database'));
});

test('search escapes LIKE wildcards', () => {
  assert.equal(likePattern('100%_off\\'), '%100\\%\\_off\\\\%');
});

test('search returns matching people and only posts visible to the verified user', async () => {
  const person = { id: 'other', username: 'algo_fan', display_name: 'Algo Fan' };
  const post = { id: 'post-1', content: 'algorithm notes' };
  const queries = [];
  await withServer(async request => {
    const res = await request('  Algo  ');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await res.json(), { users: [person], posts: [post] });
  }, async (sql, values) => {
    queries.push(sql);
    assert.deepEqual(values, [claims.uid, '%Algo%']);
    return { rows: /FROM public\.posts/.test(sql) ? [post] : [person] };
  });
  const [usersSql, postsSql] = [queries.find(sql => !/public\.posts/.test(sql)), queries.find(sql => /public\.posts/.test(sql))];
  const selected = usersSql.match(/SELECT\s+([\s\S]+?)\s+FROM/i)[1];
  assert.doesNotMatch(selected, /\bemail\b|\*|(^|,)\s*firebase_uid\s*(,|$)/i);
  assert.match(usersSql, /username ILIKE \$2 OR display_name ILIKE \$2/);
  assert.match(postsSql, /u\.firebase_uid = \$1 OR p\.visibility = 'public'/);
  assert.doesNotMatch(postsSql, /post_likes|post_comments/);
});
