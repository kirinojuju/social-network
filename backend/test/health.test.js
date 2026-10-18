const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../app');

test('health, readiness failure/recovery, and CORS', async () => {
  let available = false;
  const pool = { query: async () => {
    if (!available) throw new Error('secret database details');
    return { rows: [{ '?column?': 1 }] };
  } };
  const server = createApp(pool, ['http://localhost:5173']).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.equal((await fetch(`${url}/api/health`)).status, 200);
    const failed = await fetch(`${url}/api/ready`);
    assert.equal(failed.status, 503);
    assert.deepEqual(await failed.json(), { status: 'not_ready' });
    available = true;
    const ready = await fetch(`${url}/api/ready`, { headers: { Origin: 'http://localhost:5173' } });
    assert.equal(ready.status, 200);
    assert.equal(ready.headers.get('access-control-allow-origin'), 'http://localhost:5173');
    const other = await fetch(`${url}/api/health`, { headers: { Origin: 'https://other.example' } });
    assert.equal(other.headers.get('access-control-allow-origin'), null);
    assert.equal((await fetch(`${url}/missing`)).status, 404);
    const invalid = await fetch(`${url}/missing`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{',
    });
    assert.equal(invalid.status, 400);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});

test('serves the built frontend and keeps unknown API paths as JSON 404', async () => {
  const staticDir = await fs.mkdtemp(path.join(os.tmpdir(), 'social-frontend-'));
  await fs.writeFile(path.join(staticDir, 'index.html'), '<!doctype html><title>Team test</title>');
  const server = createApp({ query: async () => ({ rows: [] }) }, [], {
    staticDir, verifyToken: async () => ({ uid: 'test' }),
    chat: async messages => `Reply: ${messages[0].content}`,
  }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const page = await fetch(`${url}/explore`, { headers: { Accept: 'text/html' } });
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Team test/);
    const api = await fetch(`${url}/api/missing`, { headers: { Accept: 'text/html' } });
    assert.equal(api.status, 404);
    assert.deepEqual(await api.json(), { error: 'Not found' });
    const ai = await fetch(`${url}/api/ai/chat`, {
      method: 'POST', headers: { Authorization: 'Bearer test', 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hello' }] }),
    });
    assert.equal(ai.status, 200);
    assert.equal(ai.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await ai.json(), { reply: 'Reply: hello' });
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(staticDir, { recursive: true, force: true });
  }
});

test('private deployment files and maps cannot be served, even when accidentally present in the frontend build', async () => {
  const staticDir = await fs.mkdtemp(path.join(os.tmpdir(), 'social-private-files-'));
  await fs.writeFile(path.join(staticDir, 'index.html'), '<title>Safe SPA</title>');
  for (const file of ['.env', 'bundle.js.map', 'private.pem', 'setup.sql']) {
    await fs.writeFile(path.join(staticDir, file), 'private-test-marker');
  }
  const server = createApp({}, [], { staticDir }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const root = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of ['/.env', '/%2eenv', '/.git/config', '/secrets/config.json',
      '/bundle.js.map', '/private.pem', '/setup.sql']) {
      const response = await fetch(root + route, { headers: { Accept: 'text/html' } });
      assert.equal(response.status, 404, route);
      assert.equal((await response.text()).includes('private-test-marker'), false);
    }
    const response = await fetch(root + '/explore', { headers: { Accept: 'text/html' } });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.match(await response.text(), /Safe SPA/);
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    await fs.rm(staticDir, { recursive: true, force: true });
  }
});
