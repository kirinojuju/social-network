-- Profile cover photos, stored in PostgreSQL the same way as profile photos.
CREATE TABLE public.user_covers (
  user_id uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  image_data bytea NOT NULL CHECK (octet_length(image_data) BETWEEN 1 AND 2097152),
  updated_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON public.user_covers FROM PUBLIC, social_app;
GRANT SELECT, DELETE ON public.user_covers TO social_app;
GRANT INSERT (user_id, mime_type, image_data) ON public.user_covers TO social_app;
GRANT UPDATE (mime_type, image_data, updated_at) ON public.user_covers TO social_app;
