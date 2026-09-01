# Architecture

```text
AI product
  `- POST /p/{projectId}/providers/{provider}/{fixed-path}
       |- provider key header, used only for this request
       |- X-Tollgate-Key: test or live project write key
       |- X-Tollgate-Idempotency-Key: unique retry ID
       |- X-Tollgate-Customer: external customer ID
       |- request -> provider adapter -> fixed provider origin -> response
       `- safe usage metadata -> event receipt -> metered call

Protected product
  |- Overview -> usage, billed amount, and close readiness
  |- Events -> accepted, duplicate, failed, unattributed, unpriced
  |- Customers -> billing identity and Stripe customer mapping
  |- Pricing -> default/customer rules and exact model rate cards
  |- Billing runs -> fixed month close -> CSV or Stripe drafts
  `- Setup -> key rotation, request examples, and Stripe connection
```

## Frontend

Next.js renders the landing page, technical contract, read-only demo, recovery screen, and protected six-view dashboard.

## Backend

Next.js route handlers create projects and keys, sign browser sessions, validate proxy requests, call provider adapters, manage customer and pricing records, close billing runs, export CSV, and call Stripe. The Stripe webhook verifies the signature against the raw request body.

## Database

Convex stores projects, hashed write keys, event receipts, safe calls, customer records, pricing rules, model rate cards, fixed billing runs, encrypted Stripe connection records, and processed Stripe webhook IDs.

## Security and correctness boundaries

- Test and live write keys are separate and rotatable. Plain write keys are shown once and never stored.
- An idempotency key reserves each request before provider spend, so safe retries cannot create a second charge.
- Provider keys, authorization headers, prompts, responses, and tool arguments are not stored.
- Billing runs copy the price, customer amount, and source-call IDs so later edits do not change a closed month.
- Stripe credentials are encrypted with AES-256-GCM before storage. Only US Stripe accounts are accepted in V1.

## Product boundaries

Only non-streaming OpenAI/OpenRouter Chat Completions, Anthropic Messages, and Gemini GenerateContent are connected. Other endpoints and providers are not. Stripe support stops at draft invoice creation; Tollgate does not send invoices, collect payment, calculate taxes, manage subscriptions, prorate charges, issue credits, or recover failed payments.
