# Provider Strategy

## Principle

Tollgate owns one internal call record. Each provider adapter forwards the user's provider authorization without persisting it, then translates model name, response, and usage into that record. The dashboard never depends on an OpenRouter-specific field.

## Connected providers

| Order | Provider | Status | Contract |
|---|---|---|---|
| 1 | Direct OpenAI | Connected | Non-streaming Chat Completions with bearer authentication and verified pricing for the local price catalogue. |
| 2 | OpenRouter | Connected | Non-streaming OpenAI-compatible Chat Completions with bearer authentication and provider-reported response cost. |
| 3 | Anthropic direct | Connected | Non-streaming Messages with `x-api-key`, Anthropic versioning, native cache usage, and tool-use parsing. |
| 4 | Gemini direct | Connected | Non-streaming GenerateContent with `x-goog-api-key`, path model IDs, cached-token usage, thoughts, and function-call parsing. |
| 5 | Other hosted providers | Not connected | A host needs its own fixed origin, authentication, request, usage, error, and cost adapter before it can be claimed. |

## Internal record

Every adapter must produce:

- `provider`
- `providerRequestId`, when returned
- `requestedModel`
- `reportedModel`
- `promptTokens`
- `completionTokens`
- `cachedPromptTokens`
- `providerCostUsd`, when the provider reports it
- `estimatedCostUsd`
- `costStatus`: `reported`, `estimated`, or `unavailable`
- `latencyMs`
- `status`
- `errorCode`, when safe and available
- `createdAt`

No adapter may store prompts, responses, keys, or authorization headers.

## Credential contract

- The tester supplies their normal provider API key through the adapter's documented key header.
- Tollgate reads it only to forward the current request.
- Tollgate must not put it in Convex, application logs, error messages, analytics, or browser output.
- A random project route assigns the call to one project but does not grant dashboard read access.
- A separate dashboard code protects reads and is stored only as a secure hash.

## Pricing rules

- Price tables carry a source URL plus checked date and never act as a request allowlist.
- Store raw calculated values; round only for display.
- If usage or price is unknown, display `Unavailable`; never invent zero spend.
- “Same-token estimate” means re-pricing the original input and output token counts. It does not measure quality, retries, caching differences, tool fees, or actual savings.
- OpenRouter-reported cost is kept separate from Tollgate estimates. Provider invoices remain the billing authority.

## Adapter acceptance contract

An adapter is supported only when all of these pass against a real provider:

1. Valid request returns the provider response without changing its meaning.
2. Unknown project or missing provider authorization never reaches the provider.
3. A valid provider model produces normalized usage. Cost is reported, estimated, or explicitly unavailable.
4. Provider error status is preserved and logged without sensitive content.
5. Dashboard updates within seconds.
6. Secret scan finds no provider key in source or logs.
7. A cross-project dashboard request returns no data.

## Scope protection

Do not accept an arbitrary upstream URL or forward arbitrary headers. Each new provider needs a fixed origin and path plus tested authentication, request, usage, error, tool, streaming, and cost behavior. The current shared record is common; the wire protocols remain provider-specific.
