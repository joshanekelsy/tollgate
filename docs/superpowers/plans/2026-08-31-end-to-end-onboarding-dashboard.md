# End-to-End Onboarding Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the email handoff into one coherent path from meter creation through setup, pricing, attributed usage, and invoice-ready totals.

**Architecture:** Keep the existing Convex project, call, session, and billing APIs. Replace the conflicting invoice, settings, and decision-dashboard entry points with one protected project shell at `/p/{projectId}/dashboard`, using a URL view parameter for Overview, Customers, Price rule, and Setup. Preserve the public invoice demo and redirect old authenticated links into the shell.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, Convex 1.45, TypeScript, Vitest, Testing Library, Playwright with installed Chrome.

**Spec:** `docs/02-PRODUCT_SPEC.md`, `docs/09-USER_FLOWS.md`, `docs/design/tollgate-dashboard-reference-board.html`

## Global Constraints

- OpenAI non-streaming Chat Completions only.
- Never persist API keys, authorization headers, prompts, responses, or tool payloads.
- One project-level percentage markup or fixed price per 1,000 tokens.
- Missing `X-Tollgate-Customer` becomes `unattributed` and remains visible.
- Invoice-ready calculations only; no payments, invoice sending, subscriptions, tax, tiers, or exports.
- Existing project IDs, access codes, proxy URLs, public demo links, and model-comparison route remain reachable.
- All product controls need keyboard focus, disabled, loading, success, and error states.
- Desktop width is 1440 by 900; phone width is 390 by 844; neither may horizontally overflow.

---

### Task 1: Provisioning Contract And Recovery Handoff

**Files:**
- Create: `src/lib/meter-links.ts`
- Create: `src/lib/meter-links.test.ts`
- Modify: `src/app/apply/route.ts`
- Modify: `src/components/test-application-form.tsx`
- Modify: `src/components/test-application-form.test.ts`
- Modify: `src/app/onboarding.css`

**Interfaces:**
- Produces: `dashboardPath(projectId, view?)`, `dashboardUrl(origin, projectId, view?)`, and `proxyBaseUrl(origin, projectId)`.
- Produces: a successful `/apply` response whose `dashboardUrl` is the protected Setup view.

- [ ] Write a failing link-contract test proving a new meter opens `/p/meter-test/dashboard?view=setup`.
- [ ] Run `npm test -- src/lib/meter-links.test.ts src/components/test-application-form.test.ts` and confirm the new expectation fails.
- [ ] Add the shared link helpers and use them in `/apply`.
- [ ] Reduce the post-email screen to recovery code, Continue to setup, copy, and download actions.
- [ ] Keep the user on the recovery screen when automatic unlock fails and show the exact recovery action.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Unified Protected Product Shell

**Files:**
- Modify: `src/app/p/[projectId]/dashboard/page.tsx`
- Replace: `src/components/dashboard-client.tsx`
- Replace: `src/app/dashboard.css`
- Create: `src/lib/dashboard-summary.ts`
- Create: `src/lib/dashboard-summary.test.ts`

**Interfaces:**
- Consumes: `/dashboard/data`, `/dashboard/invoices`, and `/dashboard/billing-rule` using parallel fetches.
- Produces: `DashboardView = "overview" | "customers" | "pricing" | "setup"`.
- Produces: `summarizeBilling(rows)` with total billed, raw cost, margin, unattributed count, and customer count.

- [ ] Write failing summary tests for active data, no rule, empty data, and unattributed usage.
- [ ] Run the focused tests and confirm they fail.
- [ ] Implement the pure summary helper.
- [ ] Render the dashboard page instead of redirecting it.
- [ ] Build the stable meter shell with native buttons and URL-backed view changes.
- [ ] Fetch independent dashboard resources in parallel and poll only while the page is visible.
- [ ] Run the focused tests and TypeScript build.

### Task 3: Complete The Four Product Views

**Files:**
- Modify: `src/components/dashboard-client.tsx`
- Modify: `src/app/dashboard.css`

**Interfaces:**
- Overview consumes invoice rows and shows totals, setup progress, attention items, and the customer ledger.
- Customers consumes the same rows and exposes one selected customer without another API request.
- Price rule reads and writes `/dashboard/billing-rule`, then refreshes invoice calculations.
- Setup derives completion from meter creation, recorded live calls, customer attribution, and an active rule.

- [ ] Build Overview loading, empty, missing-rule, active, unattributed, and failed-data states.
- [ ] Build the customer list/detail view with a useful empty state.
- [ ] Build percentage and per-1,000-token pricing, client validation, save feedback, and retry behavior.
- [ ] Build four-step Setup with copyable base URL and customer header, live first-call evidence, and permanent privacy boundaries.
- [ ] Keep the existing model comparison available as an optional advanced action, not the first-run goal.
- [ ] Check keyboard navigation, focus visibility, minimum 44px targets, reduced motion, and screen-reader labels.

### Task 4: Compatibility And Failure Boundaries

**Files:**
- Modify: `src/app/invoices/page.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/components/meter-selector.tsx`
- Modify: `README.md`
- Create: `.env.example`

**Interfaces:**
- `/invoices?demo=1` and `/settings?demo=1` remain public samples.
- `/invoices?projectId=x` redirects to `/p/x/dashboard?view=overview`.
- `/settings?projectId=x` redirects to `/p/x/dashboard?view=pricing`.
- Access-code selection opens the matching protected dashboard view.

- [ ] Redirect old private links while preserving public demo routes.
- [ ] Make expired or mismatched sessions return to the access-code screen without losing the project ID.
- [ ] Document required local environment variables without real values.
- [ ] Update product-surface documentation to match the unified shell.
- [ ] Run lint and production build.

### Task 5: Browser Acceptance Suite

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Replace: `scripts/verify-conversion-flow.cjs`
- Replace: `scripts/verify-billing-flow.cjs`

**Interfaces:**
- Produces: `npm run test:e2e` using local Next.js, the configured Convex deployment, a test session secret, and Chrome.

- [ ] Add Playwright as an explicit development dependency without downloading another browser.
- [ ] Test the happy flow at 1440x900 and 390x844: email, recovery code, automatic unlock, Setup, price rule, Overview, and no horizontal overflow.
- [ ] When a test OpenAI key is available, send attributed and unattributed proxy calls and verify both customer rows and recalculated totals.
- [ ] Test unhappy paths: invalid application JSON, wrong access code, unauthorized meter, negative rule, unsupported model, rejected provider key, failed dashboard fetch, and expired access behavior.
- [ ] Capture desktop and phone screenshots for visual inspection.
- [ ] Run the browser suite twice to catch state and timing leaks.

### Task 6: Final Verification

**Files:** Existing code and tests only.

- [ ] Run `npm test` and report the exact file and test counts.
- [ ] Run `npm run lint` with zero errors.
- [ ] Run `npm run build` and verify every expected route compiles.
- [ ] Run `npm run test:e2e` and report each happy and unhappy scenario.
- [ ] Inspect desktop and phone screenshots for hierarchy, clipping, overlap, blank images, and mobile readability.
- [ ] Run `git diff --check` and review only the files changed by this implementation.

