# UniAI integration

Merged from `origin/feature/beach-ai-summarize-endpoint` at `d7a98fa`.
The teammate's AI chat layout, OpenRouter provider and original commits are
preserved. UniAI is available from the existing left sidebar. Member-to-member
Messages remains a separate feature.

## Configuration

In the ignored `backend/.env`, set `OPENROUTER_API_KEY` to a newly issued key.
Do not paste credentials into chat, commit them, or put them in `VITE_*`.
Restart the backend after changing environment variables. Optionally set
`OPENROUTER_MODEL`; the default is `openrouter/free`.

When publishing, set the same server environment variables on Render.
AI requests use `/api/ai` on the same origin in production and the local
backend in Vite development. `VITE_API_BASE_URL` can explicitly override this.
The server continues serving the built frontend and existing health/profile/
post APIs. A missing AI key does not prevent those services starting.

## Behavior and limits

- Firebase bearer authentication is required for both AI endpoints.
- `POST /api/ai/chat` accepts user/assistant messages and optional post context.
- `POST /api/ai/summarize` accepts `{ "text": "..." }`.
- The browser displays the session's messages but sends only the latest 19
  messages, within the server's 20-message limit.
- Provider calls time out after 30 seconds and do not retry automatically.
- Failed sends preserve the user's draft for retry. Provider details and keys
  are not returned to clients; AI responses have `private, no-store` caching.
- Chat history exists only in the popup session, not PostgreSQL or Firestore.
  Closing the popup or reloading clears it. No AI migration is needed.
- Messages/context are sent to OpenRouter and its selected model provider
  when making real requests.

## Verification

Backend API tests use injected responses and do not contact OpenRouter.
Frontend tests cover origin selection, fresh Firebase tokens, conversation
limits and safe error handling. The static-site test covers AI and the built
frontend together. Run `npm.cmd test` from each package and
`npm.cmd run build` from frontend.

Real model responses still need an independently configured new key.
No Render deployment or production environment change is performed by this
integration. Apply the separate post-interaction SQL migration 006 before
deploying the combined branch if it is not already applied in that database.
