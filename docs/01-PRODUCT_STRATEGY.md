# Product Strategy

## Problem

AI-product companies receive provider usage by model and token, but their commercial question is customer-level: which customer created the usage, what should that usage cost them, and what margin remains?

## JTBD

> When customers use my AI product, turn their supported model usage into a fixed monthly charge I can send to Stripe.

## Product promise

Meter supported AI usage per customer and push verified monthly charges to Stripe without storing prompts.

## Beachhead

Technical founders and engineering leads operating an AI product on OpenAI, Anthropic, Gemini, or OpenRouter APIs who need usage-based customer billing but do not yet need a full billing platform.

## Wedge

1. Attribute usage at the request boundary.
2. Meter provider-reported tokens and raw cost when reported or safely estimated.
3. Apply a transparent default or customer price and exact model cost when needed.
4. Close a completed month into fixed customer statements.
5. Export CSV or create Stripe draft invoices.

## Differentiation

Provider dashboards answer what the company spent. Full billing platforms handle contracts, taxes, subscriptions, and collections. Tollgate is the narrow bridge between them: supported AI usage becomes customer-level Stripe drafts with a reviewable monthly close.

## Evidence status

- Built and verified internally: write-key protection, retry safety, customer attribution, isolated test/live environments, default/customer pricing, exact model rate cards, fixed billing runs, CSV, and Stripe draft creation logic.
- Not verified externally: a company has not yet used Tollgate totals to issue a real customer invoice or paid for the product.

## Kill condition

Reposition if three qualified AI-product operators do not recognize customer attribution or invoice calculation as a current manual problem.
