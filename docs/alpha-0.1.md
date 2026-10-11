# Alpha 0.1 test candidate

Prepared on 2026-10-11 on `codex/alpha-0-1`, based on `develop` at
`a3adc6a`. This retains Sally's `413f5a0` chat/search/profile work and its
commit history. Prisma files remain in place.

## Included

- Firebase sign-in and PostgreSQL member profiles/directory.
- Search for members and visible posts; open a member's profile.
- Community posts with All members / Only me visibility, images, likes and comments.
- Follow/unfollow and a Chats panel with conversations, unread counts and suggestions.
- Private one-to-one text/photo messages saved in PostgreSQL, with read receipts.
- Automatic refresh: open chat every 4 seconds; Chats panel every 10 seconds.
  Checks pause while the page is hidden. This release uses polling.

This integration also prevents a pagination cursor from another conversation
being used in the current chat. Search and Chats now show request failures and
offer a retry instead of reporting an empty list.

## Run the candidate

Keep existing ignored `.env` files. Install dependencies in both `backend` and
`frontend` with `npm ci` (Windows PowerShell: `npm.cmd ci`).

The active Express APIs use `backend/config/db.js`: **PG*** variables take
precedence over DB_* variables. `DATABASE_URL` / `DIRECT_URL` configure the
Prisma tools; they do not switch these APIs to Neon.

For shared team testing, all backends must use the **same Neon database** and
Firebase project. Separate local PostgreSQL databases naturally contain
different members, posts and conversations. Use the limited `social_app` role
for the running backend; retain owner credentials only for migrations.

1. Have the database owner apply migrations `001` through `009` in order using
   `npm run migrate` in `backend`. The runner uses `MIGRATION_DATABASE_URL` and
   checks existing migration checksums. Do not reset the shared database or
   use `prisma migrate reset` / `db push` to replace the existing schema.
2. Start the backend in `backend` with `npm run dev`. On this Windows machine,
   Firebase certificate verification needs `node --use-system-ca --watch server.js`.
3. Start Vite in `frontend` with `npm run dev`; open its printed URL.
4. Verify `/api/ready` on the backend before testing. Readiness checks database
   connectivity; it does not prove that all feature migrations are present.

Neon already had all nine matching migrations when checked on 2026-10-11.
The project owner's local database was also advanced from six to nine. Each
teammate using a separate local database must migrate that database too.

## Verification recorded for this candidate

- Backend: 44/44 tests passed.
- Frontend: 21/21 tests passed; source lint and production build passed.
- `npm run test:post-interactions`: passed against a disposable local
  PostgreSQL database using the real limited role and HTTP APIs. Tests cover
  all nine migrations, public/private posts, likes/comments, member profiles,
  search visibility, follows, two-way chat/photos, read receipts, third-account
  isolation, foreign pagination cursors and persistence after API restart.
  Firebase verification is stubbed only inside that isolated test app.
- Browser: an existing signed-in account could load Home, search for a real
  local member, open their profile and open the chat composer/Chats panel.

## Final team acceptance before calling the release complete

Use two real Firebase accounts, in separate browsers/devices, connected to the
same PostgreSQL database:

1. A creates an All members post; B sees it, likes and comments. A sees the updates.
2. A creates an Only me post; B cannot see it.
3. A searches for B and sends text and a photo. B opens Chats and replies.
4. Reload both browsers: messages and interactions remain. Unread counts clear
   when the recipient opens the conversation.
5. A third account cannot load the private conversation or its photo.

The two-real-account browser check and a deployment of this exact candidate to
Render are still pending. Existing automated tests are not evidence of those
live checks. The build reports an existing large JavaScript chunk warning.

Notifications, Saved/Settings and group recommendations are not Alpha acceptance
items. The profile Friends/Photos sections remain the teammate's layout previews.

