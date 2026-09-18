const path = require('node:path');
const fs = require('node:fs/promises');
const { createHash } = require('node:crypto');
const { Client } = require('pg');

const migrationDirectory = path.join(__dirname, '../../database/migrations');

async function migrate(client, directory = migrationDirectory) {
  const names = (await fs.readdir(directory)).filter(name => /^\d{3}_[a-z_]+\.sql$/.test(name)).sort();
  const migrations = await Promise.all(names.map(async name => {
    const sql = await fs.readFile(path.join(directory, name), 'utf8');
    return { name, sql, checksum: createHash('sha256').update(sql.replace(/\r\n/g, '\n')).digest('hex') };
  }));
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query('SELECT pg_advisory_xact_lock(734829105)');
    await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
    )`);
    await client.query('REVOKE ALL ON public.schema_migrations FROM PUBLIC, social_app');
    const applied = (await client.query('SELECT name, checksum FROM public.schema_migrations ORDER BY name')).rows;
    // Applied files must be an unchanged prefix; never silently skip edited history.
    for (let i = 0; i < applied.length; i++) {
      if (applied[i].name !== migrations[i]?.name || applied[i].checksum !== migrations[i]?.checksum) {
        throw new Error('Migration history mismatch');
      }
    }
    for (const migration of migrations.slice(applied.length)) {
      await client.query(migration.sql);
      await client.query('INSERT INTO public.schema_migrations (name, checksum) VALUES ($1, $2)',
        [migration.name, migration.checksum]);
    }
    await client.query('COMMIT');
    return migrations.length - applied.length;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function main() {
  require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
  if (!process.env.MIGRATION_DATABASE_URL) {
    console.error('Set MIGRATION_DATABASE_URL to the migration owner connection');
    process.exitCode = 1;
    return;
  }
  const client = new Client({ connectionString: process.env.MIGRATION_DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    const { rows } = await client.query('SELECT current_user AS username');
    if (rows[0].username === 'social_app') throw new Error('Migration owner required');
    const count = await migrate(client);
    console.log(`Migrations complete: ${count} applied`);
  } catch {
    console.error('Migration failed. Check owner credentials, social_app role, SQL files, and migration history. No pending migrations were committed.');
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

if (require.main === module) main().catch(() => {
  console.error('Migration runner failed');
  process.exitCode = 1;
});
module.exports = { migrate };
