const { Pool } = require('pg');

function createPool(env = process.env) {
  const config = {};
  for (const [option, key, alias] of [
    ['host', 'PGHOST', 'DB_HOST'],
    ['port', 'PGPORT', 'DB_PORT'],
    ['database', 'PGDATABASE', 'DB_NAME'],
    ['user', 'PGUSER', 'DB_USER'],
    ['password', 'PGPASSWORD', 'DB_PASSWORD'],
  ]) {
    const value = env[key] ?? env[alias];
    if (!value) throw new Error(`Missing environment variable: ${key} (or ${alias})`);
    config[option] = value;
  }
  config.port = Number(config.port);
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error('PGPORT (or DB_PORT) must be an integer between 1 and 65535');
  }
  const sslMode = env.PGSSLMODE || 'disable';
  if (sslMode === 'require') config.ssl = { rejectUnauthorized: true };
  else if (sslMode !== 'disable') {
    throw new Error('PGSSLMODE must be disable or require');
  }
  const connectionTimeoutMillis = Number(env.PGCONNECT_TIMEOUT_MS || 3000);
  if (!Number.isInteger(connectionTimeoutMillis) || connectionTimeoutMillis < 1000 ||
      connectionTimeoutMillis > 60000) {
    throw new Error('PGCONNECT_TIMEOUT_MS must be between 1000 and 60000');
  }
  const pool = new Pool({
    ...config,
    max: 10,
    connectionTimeoutMillis,
    idleTimeoutMillis: 30000,
    query_timeout: 3000,
    statement_timeout: 3000,
  });
  pool.on('error', () => console.error('Idle database connection failed'));
  return pool;
}

async function assertLimitedRole(pool) {
  const { rows } = await pool.query(`
    SELECT r.rolsuper, r.rolcreatedb, r.rolcreaterole, r.rolreplication,
           r.rolbypassrls,
           COALESCE((SELECT pg_has_role(current_user, n.oid, 'MEMBER')
                     FROM pg_roles n WHERE n.rolname = 'neon_superuser'), false)
             AS neon_superuser_member
    FROM pg_roles r WHERE r.rolname = current_user
  `);
  const role = rows[0];
  if (!role || Object.values(role).some(Boolean)) {
    throw new Error('Database runtime role has elevated privileges');
  }
}

module.exports = { createPool, assertLimitedRole };
