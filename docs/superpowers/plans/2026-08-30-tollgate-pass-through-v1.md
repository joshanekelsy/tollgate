# Tollgate Pass-Through V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship one deployed, tester-funded direct-OpenAI call that appears within two seconds on only that tester's protected Tollgate dashboard.

**Architecture:** A project-specific Next.js route accepts the tester's normal OpenAI authorization, keeps key and content only in request memory, forwards to direct OpenAI, and stores safe usage metadata in Convex. A separate hashed dashboard code creates a short-lived project-scoped cookie; authenticated server polling returns only that project's records. The public landing page collects test applications but never provider credentials.

**Tech Stack:** Node.js 20.9+, Next.js App Router, TypeScript, Tailwind CSS, Convex, Vitest, Testing Library, Vercel, Node `crypto`, direct OpenAI Chat Completions.

**Spec:** `IDEA_SCOPE.md`, `docs/02-PRODUCT_SPEC.md`, `docs/08-TECHNICAL_CONTRACT.md`, `docs/09-USER_FLOWS.md`, `docs/11-ARCHITECTURE.md`

## Global Constraints

- Work only inside `tollgate/`.
- Landing: `/`; proxy: `POST /p/{projectId}/v1/chat/completions`; dashboard: `/p/{projectId}/dashboard`.
- Execute only `gpt-5.4-mini`; compare only with `gpt-5.4-nano` and never execute nano.
- Reject `stream: true` before provider spend.
- Never log or persist authorization, prompts, responses, or request headers.
- Tester-owned OpenAI authorization is forwarded only in request memory.
- Project ID assigns writes; a separate access code protects reads.
- Hash dashboard codes with Node `scrypt` plus random salt.
- Use a signed, secure, HTTP-only, same-site, 30-minute project cookie.
- Browser data requests go through an authenticated Next.js route, never an unrestricted Convex query.
- Poll every two seconds; this counts as live for M1.
- Prices checked 2026-08-30 in official OpenAI documentation: mini `$0.75/M` input, `$0.075/M` cached input, `$4.50/M` output; nano `$0.20/M`, `$0.02/M`, `$1.25/M`.
- Regional processing, images, tools, batch, priority, flex, or unknown usage display `Unavailable`.
- No OpenRouter, streaming, routing, teams, budgets, payment flow, notification flow, or self-service provisioning.

## Launch-first execution order

Execute tasks in this order: **Task 0 → Task 1 → Task 6 → Task 2 → Task 3 → Task 4 → Task 5 → Task 7**.

Task 1 creates the minimum app and Convex application table. Task 6 then publishes the landing page immediately so qualification starts while the product is being built. Do not imply that the meter is already available: the page says early access and asks people to apply for a Build Week test.

---

## File map

| File | Responsibility |
|---|---|
| `convex/schema.ts` | Projects, safe calls, test applications, and indexes. |
| `convex/projects.ts` | Create and resolve projects. |
| `convex/calls.ts` | Store and summarize project-scoped metadata. |
| `convex/applications.ts` | Deduplicate test applications. |
| `src/lib/types.ts` | Safe shared types only. |
| `src/lib/access-code.ts` | Generate, hash, and verify dashboard codes. |
| `src/lib/session.ts` | Sign and verify dashboard sessions. |
| `src/lib/pricing.ts` | Provider-scoped cost estimates. |
| `src/lib/proxy.ts` | Validate, forward, extract usage, and build safe records. |
| `src/app/p/[projectId]/v1/chat/completions/route.ts` | Thin proxy route. |
| `src/app/p/[projectId]/dashboard/*` | Unlock, data API, and dashboard. |
| `src/app/page.tsx` | Landing page. |
| `src/app/apply/route.ts` | Test application handler. |
| `scripts/provision-project.ts` | Builder-only project creation. |

---

### Task 0: Run the validation gate

**Files:**
- Modify: `docs/03-VALIDATION_PLAN.md`

**Interfaces:**
- Produces: one named direct-OpenAI bill owner's response to credential pass-through.

