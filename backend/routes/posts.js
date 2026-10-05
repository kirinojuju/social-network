const { randomUUID } = require('node:crypto');
const { Router } = require('express');
const { createAuthMiddleware } = require('../middleware/auth');

const allowedImages = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const maxImageBytes = 5 * 1024 * 1024;

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

  router.get('/', async (req, res, next) => {
    try {
      const result = await pool.query(`
        SELECT p.id, p.content, p.visibility, p.created_at,
          (SELECT m.id FROM public.media m WHERE m.post_id = p.id AND m.image_data IS NOT NULL LIMIT 1) AS image_id
        FROM public.posts p JOIN public.users u ON u.id = p.author_id
        WHERE u.firebase_uid = $1 ORDER BY p.created_at DESC, p.id DESC LIMIT 50`, [req.auth.uid]);
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
          RETURNING id, content, visibility, created_at
        ), new_image AS (
          INSERT INTO public.media (id, post_id, owner_id, storage_path, media_type, mime_type, file_size, image_data)
          SELECT $4::uuid, p.id, u.id, $5, 'image', $6, $7, $8
          FROM new_post p JOIN public.users u ON u.firebase_uid = $1
          WHERE $4::uuid IS NOT NULL
          RETURNING id
        )
        SELECT p.*, (SELECT id FROM new_image) AS image_id FROM new_post p`,
      [req.auth.uid, post.content, post.visibility, imageId,
        imageId ? `database/${imageId}` : null, post.image?.mime_type ?? null,
        post.image?.data.length ?? null, post.image?.data ?? null]);
      if (!result.rows.length) return res.status(409).json({ error: 'Complete your profile first' });
      res.status(201).json({ post: result.rows[0] });
    } catch (error) { next(error); }
  });

  router.get('/:id/image', async (req, res, next) => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(req.params.id)) {
      return res.status(404).json({ error: 'Image not found' });
    }
    try {
      const result = await pool.query(`
        SELECT m.mime_type, m.image_data FROM public.media m
        JOIN public.users u ON u.id = m.owner_id
        WHERE m.id = $2 AND u.firebase_uid = $1 AND m.image_data IS NOT NULL`, [req.auth.uid, req.params.id]);
      if (!result.rows.length) return res.status(404).json({ error: 'Image not found' });
      res.set('Content-Type', result.rows[0].mime_type);
      res.set('X-Content-Type-Options', 'nosniff');
      res.send(result.rows[0].image_data);
    } catch (error) { next(error); }
  });
  return router;
}

module.exports = { createPostsRouter, parsePost };
