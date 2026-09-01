# Positioning and niches

## Position

**Tollgate meters supported AI usage per customer and turns a completed month into fixed billing records, CSV, or Stripe draft invoices without storing prompts.**

Category: AI usage metering for early usage-billed products.

It is not a general billing platform, an AI gateway for every workflow, or a Stripe replacement.

## Launch niche

Technical founders of US-focused AI SaaS products with their first 0-10 paying customers who:

1. Pay OpenAI, Anthropic, Gemini, or OpenRouter directly.
2. Can add a customer ID and retry ID to model requests.
3. Use one of Tollgate's supported non-streaming text-generation endpoints.
4. Need customer-level usage totals before sending monthly charges.
5. Find enterprise metering platforms too broad for their current stage.

Core pain: the provider invoice shows total model spend, but not what each customer should be charged.

First proof: two customer IDs appear as separate usage rows, a price rule produces fixed charges, and the completed month exports to CSV or Stripe drafts.

## Later niches

**AI workflow SaaS:** multi-tenant products running document, research, support, or content workflows where model spend varies by customer.

**White-label AI providers and agencies:** teams operating the same AI service for several clients and needing defensible monthly chargebacks.

These are later niches because they often need more varied endpoints, service fees, or contract-specific pricing.

## Do not target yet

- Consumer AI apps without customer-level billing.
- Products built mainly on streaming, realtime, image, audio, embedding, or batch APIs.
- Companies needing tax, credits, refunds, subscriptions, payment collection, or revenue recognition.
- Enterprises requiring SSO, role-based access, audit logs, or compliance evidence today.
- Teams unwilling to send provider traffic through a proxy.

## Message hierarchy

1. **Know what to bill each customer.**
2. Attribute supported AI calls to stable customer IDs.
3. Keep test and live usage separate and prevent duplicate billing.
4. Set pricing, close a fixed month, then export to CSV or Stripe drafts.
5. Prompts, responses, and provider credentials are not persisted.
