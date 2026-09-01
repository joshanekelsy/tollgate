# Customer Metering Implementation Plan

> **For agentic workers:** Implement this plan inline, task by task, with tests before production deployment.

**Goal:** Attribute every proxy call to a customer and turn monthly usage into invoice-ready totals using one project-level price rule.

**Architecture:** The proxy reads `X-Tollgate-Customer` and stores it with safe call metadata. Convex stores one billing rule per project and aggregates current-month calls by customer. `/settings` edits the rule; `/invoices` reads the protected aggregation through the existing project dashboard session.

**Tech Stack:** Next.js 16, React 19, Convex, Vitest, Vercel.

**Spec:** User request dated 31 August 2026.

## Global Constraints

- Add only customer attribution and one price rule with an invoice view.
- Do not rebuild working proxy, comparison, task-policy, or onboarding flows.
- Do not add payments, Stripe, subscriptions, multi-user auth, plan tiers, proration, or exports.
- Current month means the current UTC calendar month.

---

### Task 1: Customer attribution

**Files:** `src/lib/proxy.ts`, `src/lib/types.ts`, `convex/schema.ts`, `convex/calls.ts`, `src/lib/proxy.test.ts`

- [ ] Test two customer headers and the missing-header fallback.
- [ ] Read `x-tollgate-customer` in the proxy and record `unattributed` when absent.
- [ ] Add `customerId` to the call schema and a Convex customer index.
- [ ] Run proxy tests.

### Task 2: Price calculation and storage

**Files:** `src/lib/billing.ts`, `src/lib/billing.test.ts`, `convex/schema.ts`, `convex/billing.ts`

- [ ] Test percentage markup and fixed price per 1,000 tokens.
- [ ] Implement one calculation function shared by display code.
- [ ] Store one active rule per project.
- [ ] Aggregate current-month calls by customer and sort by billed amount.

### Task 3: Protected billing endpoints

**Files:** `src/app/p/[projectId]/dashboard/billing-rule/route.ts`, `src/app/p/[projectId]/dashboard/invoices/route.ts`

- [ ] Reuse the existing dashboard session check.
- [ ] Validate and save either percentage or fixed-token pricing.
- [ ] Return the current rule and monthly customer rows without customer content beyond the supplied ID.

### Task 4: Settings and invoices views

**Files:** `src/app/settings/page.tsx`, `src/app/invoices/page.tsx`, `src/components/billing-settings.tsx`, `src/components/invoice-view.tsx`, `src/app/billing.css`, `src/components/dashboard-client.tsx`

- [ ] Add dashboard navigation to `/settings?projectId=...` and `/invoices?projectId=...`.
- [ ] Build one two-mode rule form with saved, loading, empty, and error states.
- [ ] Build the current-month customer table with calls, tokens, raw cost, billed amount, and margin.
- [ ] Verify desktop and phone layouts.

### Task 5: Acceptance and deployment

- [ ] Deploy Convex development schema and run all tests.
- [ ] Run the Next.js production build.
- [ ] Send two fake-provider proxy calls with different customer headers in tests and verify distinct invoice calculations.
- [ ] Walk settings and invoices in a browser, then deploy Convex production and Vercel.
