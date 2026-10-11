// Creates and drops a dedicated LOCAL database. Never runs against Neon or the
// current application database; authentication is stubbed only in this test app.
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const { Client } = require('pg');
const { migrate } = require('./migrate');
const { createPool, assertLimitedRole } = require('../config/db');
const { createApp } = require('../app');

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
  const connection = new URL(process.env.MIGRATION_DATABASE_URL || 'postgresql://invalid');
  if (!['127.0.0.1', 'localhost'].includes(connection.hostname) ||
      !['127.0.0.1', 'localhost'].includes(process.env.PGHOST) || process.env.PGUSER !== 'social_app') {
    throw new Error('Local owner connection and local social_app runtime required');
  }
  const database = `social_interactions_test_${randomUUID().replaceAll('-', '')}`;
  const owner = new Client({ connectionString: connection.toString() });
  let fixture, pool, server, created = false;
  await owner.connect();
  try {
    await owner.query(`CREATE DATABASE ${database}`);
    created = true;
    connection.pathname = `/${database}`;
    fixture = new Client({ connectionString: connection.toString() });
    await fixture.connect();
    await fixture.query(`GRANT CONNECT ON DATABASE ${database} TO social_app`);
    await fixture.query('GRANT USAGE ON SCHEMA public TO social_app');
    assert.equal(await migrate(fixture), 9);
    assert.equal(await migrate(fixture), 0);
    pool = createPool({ ...process.env, PGDATABASE: database });
    await assertLimitedRole(pool);
    for (const name of ['alice', 'bob', 'carol']) {
      await fixture.query(`INSERT INTO public.users (firebase_uid, email, username, display_name)
        VALUES ($1, $2, $1, $1)`, [name, `${name}@example.invalid`]);
    }
    const members = Object.fromEntries((await fixture.query(
      'SELECT firebase_uid, id FROM public.users'
    )).rows.map(row => [row.firebase_uid, row.id]));
    const start = async () => {
      server = createApp(pool, [], { verifyToken: async token => {
        if (!['alice', 'bob', 'carol', 'no-profile'].includes(token)) throw new Error('Invalid test token');
        return { uid: token };
      } }).listen(0, '127.0.0.1');
      await new Promise(resolve => server.once('listening', resolve));
      return `http://127.0.0.1:${server.address().port}/api/posts`;
    };
    let root = await start();
    const stop = async () => {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
      server = null;
    };
    async function request(user, method, route = '', body, status = 200) {
      const url = route.startsWith('/api/') ? new URL(route, root).href : root + route;
      const response = await fetch(url, { method, headers: {
        ...(user ? { Authorization: `Bearer ${user}` } : {}), 'Content-Type': 'application/json',
      }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
      assert.equal(response.status, status, `${user} ${method} ${route}: ${(await response.clone().text()).slice(0, 250)}`);
      if (status === 204) return null;
      return response.json();
    }
    const png = Buffer.from('89504e470d0a1a0a0000', 'hex');
    const image = { mime_type: 'image/png', base64: png.toString('base64') };
    const shared = (await request('alice', 'POST', '', { content: 'Shared by Alice', visibility: 'public', image }, 201)).post;
    const secret = (await request('alice', 'POST', '', { content: 'Private Alice', image }, 201)).post;
    await request('bob', 'POST', '', { content: 'Shared by Bob', visibility: 'public' }, 201);
    assert.equal((await request('bob', 'GET', '?scope=feed')).posts.length, 2);
    assert.equal((await request('alice', 'GET', '?scope=feed')).posts.length, 3);
    assert.equal((await request('bob', 'GET')).posts.length, 1);
    const feed = (await request('bob', 'GET', '?scope=feed')).posts;
    assert.equal(feed.find(p => p.id === shared.id).author_name, 'alice');
    assert.ok(feed.every(p => !('firebase_uid' in p) && !('email' in p)));
    await request(null, 'GET', '?scope=feed', undefined, 401);
    const publicImage = await fetch(`${root}/${shared.image_id}/image`, { headers: { Authorization: 'Bearer bob' } });
    assert.equal(publicImage.status, 200);
    assert.deepEqual(Buffer.from(await publicImage.arrayBuffer()), png);
    await request('bob', 'GET', `/${secret.image_id}/image`, undefined, 404);
    await request('bob', 'PATCH', `/${secret.id}/visibility`, { visibility: 'public' }, 404);
    await request('alice', 'POST', '', { content: 'Forged', author_id: 'bob' }, 400);

    // Alpha acceptance: real SQL search, follows and two-way private chat.
    const search = await request('bob', 'GET', '/api/search?q=Alice');
    assert.equal(search.users[0].id, members.alice);
    const aliceProfile = (await request('bob', 'GET', `/api/users/${members.alice}`)).user;
    assert.equal(aliceProfile.id, members.alice);
    assert.equal(aliceProfile.is_self, false);
    assert.ok(!('email' in aliceProfile) && !('firebase_uid' in aliceProfile));
    assert.ok(search.posts.some(post => post.id === shared.id));
    assert.ok(!search.posts.some(post => post.id === secret.id));
    assert.equal((await request('bob', 'PUT', `/api/users/${members.alice}/follow`)).follow.following, true);
    assert.equal((await request('bob', 'GET', '/api/users/me/following')).users[0].id, members.alice);
    assert.equal((await request('bob', 'DELETE', `/api/users/${members.alice}/follow`)).follow.following, false);

    const chatWithBob = `/api/messages/with/${members.bob}`;
    const chatWithAlice = `/api/messages/with/${members.alice}`;
    const hello = (await request('alice', 'POST', chatWithBob, { content: 'Hello Bob' }, 201)).message;
    const reply = (await request('bob', 'POST', chatWithAlice, { content: 'Hello Alice' }, 201)).message;
    const photo = (await request('alice', 'POST', chatWithBob, { image }, 201)).message;
    const received = (await request('bob', 'GET', chatWithAlice)).messages;
    assert.equal(received.length, 3);
    assert.equal(received.find(message => message.id === hello.id).from_me, false);
    assert.equal(received.find(message => message.id === reply.id).from_me, true);
    assert.equal((await request('carol', 'GET', chatWithAlice)).messages.length, 0);
    assert.equal((await request('carol', 'GET', '/api/messages/conversations')).conversations.length, 0);
    await request(null, 'GET', '/api/messages/conversations', undefined, 401);
    await request('alice', 'POST', chatWithAlice, { content: 'Self' }, 404);
    await request('alice', 'POST', chatWithBob, { content: 'Forged', sender_id: members.carol }, 400);
    const chatPhoto = await fetch(new URL(`/api/messages/images/${photo.id}`, root), {
      headers: { Authorization: 'Bearer bob' },
    });
    assert.equal(chatPhoto.status, 200);
    assert.deepEqual(Buffer.from(await chatPhoto.arrayBuffer()), png);
    await request('carol', 'GET', `/api/messages/images/${photo.id}`, undefined, 404);
    assert.equal((await request('bob', 'GET', '/api/messages/conversations')).conversations[0].unread_count, 2);
    await request('bob', 'PUT', `${chatWithAlice}/read`, undefined, 204);
    assert.equal((await request('bob', 'GET', '/api/messages/conversations')).conversations[0].unread_count, 0);
    const foreign = (await request('carol', 'POST', chatWithBob, { content: 'Separate conversation' }, 201)).message;
    assert.equal((await request('alice', 'GET', `${chatWithBob}?before=${foreign.id}`)).messages.length, 0);

    for (const method of ['PUT', 'DELETE']) await request('bob', method, `/${secret.id}/like`, undefined, 404);
    await request('bob', 'POST', `/${secret.id}/comments`, { content: 'Forbidden' }, 404);
    await request('bob', 'GET', `/${secret.id}/comments`, undefined, 404);
    assert.equal((await request('bob', 'PUT', `/${shared.id}/like`)).post.like_count, 1);
    await Promise.all(Array.from({ length: 8 }, () => request('bob', 'PUT', `/${shared.id}/like`)));
    assert.equal((await request('bob', 'PUT', `/${shared.id}/like`)).post.like_count, 1);
    assert.equal((await request('alice', 'PUT', `/${shared.id}/like`)).post.like_count, 2);
    assert.equal((await request('bob', 'DELETE', `/${shared.id}/like`)).post.like_count, 1);
    assert.equal((await request('bob', 'DELETE', `/${shared.id}/like`)).post.like_count, 1);
    const comment = (await request('bob', 'POST', `/${shared.id}/comments`, { content: ' สวัสดี Alice ' }, 201)).comment;
    assert.equal(comment.author_name, 'bob');
    assert.equal(comment.content, 'สวัสดี Alice');
    await request('bob', 'POST', `/${shared.id}/comments`, { content: 'x', author_id: 'alice' }, 400);
    await request('bob', 'POST', `/${shared.id}/comments`, { content: ' ' }, 400);
    await request('bob', 'POST', `/${shared.id}/comments`, { content: 'x'.repeat(2001) }, 400);
    await request('alice', 'DELETE', `/${shared.id}/comments/${comment.id}`, undefined, 404);
    await request('carol', 'DELETE', `/${shared.id}/comments/${comment.id}`, undefined, 404);
    const comments = (await request('alice', 'GET', `/${shared.id}/comments`)).comments;
    assert.equal(comments[0].is_own, false);
    assert.equal((await request('bob', 'GET', `/${shared.id}/comments`)).comments[0].is_own, true);

    // Persistence across API restarts, not merely an in-memory response.
    await stop();
    root = await start();
    assert.equal((await request('alice', 'GET', chatWithBob)).messages.length, 3);
    assert.ok((await request('bob', 'GET', chatWithAlice)).messages.some(message => message.id === reply.id));
    const restored = (await request('alice', 'GET', '?scope=feed')).posts.find(p => p.id === shared.id);
    assert.equal(restored.like_count, 1);
    assert.equal(restored.comment_count, 1);
    assert.equal((await request('bob', 'GET', `/${shared.id}/comments`)).comments[0].id, comment.id);
    await request('alice', 'PATCH', `/${shared.id}/visibility`, { visibility: 'private' });
    await request('bob', 'GET', `/${shared.id}/comments`, undefined, 404);
    await request('bob', 'PUT', `/${shared.id}/like`, undefined, 404);
    await request('bob', 'GET', `/${shared.image_id}/image`, undefined, 404);
    await request('alice', 'PATCH', `/${shared.id}/visibility`, { visibility: 'public' });
    await request('bob', 'DELETE', `/${shared.id}/comments/${comment.id}`, undefined, 204);

    // Stable pagination even when comments have identical timestamps.
    await fixture.query(`INSERT INTO public.post_comments (post_id, author_id, content, created_at)
      SELECT $1, u.id, 'Page ' || n, '2026-01-01'::timestamptz
      FROM public.users u CROSS JOIN generate_series(1, 55) n WHERE u.firebase_uid = 'bob'`, [shared.id]);
    const first = await request('alice', 'GET', `/${shared.id}/comments`);
    const second = await request('alice', 'GET', `/${shared.id}/comments?before=${first.next_cursor}`);
    assert.equal(first.comments.length, 50);
    assert.equal(second.comments.length, 5);
    assert.equal(new Set([...first.comments, ...second.comments].map(c => c.id)).size, 55);

    const legacy = { posts: [{ source_id: 'AbCdEf0123456789ghij', content: 'Old private post', created_at: '2026-01-01T00:00:00Z' }] };
    assert.equal((await request('alice', 'POST', '/import', legacy)).imported, 1);
    assert.equal((await request('alice', 'POST', '/import', legacy)).imported, 0);
    assert.equal((await request('bob', 'POST', '/import', legacy)).imported, 1);
    const imported = (await request('alice', 'GET')).posts.find(p => p.content === 'Old private post');
    assert.equal(imported.visibility, 'private');
    assert.equal(imported.created_at, '2026-01-01T00:00:00.000Z');
    await request('alice', 'PATCH', `/${imported.id}/visibility`, { visibility: 'public' });
    assert.equal((await request('alice', 'POST', '/import', legacy)).imported, 0);
    assert.equal((await request('alice', 'GET')).posts.find(p => p.id === imported.id).visibility, 'public');
    await request('alice', 'GET', `/${shared.id}/comments?before=bad`, undefined, 400);
    await request('alice', 'GET', `/${shared.id}/comments?before=${comment.id}&before=${comment.id}`, undefined, 400);
    await request('no-profile', 'POST', '/import', legacy, 409);
    await request('alice', 'POST', '/import', { posts: [{ ...legacy.posts[0], visibility: 'public' }] }, 400);
    await assert.rejects(pool.query(`INSERT INTO public.post_comments (post_id, author_id, content)
      SELECT $1, id, '' FROM public.users WHERE firebase_uid = 'bob'`, [shared.id]), { code: '23514' });
    await assert.rejects(pool.query('UPDATE public.post_comments SET content = $1', ['changed']), { code: '42501' });
    await assert.rejects(pool.query('DELETE FROM public.posts'), { code: '42501' });
    // Deleting a fixture post cascades to its interactions without orphans.
    await fixture.query('DELETE FROM public.posts WHERE id = $1', [shared.id]);
    assert.equal((await fixture.query('SELECT count(*)::int AS n FROM public.post_likes WHERE post_id = $1', [shared.id])).rows[0].n, 0);
    assert.equal((await fixture.query('SELECT count(*)::int AS n FROM public.post_comments WHERE post_id = $1', [shared.id])).rows[0].n, 0);
    console.log('PASS: nine migrations, limited role, three-account feed/privacy, likes/comments, search visibility, follows, two-way chat/photos, participant privacy, read receipts, restart persistence, private legacy import, cascade cleanup.');
  } finally {
    if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
    if (pool) await pool.end();
    if (fixture) await fixture.end();
    if (created && /^social_interactions_test_[a-f0-9]{32}$/.test(database)) await owner.query(`DROP DATABASE ${database}`);
    await owner.end();
  }
}
main().catch(error => {
  console.error('Post interactions check failed:', error.message);
  process.exitCode = 1;
});
