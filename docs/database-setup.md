# Local PostgreSQL Setup

This guide explains how to run the Social Network project's local
PostgreSQL database using Docker Compose on Windows PowerShell.

Each developer has their own database and passwords.
Git push and pull do not synchronize database contents.

## 1. Requirements

- Git
- Docker Desktop configured to use Linux containers
- DataGrip or pgAdmin (optional)

A separate PostgreSQL Server installation is not required.

Start Docker Desktop, then check:

```powershell
docker version
docker compose version
```

The output of `docker version` should include both Client and Server information.

## 2. Prepare the Repository

If you have not cloned the repository:

```powershell
git clone https://github.com/kirinojuju/social-network.git
cd social-network
```

If you already have the repository, open a terminal in its directory.
Do not clone it again. Run `git status` and save any pending work
before switching branches.

`develop` is the integration branch. Create feature branches from its latest
remote state after preserving pending work. The Phase 1 schema/auth work is on
`feature/jr-core-social-schema` until reviewed and merged.

Run all Docker Compose commands in this guide from the repository
root, where `compose.yaml` is located.

## 3. Configure Environment Variables

For the initial setup, copy the example file:

```powershell
Copy-Item .env.example .env
```

If `.env` already exists, do not overwrite it.

Open `.env` and enter a password after the equals sign:

```dotenv
POSTGRES_PASSWORD=
```

This password belongs to the database administrator account, `postgres`.

- Use a long, hard-to-guess password.
- Never commit `.env` or actual passwords to Git.
- Keep `.env.example` free of actual passwords.

Verify that Git ignores `.env`:

```powershell
git check-ignore .env
```

The expected output is `.env`.

## 4. Start the Database

```powershell
docker compose up -d
docker compose ps
```

Docker downloads the PostgreSQL image during the first run.

Wait until the `db` service reports a `healthy` status.

If the database does not become ready, inspect its logs:

```powershell
docker compose logs --tail=100 db
```

Connection settings:

| Setting | Value |
|---|---|
| Host | 127.0.0.1 |
| Port | 5432 |
| Database | social_network |
| Administrator user | postgres |
| Application user | social_app |

The published port is bound to the local machine only.
Other computers cannot connect directly using this configuration.

## 5. Create the Application Role

Use `postgres` for database administration.
The `social_app` account is intended for backend connections.

Copy the SQL file into the container, then execute it:

```powershell
docker compose cp database/setup-role.sql db:/tmp/social-network-setup-role.sql
docker compose exec db psql -U postgres -d social_network -v ON_ERROR_STOP=1 -f /tmp/social-network-setup-role.sql
```

Both commands must complete successfully.
Resolve any errors before continuing.

The script:

- Creates `social_app` if it does not already exist.
- Grants permission to connect to `social_network`.
- Grants permission to use the `public` schema.
- Contains no passwords.

If the role already exists, the script does not recreate it
or change its existing password or role attributes.

Application table permissions are configured by the
[Phase 1 migrations](core-schema-auth.md#migrations).

## 6. Set the Application Password

Open psql:

```powershell
docker compose exec db psql -U postgres -d social_network
```

At the `social_network=#` prompt, enter:

```text
\password social_app
```

Enter a new password and repeat it to confirm.
Characters and asterisks will not appear while typing. This is normal.

Choose a password different from the username `social_app`
and the password used by `postgres`.

Exit psql:

```text
\q
```

Notes:

- `\password` and `\q` are psql commands, not SQL statements
  to execute in a DataGrip SQL console.
- If the application password has already been configured,
  you do not need to reset it each time.
- Do not change `POSTGRES_PASSWORD` in `.env` for this step.
  That variable belongs to the `postgres` account.
- Never put actual passwords in SQL files or documentation.

## 7. Verify Application Login

Connect over TCP to test password authentication:

```powershell
docker compose exec db psql -h 127.0.0.1 -U social_app -d social_network -W
```

Enter the password for `social_app`, then run:

```sql
SELECT current_database(), current_user;
```

Expected result:

| current_database | current_user |
|---|---|
| social_network | social_app |

Exit:

```text
\q
```

This verifies database login only.
It does not verify read or write permissions on application tables.

## 8. Connect with DataGrip (Optional)

Add a PostgreSQL data source:

| Field | Value |
|---|---|
| Name | Social Network - App |
| Host | 127.0.0.1 |
| Port | 5432 |
| Database | social_network |
| User | social_app |
| Password | The application password configured earlier |

Click **Test Connection**, then open a query console and run:

```sql
SELECT current_database(), current_user;
```

For administration, create a separate connection using `postgres`
and the administrator password from `.env`.

Do not use the administrator account for normal backend operations.

## 9. Stop and Restart

Stop the database while preserving its data:

```powershell
docker compose stop
```

Start the existing container again:

```powershell
docker compose start
docker compose ps
```

If the container has been removed, recreate it using:

```powershell
docker compose up -d
```

## 10. Data Persistence and Warnings

PostgreSQL data is stored in the Docker named volume declared as
`postgres_data`, not in SQL files or the Git repository.

- Stopping the container does not delete database contents.
- Switching Git branches does not switch database contents.
- A persistent volume is not a backup.
- Do not delete the volume in Docker Desktop if you need its data.
- Do not run `docker compose down -v` unless you intentionally
  want to delete this Compose project's volumes and their data.

`POSTGRES_PASSWORD` and `POSTGRES_DB` are used when initializing
a database in an empty data volume.

Changing these values in `.env` or `compose.yaml` does not update
the password or rename an existing database.

Do not delete the volume as the first response to a connection problem.

## 11. Troubleshooting

### Docker Server Is Unavailable

Start Docker Desktop, wait until it is ready,
then run `docker version` again.

### Port 5432 Is Already in Use

Check whether another PostgreSQL service or container is using the port.

Do not stop an unfamiliar service without identifying it first.

If you change the host port, update the client connection settings
to match.

### Password Authentication Failed

Check that you are using the password for the selected account.
`postgres` and `social_app` are separate accounts.

### Role social_app Does Not Exist

Complete the Create the Application Role step successfully first.

### Permission Denied for a Table

The `social_app` account may not have permissions for that table yet.

Check the permission scripts with the database maintainer.
Do not resolve this by making the application account a superuser.

## 12. Current Scope

This setup provides PostgreSQL and a database account for the backend.
Follow [Phase 1 schema and authentication](core-schema-auth.md) for application
tables, reproducible migrations, and Firebase-backed profile endpoints.

It does not yet include:

- Sample data or seed scripts
- Frontend registration and login UI
- Image and video file storage

`social_app` is the backend's database login account.
It is not a website member account.
