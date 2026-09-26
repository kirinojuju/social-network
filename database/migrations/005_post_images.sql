-- Small image uploads are stored in PostgreSQL so posts work without a
-- separately provisioned Firebase Storage bucket.
ALTER TABLE public.media ADD COLUMN image_data bytea;
ALTER TABLE public.media ADD CONSTRAINT media_database_image_check CHECK (
  image_data IS NULL OR (
    media_type = 'image' AND
    mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif') AND
    octet_length(image_data) BETWEEN 1 AND 2097152 AND
    file_size = octet_length(image_data) AND
    storage_path = 'database/' || id::text
  )
);
GRANT SELECT ON public.posts, public.media TO social_app;
GRANT INSERT (author_id, content, visibility) ON public.posts TO social_app;
GRANT INSERT (id, post_id, owner_id, storage_path, media_type, mime_type, file_size, image_data)
  ON public.media TO social_app;
