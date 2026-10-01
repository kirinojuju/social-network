const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createPool, assertLimitedRole } = require('../config/db');

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

test('requires certificate-verified TLS for a remote database when configured', async () => {
  const pool = createPool({ ...legacy, PGSSLMODE: 'require', PGCONNECT_TIMEOUT_MS: '10000' });
  try {
    assert.deepEqual(pool.options.ssl, { rejectUnauthorized: true });
    assert.equal(pool.options.connectionTimeoutMillis, 10000);
  } finally {
    await pool.end();
  }
  for (const mode of ['prefer', 'allow', 'verify-none']) {
    assert.throws(() => createPool({ ...legacy, PGSSLMODE: mode }), /PGSSLMODE/);
  }
  for (const timeout of ['0', 'abc', '60001']) {
    assert.throws(() => createPool({ ...legacy, PGCONNECT_TIMEOUT_MS: timeout }), /PGCONNECT_TIMEOUT_MS/);
  }
});

test('hosted runtime rejects elevated PostgreSQL roles', async () => {
  const role = {
    rolsuper: false, rolcreatedb: false, rolcreaterole: false,
    rolreplication: false, rolbypassrls: false, neon_superuser_member: false,
  };
  await assert.doesNotReject(assertLimitedRole({ query: async () => ({ rows: [role] }) }));
  for (const flag of Object.keys(role)) {
    await assert.rejects(
      assertLimitedRole({ query: async () => ({ rows: [{ ...role, [flag]: true }] }) }),
      /elevated privileges/,
    );
  }
  await assert.rejects(assertLimitedRole({ query: async () => ({ rows: [] }) }),
    /elevated privileges/);
});
