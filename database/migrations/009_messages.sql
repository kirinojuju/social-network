-- Chat photos are stored in PostgreSQL like post images, so no storage bucket is needed.
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '' CHECK (char_length(content) <= 2000),
  image_mime_type text CHECK (image_mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')),
  image_data bytea CHECK (octet_length(image_data) BETWEEN 1 AND 2097152),
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz,
  CHECK (sender_id <> recipient_id),
  CHECK ((image_data IS NULL) = (image_mime_type IS NULL)),
  CHECK (char_length(btrim(content)) > 0 OR image_data IS NOT NULL)
);
CREATE INDEX messages_sender_idx ON public.messages(sender_id, recipient_id, created_at DESC, id DESC);
CREATE INDEX messages_recipient_idx ON public.messages(recipient_id, sender_id, created_at DESC, id DESC);

REVOKE ALL ON public.messages FROM PUBLIC, social_app;
GRANT SELECT ON public.messages TO social_app;
GRANT INSERT (sender_id, recipient_id, content, image_mime_type, image_data) ON public.messages TO social_app;
GRANT UPDATE (read_at) ON public.messages TO social_app;