- [ ] **Step 1:** Send the exact message in `docs/03-VALIDATION_PLAN.md`.
- [ ] **Step 2:** Record `accepted`, `rejected`, or `no response` and their exact reason.
- [ ] **Step 3:** If rejected for proxy trust, keep it as Monday's largest risk; do not claim demand.
- [ ] **Step 4:** Commit with `git commit -m "docs: record first Tollgate validation response"`.

---

### Task 1: Scaffold and lock the safe data boundary

**Files:**
- Create: `package.json`, `src/app/layout.tsx`, `src/app/globals.css`, `.env.example`
- Create: `convex/schema.ts`, `src/lib/types.ts`

**Interfaces:**
- Produces `TrafficType`, `CostStatus`, and `SafeCallRecord`.

- [ ] **Step 1: Scaffold in the existing folder**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias '@/*' --use-npm
npm install convex
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom tsx
```

Preserve the existing Markdown files.

- [ ] **Step 2: Define the only allowed call record**

```ts
export type SafeCallRecord = {
  projectId: string;
  createdAt: number;
  provider: "openai";
  providerRequestId?: string;
  requestedModel: "gpt-5.4-mini";
  reportedModel?: string;
  promptTokens: number;
  cachedPromptTokens: number;
  completionTokens: number;
  estimatedCostUsd?: number;
  sameTokenEstimateUsd?: number;
  costStatus: "estimated" | "unavailable";
  latencyMs: number;
  status: "ok" | "error";
  errorCode?: string;
  trafficType: "internal" | "demo" | "external";
};
```

- [ ] **Step 3:** Create `projects`, `calls`, and `testApplications` tables exactly as specified, with indexes `projects.by_projectId`, `calls.by_project_createdAt`, and `testApplications.by_email`.
- [ ] **Step 4:** Confirm the schema contains no prompt, response, message, authorization, header, or key field.
- [ ] **Step 5:** Add only `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_DEPLOYMENT`, and `DASHBOARD_SESSION_SECRET` to `.env.example`.
- [ ] **Step 6:** Run `npm test && npm run lint && npm run build`; expect success.
- [ ] **Step 7:** Commit with `git commit -m "chore: scaffold Tollgate safe data boundary"`.

- [ ] **Step 8: Continue directly to Task 6**

Do not start proxy or dashboard work until the landing page is deployed and its form has passed one production submission.

---

### Task 2: Provision projects and secure dashboard reads

**Files:**
- Create: `src/lib/access-code.ts`, `src/lib/access-code.test.ts`
- Create: `src/lib/session.ts`, `src/lib/session.test.ts`
- Create: `convex/projects.ts`, `scripts/provision-project.ts`

**Interfaces:**
- Produces `generateAccessCode()`, `hashAccessCode(code)`, `verifyAccessCode(code, stored)`.
- Produces `createDashboardSession(projectId, now)` and `verifyDashboardSession(token, expectedProjectId, now)`.

- [ ] **Step 1:** Test that codes differ, correct codes verify, wrong/malformed codes fail, and stored hashes exclude the plain code.
- [ ] **Step 2:** Run `npm test -- src/lib/access-code.test.ts`; expect missing-module failure.
- [ ] **Step 3:** Implement 24 random bytes for codes, 16 random salt bytes, asynchronous `scrypt` with a 64-byte result, and `timingSafeEqual`.
- [ ] **Step 4:** Test correct project, wrong project, expired token, modified signature, and malformed session.
- [ ] **Step 5:** Implement HMAC-SHA256 sessions with `{ projectId, exp }`, a 30-minute expiry, and a session secret of at least 32 bytes.
- [ ] **Step 6:** Implement project creation, duplicate rejection, active-project resolution, and code-hash lookup. Public project resolution returns no hash or name.
- [ ] **Step 7:** Implement the local provision script. It prints project base URL, dashboard URL, and dashboard code once; it never requests or prints an OpenAI key.
- [ ] **Step 8:** Run both unit suites, lint, and build; expect success.
- [ ] **Step 9:** Commit with `git commit -m "feat: add isolated project access"`.

---

### Task 3: Price supported calls honestly

**Files:**
- Create: `src/lib/pricing.ts`, `src/lib/pricing.test.ts`

**Interfaces:**
- Produces `priceCall({ promptTokens, cachedPromptTokens, completionTokens, exceptionalPricing })`.

- [ ] **Step 1:** Test 1M uncached input plus 1M output: mini cost `5.25`, nano same-token estimate `1.45`.
- [ ] **Step 2:** Test cached tokens, negative values, non-integers, cached greater than input, and exceptional pricing.
- [ ] **Step 3:** Run the suite and confirm it fails before implementation.
- [ ] **Step 4:** Implement `uncached = promptTokens - cachedPromptTokens`; apply uncached, cached, and output rates without rounding stored values.
- [ ] **Step 5:** Return `{ costStatus: "unavailable" }` for exceptional or untrustworthy usage.
- [ ] **Step 6:** Run the suite and commit with `git commit -m "feat: add honest cost estimates"`.

---

### Task 4: Build the pass-through proxy

**Files:**
- Create: `src/lib/proxy.ts`, `src/lib/proxy.test.ts`
- Create: `convex/calls.ts`
- Create: `src/app/p/[projectId]/v1/chat/completions/route.ts`

**Interfaces:**
- Produces `handleChatCompletion(request, projectId, deps): Promise<Response>`.
- `deps` contains `resolveProject`, `recordCall`, `fetchUpstream`, and `now`; it contains no provider key.

- [ ] **Step 1:** Test unknown project, missing bearer authorization, malformed JSON, streaming, and unsupported model; every case must avoid upstream fetch.
- [ ] **Step 2:** Test success forwards only the exact authorization, JSON content type, and supported body to direct OpenAI.
- [ ] **Step 3:** Test success records cached-token usage and only `SafeCallRecord` properties.
- [ ] **Step 4:** Test upstream `401` and `429` preserve status but persist no response body.
- [ ] **Step 5:** Run tests and confirm failure before implementation.
- [ ] **Step 6:** Resolve project first, then validate authorization presence, JSON, `stream !== true`, and exact model `gpt-5.4-mini`.
- [ ] **Step 7:** Forward to `https://api.openai.com/v1/chat/completions`; never spread incoming headers and never call a logger with request data.
- [ ] **Step 8:** Extract prompt, cached prompt, and completion tokens. Mark tools, images, nonstandard service tier, or missing usage unavailable.
- [ ] **Step 9:** Implement exact-project storage and latest-50/today/week summary queries.
- [ ] **Step 10:** Wire the thin route with real fetch, time, and server Convex client.
- [ ] **Step 11:** Run proxy, pricing, lint, and build gates; inspect schema and snapshots for forbidden fields.
- [ ] **Step 12:** Commit with `git commit -m "feat: meter caller-funded OpenAI requests"`.

