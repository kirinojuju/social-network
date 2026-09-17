const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPool } = require('../config/db');

const legacy = {
  DB_HOST: '127.0.0.1', DB_PORT: '5432', DB_NAME: 'social_network',
  DB_USER: 'social_app', DB_PASSWORD: 'test-only',
};

test('accepts existing DB_* configuration', async () => {
  const pool = createPool(legacy);
  try {
    for (const [option, key] of Object.entries({
      host: 'DB_HOST', database: 'DB_NAME', user: 'DB_USER', password: 'DB_PASSWORD',
    })) assert.equal(pool.options[option], legacy[key]);
    assert.equal(pool.options.port, 5432);
  } finally {
    await pool.end();
  }
});

test('PG_* configuration takes precedence', async () => {
  const pool = createPool({ ...legacy, PGHOST: 'localhost', PGPORT: '5433',
    PGDATABASE: 'other_db', PGUSER: 'other_user', PGPASSWORD: 'other-test-only' });
  try {
    assert.equal(pool.options.host, 'localhost');
    assert.equal(pool.options.port, 5433);
    assert.equal(pool.options.database, 'other_db');
    assert.equal(pool.options.user, 'other_user');
    assert.equal(pool.options.password, 'other-test-only');
  } finally {
    await pool.end();
  }
});

test('rejects missing settings and invalid ports before connecting', () => {
  assert.throws(() => createPool({}), /Missing environment variable: PGHOST/);
  for (const port of ['abc', '0', '65536', '5432oops', '1.5']) {
    assert.throws(() => createPool({ ...legacy, DB_PORT: port }), /must be an integer/);
  }
});
