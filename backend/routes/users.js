const { Router } = require('express');
const { createAuthMiddleware } = require('../middleware/auth');

const fields = ['username', 'display_name', 'bio', 'avatar_url', 'faculty_id', 'major_id'];
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateProfile(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      Object.keys(body).some(key => !fields.includes(key))) return null;
  if (typeof body.username !== 'string' || !/^[a-z0-9_]{3,30}$/.test(body.username)) return null;
  if (typeof body.display_name !== 'string' || !body.display_name.trim() ||
      [...body.display_name].length > 100) return null;
  if (body.bio != null && (typeof body.bio !== 'string' || [...body.bio].length > 2000 || body.bio.includes('\0'))) return null;
  if (body.display_name.includes('\0')) return null;
  if (body.avatar_url != null) {
    if (typeof body.avatar_url !== 'string' || body.avatar_url.length > 2048 || /\s/.test(body.avatar_url)) return null;
    try {
      const url = new URL(body.avatar_url);
      if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    } catch { return null; }
  }
  for (const field of ['faculty_id', 'major_id']) {
    if (body[field] != null && (typeof body[field] !== 'string' || !uuid.test(body[field]))) return null;
  }
  if (body.major_id != null && body.faculty_id == null) return null;
  return [body.username, body.display_name.trim(), body.bio ?? null,
    body.avatar_url ?? null, body.faculty_id ?? null, body.major_id ?? null];
}

const columns = 'id, firebase_uid, email, username, display_name, bio, avatar_url, faculty_id, major_id, created_at, updated_at';

function createUsersRouter(pool, verifyToken) {
  const router = Router();
  router.use(createAuthMiddleware(verifyToken));
  router.get('/me', async (req, res) => {
    const result = await pool.query(`SELECT ${columns} FROM public.users WHERE firebase_uid = $1`, [req.auth.uid]);
    if (!result.rows.length) return res.status(404).json({ error: 'Profile not found' });
    res.json({ user: result.rows[0] });
  });
  router.post('/sync', async (req, res, next) => {
    const email = req.auth.email;
    if (req.auth.email_verified !== true || typeof email !== 'string' ||
        email.length > 254 || !/^[^\s@\x00]+@[^\s@\x00]+\.[^\s@\x00]+$/.test(email)) {
      return res.status(403).json({ error: 'A verified Firebase email is required' });
    }
    const profile = validateProfile(req.body);
    if (!profile) return res.status(400).json({ error: 'Invalid profile fields' });
    try {
      const result = await pool.query(`
        INSERT INTO public.users (firebase_uid, email, username, display_name, bio, avatar_url, faculty_id, major_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (firebase_uid) DO UPDATE SET
          email = EXCLUDED.email, username = EXCLUDED.username, display_name = EXCLUDED.display_name,
          bio = EXCLUDED.bio, avatar_url = EXCLUDED.avatar_url,
          faculty_id = EXCLUDED.faculty_id, major_id = EXCLUDED.major_id
        RETURNING ${columns}`, [req.auth.uid, email.toLowerCase(), ...profile]);
      return res.json({ user: result.rows[0] });
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email or username already in use' });
      if (['23503', '23514', '22P02'].includes(error.code)) {
        return res.status(400).json({ error: 'Invalid profile fields' });
      }
      return next(error);
    }
  });
  return router;
}

module.exports = { createUsersRouter, validateProfile };
