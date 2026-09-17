const { test } = require('node:test');
const assert = require('node:assert/strict');
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
