-- Existing posts keep their visibility. Only the owner can choose to share them.
ALTER TABLE public.posts ADD COLUMN legacy_firestore_id text;
ALTER TABLE public.posts ADD CONSTRAINT posts_legacy_firestore_id_check
  CHECK (legacy_firestore_id IS NULL OR legacy_firestore_id ~ '^[A-Za-z0-9]{20}$');
ALTER TABLE public.posts ADD CONSTRAINT posts_author_legacy_key
  UNIQUE (author_id, legacy_firestore_id);

CREATE TABLE public.post_likes (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
CREATE INDEX post_likes_user_idx ON public.post_likes(user_id);

CREATE TABLE public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX post_comments_post_created_idx
  ON public.post_comments(post_id, created_at, id);
CREATE INDEX post_comments_author_idx ON public.post_comments(author_id);

REVOKE ALL ON public.post_likes, public.post_comments FROM PUBLIC, social_app;
GRANT SELECT, DELETE ON public.post_likes, public.post_comments TO social_app;
GRANT INSERT (post_id, user_id) ON public.post_likes TO social_app;
GRANT INSERT (post_id, author_id, content) ON public.post_comments TO social_app;
GRANT UPDATE (visibility) ON public.posts TO social_app;
GRANT INSERT (legacy_firestore_id, created_at) ON public.posts TO social_app;
