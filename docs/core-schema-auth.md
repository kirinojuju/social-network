# Phase 1: database and authentication

React signs users in with the Firebase client SDK. It sends a Firebase ID token
in `Authorization: Bearer <token>` to Express. The Admin SDK verifies the token,
including signature, issuer, audience and expiry checks, and middleware exposes the verified
claims as `req.auth`. Express uses `req.auth.uid` to locate the PostgreSQL profile.
Firebase owns passwords, providers, and token refresh. This app does not require
email verification for signup or profile creation.
PostgreSQL retains application profiles and image bytes; Firestore stores private
post documents and a copy of each profile. PostgreSQL has no password columns.
There is no additional Express login/password system.

Firebase setup follows the official [Admin SDK setup](https://firebase.google.com/docs/admin/setup)
and [session verification](https://firebase.google.com/docs/auth/admin/manage-sessions) documentation.

## Local Firebase configuration

Enable your instructor-required sign-in provider in the Firebase project console.
Set `FIREBASE_PROJECT_ID` in `backend/.env`. The default token check verifies
signatures against Firebase public keys. To also reject revoked or disabled-user
tokens immediately, set `FIREBASE_CHECK_REVOKED=true` and provide standard
Application Default Credentials: locally, set `GOOGLE_APPLICATION_CREDENTIALS`
to an absolute path to your service-account JSON **outside the repository**.
On a managed host, use its service identity. Never put Admin credentials in Vite
variables, frontend bundles, tracked files, logs, or API responses. Use only the
Firebase permissions needed for token verification and user lookup.

The Admin SDK is initialized on the first protected request, so health/readiness
and unit tests require no Firebase credentials. Revocation checks are disabled by
default and can be enabled with `FIREBASE_CHECK_REVOKED=true` when Admin credentials
are configured. Normal ID tokens remain valid until expiry after a user is disabled
or signed out server-side. Verification failures return a
generic 401, including configuration/network failures; diagnose configuration
separately without logging credentials or bearer tokens. This server refuses the
Auth emulator environment variable to avoid accidentally accepting unsigned tokens.
Use an injected mock verifier in unit tests instead.

Keep credentials outside the repository even with ignore rules. `.env` variants,
`secrets/` directories, and conventional service-account/Admin SDK JSON filenames
are ignored. Git cannot recognize arbitrarily renamed secret files by content.
Never force-add credentials. Production must use HTTPS and a restricted CORS origin.

## Migrations

Prerequisites: Node dependencies (`npm ci` in `backend`), a running PostgreSQL 18
database, and `social_app` provisioned with [database setup](database-setup.md).
Use a separate migration owner such as the local `postgres` administrator.
The backend HTTP connection must continue to use `social_app`.

In your untracked `backend/.env`, set `MIGRATION_DATABASE_URL` to a PostgreSQL
connection URI for the migration owner and target database. URL-encode special
characters in credentials. Do not paste the URI into shared commands or logs.
Then run from the repository root:

```powershell
cd backend
npm.cmd run migrate
npm.cmd run migrate
```

The first run applies `database/migrations/001` through `005` in filename order.
The second reports zero applied. The runner uses one transaction for the pending
batch, an advisory lock, and `public.schema_migrations` with SHA-256 checksums.
Failure rolls back pending DDL and history. Changed/removed/out-of-order applied
files fail validation. Checksums normalize Windows line endings. Never edit an
applied migration; add the next numbered file. Do not run individual SQL files
outside the runner or manually modify tables. Existing conflicting tables cause
failure rather than being dropped or overwritten. No volume reset is needed.

`database/setup-role.sql` provisions the role on a new local database; it does not
set the password. Run it before migrations. Database names other than
`social_network` also need CONNECT granted by their administrator. Keep migration
credentials out of the deployed HTTP process and remove them from its environment.

After migration, optional transactional SQL checks can be run as the migration
owner (all fixtures are rolled back):

```powershell
docker compose cp database/tests/core-schema.sql db:/tmp/core-schema-check.sql
docker compose exec -T db psql -U postgres -d social_network -v ON_ERROR_STOP=1 -f /tmp/core-schema-check.sql
```

## Schema decisions

- UUID keys use PostgreSQL's built-in `gen_random_uuid()`; no extension required.
  `timestamptz` stores instants, independent of the client's display timezone.
  Database triggers maintain profile/post `updated_at`.
- Email is required and unique without case sensitivity. Usernames are lowercase
  ASCII letters, numbers, or underscores, 3–30 characters. Firebase UID is unique,
  required, and cannot be changed by the application role.
- A composite major/faculty foreign key prevents mismatched selections. Deleting
  referenced faculties/majors is restricted. Reference data is maintained by an
  administrator; this phase does not invent faculty/major seed values.
- Posts default to `private`; only `public` and `private` are accepted. Content
  can be empty for future media-only posts. Feed and author indexes support later
  endpoints. Deleting a user cascades through posts and media metadata.
- Media belongs to its post's author through a composite foreign key. The first
  four migrations defined a storage path and metadata. Migration 005 adds a
  `bytea` column for local image uploads up to 2 MB. Video uploads are not enabled.
- `social_app` gets reference-table SELECT, profile SELECT, and only the INSERT/
  UPDATE columns needed by sync. Migration 005 grants post and image reads/inserts;
  the API binds them to the verified UID. The role cannot delete profiles, write
  migration history, or delete posts. This shared backend role is not a per-user
  database identity; endpoint authorization isolates users.

## API contract

Both endpoints require a valid Firebase ID token and return `Cache-Control: no-store`.

`POST /api/users/sync` creates or updates **only** the authenticated UID's profile.
It requires a valid Firebase email claim; a missing or malformed email returns 403.
Refresh the ID token after email changes. Request example:

```json
{
  "username": "student_one",
  "display_name": "Student One",
  "bio": "Hello",
  "avatar_url": null,
  "faculty_id": null,
  "major_id": null
}
```

This is a full profile replacement: username/display name are required each time;
omitted optional fields become NULL. Unknown fields (including UID, email, ID,
password, and timestamps) are rejected. Avatar URLs must be HTTPS without embedded
credentials; they are stored, never fetched by the backend. Faculty/major values
must be existing UUIDs with the correct relationship. Email comes exclusively
from the verified token. A different UID cannot claim a profile by matching email.
Both creation and update return 200 with `{ "user": { ...profile } }` and keep the
same internal UUID. Username/email conflicts return 409 without database details.

`POST /api/users/ensure` creates an initial profile on first sign-in and keeps an
existing profile unchanged except for its Firebase email. It accepts an optional
`display_name` and derives a stable username from the email and UID.
`GET /api/users/me` returns 200 with the same user envelope, or 404 before sync or ensure.
Invalid profile input returns 400; missing/invalid/expired tokens return
401; unexpected database failures return a generic 500. No raw exceptions are logged.

## Frontend integration and posts

The frontend uses Firebase email/password sign-in. A new user without a
PostgreSQL profile is provisioned automatically through `/ensure` using a stable
username derived from their email and UID. A returning user is loaded with `/me`, synced to refresh
the Firebase email, and read again with `/me`. Each request obtains a
current Firebase ID token and sends it in the Authorization header. The UI shows
the PostgreSQL profile ID for the restart/persistence check. Do not use a UID
supplied in a request body as proof of identity. See the frontend README for the
manual live check. Faculty/major editing is not yet in the UI.

New private text posts are written directly to Cloud Firestore `posts/{id}`.
On sign-in the frontend copies up to 50 existing PostgreSQL posts to Firestore,
without overwriting documents that already exist. Profiles are copied to
`users/{uid}`. Image posts use `POST /api/posts` to store image bytes in PostgreSQL,
then create a Firestore post referencing the image ID. `GET /api/posts/:id/image`
returns an image only to its owner. Images up to 2 MB are stored in
`media.image_data`; the API checks content type and file signature. Public feeds
are not part of this flow. Firebase Storage is unavailable on the project's
current Spark plan, so image bytes remain in PostgreSQL.

## Tests

Run `npm.cmd test` in `backend`. Tests inject token verifiers and database stubs,
cover middleware, validation, error sanitization, migration-runner behavior, and
the existing health/readiness checks. They require neither Firebase credentials
nor a database. The test script targets `test/*.test.js` so the contributor's manual
`ai/test.js` demo is not executed as an automated test. SQL constraint/grant checks
require a real PostgreSQL instance and are separate from the unit suite.
