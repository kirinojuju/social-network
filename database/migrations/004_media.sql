CREATE TABLE public.media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  storage_path text NOT NULL CHECK (char_length(btrim(storage_path)) BETWEEN 1 AND 2048),
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  mime_type text NOT NULL CHECK (
    (media_type = 'image' AND mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')) OR
    (media_type = 'video' AND mime_type IN ('video/mp4', 'video/webm', 'video/quicktime'))
  ),
  file_size bigint NOT NULL CHECK (file_size BETWEEN 1 AND 5368709120),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (post_id, owner_id) REFERENCES public.posts(id, author_id) ON DELETE CASCADE
);
CREATE INDEX media_post_idx ON public.media (post_id);
CREATE INDEX media_owner_idx ON public.media (owner_id);
REVOKE ALL ON public.media FROM PUBLIC, social_app;
-- Metadata only. Storage objects require a separate deletion workflow in a later phase.
