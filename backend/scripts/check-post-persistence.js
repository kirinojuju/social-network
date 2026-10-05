const path = require('node:path');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { createPool } = require('../config/db');
const { createApp } = require('../app');

async function main() {
  if (!process.env.MIGRATION_DATABASE_URL ||
      !['localhost', '127.0.0.1'].includes(new URL(process.env.MIGRATION_DATABASE_URL).hostname) ||
      !['localhost', '127.0.0.1'].includes(process.env.PGHOST || process.env.DB_HOST)) {
    throw new Error('Local migration connection required');
  }
  const uid = `post-check-${randomUUID()}`;
  const owner = new Client({ connectionString: process.env.MIGRATION_DATABASE_URL });
  const pool = createPool();
  let server;
  await owner.connect();
  try {
    await owner.query(`INSERT INTO public.users (firebase_uid, email, username, display_name)
      VALUES ($1, $2, $3, 'Post Check')`, [uid, `${uid}@example.invalid`, `check_${uid.slice(-16).replace(/-/g, '')}`]);
    server = createApp(pool, [], { verifyToken: async () => ({ uid }) }).listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const root = `http://127.0.0.1:${server.address().port}/api/posts`;
    const headers = { Authorization: 'Bearer test', 'Content-Type': 'application/json' };
    const image = Buffer.from('89504e470d0a1a0a0000', 'hex');
    const create = await fetch(root, { method: 'POST', headers, body: JSON.stringify({
      content: 'Saved text', image: { mime_type: 'image/png', base64: image.toString('base64') },
    }) });
    assert.equal(create.status, 201);
    const { post } = await create.json();
    assert.ok(post.image_id);
    const list = await fetch(root, { headers });
    assert.equal(list.status, 200);
    assert.equal((await list.json()).posts[0].content, 'Saved text');
    const imageResponse = await fetch(`${root}/${post.image_id}/image`, { headers });
    assert.equal(imageResponse.status, 200);
    assert.deepEqual(Buffer.from(await imageResponse.arrayBuffer()), image);
    console.log('Live post and image persistence check passed.');
  } finally {
    if (server) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    await pool.end();
    await owner.query('DELETE FROM public.users WHERE firebase_uid = $1', [uid]);
    await owner.end();
  }
}

main().catch(() => {
  console.error('Live post persistence check failed.');
  process.exitCode = 1;
});
