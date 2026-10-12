const { Router } = require('express');
const { createAuthMiddleware } = require('../middleware/auth');

// Notifications are derived from likes, comments and follows aimed at the signed-in member,
// so they disappear automatically when the like, comment or follow is undone.
const notificationsQuery = `WITH me AS (SELECT id FROM public.users WHERE firebase_uid = $1)
  SELECT n.* FROM (
    SELECT 'like:' || l.post_id || ':' || l.user_id AS id, 'like' AS type, l.created_at,
      actor.id AS actor_id, actor.display_name AS actor_name,
      p.id AS post_id, left(p.content, 80) AS post_excerpt, NULL::text AS comment_excerpt
    FROM public.post_likes l
    JOIN public.posts p ON p.id = l.post_id
    JOIN me ON p.author_id = me.id
    JOIN public.users actor ON actor.id = l.user_id
    WHERE l.user_id <> me.id
    UNION ALL
    SELECT 'comment:' || c.id, 'comment', c.created_at,
      actor.id, actor.display_name, p.id, left(p.content, 80), left(c.content, 80)
    FROM public.post_comments c
    JOIN public.posts p ON p.id = c.post_id
    JOIN me ON p.author_id = me.id
    JOIN public.users actor ON actor.id = c.author_id
    WHERE c.author_id <> me.id
    UNION ALL
    SELECT 'follow:' || f.follower_id, 'follow', f.created_at,
      actor.id, actor.display_name, NULL::uuid, NULL, NULL
    FROM public.follows f
    JOIN me ON f.followee_id = me.id
    JOIN public.users actor ON actor.id = f.follower_id
  ) n
  ORDER BY n.created_at DESC, n.id DESC
  LIMIT 30`;

function createNotificationsRouter(pool, verifyToken) {
  const router = Router();
  router.use(createAuthMiddleware(verifyToken));
  router.use((req, res, next) => {
    res.set('Cache-Control', 'private, no-store');
    next();
  });

  router.get('/', async (req, res, next) => {
    try {
      const result = await pool.query(notificationsQuery, [req.auth.uid]);
      res.json({ notifications: result.rows });
    } catch (error) { next(error); }
  });
  return router;
}

module.exports = { createNotificationsRouter };
