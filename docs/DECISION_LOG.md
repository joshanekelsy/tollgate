# Decision Log

## Locked decisions

| Date | Decision | Reason |
|---|---|---|
| 2026-08-30 | Tollgate replaces the handoff and chargeback directions. | It directly reflects the founder's repeated cost and limit pain. |
| 2026-08-30 | Revenue is the primary Build Week track. | The target user directly owns a measurable API bill. |
| 2026-08-30 | M1 is a meter, not a router. | Re-pricing tokens is feasible and honest; equivalent quality is unproven. |
| 2026-08-30 | Direct OpenAI is the first required provider. | The product must not depend on OpenRouter. |
| 2026-08-30 | OpenRouter is the second adapter only after the direct flow passes. | It expands coverage without becoming the architecture. |
| 2026-08-30 | Native Anthropic, Gemini, and hosted Meta support are parked. | Their contracts add risk before the core job is validated. |
| 2026-08-30 | No prompt or response content is stored. | Trust is a core adoption constraint. |
| 2026-08-30 | `/` is the public landing page and `/p/{projectId}/dashboard` is the protected working meter. | Build Week needs both acquisition and an isolated product surface. |
| 2026-08-30 | The landing page has one CTA: `Apply to test Tollgate`. | The immediate goal is a qualified external install, not generic traffic. |
| 2026-08-30 | The tester's own provider key passes through request memory and is never persisted or logged. | The product must measure the tester's real provider bill, not the builder's account. |
| 2026-08-30 | Each tester receives a random project route and a separate dashboard access code stored only as a hash. | Calls need server-assigned attribution while dashboard reads need stronger protection than the write route. |
| 2026-08-30 | M1 public claims say `OpenAI Chat Completions client`, not every coding agent. | Streaming and other provider-native agent endpoints are not supported yet. |
| 2026-08-30 | Launch the early-access landing page before building the proxy. | Demand capture and qualification can run in parallel with product development. The page must clearly say the product is being built. |
| 2026-08-30 | M1 ICP requires direct OpenAI billing, non-streaming Chat Completions, base-URL control, recent cost surprise, and willingness to test pass-through. | A broad “developers using AI” audience cannot validate the current product. |
| 2026-08-30 | Market sizing uses transparent spend-pool and bottom-up scenarios, not a generic AI market headline. | Tollgate captures cost-control software revenue, not total model or AI application spend. |

## Verified source register

| Checked | Claim | Source |
|---|---|---|
| 2026-08-30 | GPT-5.4 supports `v1/chat/completions`; listed standard text price is $2.50 per million input tokens and $15 per million output tokens, with documented exceptions. | https://developers.openai.com/api/docs/models/gpt-5.4 |
| 2026-08-30 | OpenAI Chat Completions has an official API reference. | https://developers.openai.com/api/reference/resources/chat |
| 2026-08-30 | OpenRouter exposes an OpenAI-compatible chat-completions interface and model metadata. | https://openrouter.ai/docs/api/reference/overview |

Refresh provider prices before deployment. Do not silently change scope: add a dated row here.
