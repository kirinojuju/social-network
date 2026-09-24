# Backend foundation (local development)

Use a supported Node.js LTS release with `node --watch` and built-in `fetch`.
First complete [database setup](database-setup.md), including the `social_app` password.

From the repository root in PowerShell:

```powershell
docker compose up -d
cd backend
npm ci
Copy-Item .env.example .env
```

Only copy the example if `backend/.env` does not already exist. Set `PGPASSWORD`
to your `social_app` password. This differs from the root `.env` administrator
password. Never commit either `.env` file.

Existing `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD`
settings are also supported. The corresponding `PG_*` settings take precedence
when both formats are present.

If PowerShell blocks `npm.ps1`, use `npm.cmd` in place of `npm` in these commands.

```powershell
npm run dev
```

Open `http://localhost:3000/api/health`: HTTP 200 means Express is running.
Open `http://localhost:3000/api/ready`: HTTP 200 means a database query succeeded;
HTTP 503 means the database is unavailable or its credentials/configuration are wrong.
Readiness does not verify application tables or their permissions.

To verify recovery locally, stop the database with `docker compose stop db`
from the repository root. Health should remain 200 and readiness become 503.
Run `docker compose start db`, wait for healthy status, then readiness should return 200.
Use Ctrl+C to stop the backend and close its database pool.

Run `npm test` inside `backend` for HTTP tests using a simulated database.
These tests do not replace the real database connection check above.

## Networking

This step runs Node directly on the host; only PostgreSQL runs in Docker.
The default backend HOST is loopback for local development.
When a backend container is added later, use HOST=0.0.0.0 and PGHOST=db.
Do not start a second backend on the same port.

CORS_ORIGIN is a comma-separated list of frontend origins (without paths),
not the backend API URL. CORS does not authenticate requests.
No credentialed cookie flow, authentication, application routes, or public
internet hosting is implemented in this step.
