\set ON_ERROR_STOP on
BEGIN;
-- Run as the migration owner. All fixtures and changes are rolled back.
DO $$
DECLARE
  faculty uuid;
  other_faculty uuid;
  major uuid;
  member uuid;
  other_member uuid;
  post uuid;
  marker text := gen_random_uuid()::text;
  before_update timestamptz;
BEGIN
  INSERT INTO public.faculties(name) VALUES ('Schema check ' || marker) RETURNING id INTO faculty;
  INSERT INTO public.faculties(name) VALUES ('Other schema check ' || marker) RETURNING id INTO other_faculty;
  INSERT INTO public.majors(faculty_id, name) VALUES (faculty, 'Major ' || marker) RETURNING id INTO major;

  -- Exercise the exact columns and upsert permissions used by the HTTP service.
  SET LOCAL ROLE social_app;
  INSERT INTO public.users(firebase_uid, email, username, display_name, faculty_id, major_id)
    VALUES (marker, marker || '@example.invalid', 'a' || left(replace(marker, '-', ''), 29), 'Schema check', faculty, major)
    ON CONFLICT (firebase_uid) DO UPDATE SET email = EXCLUDED.email
    RETURNING id INTO member;
  INSERT INTO public.users(firebase_uid, email, username, display_name)
    VALUES (marker, marker || '@example.invalid', 'a' || left(replace(marker, '-', ''), 29), 'Changed')
    ON CONFLICT (firebase_uid) DO UPDATE SET display_name = EXCLUDED.display_name;
  IF (SELECT display_name FROM public.users WHERE id = member) <> 'Changed' THEN
    RAISE EXCEPTION 'Profile upsert failed';
  END IF;
  BEGIN
    UPDATE public.users SET firebase_uid = 'changed' WHERE id = member;
    RAISE EXCEPTION 'Application can change Firebase identity';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    DELETE FROM public.users WHERE id = member;
    RAISE EXCEPTION 'Application can delete profiles';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  RESET ROLE;

  INSERT INTO public.users(firebase_uid, email, username, display_name)
    VALUES ('other-' || marker, 'other-' || marker || '@example.invalid',
      'b' || left(replace(marker, '-', ''), 29), 'Other') RETURNING id INTO other_member;
  BEGIN
    UPDATE public.users SET email = upper(marker || '@example.invalid') WHERE id = other_member;
    RAISE EXCEPTION 'Case-insensitive email uniqueness failed';
  EXCEPTION WHEN unique_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.users SET faculty_id = other_faculty WHERE id = member;
    RAISE EXCEPTION 'Mismatched faculty accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    DELETE FROM public.faculties WHERE id = faculty;
    RAISE EXCEPTION 'Referenced faculty deletion allowed';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  UPDATE public.users SET updated_at = '2000-01-01T00:00:00Z' WHERE id = member;
  SELECT updated_at INTO before_update FROM public.users WHERE id = member;
  IF before_update <> statement_timestamp() THEN RAISE EXCEPTION 'Timestamp trigger failed'; END IF;

  INSERT INTO public.posts(author_id, content) VALUES (member, 'Test') RETURNING id INTO post;
  IF (SELECT visibility FROM public.posts WHERE id = post) <> 'private' THEN
    RAISE EXCEPTION 'Unsafe default visibility';
  END IF;
  BEGIN
    UPDATE public.posts SET visibility = 'unexpected' WHERE id = post;
    RAISE EXCEPTION 'Invalid visibility accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  INSERT INTO public.media(post_id, owner_id, storage_path, media_type, mime_type, file_size)
    VALUES (post, member, 'test/' || marker, 'image', 'image/png', 100);
  BEGIN
    INSERT INTO public.media(post_id, owner_id, storage_path, media_type, mime_type, file_size)
      VALUES (post, other_member, 'test/wrong-owner', 'image', 'image/png', 100);
    RAISE EXCEPTION 'Media ownership mismatch accepted';
  EXCEPTION WHEN foreign_key_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.media SET file_size = -1 WHERE post_id = post;
    RAISE EXCEPTION 'Negative size accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  BEGIN
    UPDATE public.media SET mime_type = 'video/mp4' WHERE post_id = post;
    RAISE EXCEPTION 'Media MIME mismatch accepted';
  EXCEPTION WHEN check_violation THEN NULL;
  END;
  IF has_table_privilege('social_app', 'public.posts', 'SELECT') OR
     has_table_privilege('social_app', 'public.media', 'INSERT') OR
     has_table_privilege('social_app', 'public.schema_migrations', 'UPDATE') OR
     has_table_privilege('social_app', 'public.users', 'TRUNCATE') THEN
    RAISE EXCEPTION 'Application has excessive privileges';
  END IF;
  DELETE FROM public.users WHERE id = member;
  IF EXISTS (SELECT FROM public.posts WHERE id = post) OR
     EXISTS (SELECT FROM public.media WHERE post_id = post) THEN
    RAISE EXCEPTION 'Cascading metadata deletion failed';
  END IF;
END;
$$;
ROLLBACK;
