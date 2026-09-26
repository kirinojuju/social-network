# Social Network Project (Local Setup)

A group project social network app. Runs entirely on `localhost` — no cloud hosting.

Firebase Authentication handles email/password signup and login without email
verification. Cloud Firestore stores private post documents and a copy of each
profile. PostgreSQL retains existing profiles and image bytes up to 2 MB; images
are referenced from Firestore posts. The setup steps in
[backend setup](docs/backend-setup.md) and [frontend setup](frontend/README.md)
describe the Firebase web configuration and local database. Run
`npm.cmd run migrate` in `backend` before using posts.

## Team Roles

| Name | Role |
|---|---|
| Sally | Back-End (Logic & Features) |
| JR | Infra (Database & Security) |
| OT | Front-End |
| Beach | Back-End (AI Features, API) |
| Min Swan | Full-Stack |

## Project Structure

```
/backend
  /routes       ← API endpoints (Sally)
  /controllers  ← business logic (Sally)
  /ai           ← AI features (Beach)
  /config       ← DB & app config (JR)
/frontend
  /src
    /components ← UI components (OT)
    /pages      ← pages/routes (OT, Min Swan)
/shared         ← shared types / API contract docs
```

## Prerequisites

On Windows PowerShell, use `npm.cmd` in place of `npm` if script execution is
disabled. This runs npm without changing your PowerShell execution policy.

- Node.js (see `.nvmrc` for exact version — run `nvm use`)
- npm
- Docker Desktop for the local PostgreSQL database
- A Firebase project with Email/Password sign-in enabled

## Setup

1. Fill in the ignored root `.env`, `backend/.env`, and `frontend/.env` files from
   their `.env.example` files. Use the same Firebase project ID on both sides.
   Admin credentials are optional for local token signature verification; configure
   them only if you enable `FIREBASE_CHECK_REVOKED=true`.
2. Start PostgreSQL with `docker compose up -d`. Follow
   [database setup](docs/database-setup.md) to provision the `social_app` role.
3. In `backend`, run `npm.cmd ci`, then `npm.cmd run migrate`, then `npm.cmd run dev`.
   `http://127.0.0.1:3000/api/ready` should report `ready`.
4. In `frontend`, run `npm.cmd ci` and `npm.cmd run dev`. Open the Vite URL shown.

Use `npm.cmd run test:integration-db` and `npm.cmd run test:posts-db` in `backend`
to check local persistence, and `npm.cmd run test:firestore-live` in `frontend`
to test Firestore owner rules with disposable accounts.

## Git Workflow

- `main` — always deployable, protected, no direct pushes
- `develop` — integration branch, all feature branches merge here first
- `feature/<name>-<short-desc>` — one branch per task, e.g. `feature/sally-auth-logic`

**Rules:**
- Never commit directly to `main` or `develop`
- Open a Pull Request into `develop` for every change, even small ones
- Pull `develop` into your feature branch daily to avoid large conflicts
- Keep PRs small and scoped to one feature
- Get at least one teammate to review before merging

```bash
git checkout develop
git pull origin develop
git checkout -b feature/yourname-task-description
# ...make changes, commit...
git push -u origin feature/yourname-task-description
# open PR on GitHub into develop
```

## Demo Day

Since this is local-only, plan to run the app on one laptop for the demo, or use a tunneling tool like `ngrok` if it needs to be shown on another device.
