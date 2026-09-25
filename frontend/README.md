# CMU Connect frontend

## Run locally

1. Run `npm.cmd install` in `frontend`.
2. Copy `.env.example` to `.env` and enter the Firebase **web app** configuration
   from Firebase Console > Project settings > Your apps. Use the same project as
   `FIREBASE_PROJECT_ID` in `backend/.env`. Do not use Admin service-account credentials.
3. Enable **Email/Password** in Firebase Authentication > Sign-in method.
4. Set `VITE_API_BASE_URL` to the Express API origin if it differs from
   `http://127.0.0.1:3000`. Run the backend and its migrations, then run
   `npm.cmd run dev`. Restart Vite after changing environment variables.

The signup and login forms use the Firebase client SDK. Signup saves the user's
name, creates their email/password account, and sends an email verification link.
Unverified users can resend the link, check verification, or sign out. Verification
refreshes the ID token. Verified users create a PostgreSQL profile by choosing a
username and display name. On later sign-ins, the app loads the saved profile,
syncs its Firebase email through Express, and reads it again. The welcome screen
shows the PostgreSQL profile ID so you can compare it after a backend restart.
Firebase restores the session on page reload. Forgot password sends a password
reset email.

If web configuration is missing, the app still renders and shows an error when
an authentication action is attempted. Live account creation and email delivery
require a configured Firebase project and an internet connection.

## Scope

The old student ID, account type, faculty, and major inputs have been removed from
signup because the existing authentication flow cannot save them. The placeholder
CMU SSO link has also been removed; no CMU OAuth provider is configured. Signup
currently accepts email/password accounts and does not enforce a CMU email domain.

Profile onboarding stores username and display name. Faculty and major choice,
student IDs, account types, and a social feed still need separate product work.
See [the API contract](../docs/core-schema-auth.md).

## Checks

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Automated tests cover signup validation, partial account-creation failures,
verification dispatch, password-reset errors, and safe user-facing messages using
an injected client. Profile tests check the token/header, sync/read order, and
preserved profile ID with an injected HTTP response stub. They do not create real accounts,
send email, or run PostgreSQL.

Manual live check with a test account: create an account, verify the email, click
I've verified my email, choose a username, and record the PostgreSQL profile ID.
Restart the backend without resetting the database, sign out, sign back in, and
confirm the same profile ID and username appear. Also check incorrect passwords,
mismatched signup passwords, and a password reset. The browser requires Firebase
web app settings; Express requires Application Default Credentials for the same
project and a working PostgreSQL connection. Keep all credentials in ignored
local files or environment variables.

Firebase reference: [password authentication](https://firebase.google.com/docs/auth/web/password-auth)
and [user management](https://firebase.google.com/docs/auth/web/manage-users).
