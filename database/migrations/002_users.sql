CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid text NOT NULL UNIQUE CHECK (char_length(firebase_uid) BETWEEN 1 AND 128),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254 AND email = btrim(email)),
  username text NOT NULL UNIQUE CHECK (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 100),
  bio text CHECK (char_length(bio) <= 2000),
  avatar_url text CHECK (char_length(avatar_url) <= 2048 AND avatar_url ~ '^https://[^[:space:]]+$'),
  faculty_id uuid REFERENCES public.faculties(id) ON DELETE RESTRICT,
  major_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (major_id IS NULL OR faculty_id IS NOT NULL),
  FOREIGN KEY (major_id, faculty_id) REFERENCES public.majors(id, faculty_id) ON DELETE RESTRICT
);
CREATE UNIQUE INDEX users_email_unique ON public.users (lower(email));
CREATE INDEX users_faculty_major_idx ON public.users (faculty_id, major_id);
CREATE INDEX users_major_idx ON public.users (major_id) WHERE major_id IS NOT NULL;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

REVOKE ALL ON public.users FROM PUBLIC, social_app;
GRANT SELECT ON public.users TO social_app;
GRANT INSERT (firebase_uid, email, username, display_name, bio, avatar_url, faculty_id, major_id)
  ON public.users TO social_app;
GRANT UPDATE (email, username, display_name, bio, avatar_url, faculty_id, major_id)
  ON public.users TO social_app;
