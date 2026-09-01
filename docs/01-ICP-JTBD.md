# ICP and JTBD

## Ideal customer

A technical founder or engineering lead whose AI product uses OpenAI, Anthropic, Gemini, or OpenRouter APIs, who can change request headers and the provider endpoint, and who needs customer-level usage totals for billing.

## Required qualification

1. Operates an AI product with external customers.
2. Pays the model provider directly.
3. Can attach a stable customer ID to model requests.
4. Charges for usage or is deciding how to do so.
5. Will test non-production traffic through a metadata-only proxy.

## Disqualifiers

Subscription-only AI-tool users, internal tools with no external customer billing, unsupported provider/endpoint requirements, or teams that already have satisfactory customer metering and billing infrastructure.

## JTBD

> When customers use my AI product, tell me what to invoice each customer from their actual model usage.

## Pain moment

Month-end arrives with one provider bill and no reliable customer-level record connecting usage, raw cost, price and margin.

## First value

Two customer IDs appear as separate invoice rows with different billed amounts under one transparent rule.

## Riskiest assumption

Early AI-product teams need this narrow bridge enough to route non-production calls through Tollgate instead of writing customer attribution and aggregation themselves.
