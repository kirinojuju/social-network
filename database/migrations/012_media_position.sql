-- Order of photos within a post. Existing single-photo posts keep position 0.
ALTER TABLE public.media ADD COLUMN position smallint NOT NULL DEFAULT 0
  CHECK (position BETWEEN 0 AND 9);
CREATE INDEX media_post_position_idx ON public.media (post_id, position);
GRANT INSERT (position) ON public.media TO social_app;
