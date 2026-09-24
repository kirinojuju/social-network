const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const { createPool } = require('./config/db');
const { createApp } = require('./app');

const port = Number(process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535');
}
const host = process.env.HOST || '127.0.0.1';
const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',').map(value => value.trim()).filter(Boolean);
const pool = createPool();
const server = createApp(pool, origins).listen(port, host, () => {
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
