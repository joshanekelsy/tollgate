# User Stories

Priority meanings: P0 must ship for the product to count; P1 supports acquisition or trust; P2 is parked unless all P0 and P1 acceptance tests pass.

## P0 — complete metering flow

### US-01 — send a protected call

As a technical operator, I want to point a non-production OpenAI-compatible client at Tollgate so that I can meter a real request.

Acceptance:

- The README provides the project-specific Tollgate base URL and explains that the client continues using the tester's own OpenAI key.
- A valid supported non-streaming request reaches direct OpenAI.
- The client receives the provider's status and response without changed meaning.
- An unknown project or missing provider authorization never reaches the provider.

### US-02 — see a call arrive

As an API-bill owner, I want a completed call to appear live so that I know Tollgate is observing current spend.

Acceptance:

- `/p/{projectId}/dashboard` adds the call within seconds without refresh after dashboard-code verification.
- The row shows time, provider, model, input tokens, output tokens, latency, status, and estimated cost.
- The zero-call state says `Waiting for your first request`.

### US-03 — understand the cheaper-model number

As an API-bill owner, I want the same token counts priced against a cheaper model so that I can see where investigation may matter.

Acceptance:

- The dashboard labels it `Same-token estimate—not tested savings`.
- Nearby copy says quality, retries, caching differences, and actual savings were not tested.
- Unknown prices display `Unavailable`, never `$0`.

### US-04 — keep content private

As a technical operator, I want Tollgate to avoid storing prompts and responses so that a cost test does not create an unnecessary content record.

Acceptance:

- The call schema has no prompt or response fields.
- Stored calls and application logs contain no request content, response content, authorization headers, or keys.
- The dashboard and README state the boundary plainly.
- The provider key is held only in request memory while being forwarded.

## P1 — acquisition and comprehension

### US-05 — understand Tollgate quickly

As an API-bill owner arriving from GrowthX, LinkedIn, or a direct message, I want to understand the product and limitation quickly so that I can decide whether to test it.

Acceptance:

- The first screen states the outcome, target user, and test CTA.
- The page does not claim automatic routing or proven savings.
- OpenRouter is not presented as a requirement.

### US-06 — apply for a test

As a qualified visitor, I want to request test access so that I can try one non-production call.

Acceptance:

- Name, valid email, and current provider are required.
- Current pain is optional.
- Successful submission is stored once and shows confirmation.
- The form never requests an API key.

### US-07 — distinguish real traction

As the builder, I want calls marked as internal, demo, or external so that Saturday numbers remain honest.

Acceptance:

- Each call has one traffic type.
- The project assigns traffic type server-side; the caller cannot choose it.
- External numbers exclude demo and builder calls.
- The dashboard visibly shows the active traffic label.

### US-08 — isolate project data

As an API-bill owner, I want my project dashboard protected separately from the proxy route so that another tester cannot read my usage metadata.

Acceptance:

- A dashboard access code is stored only as a secure hash.
- Missing or wrong dashboard access returns no project data.
- A valid code returns only its matching project's records.

## P2 — only after the core works

### US-09 — run through OpenRouter

As a tester using OpenRouter, I want the same public Tollgate model names to work through an OpenRouter adapter.

Acceptance:

- Canonical names map internally to OpenRouter model IDs.
- Pricing remains provider-specific.
- The direct OpenAI flow continues to pass unchanged.

## Explicitly rejected stories for M1

- As a manager, I want project chargeback.
- As a user, I want Tollgate to pick the cheapest model.
- As a team, I want accounts and roles.
- As a developer, I want streaming or native Anthropic/Gemini support.
