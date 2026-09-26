# Firebase Auth + Express + PostgreSQL integration check

Use the `feature/jr-auth-db-integration` worktree. These steps require your own
Firebase project, an Email/Password test account, and local database
passwords. Keep real values in ignored `.env` files. If revoked-token checks are
enabled, keep the Firebase Admin service-account JSON outside the repository. Do not paste credentials or tokens
into a terminal transcript or commit them.

## Configure and start PostgreSQL

From the integration worktree root in PowerShell:

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
if (-not (Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
if (-not (Test-Path frontend/.env)) { Copy-Item frontend/.env.example frontend/.env }
docker compose up -d
docker compose ps
docker compose cp database/setup-role.sql db:/tmp/social-network-setup-role.sql
docker compose exec -T db psql -U postgres -d social_network -v ON_ERROR_STOP=1 -f /tmp/social-network-setup-role.sql
docker compose exec db psql -U postgres -d social_network
```

Before starting Compose, enter `POSTGRES_PASSWORD` in the root `.env`. In the
interactive `psql` prompt, run `\password social_app`, enter a different password,
then `\q`. In `backend/.env`, configure `PGPASSWORD` for `social_app`, the
`MIGRATION_DATABASE_URL` for the migration owner, and `FIREBASE_PROJECT_ID`.
If `FIREBASE_CHECK_REVOKED=true`, set `GOOGLE_APPLICATION_CREDENTIALS` to the
absolute path of the Admin JSON outside the repository. In `frontend/.env`, enter the Firebase web app config
for the same project. Enable Email/Password sign-in in Firebase Console. See
[database setup](database-setup.md) and [schema/auth setup](core-schema-auth.md)
for details. Never put Admin credentials in frontend variables.

## Apply and check migrations

```powershell
Set-Location backend
npm.cmd ci
npm.cmd run migrate
npm.cmd run migrate
npm.cmd test
npm.cmd run test:integration-db
Set-Location ..
docker compose cp database/tests/core-schema.sql db:/tmp/core-schema-check.sql
docker compose exec -T db psql -U postgres -d social_network -v ON_ERROR_STOP=1 -f /tmp/core-schema-check.sql
```

The first migration run applies files 001–005 if they have not already been
applied; the second should report zero. The schema check rolls its fixture data
back. The live database check exercises the frontend profile client through
Express with an injected test verifier, closes and reopens Express and PostgreSQL
connections, confirms the same profile ID, then removes its uniquely named test
profile. It uses the local database and requires the migration owner for cleanup.
It does not prove Firebase token verification. Do not reset the database volume
or edit applied migration files.

## Check the full browser flow

Start the backend from `backend` with `npm.cmd start`. In a second PowerShell
window, run `npm.cmd ci` and `npm.cmd run dev` from `frontend`. Open the Vite URL
shown in the terminal. Sign up using a disposable test account in your Firebase
project. The profile should be created automatically. Then create a text and photo post.

Record that ID. Stop only the backend process with Ctrl+C and start it again with
`npm.cmd start`. Sign out in the browser, sign in with the same test account, and
confirm the username and profile ID are unchanged. A returning sign-in makes
`GET /api/users/me`, `POST /api/users/sync`, then `GET /api/users/me` requests.
The first profile creation makes `POST /api/users/sync` followed by `GET
/api/users/me`. Each request obtains a current Firebase ID token for the Bearer
header. The UI does not display or log tokens.
