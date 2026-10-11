const { Router } = require('express');
const { createAuthMiddleware } = require('../middleware/auth');

function parseQuery(value) {
  if (typeof value !== 'string' || value.includes('\0')) return null;
  const term = value.trim();
  return term && [...term].length <= 100 ? term : null;
}

// Escape LIKE wildcards so a search for "100%" matches the literal text.
const likePattern = term => `%${term.replace(/[\\%_]/g, '\\$&')}%`;

function createSearchRouter(pool, verifyToken) {
  const router = Router();
  router.use(createAuthMiddleware(verifyToken));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  });

  router.get('/', async (req, res, next) => {
    const term = parseQuery(req.query.q);
    if (!term) return res.status(400).json({ error: 'Invalid search' });
    const values = [req.auth.uid, likePattern(term)];
    try {
      const [users, posts] = await Promise.all([
        pool.query(`SELECT id, username, display_name, bio, avatar_url, faculty_id, major_id,
            (firebase_uid = $1) AS is_self
          FROM public.users WHERE username ILIKE $2 OR display_name ILIKE $2
          ORDER BY display_name, id LIMIT 20`, values),
        pool.query(`SELECT p.id, p.content, p.visibility, p.created_at,
            u.id AS author_id, u.username AS author_username, u.display_name AS author_name, (u.firebase_uid = $1) AS is_own
          FROM public.posts p JOIN public.users u ON u.id = p.author_id
          WHERE (u.firebase_uid = $1 OR p.visibility = 'public') AND p.content ILIKE $2
          ORDER BY p.created_at DESC, p.id DESC LIMIT 20`, values),
      ]);
      res.json({ users: users.rows, posts: posts.rows });
    } catch (error) { next(error); }
  });
  return router;
}

module.exports = { createSearchRouter, parseQuery, likePattern };
