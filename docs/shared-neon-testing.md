# Shared team test site

The shared PostgreSQL database belongs to the project owner in Neon. Teammates
use the website and Firebase sign-in; they do **not** need a Neon account or a
database password. The website and Express API are served from one HTTPS origin.
Only the API connects to Neon.

## Owner setup

1. In your Neon account, create a project in a region near the web host, with a
   database named `social_network`. This team's project is
   [social-network-team-test](https://console.neon.tech/app/projects/mute-bread-92866964)
   in Singapore. The default database owner is `social_network_owner`.
2. Create a separate, limited Neon role named `social_app` **with SQL**, not
   the Neon Console's Add role button. A role created by Add role can inherit
   `neon_superuser` and bypass row security. Give the SQL-created role a strong
   password and no `CREATEDB`, `CREATEROLE`, `REPLICATION`, or `BYPASSRLS`
   attributes. Keep its password private. In the Neon SQL Editor, select
   `social_network` and the owner role, then run `database/setup-role.sql` to
   grant database and schema access. The script does not change an existing
   role's password.
3. On the owner's computer, obtain the **direct** owner connection string from
   Neon. Put it only in the ignored `backend/.env` as
   `MIGRATION_DATABASE_URL`, and run `npm.cmd run migrate` from `backend`.
   The migration runner creates the application tables and grants only the
   table permissions used by the API. Remove the owner URL from the environment
   after migration; never add it to the hosted web service.
4. Use [render.yaml](../render.yaml) to create one Render Web Service from this
   branch in your own Render account. The service builds the frontend and runs
   Express in Singapore. Render asks for `PGHOST`, `PGUSER`, and `PGPASSWORD`:
   enter the **pooled** Neon host for `social_app`, `social_app`, and that role's
   password. Do not enter the owner password. Render supplies an HTTPS URL when
   deployment succeeds. The database hostname is the host part only, without a
   scheme, username, password, or path.
   The hosted backend checks the role at startup and refuses elevated roles.
5. Open `https://<your-render-host>/api/ready`. A `ready` response confirms the
   API can query Neon. Open the site URL, sign in with a test Firebase account,
   and check that a profile and image post survive a page reload. If Firebase
   requests an authorized domain, add the Render hostname in Firebase
   Authentication settings under your Firebase project.
6. Give teammates only the site URL. They use their own Firebase test accounts.
   Keep the Neon console and Render settings under your account. Run migrations
   only when the schema changes and only with the owner role.

## What is public and what stays private

The Firebase Web configuration and project ID are public client settings. The
Neon owner URL, `social_app` password, Firebase Admin credentials, and any AI
provider keys are server secrets. Keep them out of Git, frontend variables, and
team chat. If someone gets a database password, rotate it in Neon and update
the Render secret. Do not give teammates `MIGRATION_DATABASE_URL`.

The test site is publicly reachable, so use disposable test accounts and data.
Posts are currently private to their author. The free Render Web Service may
sleep after inactivity; its first request can take longer to respond. Neon and
Render limits and pricing can change, so review both dashboards before relying
on the site for a demonstration.

References: [Neon connection pooling](https://neon.com/docs/connect/connection-pooling),
[Render Blueprints](https://render.com/docs/blueprint-spec), and
[Render free service limits](https://render.com/docs/free).