---

### Task 5: Build the protected dashboard

**Files:**
- Create: `src/app/p/[projectId]/dashboard/page.tsx`
- Create: `src/app/p/[projectId]/dashboard/unlock/route.ts`
- Create: `src/app/p/[projectId]/dashboard/data/route.ts`
- Create: `src/components/dashboard-client.tsx`, `src/components/dashboard-client.test.tsx`

**Interfaces:**
- Unlock returns `204` and `tollgate_dashboard_session` cookie.
- Data returns `{ todayUsd, weekUsd, calls }` for exactly one project.

- [ ] **Step 1:** Test locked form, generic wrong-code error, empty state, latest call, unavailable cost, disclaimer, and two-second polling.
- [ ] **Step 2:** Test missing/expired cookie `401`, wrong-project cookie `403`, and Project A requesting Project B with no data.
- [ ] **Step 3:** Verify code server-side; set a `secure`, `httpOnly`, `sameSite: "strict"` cookie scoped to the exact project path.
- [ ] **Step 4:** Verify cookie before every data query and set `Cache-Control: no-store`.
- [ ] **Step 5:** Render provider, traffic label, today/week totals, latest 50 calls, setup URL, and estimate disclaimer. No charts.
- [ ] **Step 6:** Run component, route, lint, and build gates.
- [ ] **Step 7:** Commit with `git commit -m "feat: add protected project dashboard"`.

