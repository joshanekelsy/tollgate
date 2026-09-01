# Product Specification

## Product

Tollgate meters supported AI calls by customer and calculates invoice-ready monthly totals.

## Primary user

A technical founder or engineering lead who owns an OpenAI, Anthropic, Gemini, or OpenRouter integration, can change its endpoint and headers, and needs to charge customers for AI usage.

## Core flow

1. Create and open a private meter.
2. Point a supported client at the Tollgate project URL.
3. Send `X-Tollgate-Customer` with each call.
4. Tollgate stores customer ID and safe usage metadata; a missing header becomes `unattributed`.
5. Set one percentage-markup or per-1,000-token price rule.
6. Open `/invoices` and review current-month usage, raw cost, billed amount and margin per customer.

## Included

- Project-isolated adapters for non-streaming OpenAI/OpenRouter Chat Completions, Anthropic Messages, and Gemini GenerateContent.
- Customer attribution and customer index.
- Calls, tokens, raw model-cost estimates and latency.
- One project-level price rule.
- Current UTC-month invoice view sorted by billed amount.
- Existing task attribution, model comparison and approved task routing.
- Private metadata persistence; no key, prompt or response storage.

## Excluded

Payments, Stripe, invoice issuing, subscriptions, multi-user auth, customer-specific plans, tiers, discounts, credits, taxes, proration and exports.

## Acceptance

Two proxy calls with different `X-Tollgate-Customer` values produce two current-month invoice rows with different billed amounts under the saved rule.
