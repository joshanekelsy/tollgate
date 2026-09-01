# Decision Dashboard Implementation Plan

> **For agentic workers:** Implement inline, task by task, with tests before production deployment.

**Goal:** Turn Tollgate from a chronological call meter into a task-level decision tool where a user runs and evaluates a cheaper-model test without leaving Tollgate.

**Architecture:** Widen the existing OpenAI proxy to the four models already held in the verified pricing catalogue. Derive task groups from the private call metadata already stored, then make the dashboard lead with ranked task opportunities and measured model results. Persist only the existing safe metadata and user quality vote; never store prompts, responses, keys, or tool payloads.

**Tech Stack:** Next.js, React, Convex, Vitest, Vercel.

**Spec:** `docs/02-PRODUCT_SPEC.md`

## Global Constraints

- OpenAI only; non-streaming Chat Completions only.
- A task comparison requires the same non-empty `x-tollgate-task-id` on each run.
- Price estimates never claim equivalent quality.
- No prompt, response, key, authorization header, or tool payload storage.
- Existing meter URLs and access codes must continue working.

---

### Task 1: Support measured alternative-model calls

**Files:** `src/lib/pricing.ts`, `src/lib/types.ts`, `src/lib/proxy.ts`, `src/lib/proxy.test.ts`, `convex/schema.ts`, `convex/calls.ts`

- [x] Add a typed supported-model guard backed by the verified catalogue.
- [x] Price the requested model rather than assuming GPT-5.4 Mini.
- [x] Reject unknown models before provider spend.
- [x] Record the requested supported model without widening stored private data.
- [x] Test a successful alternative-model call and an unsupported model.

Acceptance: a `gpt-5.4-nano` call passes through, receives its own price, and is stored with no content or credentials.

### Task 2: Derive task-level decisions

**Files:** `src/lib/task-insights.ts`, `src/lib/task-insights.test.ts`

- [x] Group calls by task ID, with unattributed calls kept separate.
- [x] Calculate call count, model runs, estimated spend, quality votes, and the cheapest measured successful run.
- [x] Rank repeated, high-spend tasks first without claiming quality equivalence.

Acceptance: deterministic tests cover repeated tasks, missing task IDs, unavailable cost, and mixed quality votes.

### Task 3: Complete the decision loop inside the dashboard

**Files:** `src/components/dashboard-client.tsx`, `src/app/dashboard.css`

- [x] Lead with “tasks to review,” attributed coverage, and observed spend—not an unreliable monthly projection.
- [x] Add a ranked task opportunity list as the main surface.
- [x] Add a selected-task workbench showing measured model runs, cost, latency, and quality.
- [x] Run the same prompt on two chosen supported models inside Tollgate.
- [x] Keep the provider key, prompt, and outputs in browser memory only; never persist them.
- [x] Show each real output, measured cost, and browser-observed latency side by side.
- [x] Let the user record the winning output as task-level quality evidence.
- [x] Keep raw traces as secondary evidence.

Acceptance: a user can identify one task, run two paid model calls, compare their results, and record a winner without leaving the dashboard.

### Task 4: Verify and ship

**Files:** existing test and deployment configuration only.

- [x] Run tests, lint, and production build.
- [x] Deploy the widened Convex schema.
- [x] Deploy to Vercel.
- [x] Verify the old demo meter still unlocks and returns existing calls.
- [x] Run one attributed alternative-model call and confirm the comparison appears.

Acceptance: old links work, the new call is measured, and production returns HTTP 200.
