const { Router } = require('express');
const { createAuthMiddleware } = require('../middleware/auth');

function parseSummarize(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => key !== 'text')) return null;
  if (typeof body.text !== 'string' || body.text.includes('\0')) return null;
  const text = body.text.trim();
  return text && text.length <= 10000 ? text : null;
}

function parseChat(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !['messages', 'context'].includes(key))) return null;
  const { messages, context = '' } = body;
  if (!Array.isArray(messages) || !messages.length || messages.length > 20) return null;
  if (typeof context !== 'string' || context.length > 10000 || context.includes('\0')) return null;
  const clean = [];
  for (const message of messages) {
    if (!message || typeof message !== 'object' || Object.keys(message).some(key => !['role', 'content'].includes(key)) ||
        !['user', 'assistant'].includes(message.role) || typeof message.content !== 'string' ||
        !message.content.trim() || message.content.length > 4000 || message.content.includes('\0')) return null;
    clean.push({ role: message.role, content: message.content.trim() });
  }
  if (clean[clean.length - 1].role !== 'user') return null;
  return { messages: clean, context: context.trim() };
}

function createAiRouter(verifyToken, { summarize, chat }) {
  const router = Router();
  router.use(createAuthMiddleware(verifyToken));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  });

  router.post('/summarize', async (req, res) => {
    const text = parseSummarize(req.body);
    if (!text) return res.status(400).json({ error: 'Invalid text' });
    try {
      res.json({ summary: await summarize(text) });
    } catch {
      res.status(502).json({ error: 'AI service unavailable' });
    }
  });

  router.post('/chat', async (req, res) => {
    const input = parseChat(req.body);
    if (!input) return res.status(400).json({ error: 'Invalid chat' });
    try {
      res.json({ reply: await chat(input.messages, input.context) });
    } catch {
      res.status(502).json({ error: 'AI service unavailable' });
    }
  });

  return router;
}

module.exports = { createAiRouter, parseSummarize, parseChat };
