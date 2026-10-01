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
developer runs a separate local PostgreSQL database. Current post rules are
private, so teammates do not see one another's posts yet.

## What belongs in Git

The Firebase Web API key in `frontend/.env.example` is a client identifier.
Firebase authorizes data access with Authentication and Firestore Security
Rules. The project owner should keep this key restricted to Firebase-related
APIs in Google Cloud Console. See [Firebase's API key guidance](https://firebase.google.com/docs/projects/api-keys).

Do not commit your `.env` files, PostgreSQL passwords, migration owner URL,
Firebase Admin service-account JSON, or AI provider keys. If a future test
needs a shared server credential, distribute it through a private channel and
give each teammate only the access required for that test.
