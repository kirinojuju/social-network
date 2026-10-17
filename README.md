# CMUnite — Social Network Project

CMUnite is a student-focused social network built by our team. Members can find
one another, share posts, and have private conversations. This repository is an
**Alpha 0.1 team project**, not an official Chiang Mai University service.

**Team test site:** [social-network-team-test.onrender.com](https://social-network-team-test.onrender.com/)

<img src="frontend\src\assets\cmunite.png" alt="Alt text" width="500">

The shared site is for testing. Render may take longer to answer its first request
after a period of inactivity. The site runs a manually selected integration commit;
the GitHub `main` and `develop` branches can be at different versions.

## What works in Alpha 0.1

- Email/password sign-up and sign-in with Firebase Authentication; member profiles
  are linked to verified Firebase user IDs.
- A member directory, search for members and visible posts, profiles, and follows.
- Community posts with **All members** or **Only me** visibility, photos, likes,
  comments, and per-account saved posts. Authors can edit visibility and delete
  their own posts.
- Private one-to-one text/photo chat with unread counts and read receipts.
- In-app notifications for likes, comments, follows, and unread messages.
- UniAI chat and post summaries when the server-side AI provider is configured.

Chat and notifications refresh by polling while the app is open; they are not
device push notifications. AI chat history stays in the current popup session.
The recommendations for groups are sample UI content, not a working group system.
There is no CMU SSO or enforced CMU email-domain restriction.

## How it is built

```text
React + Vite frontend
  ├─ Firebase Authentication: sign-in and ID tokens
  └─ Express API: profiles, posts, search, chat, notifications, AI
       ├─ Firebase Admin: verifies ID tokens
       └─ PostgreSQL on Neon: current profiles, posts, media and messages
```

The backend uses `pg` for its active API routes. SQL files in
[`database/migrations`](database/migrations) define the application schema; Prisma
files are available for teammate development but do not replace those migrations.
Firestore is still used for legacy private posts and a profile copy; current
community posts, interactions, and member-to-member messages are stored in
PostgreSQL. The frontend sends a Firebase ID token to protected API routes, and
the backend uses the verified identity to enforce ownership and visibility.

Render builds the frontend and serves it with the Express API from one HTTPS
origin. Its configuration is in [`render.yaml`](render.yaml). Database migrations
are run separately with an owner connection; the running API uses a limited
database role.

## Run locally

You need Node.js/npm, Docker Desktop for a local PostgreSQL database, and access
to the team's Firebase test project. On Windows PowerShell, use `npm.cmd` as shown
below; on macOS/Linux, use `npm`.

1. Copy `.env.example`, `backend/.env.example`, and `frontend/.env.example` to
   `.env` files beside them. Keep existing `.env` files if already configured.
   Set your own local database passwords and matching Firebase project ID.
2. Start PostgreSQL with `docker compose up -d`, then follow
   [database setup](docs/database-setup.md) to create the limited `social_app`
   role. The backend's `PG*` settings must point to that database.
3. In `backend`, install dependencies, apply migrations using the separate
   `MIGRATION_DATABASE_URL` owner connection, and start the API:

   ```powershell
   cd backend
   npm.cmd ci
   npm.cmd run migrate
   npm.cmd run dev
   ```

4. In another terminal, start the frontend:

   ```powershell
   cd frontend
   npm.cmd ci
   npm.cmd run dev
   ```

Open the Vite URL shown in the terminal. `/api/health` checks HTTP availability;
`/api/ready` checks database connectivity. Neither endpoint proves every feature
or migration is working. Accounts in the same Firebase project will only see the
same current posts and messages when their backends use the **same PostgreSQL
database**. See [team testing setup](docs/team-testing.md) for the shared setup.

Keep PostgreSQL passwords, migration URLs, Firebase Admin credentials, and AI
provider keys out of Git and frontend `VITE_*` variables. The Firebase web app
configuration is client-side configuration, not an Admin credential. See
[`SECURITY.md`](SECURITY.md) for reporting and handling security issues.

## Project structure

| Path | Purpose |
| --- | --- |
| [`frontend/src`](frontend/src) | React UI, Firebase client, post and chat clients |
| [`backend/server.js`](backend/server.js) and [`backend/app.js`](backend/app.js) | HTTP startup and API registration |
| [`backend/routes`](backend/routes) | Protected API routes |
| [`backend/config`](backend/config) | PostgreSQL and Firebase configuration |
| [`database/migrations`](database/migrations) | Ordered PostgreSQL schema changes |
| [`docs`](docs) | Setup, feature and test guides |

## Team roles

| Name | Role |
| --- | --- |
| Sally | Back-End (Logic & Features) |
| JR | Infra (Database & Security) |
| OT | Front-End |
| Beach | Back-End (AI Features, API) |
| Min Swan | Full-Stack |

## Development workflow

- `develop` is the team integration branch. Feature branches target `develop`
  through pull requests.
- `main` is the release branch. Promote reviewed, tested integration work to
  `main` through a separate pull request.
- Keep changes scoped, review them with a teammate, and run relevant backend or
  frontend checks before merging.

For feature scope and a two-account acceptance checklist, see
[`docs/alpha-0.1.md`](docs/alpha-0.1.md). Automated tests cover backend and
frontend behavior, but testing with two real accounts on the shared site is a
separate acceptance step.
