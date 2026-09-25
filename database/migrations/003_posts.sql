CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '' CHECK (char_length(content) <= 10000),
  visibility text NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (id, author_id)
);
CREATE INDEX posts_author_created_idx ON public.posts (author_id, created_at DESC, id DESC);
CREATE INDEX posts_public_created_idx ON public.posts (created_at DESC, id DESC)
  WHERE visibility = 'public';
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
REVOKE ALL ON public.posts FROM PUBLIC, social_app;
-- No post endpoints in Phase 1: grant access alongside their authorization rules later.
