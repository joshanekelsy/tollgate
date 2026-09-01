# Provider Adapter Boundary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Accept any safe model ID through non-streaming OpenAI, Anthropic, Gemini, and OpenRouter endpoints while storing one provider-neutral usage record and never fabricating unknown cost.

**Architecture:** Keep project access, customer attribution, storage, billing, and dashboard logic shared. Move endpoint, credential, request-model, response-usage, request-ID, tool metadata, and cost extraction into four provider adapters selected by a fixed registry. Preserve the existing OpenAI URL, add provider-scoped proxy URLs, and keep task-policy model routing limited to the OpenAI adapter until policies become provider-aware in the product UI.

**Tech Stack:** Next.js 16.3.3 App Router, TypeScript, Convex, Vitest, Playwright, Vercel.

**Spec:** `docs/02-PRODUCT_SPEC.md`, `docs/08-TECHNICAL_CONTRACT.md`, `docs/09-USER_FLOWS.md`

## Global Constraints

- Supported providers are exactly `openai`, `anthropic`, `gemini`, and `openrouter`.
- This release supports non-streaming generation endpoints only.
- Any safe model ID is proxied; a pricing catalogue must never be an acceptance allowlist.
- Provider origins and accepted paths are fixed in code to prevent arbitrary upstream requests.
- Provider keys, authorization headers, query keys, prompts, responses, and tool arguments are never stored.
- Provider-reported cost is stored as reported; verified catalogue cost is stored as estimated; missing cost remains unavailable.
- Existing `/p/{projectId}/v1/chat/completions` OpenAI integrations remain valid.
- Existing private sessions, customer attribution, pricing rules, invoice totals, and public demo behavior remain valid.

---

### Task 1: Correct The Current Copy Boundary

**Files:**
- Modify: `src/components/landing-experience.tsx`
- Modify: `src/app/how-it-works/page.tsx`
- Modify: `README.md`

- [ ] Change broad OpenAI claims to `Selected OpenAI models, non-streaming Chat Completions`.
- [ ] Scan public copy for broader model-support claims.
- [ ] Run focused lint.

### Task 2: Provider-Neutral Stored Contract

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/calls.ts`
- Modify: `convex/taskPolicies.ts`
- Modify: `src/app/p/[projectId]/dashboard/policy/route.ts`
- Modify: billing and summary tests where required.

- [ ] Write failing tests proving arbitrary safe model strings and reported cost work in billing.
- [ ] Expand provider and cost-status types.
- [ ] Change model storage validators from four literals to bounded strings.
- [ ] Preserve existing OpenAI policies while adding an optional provider field.
- [ ] Deploy the Convex schema and regenerate API types.

### Task 3: Provider Adapter Registry

**Files:**
- Create: `src/lib/providers/types.ts`
- Create: `src/lib/providers/shared.ts`
- Create: `src/lib/providers/openai.ts`
- Create: `src/lib/providers/openrouter.ts`
- Create: `src/lib/providers/anthropic.ts`
- Create: `src/lib/providers/gemini.ts`
- Create: `src/lib/providers/registry.ts`
- Create: `src/lib/providers/adapters.test.ts`

- [ ] Write failing adapter tests for credentials, safe model IDs, fixed paths, token fields, cached tokens, reported OpenRouter cost, request IDs, and tool names.
- [ ] Implement a small typed adapter interface.
- [ ] Implement OpenAI and OpenRouter Chat Completions adapters.
- [ ] Implement Anthropic Messages usage and tool parsing.
- [ ] Implement Gemini generateContent usage and function-call parsing.
- [ ] Reject streaming, unsafe model IDs, unsupported paths, and missing credentials before provider spend.

### Task 4: Shared Proxy And Routes

**Files:**
- Replace: `src/lib/proxy.ts`
- Modify: `src/lib/proxy.test.ts`
- Modify: `src/app/p/[projectId]/v1/chat/completions/route.ts`
- Create: `src/app/p/[projectId]/providers/[provider]/[...path]/route.ts`

- [ ] Write failing proxy tests for all four adapters and unknown-cost behavior.
- [ ] Build the shared request lifecycle around the adapter registry.
- [ ] Forward only provider-approved credential and product headers.
- [ ] Preserve response bytes and safe response headers.
- [ ] Record upstream and network failures without storing content.
- [ ] Keep the legacy OpenAI route as a compatibility wrapper.

### Task 5: Multi-Provider Setup Experience

**Files:**
- Modify: `src/lib/meter-links.ts`
- Modify: `src/lib/meter-links.test.ts`
- Modify: `src/components/dashboard-client.tsx`
- Modify: `src/app/dashboard.css`
- Modify: `src/components/test-application-form.tsx`
- Modify: `src/components/test-application-form.test.ts`

- [ ] Add stable provider base-URL helpers.
- [ ] Add OpenAI, Anthropic, Gemini, and OpenRouter segmented controls to Setup.
- [ ] Provide correct JavaScript, Python, and cURL examples without real keys.
- [ ] Explain reported, estimated, and unavailable raw cost states.
- [ ] Keep all controls readable at desktop and phone widths.

### Task 6: Product Copy And Documentation

**Files:**
- Modify: `src/components/landing-experience.tsx`
- Modify: `src/app/how-it-works/page.tsx`
- Modify: `README.md`
- Modify: `docs/02-PRODUCT_SPEC.md`
- Modify: `docs/07-LANDING_PAGE.md`
- Modify: `docs/08-TECHNICAL_CONTRACT.md`
- Modify: `docs/09-USER_FLOWS.md`

- [ ] Replace temporary selected-OpenAI copy with the exact four-provider boundary.
- [ ] State non-streaming endpoint limits and unknown-cost behavior.
- [ ] Document provider base URLs and fixed upstream endpoints.
- [ ] Keep invoice and privacy boundaries unchanged.

### Task 7: Complete Verification And Release

**Files:**
- Modify: `scripts/verify-product-flow.cjs`

- [ ] Unit-test all adapter request and response formats without live keys.
- [ ] Run the existing live OpenAI happy path.
- [ ] Test missing and invalid credentials for all four provider routes.
- [ ] Test arbitrary safe model pass-through and unsafe model rejection.
- [ ] Test setup provider controls, browser history, public demo, mobile layout, and failure states.
- [ ] Run all tests, lint, production build, dependency audit, and diff checks.
- [ ] Deploy the final Convex functions and Vercel production build.
- [ ] Run the complete browser suite against production.
