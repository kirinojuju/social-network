const { randomUUID } = require('node:crypto');
const { Router } = require('express');
const { createAuthMiddleware } = require('../middleware/auth');

const allowedImages = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maxImageBytes = 2 * 1024 * 1024;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// All reads and mutations use the verified Firebase identity, never an author ID from the client.
const postSelection = `SELECT p.id, p.content, p.visibility, p.created_at,
  u.id AS author_id, u.username AS author_username, u.display_name AS author_name,
  (u.firebase_uid = $1) AS is_own,
  (SELECT m.id FROM public.media m WHERE m.post_id = p.id AND m.image_data IS NOT NULL LIMIT 1) AS image_id,
  (SELECT count(*)::int FROM public.post_likes l WHERE l.post_id = p.id) AS like_count,
  (SELECT count(*)::int FROM public.post_comments c WHERE c.post_id = p.id) AS comment_count,
  EXISTS (SELECT FROM public.post_likes l JOIN public.users viewer ON viewer.id = l.user_id
    WHERE l.post_id = p.id AND viewer.firebase_uid = $1) AS liked
  FROM public.posts p JOIN public.users u ON u.id = p.author_id`;

const visibleTarget = `SELECT p.id, viewer.id AS user_id FROM public.posts p
  JOIN public.users owner ON owner.id = p.author_id
  JOIN public.users viewer ON viewer.firebase_uid = $1
  WHERE p.id = $2 AND (p.visibility = 'public' OR owner.id = viewer.id)`;

function parseComment(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => key !== 'content') || typeof body.content !== 'string') return null;
  const content = body.content.trim();
  return content && [...content].length <= 2000 && !content.includes('\0') ? content : null;
}

function matchesImageType(data, type) {
  if (type === 'image/png') return data.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'));
  if (type === 'image/jpeg') return data.length >= 3 && data.subarray(0, 3).equals(Buffer.from('ffd8ff', 'hex'));
  if (type === 'image/gif') return ['GIF87a', 'GIF89a'].includes(data.toString('ascii', 0, 6));
  if (type === 'image/webp') return data.toString('ascii', 0, 4) === 'RIFF' &&
    data.toString('ascii', 8, 12) === 'WEBP';
  return false;
}

function parsePost(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !['content', 'visibility', 'image'].includes(key))) return null;
  if (typeof body.content !== 'string' || body.content.length > 10000 || body.content.includes('\0')) return null;
  const visibility = body.visibility ?? 'private';
  if (!['public', 'private'].includes(visibility)) return null;
  let image = null;
  if (body.image != null) {
    if (typeof body.image !== 'object' || Array.isArray(body.image) ||
        Object.keys(body.image).some(key => !['mime_type', 'base64'].includes(key)) ||
        !allowedImages.has(body.image.mime_type) ||
        typeof body.image.base64 !== 'string' ||
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.image.base64)) return null;
    const data = Buffer.from(body.image.base64, 'base64');
    if (!data.length || data.length > maxImageBytes || data.toString('base64') !== body.image.base64 ||
        !matchesImageType(data, body.image.mime_type)) return null;
    image = { mime_type: body.image.mime_type, data };
  }
  if (!body.content.trim() && !image) return null;
  return { content: body.content.trim(), visibility, image };
}

