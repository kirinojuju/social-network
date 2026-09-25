const path = require('node:path');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { createPool } = require('../config/db');
const { createApp } = require('../app');

function isLocal(host) {
  return ['localhost', '127.0.0.1', '::1'].includes(host);
}

async function withApi(verifyToken, run) {
  const pool = createPool();
  const server = createApp(pool, [], { verifyToken }).listen(0, '127.0.0.1');
  try {
    await new Promise((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const { createProfileClient } = await import('../../frontend/src/auth/profile.js');
    const client = createProfileClient({ baseUrl: `http://127.0.0.1:${server.address().port}` });
    await run(client);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await pool.end();
  }
}

async function main() {
  if (!process.env.MIGRATION_DATABASE_URL) throw new Error('Missing migration connection');
  const ownerHost = new URL(process.env.MIGRATION_DATABASE_URL).hostname;
  const appHost = process.env.PGHOST || process.env.DB_HOST;
  if (!isLocal(ownerHost) || !isLocal(appHost)) throw new Error('Local database required');

  const suffix = randomUUID().replace(/-/g, '').slice(0, 16);
  const uid = `integration-check-${suffix}`;
  const token = randomUUID();
  const profile = { username: `check_${suffix}`, display_name: 'Integration Check' };
  const user = { getIdToken: async () => token };
  const verifyToken = async provided => {
    if (provided !== token) throw new Error('Invalid test token');
    return { uid, email: `check+${suffix}@example.invalid`, email_verified: true };
  };
  const owner = new Client({ connectionString: process.env.MIGRATION_DATABASE_URL,
    connectionTimeoutMillis: 5000 });
  await owner.connect();
  let created = false;
  try {
    let originalId;
    await withApi(verifyToken, async api => {
      assert.equal(await api.load(user), null);
      const saved = await api.syncAndRead(user, profile);
      assert.equal(saved.username, profile.username);
      originalId = saved.id;
      created = true;
    });
    // Open a new HTTP server and PostgreSQL pool, as after a backend restart.
    await withApi(verifyToken, async api => {
      const restored = await api.load(user);
      assert.equal(restored.id, originalId);
      assert.equal(restored.username, profile.username);
    });
    console.log('Live Express/PostgreSQL persistence check passed.');
  } finally {
    try {
      const result = await owner.query('DELETE FROM public.users WHERE firebase_uid = $1', [uid]);
      if (created && result.rowCount !== 1) throw new Error('Test profile cleanup failed');
      console.log('Test profile cleanup complete.');
    } finally {
      await owner.end();
    }
  }
}

main().catch(() => {
  console.error('Live Express/PostgreSQL check failed. Check local DB settings and test profile cleanup.');
  process.exitCode = 1;
});
