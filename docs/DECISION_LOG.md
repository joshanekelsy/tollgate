# Decision Log

| Date | Decision | Reason |
|---|---|---|
| 2026-08-29 | Build Tollgate for direct API-bill owners. | The founder personally experienced model-cost and limit pain. |
| 2026-08-29 | Primary track: Revenue. | One paid bill owner is stronger evidence than broad traffic. |
| 2026-08-30 | Caller owns and supplies the provider key. | The measurement must reflect the user's bill; Tollgate does not resell inference. |
| 2026-08-30 | Persist private metadata only. | Cost visibility should not require retaining prompts, responses, credentials or tool payloads. |
| 2026-08-30 | OpenAI non-streaming Chat Completions only. | One verified provider contract is stronger than untested breadth. |
| 2026-08-30 | Replace manual applications with one-email self-serve meters. | A stranger must reach first value without founder provisioning. |
| 2026-08-30 | Add a real two-model comparison and human winner. | Same-token repricing alone produces insight without a quality decision. |
| 2026-08-30 | Position as a task-level decision layer, not broad observability. | Established gateways and observability suites already win on feature breadth. |
| 2026-08-30 | Keep routing, budgets and alerts out of M1. | Validate that users make a model decision before automating enforcement. |
| 2026-08-30 | Landing proof uses one controlled production comparison. | Real output, cost and latency are stronger and more honest than an illustration. |
| 2026-08-31 | Supersede the OpenAI-only proxy with four fixed provider adapters. | Metering is provider-neutral, but authentication, paths, usage fields, errors and cost sources require explicit OpenAI, Anthropic, Gemini and OpenRouter translations. |
| 2026-08-31 | Treat the price catalogue as pricing data, not a model allowlist. | A safe provider model ID may pass through even when Tollgate cannot calculate monetary cost; unavailable cost must remain explicit. |
