CREATE TABLE public.follows (
  follower_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  followee_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id),
  CHECK (follower_id <> followee_id)
);
CREATE INDEX follows_followee_idx ON public.follows(followee_id);

REVOKE ALL ON public.follows FROM PUBLIC, social_app;
GRANT SELECT, DELETE ON public.follows TO social_app;
GRANT INSERT (follower_id, followee_id) ON public.follows TO social_app;
