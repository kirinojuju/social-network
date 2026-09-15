DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'social_app'
  ) THEN
    CREATE ROLE social_app
      WITH LOGIN
      NOSUPERUSER
      NOCREATEDB
      NOCREATEROLE;
  END IF;
END
$$;

GRANT CONNECT ON DATABASE social_network TO social_app;
GRANT USAGE ON SCHEMA public TO social_app;