# Alpha 0.1 test candidate

Updated on 2026-10-14 on `codex/alpha-0-1`, including `develop` at
`30758f9` and `main` at `aa74943` (merged PR #44). This retains Sally's
chat/search/profile work and its commit history. Prisma files remain in place.

## Included

- Firebase sign-in and PostgreSQL member profiles/directory.
- Search for members and visible posts; open a member's profile.
- Community posts with All members / Only me visibility, up to ten ordered
  photos, a photo viewer, likes, comments and per-account saved posts.
- Profile/avatar/cover images, profile posts/media and mutual-follow Connections.
- Notifications derived from other members' likes, comments and follows.
  The seen timestamp is stored per account in the current browser.
- Incoming unread messages appear in Notifications and the Messages badge.
  Notifications group messages by sender without exposing message bodies. Clicking
  one opens that sender's chat. Reading the chat clears its notification on the
  next refresh; simply viewing Notifications does not mark messages read.
- Authors can delete their own posts, including dependent photos/likes/comments/saves.
- Follow/unfollow and a Chats panel with conversations, unread counts and suggestions.
- Private one-to-one text/photo messages saved in PostgreSQL, with read receipts.
- Automatic refresh: open chat every 4 seconds; Chats panel every 10 seconds.
  Incoming message notifications refresh every 5 seconds while the page is visible.
  Checks pause while the page is hidden. This release uses polling.
  These are in-app notifications, not operating-system push notifications.

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

1. Have the database owner apply migrations `001` through `013` in order using
   `npm run migrate` in `backend`. The runner uses `MIGRATION_DATABASE_URL` and
   checks existing migration checksums. Do not reset the shared database or
   use `prisma migrate reset` / `db push` to replace the existing schema.
2. Start the backend in `backend` with `npm run dev`. On this Windows machine,
   Firebase certificate verification needs `node --use-system-ca --watch server.js`.
3. Start Vite in `frontend` with `npm run dev`; open its printed URL.
4. Verify `/api/ready` on the backend before testing. Readiness checks database
   connectivity; it does not prove that all feature migrations are present.

Neon already had all thirteen matching migrations when checked on 2026-10-14.
The project owner's local database was previously advanced from nine to twelve. Each
teammate using a separate local database must migrate that database too.

## Verification recorded for this candidate

- Backend: 52/52 tests passed.
- Frontend: 28/28 tests passed; source lint and production build passed.
- `npm run test:post-interactions`: passed against a disposable local
  PostgreSQL database using the real limited role and HTTP APIs. Tests cover
  all thirteen migrations, public/private posts, likes/comments, member profiles,
  search visibility, follows, two-way chat/photos, read receipts, third-account
  isolation, foreign pagination cursors and persistence after API restart.
  New coverage verifies ordered post photos and image access, saved-post
  isolation and visibility changes, mutual follows, notification ownership and
  avatar/cover upload/read/delete through the limited runtime role.
  New message checks verify recipient-only grouped unread notifications, third-account
  isolation and removal after reading. Author-only post deletion is checked through
  the real API, including photo, comment, like and saved-post cascade cleanup.
  Firebase verification is stubbed only inside that isolated test app.
- Browser: an existing signed-in account could load Home, search for a real
  local member, open their profile and open the chat composer/Chats panel.
  On 2026-10-12, Home and the new post composer, Saved, Notifications,
  profile Media and the photo viewer were also checked with that account.

## Final team acceptance before calling the release complete

Use two real Firebase accounts, in separate browsers/devices, connected to the
same PostgreSQL database:

1. A creates an All members post; B sees it, likes and comments. A sees the updates.
2. A creates an Only me post; B cannot see it.
3. A searches for B and sends text and a photo. B opens Chats and replies.
4. Reload both browsers: messages and interactions remain. Unread counts clear
   when the recipient opens the conversation.
5. A third account cannot load the private conversation or its photo.

6. A uploads multiple photos and a cover; B can view public media in order.
   Saved posts stay per account and disappear from B's list when A makes a post private.
7. A and B follow each other: Connections shows the relationship. Like/comment/follow
   notifications appear only for the recipient and exclude their own actions.
8. A sends B text and a photo while B's chat is closed. B sees a Messages badge and
   one grouped notification within about five seconds. Opening Notifications alone
   leaves messages unread; clicking A's notification opens their chat. After reading,
   the badge/notification clears. A third account sees neither notification nor chat.
9. B cannot delete A's post. A deletes a disposable test post; its photos and
   interactions no longer appear after reloading either account.

The two-real-account browser check remains pending. Hosted deployment evidence is
tracked in PR #42; earlier `2a075db` was verified live with UniAI and post summaries.
Automated tests are not evidence of two-account browser acceptance. The build
reports an existing large JavaScript chunk warning; dependency advisories remain
outside this feature change.

Settings was removed by the teammate's update. Group recommendations are outside
Alpha acceptance. Notifications, Saved and profile Friends/Photos now use the APIs.

