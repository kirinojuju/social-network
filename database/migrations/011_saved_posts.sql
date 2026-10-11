-- Posts a member bookmarked. Visibility is re-checked when the saved list is read,
-- so a post that later becomes private disappears from other members' saved lists.
CREATE TABLE public.saved_posts (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX saved_posts_post_idx ON public.saved_posts(post_id);

REVOKE ALL ON public.saved_posts FROM PUBLIC, social_app;
GRANT SELECT, DELETE ON public.saved_posts TO social_app;
GRANT INSERT (user_id, post_id) ON public.saved_posts TO social_app;
