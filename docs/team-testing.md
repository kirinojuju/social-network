# Team testing setup

This branch shares the Firebase **Web app configuration** in
`frontend/.env.example`. It contains the API key, Auth domain, project ID, and
app ID for the team test project. These values identify the Firebase project;
they are not administrator credentials. The matching project ID is already in
`backend/.env.example`.

## Start on your own computer

1. Get the latest `codex/jr-team-integration` branch.
2. Copy `.env.example` to `.env` in the repository root, `backend`, and
   `frontend`. Keep any `.env` files you already have.
3. Choose your own PostgreSQL passwords. Put the administrator password in the
   root `.env`, the `social_app` password in `backend/.env` as `PGPASSWORD`, and
   your local migration connection in `MIGRATION_DATABASE_URL`. Follow
   [database setup](database-setup.md) for the local role and database.
4. Start PostgreSQL with `docker compose up -d`. In `backend`, run `npm ci`,
   `npm run migrate`, then `npm run dev`. In `frontend`, run `npm ci` and
   `npm run dev`.
5. Open the URL printed by Vite. Create a test account, sign in, and create a
   text or image post. The backend's `/api/ready` endpoint should return
   `ready` before testing the page.

The team shares one Firebase Authentication and Firestore project. Each
developer may continue using a separate local PostgreSQL database. For a
single website and shared PostgreSQL database owned by the project owner, see
[shared Neon testing](shared-neon-testing.md). Current post rules are private,
so teammates do not see one another's posts yet.

## What belongs in Git

The Firebase Web API key in `frontend/.env.example` is a client identifier.
Firebase authorizes data access with Authentication and Firestore Security
Rules. The project owner should keep this key restricted to Firebase-related
APIs in Google Cloud Console. See [Firebase's API key guidance](https://firebase.google.com/docs/projects/api-keys).

Do not commit your `.env` files, PostgreSQL passwords, migration owner URL,
Firebase Admin service-account JSON, or AI provider keys. If a future test
needs a shared server credential, keep it in the hosted backend's secret
settings. Teammates using the website should receive only the site URL.

## Troubleshooting: "Backend failed to start"

If `node server.js` prints "Backend failed to start" with no further detail,
check `.env` first:

- The backend reads **separate** PG* variables (`PGHOST`, `PGPORT`,
  `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGSSLMODE`) — not a single
  `DATABASE_URL`. If you have a Neon connection string, split it into the
  pieces above (see `backend/.env.example`).
- If your Postgres role is an elevated/owner role, set
  `REQUIRE_LIMITED_DB_ROLE=false` locally, or ask for a non-owner
  connection string.
- `FIREBASE_PROJECT_ID` must be set even without Admin credentials;
  `GOOGLE_APPLICATION_CREDENTIALS` can stay blank for basic token
  verification.

If the frontend shows "Cannot reach the profile server," it means the
backend isn't running — start it in a separate terminal with
`node server.js` (or `npm run dev`) inside `backend/`, alongside
`npm run dev` in `frontend/`.