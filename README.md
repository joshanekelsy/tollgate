# Tollgate

Tollgate meters supported AI usage per customer and turns a completed month into fixed billing records, CSV exports, or Stripe draft invoices without storing prompts or responses.

Every proxied request needs a project write key and a unique retry ID:

```text
X-Tollgate-Key: tgw_live_...
X-Tollgate-Idempotency-Key: req_01J...
X-Tollgate-Customer: customer-acme
```

The write key protects meter ingestion. The retry ID prevents the same request from being recorded or sent to the provider twice. Separate test and live keys keep test data out of production billing.

## Current boundary

- OpenAI and OpenRouter: non-streaming Chat Completions.
- Anthropic: non-streaming Messages.
- Gemini: non-streaming GenerateContent.
- Safe model IDs can pass through only within those request formats. Streaming, OpenAI Responses, embeddings, image, audio, realtime, batch, and other provider workflows are not supported.
- OpenRouter-reported cost, verified OpenAI estimates, and exact provider/model rate cards can price usage. Unknown cost stays unavailable.
- Pricing supports a project default or customer override, percentage markup or USD per 1,000 tokens, plus optional base charges and included tokens.
- Completed UTC months can be closed into fixed billing runs and exported as CSV.
- A US Stripe account can receive draft invoices for customers with Stripe customer IDs. Tollgate does not finalize, send, or collect those invoices.
- Subscriptions, tax, proration, credits, refunds, and failed-payment recovery are not included.
- Provider keys, authorization headers, prompts, responses, and tool arguments pass through memory for the request and are not persisted.
- Provider invoices remain authoritative for raw model cost.

## Product surfaces

- `/` - product page and private-meter creation.
- `/how-it-works` - request, privacy, billing, and product limits.
- `/demo` - read-only sample of all six dashboard views.
- `/docs` - integration quickstart and supported workflows.
- `/api-reference` - proxy routes, required headers, and error responses.
- `/security` - stored data, request handling, access limits, and security practices.
- `/changelog` - dated product changes.
- `/status` - live application and Convex health check.
- `/contact` - private-beta contact form.
- `/p/{projectId}/dashboard?view=overview` - usage and billing readiness.
- `/p/{projectId}/dashboard?view=events` - accepted, duplicate, failed, unattributed, and unpriced events.
- `/p/{projectId}/dashboard?view=customers` - customer records, billing details, and Stripe mapping.
- `/p/{projectId}/dashboard?view=pricing` - default and customer pricing plus model rate cards.
- `/p/{projectId}/dashboard?view=billing-runs` - month close, fixed runs, CSV, and Stripe drafts.
- `/p/{projectId}/dashboard?view=setup` - test/live write keys, code examples, provider endpoints, and Stripe connection.
- `/p/{projectId}/v1/chat/completions` - legacy OpenAI-compatible endpoint.
- `/p/{projectId}/providers/openai/v1/chat/completions` - OpenAI adapter.
- `/p/{projectId}/providers/openrouter/api/v1/chat/completions` - OpenRouter adapter.
- `/p/{projectId}/providers/anthropic/v1/messages` - Anthropic adapter.
- `/p/{projectId}/providers/gemini/v1beta/models/{model}:generateContent` - Gemini adapter.

## Environment

```bash
cp .env.example .env.local
npm install
npx convex dev
npm run dev
```

`DASHBOARD_SESSION_SECRET` signs the private browser session. `STRIPE_KEY_ENCRYPTION_SECRET` encrypts each project's Stripe restricted key and webhook secret before storage. Vercel Web Analytics works without an application key. Amplitude uses `NEXT_PUBLIC_AMPLITUDE_API_KEY`. Sentry uses the public/server DSNs plus its organization, project, and build token values. Both integrations stay inactive when those values are absent.

## Verification

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
npm run test:e2e
```

The browser acceptance test covers meter creation, recovery, test/live isolation, authenticated ingestion, retry protection, customer and pricing setup, event inspection, completed-month close, CSV export, public pages, responsive layouts, and expected failure states.
