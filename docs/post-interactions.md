# Post likes, comments and member feed

## Status and storage

Feature branch: `codex/post-interactions`. Firebase Auth remains the identity
provider. New posts, likes and comments are stored in PostgreSQL (local or Neon,
depending on backend configuration). The Express runtime continues using its
existing `pg` pool. Prisma 7.10's schema and generated client include the new
models for teammates; this feature does not replace Sally's Prisma setup or
switch the whole backend to Prisma.

`database/migrations/006_post_interactions.sql` is additive. Apply it with the
existing SQL migration runner before starting the updated frontend/backend.
Do not edit applied migrations or independently run Prisma Migrate/db push
against the shared schema. There are still SQL constraints, triggers and grants
that the Prisma model alone does not reproduce.

## Local setup and verification

From `backend`, with the local owner connection in `MIGRATION_DATABASE_URL` and
the local limited `social_app` role in `PG*`:

```powershell
npm.cmd run migrate
npm.cmd run prisma:validate
npm.cmd run prisma:generate
npm.cmd test
npm.cmd run test:post-interactions
```

`test:post-interactions` creates a uniquely named, isolated LOCAL database using
the migration owner's connection, applies all migrations, starts a test API on
a random port and uses three stubbed identities. It exercises real PostgreSQL
through `social_app`, then drops only that test database. It refuses remote
connections. Firebase Auth verification is covered separately by auth tests;
this test does not create Firebase accounts or contact Neon.

From `frontend`, run `npm.cmd test`, `npm.cmd run build`, then `npm.cmd run dev`.
Start the backend with `npm.cmd run dev` in another terminal.

## Data and ownership

* `post_likes`: `(post_id, user_id)` primary key, created timestamp. Repeated
  Like/Unlike requests are idempotent, including concurrent Like requests.
* `post_comments`: UUID, post ID, author ID, nonempty content up to 2000 Unicode
  characters, created timestamp. Only the comment's author may delete it.
* Both tables reference existing users/posts and cascade when the referenced
  user or post is removed. Normal app credentials cannot delete posts/users.
* `posts.legacy_firestore_id` plus author ID deduplicates legacy text imports.
* Database grants restrict writable columns. Per-account visibility and
  ownership checks happen in the API SQL, as in the existing profile/post API;
  these are not PostgreSQL row-level policies. Never distribute runtime DB
  credentials to browser clients.

## API (all endpoints require a Firebase bearer token)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/posts` | Latest 50 own posts; preserves the existing API behavior |
| GET | `/api/posts?scope=feed` | Latest 50 shared posts plus own private posts |
| POST | `/api/posts` | Text/image post; `content`, `visibility`, optional `image` |
| PATCH | `/api/posts/:id/visibility` | Owner chooses `public` or `private` |
| PUT / DELETE | `/api/posts/:id/like` | Like / Unlike a visible post |
| GET | `/api/posts/:id/comments` | Newest 50 comments, optional `before` cursor |
| POST | `/api/posts/:id/comments` | Add `{content}` as the verified account |
| DELETE | `/api/posts/:id/comments/:commentId` | Delete own comment on a visible post |
| POST | `/api/posts/import` | Import up to 50 own legacy text posts per request |

The feed returns author display name/username, counts, `liked` and `is_own`;
other members' email/Firebase UID are not included. Existing image endpoint
uses the **image ID** and permits reads only when the post is visible to the
caller. Hidden/nonexistent posts return 404. Identity fields supplied in a
create/comment payload are rejected. Making a post private keeps existing
interactions in the database but prevents other members reading/mutating them.

## Frontend behavior and old Firestore posts

New composer defaults to **All members**. This means signed-in members, not
anonymous visitors. **Only me** remains available. Existing posts retain their
current visibility. Owners can share or hide a post from its card.

The optional `importLegacyPosts` migration utility reads only the signed-in user's Firestore documents
in pages of 100, imports text posts in batches of 50 and preserves original
timestamps. Originals are neither modified nor deleted. The API forces imports
to private and derives the owner from the bearer token; it treats imported text
as caller-submitted content, not a cryptographically verified archive. Repeating
an import never duplicates or overwrites an existing imported post, even if it
has since been shared. UUID-named image mirrors are skipped because their
original SQL post/image already exists in the same backend database.

Import into the backend database that contains those original SQL image posts.
Importing against an unrelated local database does not copy cloud image bytes
or user profiles. Missing/malformed historical documents cause an explicit
import failure rather than being silently discarded. Successfully completed
batches can safely be retried.

The user removed the import controls and explanatory migration text from the
regular feed. The utility and import API remain available for a coordinated
data migration; they are not invoked automatically.

The **Members** section uses the real authenticated `/api/users` directory
(up to 20 other database profiles). Firebase Auth registration alone does not
create a directory entry until the user completes the backend profile flow.
Both members must use a backend connected to the same database.

While visible, the feed checks for changes every 10 seconds, open comment
panels every 5 seconds and the member list every 30 seconds. Returning to the
tab or recovering connectivity triggers another check. Checks pause in hidden
tabs, do not overlap, abort on cleanup and retry transient failures. Manual
**Refresh** remains available. Updates preserve composer/comment drafts and
open comment panels. Comments support older-page loading. No push subscription, friend
request system, notifications or automatic migration of all users is included.

The new post card no longer includes the integration's Summarise preview
button. Teammate-owned Chatbox, Explore, RightSideBar and profile layouts
remain intact; the teammate's UniAI chat is now integrated as described in
`docs/uniai-setup.md`. In particular, the Sidebar's `User_Name` /
`Group_Name` examples and Chatbox's local message state are teammate scaffolds;
they are not real follows, groups or saved chat conversations. The new Members
section does not implement following or chat. A future chat API must persist
messages, authorize conversation participants and deliver updates to the other
participant; polling the feed does not provide those capabilities.

## Deployment order

Review and coordinate the migration with the backend teammate. For deployment,
apply 006 to the intended Neon database using its migration owner, regenerate
Prisma Client if consumed there, then deploy matching backend and frontend.
No new Firestore rules are needed: only legacy owner reads remain.
This change has not been deployed to Neon, Firebase rules or Render.

Manual acceptance: account A posts for All members, account B refreshes, likes
and comments, then both reload. Verify attribution/counts and delete B's own
comment. Repeat with an Only me post: B must not see it. Existing private posts
must stay private after imports or restarts.