function createPostsRouter(pool, verifyToken) {
  const router = Router();
  router.use(createAuthMiddleware(verifyToken));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  });

  router.get('/', async (req, res, next) => {
    try {
      const result = await pool.query(`${postSelection}
        WHERE u.firebase_uid = $1 OR ($2::boolean AND p.visibility = 'public')
        ORDER BY p.created_at DESC, p.id DESC LIMIT 50`, [req.auth.uid, req.query.scope === 'feed']);
      res.json({ posts: result.rows });
    } catch (error) { next(error); }
  });

  router.post('/', async (req, res, next) => {
    const post = parsePost(req.body);
    if (!post) return res.status(400).json({ error: 'Invalid post' });
    const imageId = post.image ? randomUUID() : null;
    try {
      const result = await pool.query(`
        WITH new_post AS (
          INSERT INTO public.posts (author_id, content, visibility)
          SELECT id, $2, $3 FROM public.users WHERE firebase_uid = $1
          RETURNING id, author_id, content, visibility, created_at
        ), new_image AS (
          INSERT INTO public.media (id, post_id, owner_id, storage_path, media_type, mime_type, file_size, image_data)
          SELECT $4::uuid, p.id, u.id, $5, 'image', $6, $7, $8
          FROM new_post p JOIN public.users u ON u.firebase_uid = $1
          WHERE $4::uuid IS NOT NULL
          RETURNING id
        )
        SELECT p.*, (SELECT id FROM new_image) AS image_id, u.display_name AS author_name,
          u.username AS author_username, true AS is_own, false AS liked,
          0 AS like_count, 0 AS comment_count
        FROM new_post p JOIN public.users u ON u.id = p.author_id`,
      [req.auth.uid, post.content, post.visibility, imageId,
        imageId ? `database/${imageId}` : null, post.image?.mime_type ?? null,
        post.image?.data.length ?? null, post.image?.data ?? null]);
      if (!result.rows.length) return res.status(409).json({ error: 'Complete your profile first' });
      res.status(201).json({ post: result.rows[0] });
    } catch (error) { next(error); }
  });

  // Optional, resumable import. Firestore originals are retained and never made public.
  // Imported text belongs to the caller just like a normal newly submitted post.
  router.post('/import', async (req, res, next) => {
    const items = req.body?.posts;
    if (!req.body || Object.keys(req.body).some(key => key !== 'posts') ||
        !Array.isArray(items) || !items.length || items.length > 50 || items.some(item =>
          !item || typeof item !== 'object' || Array.isArray(item) ||
          Object.keys(item).some(key => !['source_id', 'content', 'created_at'].includes(key)) ||
          typeof item.source_id !== 'string' || !/^[A-Za-z0-9]{20}$/.test(item.source_id) ||
          !parsePost({ content: item.content }) || typeof item.created_at !== 'string' ||
          !Number.isFinite(Date.parse(item.created_at)) ||
          Date.parse(item.created_at) < 0 || Date.parse(item.created_at) > Date.now() + 300000)) {
      return res.status(400).json({ error: 'Invalid legacy posts' });
    }
    try {
      const result = await pool.query(`WITH actor AS (
        SELECT id FROM public.users WHERE firebase_uid = $1
      ), imported AS (
        INSERT INTO public.posts (author_id, content, visibility, legacy_firestore_id, created_at)
        SELECT actor.id, btrim(item.content), 'private', item.source_id, item.created_at
        FROM actor CROSS JOIN jsonb_to_recordset($2::jsonb)
          AS item(source_id text, content text, created_at timestamptz)
        ON CONFLICT (author_id, legacy_firestore_id) DO NOTHING RETURNING id
      ) SELECT actor.id, (SELECT count(*)::int FROM imported) AS imported FROM actor`,
      [req.auth.uid, JSON.stringify(items.map(item => ({ ...item,
        created_at: new Date(item.created_at).toISOString() })))]);
      if (!result.rows.length) return res.status(409).json({ error: 'Complete your profile first' });
      res.json({ imported: result.rows[0].imported });
    } catch (error) { next(error); }
  });

  router.patch('/:id/visibility', async (req, res, next) => {
    if (!uuid.test(req.params.id)) return res.status(404).json({ error: 'Post not found' });
    if (!req.body || Object.keys(req.body).length !== 1 ||
        !['public', 'private'].includes(req.body.visibility)) {
      return res.status(400).json({ error: 'Invalid visibility' });
    }
    try {
      const result = await pool.query(`UPDATE public.posts p SET visibility = $3
        FROM public.users u WHERE p.id = $2 AND p.author_id = u.id AND u.firebase_uid = $1
        RETURNING p.id, p.visibility`, [req.auth.uid, req.params.id, req.body.visibility]);
      if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
      res.json({ post: result.rows[0] });
    } catch (error) { next(error); }
  });

  async function like(req, res, next) {
    if (!uuid.test(req.params.id)) return res.status(404).json({ error: 'Post not found' });
    try {
      const mutation = req.method === 'PUT'
        ? `INSERT INTO public.post_likes (post_id, user_id) SELECT id, user_id FROM target
           ON CONFLICT (post_id, user_id) DO NOTHING RETURNING post_id`
        : `DELETE FROM public.post_likes l USING target t
           WHERE l.post_id = t.id AND l.user_id = t.user_id RETURNING l.post_id`;
      const result = await pool.query(`WITH target AS (${visibleTarget}), changed AS (${mutation})
        SELECT id FROM target`, [req.auth.uid, req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
      const summary = await pool.query(`${postSelection}
        WHERE p.id = $2 AND (p.visibility = 'public' OR u.firebase_uid = $1)`, [req.auth.uid, req.params.id]);
      if (!summary.rows.length) return res.status(404).json({ error: 'Post not found' });
      res.json({ post: summary.rows[0] });
    } catch (error) { next(error); }
  }
  router.put('/:id/like', like);
  router.delete('/:id/like', like);

  router.get('/:id/comments', async (req, res, next) => {
    if (!uuid.test(req.params.id)) return res.status(404).json({ error: 'Post not found' });
    if (req.query.before !== undefined && (typeof req.query.before !== 'string' || !uuid.test(req.query.before))) {
      return res.status(400).json({ error: 'Invalid cursor' });
    }
    try {
      const target = await pool.query(visibleTarget, [req.auth.uid, req.params.id]);
      if (!target.rows.length) return res.status(404).json({ error: 'Post not found' });
      const result = await pool.query(`SELECT c.id, c.content, c.created_at, u.display_name AS author_name,
          u.username AS author_username, (u.firebase_uid = $1) AS is_own
        FROM public.post_comments c JOIN public.users u ON u.id = c.author_id
        JOIN public.posts p ON p.id = c.post_id JOIN public.users owner ON owner.id = p.author_id
        WHERE c.post_id = $2 AND (p.visibility = 'public' OR owner.firebase_uid = $1)
          AND ($3::uuid IS NULL OR (c.created_at, c.id) < (
            SELECT created_at, id FROM public.post_comments WHERE id = $3 AND post_id = $2))
        ORDER BY c.created_at DESC, c.id DESC LIMIT 51`, [req.auth.uid, req.params.id, req.query.before || null]);
      const comments = result.rows.slice(0, 50);
      res.json({ comments, next_cursor: result.rows.length > 50 ? comments[49].id : null });
    } catch (error) { next(error); }
  });

  router.post('/:id/comments', async (req, res, next) => {
    if (!uuid.test(req.params.id)) return res.status(404).json({ error: 'Post not found' });
    const content = parseComment(req.body);
    if (!content) return res.status(400).json({ error: 'Comment must contain 1–2000 characters' });
    try {
      const result = await pool.query(`WITH target AS (${visibleTarget}), new_comment AS (
        INSERT INTO public.post_comments (post_id, author_id, content)
        SELECT id, user_id, $3 FROM target RETURNING id, author_id, content, created_at
      ) SELECT c.id, c.content, c.created_at, u.display_name AS author_name,
          u.username AS author_username, true AS is_own
        FROM new_comment c JOIN public.users u ON u.id = c.author_id`, [req.auth.uid, req.params.id, content]);
      if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
      res.status(201).json({ comment: result.rows[0] });
    } catch (error) { next(error); }
  });

  router.delete('/:id/comments/:commentId', async (req, res, next) => {
    if (!uuid.test(req.params.id) || !uuid.test(req.params.commentId)) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    try {
      const result = await pool.query(`WITH target AS (${visibleTarget})
        DELETE FROM public.post_comments c USING target t
        WHERE c.id = $3 AND c.post_id = t.id AND c.author_id = t.user_id RETURNING c.id`,
      [req.auth.uid, req.params.id, req.params.commentId]);
      if (!result.rows.length) return res.status(404).json({ error: 'Comment not found' });
      res.status(204).end();
    } catch (error) { next(error); }
  });

  router.get('/:id/image', async (req, res, next) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    try {
      const result = await pool.query(`
        SELECT m.mime_type, m.image_data FROM public.media m
        JOIN public.users u ON u.id = m.owner_id JOIN public.posts p ON p.id = m.post_id
        WHERE m.id = $2 AND (u.firebase_uid = $1 OR p.visibility = 'public')
          AND m.image_data IS NOT NULL`, [req.auth.uid, req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Image not found' });
      res.set('Content-Type', result.rows[0].mime_type);
      res.set('X-Content-Type-Options', 'nosniff');
      res.send(result.rows[0].image_data);
    } catch (error) { next(error); }
  });
  return router;
}

module.exports = { createPostsRouter, parsePost, parseComment };
