const express = require('express');
const cors = require('cors');
const path = require('node:path');
const { createUsersRouter } = require('./routes/users');
const { createPostsRouter } = require('./routes/posts');
const { createAiRouter } = require('./routes/ai');
const { summarizeText } = require('./ai/summarize');
const { chatWithAssistant } = require('./ai/chat');
const { verifyFirebaseToken } = require('./config/firebase');

function createApp(pool, origins = [], { verifyToken = verifyFirebaseToken, staticDir, summarize = summarizeText, chat = chatWithAssistant } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: origins }));
  app.use('/api/posts', express.json({ limit: '7mb' }));
  app.use(express.json({ limit: '3mb' }));

  app.get('/api/health', (req, res) => {
    res.set('Cache-Control', 'no-store').json({ status: 'ok' });
  });

  app.get('/api/ready', async (req, res) => {
    res.set('Cache-Control', 'no-store');
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ready' });
    } catch {
      res.status(503).json({ status: 'not_ready' });
    }
  });

  app.use('/api/users', createUsersRouter(pool, verifyToken));
  app.use('/api/posts', createPostsRouter(pool, verifyToken));
  app.use('/api/ai', createAiRouter(verifyToken, { summarize, chat }));
  if (staticDir) {
    app.use(express.static(staticDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || (req.path === '/api' || req.path.startsWith('/api/')) ||
          !req.accepts('html')) return next();
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err.type === 'entity.parse.failed') {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
    if (err.type === 'entity.too.large') {
      return res.status(413).json({ error: 'Request too large' });
    }
    res.status(500).json({ error: 'Internal server error' });
  });
  return app;
}

module.exports = { createApp };
