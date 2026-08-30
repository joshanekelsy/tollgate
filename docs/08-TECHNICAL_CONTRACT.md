# M1 Technical Contract

This document resolves the four request-path questions that blocked implementation.

## 1. Who pays for the provider call?

The tester does. Their non-production client sends their normal OpenAI API key in the standard `Authorization: Bearer ...` header.

## 2. Where may the provider key exist?

It may exist only:

- In the tester's local client configuration.
- In encrypted network transit to Tollgate.
- In the server process memory while the current request is validated and forwarded.
- In encrypted network transit from Tollgate to OpenAI.

It is forbidden from Convex, Vercel/application logs, analytics, error bodies, browser output, test snapshots, fixtures, and source control.

The same no-persistence rule applies to request messages and provider response content.

## 3. How is a call assigned to one project?

The builder manually provisions a project with:

- A cryptographically random `projectId` used in `/p/{projectId}/v1`.
- A separately generated dashboard access code.
- A server-assigned traffic type: `internal`, `demo`, or `external`.
- Provider `openai` and active status.

The client sets:

```text
OPENAI_BASE_URL=https://<host>/p/<projectId>/v1
OPENAI_API_KEY=<the tester's own OpenAI key>
```

The OpenAI-compatible client appends `/chat/completions`. The project route is a write capability: anyone who possesses it and their own valid OpenAI key could add calls to that project's ledger. This limitation must be disclosed for M1 non-production testing.

## 4. Who can read project metadata?

The dashboard lives at `/p/{projectId}/dashboard` but returns no data until the separate dashboard access code is verified server-side.

- Store only a slow salted hash of the dashboard code.
- Never put the plain dashboard code in a URL.
- After verification, issue a short-lived, secure, HTTP-only, same-site cookie scoped to the project dashboard.
- Dashboard data queries go through a server route that validates the cookie and filters by the exact project ID.
- The browser must not call an unrestricted Convex query.
- A cross-project cookie or project ID returns `403` and no metadata.
- Polling every two seconds counts as live for M1; realtime browser access to Convex is not required.

## Request behavior

For `POST /p/{projectId}/v1/chat/completions`:

1. Confirm the project exists, is active, and allows OpenAI.
2. Require a bearer authorization header without logging its value.
3. Parse JSON without logging the body.
4. Reject streaming and unsupported models before forwarding.
5. Forward the original authorization header and supported JSON to `https://api.openai.com/v1/chat/completions`.
6. Read the response in memory, extract safe usage metadata, and return the response with its meaning unchanged.
7. Persist only the approved call fields under the resolved project.
8. If accurate pricing cannot be calculated, persist `costStatus: unavailable` rather than zero.

## Cost boundary

M1 supports only explicitly listed models and standard text-token pricing below the documented long-context threshold. If cached-token details or exceptional charges cannot be priced correctly, the dashboard shows `Unavailable` and explains why.

## First compatible client

The decisive test uses the official OpenAI SDK or another named client proven to support:

- A custom base URL.
- Non-streaming Chat Completions.
- The standard authorization header.

Do not claim Cursor, Claude Code, Codex, or every coding agent works until that exact client passes a real end-to-end test.

## Security acceptance tests

- Unknown project: no OpenAI request and no call row.
- Missing authorization: no OpenAI request and no call row.
- Provider error: safe status metadata only; no response body persisted.
- Secret scan: no real or fixture-shaped key in tracked files or logs.
- Dashboard without code: no project data.
- Wrong dashboard code: no project data.
- Project A session requesting Project B: `403` and no project data.
- Successful call: usage row belongs only to the route's server-resolved project.

## Known M1 limitations

- Tollgate sees key and content transiently because it is the proxy; “never sees your data” is a forbidden claim.
- The project route can be used to write metadata by someone who possesses it and their own provider key.
- Manual project provisioning does not scale.
- Polling is used instead of a fully realtime authenticated data connection.
- Non-production direct OpenAI Chat Completions only.

