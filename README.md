# Social Network Project (Local Setup)

A group project social network app. Runs entirely on `localhost` — no cloud hosting.

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

- Node.js (see `.nvmrc` for exact version — run `nvm use`)
- npm
- A local database installed (MongoDB / MySQL / PostgreSQL — match whatever JR sets up)

## Setup

1. Clone the repo
   ```bash
   git clone <repo-url>
   cd project
   ```

2. Install backend dependencies
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies
   ```bash
   cd ../frontend
   npm install
   ```

4. Copy the environment example file and fill in your local values
   ```bash
   cd ../backend
   cp .env.example .env
   ```

5. Start your local database (make sure it's running before starting the backend)

6. (Optional) Seed sample data so your local DB has test users/posts
   ```bash
   npm run seed
   ```

7. Run the backend
   ```bash
   npm run dev
   ```

8. In a separate terminal, run the frontend
   ```bash
   cd frontend
   npm run dev
   ```

9. Open the app in your browser at the URL shown by the frontend dev server (e.g. `http://localhost:5173`)

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
