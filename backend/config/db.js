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
  const pool = new Pool({
    ...config,
    max: 10,
    connectionTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
    query_timeout: 3000,
    statement_timeout: 3000,
  });
  pool.on('error', () => console.error('Idle database connection failed'));
  return pool;
}

module.exports = { createPool };