# CMU Connect frontend

## Run locally

For team testing, run `npm.cmd ci` and `npm.cmd run dev:team` in `frontend`.
Open `http://localhost:5173`. This uses the shared Firebase project and the
hosted Render API; no local backend or database password is needed. The
committed `.env.team` contains only public Firebase Web identifiers and the
API URL. See [team testing setup](../docs/team-testing.md) for checks.

For full local backend development, copy `.env.example` to `.env` without
overwriting an existing file. Set `VITE_API_BASE_URL` if the local Express API
is not at `http://127.0.0.1:3000`; otherwise leave it blank. Run the backend
and its database migrations, then `npm.cmd run dev`. Restart Vite after changing
environment variables. Do not use Admin service-account credentials in the
frontend. Enable **Email/Password** in Firebase Authentication > Sign-in method.

The signup and login forms use the Firebase client SDK. Signup creates an
email/password account without sending a verification email. The app creates a
PostgreSQL profile automatically on first sign-in. On later
sign-ins, the app loads the saved profile through Express. Firebase restores the
session on page reload. Forgot password still sends a password reset email.
Users can create private text posts in Cloud Firestore. The app imports existing
PostgreSQL posts into Firestore on sign-in and stores a copy of the profile there.
JPEG, PNG, WebP, and GIF images up to 5 MB remain in PostgreSQL and are linked
from Firestore post documents. Firebase Storage requires the Blaze plan; this
project currently uses Spark.

If web configuration is missing, the app still renders and shows an error when
an authentication action is attempted. Live account creation and email delivery
require a configured Firebase project and an internet connection.

## Scope

The old student ID, account type, faculty, and major inputs have been removed from
signup because the existing authentication flow cannot save them. The placeholder
CMU SSO link has also been removed; no CMU OAuth provider is configured. Signup
currently accepts email/password accounts and does not enforce a CMU email domain.

Profile names and usernames can be updated through the existing API. Faculty and major choice,
student IDs, account types, and a public social feed still need separate product work.
See [the API contract](../docs/core-schema-auth.md).

## Checks

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run test:firestore-live
```

Automated tests cover signup validation, partial account-creation failures,
password-reset errors, and safe user-facing messages using
an injected client. Profile tests check the token/header, sync/read order, and
preserved profile ID with an injected HTTP response stub. They do not create real accounts,
send email, or run PostgreSQL.

Manual live check with a test account: create an account and then create a text
and photo post. Restart the backend, sign out, sign back in,
and confirm the same profile and post appear. Also check incorrect passwords,
mismatched signup passwords, and a password reset. The browser requires Firebase
web app settings; Express requires the same Firebase project ID and a working
PostgreSQL connection. Admin credentials are needed only when revoked-token
checking is enabled. Keep all credentials in ignored
local files or environment variables.

Firebase reference: [password authentication](https://firebase.google.com/docs/auth/web/password-auth)
and [user management](https://firebase.google.com/docs/auth/web/manage-users).
