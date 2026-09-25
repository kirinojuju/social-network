# CMU Connect frontend

## Run locally

1. Run `npm.cmd install` in `frontend`.
2. Copy `.env.example` to `.env` and enter the Firebase **web app** configuration
   from Firebase Console > Project settings > Your apps. Use the same project as
   `FIREBASE_PROJECT_ID` in `backend/.env`. Do not use Admin service-account credentials.
3. Enable **Email/Password** in Firebase Authentication > Sign-in method.
4. Run `npm.cmd run dev`. Restart Vite after changing environment variables.

The signup and login forms use the Firebase client SDK. Signup saves the user's
name, creates their email/password account, and sends an email verification link.
Unverified users can resend the link, check verification, or sign out. Verification
refreshes the ID token. Verified users see a signed-in welcome screen. Firebase
restores the session on page reload. Forgot password sends a password reset email.

If web configuration is missing, the app still renders and shows an error when
an authentication action is attempted. Live account creation and email delivery
require a configured Firebase project and an internet connection.

## Scope

The old student ID, account type, faculty, and major inputs have been removed from
signup because the existing authentication flow cannot save them. The placeholder
CMU SSO link has also been removed; no CMU OAuth provider is configured. Signup
currently accepts email/password accounts and does not enforce a CMU email domain.

This change connects Firebase authentication only. It does not create a PostgreSQL
application profile or implement a social feed. Profile onboarding must request a
username, load valid faculty/major choices, and call the existing authenticated
`POST /api/users/sync` endpoint after email verification. Student IDs and account
types need a separate agreed schema/API contract. See [the API contract](../docs/core-schema-auth.md).

## Checks

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Automated tests cover signup validation, partial account-creation failures,
verification dispatch, password-reset errors, and safe user-facing messages using
an injected client. They do not create real accounts or send email.

Manual live check with a test account: create an account, verify the email, click
I've verified my email, reload to check persistence, sign out, sign back in, and
request a password reset. Also check incorrect passwords and mismatched signup
passwords.

Firebase reference: [password authentication](https://firebase.google.com/docs/auth/web/password-auth)
and [user management](https://firebase.google.com/docs/auth/web/manage-users).
