# Technical Contract

## Proxy

- Endpoints: non-streaming OpenAI and OpenRouter Chat Completions, Anthropic Messages, and Gemini GenerateContent under `POST /p/{projectId}/providers/{provider}/...`. The legacy OpenAI endpoint remains available.
- OpenAI and OpenRouter provider keys arrive in `Authorization`; Anthropic uses `x-api-key`; Gemini uses `x-goog-api-key`. Provider credentials are never persisted.
- Every request requires a matching test or live `X-Tollgate-Key` and a stable `X-Tollgate-Idempotency-Key` for safe retries.
- Customer ID arrives in `X-Tollgate-Customer`; absent or blank becomes `unattributed`.
- Requests are forwarded only to the selected adapter's fixed provider origin and endpoint. Upstream response status and body return to the caller.

## Retry contract

Tollgate reserves the project, environment, and retry-ID combination before calling the provider. A repeated identical request returns a conflict without another provider call. Reusing the same retry ID for different request content also returns a conflict. Plain write keys are shown once, stored only as hashes, and can be rotated per environment.

## Stored call metadata

Project, environment, customer ID, retry ID, time, provider, requested/reported model, tokens, reported/estimated/rate-card raw cost when available, cost and pricing status, latency, response status, strict trace IDs, safe tool names, and optional quality vote.

## Forbidden persistence

Provider keys, authorization headers, prompts, messages, responses, tool arguments, and payloads.

## Pricing

A project may have one default rule and one override for each customer:

- `percentage`: `billable model cost x (1 + percentage / 100) + base charge`
- `per_thousand_tokens`: `tokens above the included allowance / 1000 x fixed price + base charge`

An exact provider/model rate card can calculate raw cost when the provider does not report it. Percentage billing is blocked when neither reported cost, a verified estimate, nor a matching rate card exists. Margin is billed amount minus available raw model cost.

## Provider boundary

- Safe model IDs can pass through only inside the four supported request formats. The rate table is not a model allowlist.
- OpenRouter response cost is stored as provider-reported cost.
- Models in Tollgate's verified OpenAI table receive an estimate when standard pricing applies.
- A matching exact rate card can price other provider/model usage.
- Other monetary cost remains `unavailable`; Tollgate never invents zero.
- Streaming, OpenAI Responses, arbitrary upstream URLs, and endpoints outside the four fixed adapter paths are rejected.

## Billing runs

Only a completed UTC calendar month can close. Tollgate checks active customer records, billing email, pricing, attribution, and raw-cost availability. A successful close stores fixed customer amounts, applied rules, and source-call IDs. Repeating a close for the same project, environment, and month returns the existing run. Runs can be downloaded as CSV.

## Stripe

A project can store one encrypted Stripe restricted key and webhook secret. V1 accepts US Stripe accounts. Customers map to existing Stripe customer IDs. Export creates draft invoices and invoice items with stable Stripe retry keys; Tollgate does not finalize, send, or collect them.

## Dashboard access

Protected routes use a signed, HTTP-only, project-scoped browser session lasting up to 12 hours. Recovery-code access is the private-beta boundary. Team accounts, roles, passkeys, OAuth, and single sign-on are not included yet.
