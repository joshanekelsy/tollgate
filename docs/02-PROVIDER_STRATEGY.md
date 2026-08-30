# Provider Strategy

## Principle

Tollgate owns one internal call record. Each provider adapter forwards the user's provider authorization without persisting it, then translates model name, response, and usage into that record. The dashboard never depends on an OpenRouter-specific field.

## Provider sequence

| Order | Provider | Build Week status | Reason |
|---|---|---|---|
| 1 | Direct OpenAI | Required | Uses the OpenAI Chat Completions contract behind Tollgate's project-specific route and proves Tollgate is not an OpenRouter wrapper. |
| 2 | OpenRouter | Stretch after OpenAI passes | Broad model access through a compatible request shape. |
| 3 | Anthropic direct | Parking lot | Native Messages request and response need a separate adapter. |
| 4 | Gemini direct | Parking lot | Native GenerateContent request and usage fields need a separate adapter. |
| 5 | Hosted Meta models | Parking lot | Meta models are served through hosts such as cloud or inference providers; the host defines the API and bill. |

## Internal record

Every adapter must produce:

- `provider`
- `providerRequestId`, when returned
- `requestedModel`
- `reportedModel`
- `promptTokens`
- `completionTokens`
- `estimatedCostUsd`
- `latencyMs`
- `status`
- `errorCode`, when safe and available
- `createdAt`

No adapter may store prompts, responses, keys, or authorization headers.

## Credential contract

- The tester supplies their normal provider API key through the client's standard authorization header.
- Tollgate reads it only to forward the current request.
- Tollgate must not put it in Convex, application logs, error messages, analytics, or browser output.
- A random project route assigns the call to one project but does not grant dashboard read access.
- A separate dashboard code protects reads and is stored only as a secure hash.

## Pricing rules

- Price tables are provider-specific and carry a source URL plus checked date.
- Store raw calculated values; round only for display.
- If usage or price is unknown, display `Unavailable`; never invent zero spend.
- “Same-token estimate” means re-pricing the original input and output token counts. It does not measure quality, retries, caching differences, tool fees, or actual savings.
- Provider invoices remain the billing authority. Tollgate is an operational estimate in M1.

## Adapter acceptance contract

An adapter is supported only when all of these pass against a real provider:

1. Valid request returns the provider response without changing its meaning.
2. Unknown project or missing provider authorization never reaches the provider.
3. Supported model produces non-zero usage and cost.
4. Provider error status is preserved and logged without sensitive content.
5. Dashboard updates within seconds.
6. Secret scan finds no provider key in source or logs.
7. A cross-project dashboard request returns no data.

## Scope protection

Do not build a lowest-common-denominator API for all providers during Build Week. Finish direct OpenAI. Add OpenRouter only if the complete deployed flow already passes.
