# Team testing setup

## Run the frontend locally against the shared test services

1. Get the latest `codex/team-localhost-setup` branch.
2. In `frontend`, run `npm.cmd ci` and `npm.cmd run dev:team`.
3. Open `http://localhost:5173` (or the URL Vite prints). Sign in with a test
   account and check that a text post remains after a reload.

`dev:team` loads the committed `frontend/.env.team` file. It points the browser
at the shared Firebase Authentication and Firestore project and sends profile
and image requests to the Render API backed by Neon. A teammate does not need
Neon or Render console access, PostgreSQL passwords, Firebase Admin credentials,
or a local backend for this workflow. The Firebase Web configuration consists of
public client identifiers, not administrator credentials. Firebase Console
membership is useful for inspecting the project, but is not required to sign in
through the web app.

The Render API must be available for profile loading. Check
`https://social-network-team-test.onrender.com/api/ready` if sign-in succeeds
but the app shows **Profile unavailable**. The hosted API must allow
`http://localhost:5173` in `CORS_ORIGIN`; the checked-in server default does.
Use test accounts and data because this mode writes to the shared services.

If sign-in itself fails, confirm that Firebase Authentication has Email/Password
enabled. A missing local web configuration suggests the teammate ran `npm run
dev` rather than `npm run dev:team`. If Firebase reports `auth/unauthorized-domain`,
check Authentication > Settings > Authorized domains for `localhost`. Restart
Vite after changing environment variables. If the error persists, share the
exact `auth/...` code or a screenshot, without passwords or tokens.

## Run the entire stack locally instead

For backend or database work, each developer can use their own PostgreSQL
database. Copy the root, `backend`, and `frontend` `.env.example` files to
`.env` without overwriting existing `.env` files. Choose local PostgreSQL
passwords and follow [database setup](database-setup.md), then run the backend
migrations. Start the backend and run `npm.cmd run dev` in `frontend`.
This mode still uses the shared Firebase project, but the local PostgreSQL
database does not contain the hosted Neon profiles or images. Git pull does not
synchronize database contents.

## What belongs in Git

The Firebase Web API key in `frontend/.env.team` and `frontend/.env.example`
is a client identifier.
Firebase authorizes data access with Authentication and Firestore Security
Rules. The project owner should keep this key restricted to Firebase-related
APIs in Google Cloud Console. See [Firebase's API key guidance](https://firebase.google.com/docs/projects/api-keys).

Do not commit your `.env` files, PostgreSQL passwords, migration owner URL,
Firebase Admin service-account JSON, or AI provider keys. If a future test
needs a shared server credential, keep it in the hosted backend's secret
settings. Teammates using the website should receive only the site URL.
