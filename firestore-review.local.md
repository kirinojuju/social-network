# Firestore rule design notes (local working note)

- Firebase Auth email/password supplies the signed-in UID and email.
- PostgreSQL currently owns one profile and two posts, including one image post; existing API returns at most 50 posts for the verified UID.
- New Firestore paths: `users/{uid}` and `posts/{postId}`. The profile contains UID, email, username, display name, and update time. The post contains owner UID, text, private visibility, server create time, optional legacy display time, and optional PostgreSQL image ID.
- The web app gets an individual profile, queries posts by `authorUid == uid` ordered by `createdAt desc` limited to 50, creates posts, and imports legacy PostgreSQL posts by their existing IDs only if absent.
- Owner-only reads. Create and profile update validate types, field sets, lengths, and UID. Post updates/deletes are denied.
- Images remain in PostgreSQL because this Spark project has no active Firebase Storage bucket/rules and Firebase Storage now requires Blaze. Image IDs in Firestore reference the existing authenticated image endpoint.
- Attack checks: live two-account test confirmed owner reads/queries and denied cross-owner reads and queries, anonymous access, owner spoofing, extra fields, oversized content, timestamp backdating, post updates/deletes, and unfiltered queries. Compilation and deploy passed. Temporary test accounts and documents were removed.