---

### Task 6: Build the landing and application flow

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/apply/route.ts`, `convex/applications.ts`
- Create: `src/components/test-application-form.tsx`, `src/components/test-application-form.test.tsx`

**Interfaces:**
- Accepts `{ name, email, provider: "openai", pain?, source }`.
- Returns `{ accepted: true }` for new and duplicate email submissions.

- [ ] **Step 1:** Test required name, valid email, fixed direct-OpenAI provider, optional pain, source, submitting, success, duplicate success, and retry state.
- [ ] **Step 2:** Normalize email, deduplicate with `by_email`, and map unknown source to `other`.
- [ ] **Step 3:** Use the exact early-access hero, trust, button, success, and error copy from `docs/07-LANDING_PAGE.md`.
- [ ] **Step 4:** Exclude fake proof, savings, pricing, extra providers, screenshots, and decorative work.
- [ ] **Step 5:** Run tests, lint, and build.
- [ ] **Step 6:** Deploy the landing page to Vercel before continuing. Submit the production form once and confirm one Convex application row with the correct source.
- [ ] **Step 7:** Publish one direct GrowthX or LinkedIn message linking to the live page; record views when available, applications, and qualified direct-OpenAI owners.
- [ ] **Step 8:** Commit with `git commit -m "feat: launch Tollgate early access page"`.

---

### Task 7: Deploy and pass the release gates

**Files:**
- Modify: `README.md`, `docs/03-VALIDATION_PLAN.md`, `docs/06-METRICS.md`

**Interfaces:**
- Produces public GitHub, Vercel URL, production Convex, and one external handoff.

- [ ] **Step 1:** Add a README quickstart covering project URL, tester-owned key, dashboard code, supported model, privacy boundary, and limitations.
- [ ] **Step 2:** Run `npm test && npm run lint && npm run build`; expect success.
- [ ] **Step 3:** Search tracked code and logs for key-shaped strings, authorization values, prompts, and response fragments; stop on any match that persists sensitive data.
- [ ] **Step 4:** Run `npx convex deploy` and `vercel --prod`.
- [ ] **Step 5:** Set only Convex variables and a new 32-byte-or-longer dashboard session secret in Vercel. Set no OpenAI key.
- [ ] **Step 6:** Provision one internal and one external project; keep plain dashboard codes only in private handoffs.
- [ ] **Step 7:** Use the official OpenAI JavaScript SDK with the internal project base URL, the tester's own key, non-streaming mode, and `gpt-5.4-mini`.
- [ ] **Step 8:** Verify success response, dashboard arrival within two seconds, correct project, non-zero usage, honest estimate, and no sensitive data in logs or Convex.
- [ ] **Step 9:** Verify unknown project, missing key, streaming, unsupported model, wrong dashboard code, and cross-project read failures.
- [ ] **Step 10:** Give the external tester only their base URL, dashboard URL, code, two setup lines, model, and limitation statement; do not touch their configuration.
- [ ] **Step 11:** Record only observed external evidence and commit with `git commit -m "docs: record Tollgate release evidence"`.

---

## Cut order

Cut FAQ and polish first, then weekly total, call history beyond the latest row, same-token comparison, and finally the tester form in favor of direct invites. Never cut caller-funded authorization, no-store/no-log checks, project attribution, dashboard read protection, Vercel, public GitHub, or the external test attempt.

## Definition of done

- A named external tester uses their own OpenAI key.
- Their non-streaming `gpt-5.4-mini` call passes through the deployed project route.
- The response reaches their client.
- Safe usage appears only on their protected dashboard within two seconds.
- No key, prompt, or response is persisted or logged.
- Landing application works.
- Repository is public and limitations are explicit.
