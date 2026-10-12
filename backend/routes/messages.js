const { Router } = require('express');
const { createAuthMiddleware } = require('../middleware/auth');
const { parseImage } = require('./posts');

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseMessage(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !['content', 'image'].includes(key))) return null;
  const raw = body.content ?? '';
  if (typeof raw !== 'string' || raw.includes('\0')) return null;
  const content = raw.trim();
  if ([...content].length > 2000) return null;
  let image = null;
  if (body.image != null) {
    image = parseImage(body.image);
    if (!image) return null;
  }
  return content || image ? { content, image } : null;
}

const messageColumns = `m.id, m.content, m.created_at, m.read_at, (m.image_data IS NOT NULL) AS has_image`;

// Both members of a conversation, resolved from the verified identity and the requested user ID.
const pair = `SELECT me.id AS me_id, other.id AS other_id FROM public.users me
  JOIN public.users other ON other.id = $2 WHERE me.firebase_uid = $1 AND other.id <> me.id`;

function createMessagesRouter(pool, verifyToken) {
  const router = Router();
  router.use(createAuthMiddleware(verifyToken));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  });

  router.get('/conversations', async (req, res, next) => {
    try {
      const result = await pool.query(`WITH me AS (SELECT id FROM public.users WHERE firebase_uid = $1),
        mine AS (
          SELECT ${messageColumns}, (m.sender_id = me.id) AS from_me,
            CASE WHEN m.sender_id = me.id THEN m.recipient_id ELSE m.sender_id END AS other_id
          FROM public.messages m, me WHERE m.sender_id = me.id OR m.recipient_id = me.id
        ), latest AS (
          SELECT DISTINCT ON (other_id) other_id, content, created_at, from_me, has_image
          FROM mine ORDER BY other_id, created_at DESC, id DESC
        )
        SELECT u.id, u.username, u.display_name, l.content AS last_content, l.created_at AS last_at, l.from_me,
          l.has_image AS last_has_image,
          (SELECT count(*)::int FROM mine WHERE mine.other_id = l.other_id
            AND NOT mine.from_me AND mine.read_at IS NULL) AS unread_count
        FROM latest l JOIN public.users u ON u.id = l.other_id
        ORDER BY l.created_at DESC LIMIT 50`, [req.auth.uid]);
      res.json({ conversations: result.rows });
    } catch (error) { next(error); }
  });

  router.get('/with/:id', async (req, res, next) => {
    if (!uuid.test(req.params.id)) return res.status(404).json({ error: 'Member not found' });
    if (req.query.before !== undefined && (typeof req.query.before !== 'string' || !uuid.test(req.query.before))) {
      return res.status(400).json({ error: 'Invalid cursor' });
    }
    try {
      const result = await pool.query(`WITH pair AS (${pair})
        SELECT ${messageColumns}, (m.sender_id = pair.me_id) AS from_me
        FROM public.messages m, pair
        WHERE ((m.sender_id = pair.me_id AND m.recipient_id = pair.other_id) OR
               (m.sender_id = pair.other_id AND m.recipient_id = pair.me_id))
          AND ($3::uuid IS NULL OR (m.created_at, m.id) < (
            SELECT created_at, id FROM public.messages WHERE id = $3))
        ORDER BY m.created_at DESC, m.id DESC LIMIT 51`, [req.auth.uid, req.params.id, req.query.before || null]);
      const messages = result.rows.slice(0, 50);
      res.json({ messages, next_cursor: result.rows.length > 50 ? messages[49].id : null });
    } catch (error) { next(error); }
  });

  router.post('/with/:id', async (req, res, next) => {
    if (!uuid.test(req.params.id)) return res.status(404).json({ error: 'Member not found' });
    const message = parseMessage(req.body);
    if (!message) return res.status(400).json({ error: 'Send up to 2000 characters or a JPEG, PNG, WebP, or GIF up to 2 MB' });
    try {
      const result = await pool.query(`WITH pair AS (${pair})
        INSERT INTO public.messages (sender_id, recipient_id, content, image_mime_type, image_data)
        SELECT me_id, other_id, $3, $4, $5 FROM pair
        RETURNING id, content, created_at, read_at, (image_data IS NOT NULL) AS has_image, true AS from_me`,
      [req.auth.uid, req.params.id, message.content, message.image?.mime_type ?? null, message.image?.data ?? null]);
      if (!result.rows.length) return res.status(404).json({ error: 'Member not found' });
      res.status(201).json({ message: result.rows[0] });
    } catch (error) { next(error); }
  });

  router.put('/with/:id/read', async (req, res, next) => {
    if (!uuid.test(req.params.id)) return res.status(404).json({ error: 'Member not found' });
    try {
      await pool.query(`WITH pair AS (${pair})
        UPDATE public.messages m SET read_at = now() FROM pair
        WHERE m.sender_id = pair.other_id AND m.recipient_id = pair.me_id AND m.read_at IS NULL`,
      [req.auth.uid, req.params.id]);
      res.status(204).end();
    } catch (error) { next(error); }
  });

  router.get('/images/:id', async (req, res, next) => {
    if (!uuid.test(req.params.id)) return res.status(404).json({ error: 'Photo not found' });
    try {
      const result = await pool.query(`SELECT m.image_mime_type, m.image_data
        FROM public.messages m JOIN public.users me ON me.firebase_uid = $1
        WHERE m.id = $2 AND (m.sender_id = me.id OR m.recipient_id = me.id) AND m.image_data IS NOT NULL`,
      [req.auth.uid, req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Photo not found' });
      res.set('Content-Type', result.rows[0].image_mime_type);
      res.set('X-Content-Type-Options', 'nosniff');
      res.send(result.rows[0].image_data);
    } catch (error) { next(error); }
  });

  return router;
}

module.exports = { createMessagesRouter, parseMessage };
