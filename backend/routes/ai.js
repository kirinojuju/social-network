const { Router } = require('express');
const { createAuthMiddleware } = require('../middleware/auth');

function parseSummarize(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => key !== 'text')) return null;
  if (typeof body.text !== 'string' || body.text.includes('\0')) return null;
  const text = body.text.trim();
  return text && text.length <= 10000 ? text : null;
}

function createAiRouter(verifyToken, summarize) {
  const router = Router();
  router.use(createAuthMiddleware(verifyToken));

  router.post('/summarize', async (req, res) => {
    const text = parseSummarize(req.body);
    if (!text) return res.status(400).json({ error: 'Invalid text' });
    try {
      res.json({ summary: await summarize(text) });
    } catch {
      res.status(502).json({ error: 'AI service unavailable' });
    }
  });

  return router;
}

module.exports = { createAiRouter, parseSummarize };
