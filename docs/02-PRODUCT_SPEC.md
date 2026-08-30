# Product Specification

## Product

Tollgate is an early-warning cost meter for AI-agent API calls.

## Release outcome

A qualified API-bill owner can discover Tollgate, request test access, configure one non-production OpenAI-compatible client, send a direct-OpenAI call, and see its estimated cost appear within seconds without the builder operating the setup.

## Users

### API-bill owner

A founder or engineering lead responsible for direct model-provider spend. They decide whether installing Tollgate is worth the trust and setup cost.

### Technical operator

The person who can change an agent or application's API base URL and key. In M1 this may be the same person as the bill owner.

### Builder-admin

The Tollgate builder who qualifies testers and manually provisions a random project ID plus a separate dashboard access code. There is no admin product in M1.

## Surfaces

### `/` — public landing page

- Explain the problem, promise, mechanism, security boundary, and estimate limitation.
- Show one primary CTA: `Apply to test Tollgate`.
- Collect name, work email, direct provider, and one optional sentence about current spend pain.
- Confirm submission without promising access.
- Never request or expose a provider key on the landing page.

### `/p/{projectId}/dashboard` — private M1 meter

- Show configured provider and a clear `Internal test` or `External test` data label.
- Show estimated spend today and this week.
- Show the latest 50 calls with time, provider, model, token counts, estimated cost, latency, and status.
- Show the same-token estimate and its limitation beside the number.
- Update live when a new call is recorded.
- Ask for the dashboard access code before returning project metadata.
- Show a setup block with that project's Tollgate base URL and explain that the client's API key remains the tester's provider key.

### `POST /p/{projectId}/v1/chat/completions` — proxy

- Accept non-streaming OpenAI Chat Completions JSON for allowed models.
- Use the random project ID in the route to assign the call; treat it as write access, not dashboard access.
- Forward the tester's provider key from the standard `Authorization` header to direct OpenAI.
- Hold the authorization value only for the lifetime of the request and never store or log it.
- Return the upstream status and response without changing their meaning.
- Normalize usage into the call ledger.
- Reject unknown projects, unsupported models, streaming, malformed JSON, and missing authorization before provider spend occurs.

## Core flow

1. Visitor lands on `/` from a direct invitation or community post.
2. Visitor submits the tester form.
3. Builder confirms the person owns or influences a direct API bill and provisions a project.
4. Builder sends the project base URL and separate dashboard access code privately.
5. Tester changes a non-production client's base URL but continues using their own provider API key.
6. Tester sends one supported request.
7. Tollgate validates, forwards, meters, and records the call.
8. The project dashboard updates within seconds after its access code is accepted.
9. Tester states whether the number is trusted and what decision it would change.

## Data records

### `calls`

| Field | Meaning |
|---|---|
| `createdAt` | Call time in milliseconds. |
| `provider` | Selected provider label. |
| `providerRequestId` | Upstream request identifier when available. |
| `requestedModel` | Canonical model requested by the client. |
| `reportedModel` | Model reported by the provider. |
| `promptTokens` | Input tokens reported by the provider. |
| `completionTokens` | Output tokens reported by the provider. |
| `estimatedCostUsd` | Tollgate estimate using the pinned provider table. |
| `sameTokenEstimateUsd` | Original token counts priced against the comparison model. |
| `latencyMs` | Round-trip provider time measured by Tollgate. |
| `status` | `ok` or `error`. |
| `errorCode` | Safe normalized code when a call fails. |
| `trafficType` | `internal`, `demo`, or `external`. |

### `testApplications`

| Field | Meaning |
|---|---|
| `createdAt` | Submission time in milliseconds. |
| `name` | Applicant name. |
| `email` | Applicant work email. |
| `provider` | Direct provider they currently pay. |
| `pain` | Optional short description. |
| `source` | `growthx`, `linkedin`, `direct`, or `other`. |

### `projects`

| Field | Meaning |
|---|---|
| `projectId` | Random, unguessable identifier used in the proxy and dashboard route. |
| `name` | Human-readable tester or project label. |
| `dashboardCodeHash` | Secure hash of the dashboard access code; the plain code is never stored. |
| `trafficType` | Server-assigned `internal`, `demo`, or `external`. |
| `provider` | Provider allowed for this project. M1 is `openai`. |
| `createdAt` | Provisioning time in milliseconds. |
| `active` | Whether new proxy calls are accepted. |

## Pricing behavior

- Calculate estimates only when provider, model, and usage are known.
- Show `Unavailable` when cost cannot be calculated.
- Never show an unknown price as zero.
- Store a source URL and checked date with each provider price table.
- Label the comparison: `Same-token estimate—not tested savings`.

## Required states

- Landing form: idle, invalid, submitting, success, and safe error.
- Dashboard: zero calls, loading, live data, provider error, and unknown price.
- Proxy: unauthorized, malformed request, unsupported model, streaming rejected, upstream error, missing usage, and success.

## Security and privacy

- Provider keys arrive in the authorization header, exist only in request memory, and are forwarded to the selected provider.
- Prompts, responses, authorization headers, and keys are never written to Convex or logs.
- Public pages never render a real secret.
- Dashboard codes are stored only as secure hashes and are separate from project route IDs.
- Project data is returned only after server-side dashboard-code verification.
- Form collects only the fields needed to qualify a tester.
- README states that M1 is for non-production testing.

## M1 release acceptance

All must pass:

1. Landing form creates one real application and shows confirmation.
2. Unknown project or missing provider authorization causes no provider call and no spend row.
3. One call paid by the tester's direct OpenAI key returns successfully.
4. The dashboard receives that row live with non-zero usage and estimated cost.
5. Stored records and logs contain no prompt, response, or secret.
6. One external tester completes the flow without the builder touching their configuration.
7. One project cannot read another project's dashboard data.

## Non-goals

Routing, budgets, alerts, teams, accounts, billing, checkout, chargeback, streaming, production workloads, native Anthropic or Gemini request formats, hosted Meta adapters, automated price updates, and quality equivalence claims.
