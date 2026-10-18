const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');
const { likePattern } = require('../routes/search');

const claims = { uid: 'trusted-firebase-uid', email: 'person@example.com' };

async function withSearch(run, query = async () => ({ rows: [] }), verifyToken = async () => claims) {
  const server = createApp({ query }, [], { verifyToken }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const root = `http://127.0.0.1:${server.address().port}/api/search`;
  const request = (path = '', headers = { Authorization: 'Bearer test-token' }) =>
    fetch(`${root}${path}`, { headers });
  try { await run(request, root); } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

test('search requires authentication and a valid query before touching the database', async () => {
  await withSearch(async request => {
    assert.equal((await request('?q=notes', {})).status, 401);
    for (const q of ['', '   ', 'x'.repeat(101), 'a\0b']) {
      const res = await request(`?q=${encodeURIComponent(q)}`);
      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { error: 'Invalid search' });
    }
    assert.equal((await request('')).status, 400);
  }, () => assert.fail('invalid search reached database'));
});

test('search escapes LIKE wildcards', () => {
  assert.equal(likePattern('100%_off\\'), '%100\\%\\_off\\\\%');
});

test('trending requires authentication and ranks hashtags from visible posts', async () => {
  const topics = [{ tag: 'cmuevents', count: 3 }, { tag: 'midterms', count: 1 }];
  let sql = '';
  await withSearch(async request => {
    assert.equal((await request('/trending', {})).status, 401);
    const res = await request('/trending');
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await res.json(), {
      topics: [
        { tag: '#cmuevents', count: 3 },
        { tag: '#midterms', count: 1 },
      ],
    });
  }, async (text, values) => {
    sql = text;
    assert.deepEqual(values, [claims.uid]);
    return { rows: topics };
  });
  assert.match(sql, /regexp_matches/);
  assert.match(sql, /u\.firebase_uid = \$1 OR p\.visibility = 'public'/);
  assert.match(sql, /interval '7 days'/);
});

test('search returns matching people and only posts visible to the verified user', async () => {
  const person = { id: 'other', username: 'algo_fan', display_name: 'Algo Fan' };
  const post = { id: 'post-1', content: 'algorithm notes' };
  const queries = [];
  await withSearch(async request => {
    const res = await request(`?q=${encodeURIComponent('  Algo  ')}`);
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
