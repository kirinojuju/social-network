const path = require('node:path');
const fs = require('node:fs');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const { createPool, assertLimitedRole } = require('./config/db');
const { createApp } = require('./app');

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}
const host = process.env.HOST || '127.0.0.1';
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',').map(value => value.trim()).filter(Boolean);
const staticDir = process.env.SERVE_FRONTEND === 'true'
  ? path.join(__dirname, '../frontend/dist') : undefined;
if (staticDir && !fs.existsSync(path.join(staticDir, 'index.html'))) {
  throw new Error('Frontend build missing: run npm run build in frontend');
}
async function start() {
  const pool = createPool();
  try {
    if (process.env.REQUIRE_LIMITED_DB_ROLE === 'true') await assertLimitedRole(pool);
  } catch {
    console.error('Backend refused the database runtime role or could not verify it');
    await pool.end();
    process.exitCode = 1;
    return;
  }

  const server = createApp(pool, origins, { staticDir }).listen(port, host, () => {
    console.log(`Backend listening on http://${host}:${port}`);
  });
  server.on('error', async () => {
    console.error('HTTP server failed to start');
    await pool.end();
    process.exitCode = 1;
  });

  let stopping = false;
  function shutdown() {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 10000);
    deadline.unref();
    server.close(async () => {
      try {
        await pool.end();
      } catch {
        process.exitCode = 1;
      } finally {
        clearTimeout(deadline);
      }
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(() => {
  console.error('Backend failed to start');
  process.exitCode = 1;
});
