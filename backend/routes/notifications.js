const { Router } = require('express');
const { createAuthMiddleware } = require('../middleware/auth');

// Social events and unread messages are scoped to the verified recipient.
// Message notifications disappear when that conversation is read; bodies stay in chat.
const notificationsQuery = `WITH me AS (SELECT id FROM public.users WHERE firebase_uid = $1),
  unread_messages AS (
    SELECT m.id, m.sender_id, m.created_at,
      count(*) OVER (PARTITION BY m.sender_id)::int AS unread_count,
      row_number() OVER (PARTITION BY m.sender_id ORDER BY m.created_at DESC, m.id DESC) AS position
    FROM public.messages m JOIN me ON m.recipient_id = me.id
    WHERE m.read_at IS NULL
  )
  SELECT n.* FROM (
    SELECT 'like:' || l.post_id || ':' || l.user_id AS id, 'like' AS type, l.created_at,
      actor.id AS actor_id, actor.display_name AS actor_name,
      p.id AS post_id, left(p.content, 80) AS post_excerpt, NULL::text AS comment_excerpt,
      NULL::uuid AS message_id, 0::int AS unread_count
    FROM public.post_likes l
    JOIN public.posts p ON p.id = l.post_id
    JOIN me ON p.author_id = me.id
    JOIN public.users actor ON actor.id = l.user_id
    WHERE l.user_id <> me.id
    UNION ALL
    SELECT 'comment:' || c.id, 'comment', c.created_at,
      actor.id, actor.display_name, p.id, left(p.content, 80), left(c.content, 80), NULL::uuid, 0::int
    FROM public.post_comments c
    JOIN public.posts p ON p.id = c.post_id
    JOIN me ON p.author_id = me.id
    JOIN public.users actor ON actor.id = c.author_id
    WHERE c.author_id <> me.id
    UNION ALL
    SELECT 'follow:' || f.follower_id, 'follow', f.created_at,
      actor.id, actor.display_name, NULL::uuid, NULL, NULL, NULL::uuid, 0::int
    FROM public.follows f
    JOIN me ON f.followee_id = me.id
    JOIN public.users actor ON actor.id = f.follower_id
    UNION ALL
    SELECT 'message:' || m.id, 'message', m.created_at,
      actor.id, actor.display_name, NULL::uuid, NULL, NULL, m.id, m.unread_count
    FROM unread_messages m JOIN public.users actor ON actor.id = m.sender_id
    WHERE m.position = 1
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
