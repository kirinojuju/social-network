# Prisma development setup

The backend runtime still uses pg and the PG* variables. Prisma 7.10 is available
for backend feature development; adding its schema does not switch the API to
Prisma or change a database.

## Configure and generate

1. In backend/.env, set DIRECT_URL to the direct PostgreSQL connection for your
   development database. For Neon, select the development branch and turn off
   Connection pooling in Connect. Keep this URL out of Git and frontend variables.
2. From backend, run:

```powershell
npm.cmd run prisma:validate
npm.cmd run prisma:generate
```

Both commands operate on the checked-in schema without connecting to the database.
The client is generated into node_modules and is not committed. Runtime use with
Prisma 7 requires a driver adapter; the existing API continues using pg until a
feature explicitly integrates Prisma. A direct URL does not grant extra database
permissions: use a limited application role for normal API reads and writes.

## Schema changes

The checked-in Prisma schema was introspected from a disposable PostgreSQL
database created by SQL migrations 001 through 005, then extended alongside 006
for post interactions. It models the existing table
names, UUIDs, timestamptz columns, composite foreign keys, and partial indexes.
The internal schema_migrations table is ignored by Prisma Client.

SQL files under database/migrations remain the source of truth. Make schema
changes there and apply them with npm.cmd run migrate using MIGRATION_DATABASE_URL
on a development database. After reviewing those changes, update the Prisma
schema with prisma db pull against that development database, preserve the ignore
on schema_migrations, then validate and generate the client again.

Do not run prisma migrate dev, prisma migrate reset, or prisma db push on the
shared database. Prisma does not fully model the check constraints, expression
index on lower(email), triggers, or role grants; generating SQL from this model
would not preserve all of those protections. Keep previously applied SQL migration
files unchanged and add new migration files when the database must change.
