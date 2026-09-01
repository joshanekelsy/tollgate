# Landing And Dashboard Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every public product path show the new Tollgate dashboard, tighten the landing promises and FAQ, verify happy and unhappy paths, and deploy the tested build to Vercel.

**Architecture:** Extend the existing `DashboardClient` with a read-only sample mode backed by local typed sample data. Keep private meters on their existing protected APIs, while `/demo` renders the same four-view shell without access checks, polling, writes, or live provider actions. Redirect retired public invoice and pricing URLs into the matching sample-dashboard views.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, TypeScript, Vitest, Playwright with installed Chrome, Vercel CLI.

**Spec:** `docs/02-PRODUCT_SPEC.md`, `docs/09-USER_FLOWS.md`, `docs/design/tollgate-dashboard-reference-board.html`

## Global Constraints

- OpenAI non-streaming Chat Completions only.
- Never persist API keys, authorization headers, prompts, responses, or tool payloads.
- One project-level percentage markup or fixed price per 1,000 tokens.
- Public sample data must never call protected project APIs or pretend to be live.
- The sample and private dashboard must share the same product shell and views.
- Retired demo URLs must remain reachable through redirects.
- Desktop width is 1440 by 900; phone width is 390 by 844; neither may horizontally overflow.
- Keep unrelated uncommitted worktree changes intact.

---

### Task 1: Typed Public Sample

**Files:**
- Create: `src/lib/dashboard-sample.ts`
- Create: `src/lib/dashboard-sample.test.ts`
- Modify: `src/lib/meter-links.ts`
- Modify: `src/lib/meter-links.test.ts`

**Interfaces:**
- Produces: `sampleDashboardData` with `usage` and `invoice` values matching dashboard types.
- Produces: `demoDashboardPath(view?)` returning `/demo` or `/demo?view={view}`.

- [ ] Write failing tests for stable sample totals and sample dashboard URLs.
- [ ] Run the focused tests and confirm the new expectations fail.
- [ ] Add typed, current-month sample calls and derive invoice rows with the existing billing function.
- [ ] Add the public demo path helper.
- [ ] Run the focused tests and confirm they pass.

### Task 2: Shared Read-Only Dashboard

**Files:**
- Modify: `src/components/dashboard-client.tsx`
- Modify: `src/app/dashboard.css`
- Replace: `src/app/demo/page.tsx`

**Interfaces:**
- `DashboardClient({ projectId, initialView, demo })` uses sample data when `demo` is true.
- Demo navigation writes `/demo?view=...`; private navigation writes the protected dashboard URL.
- Demo pricing can be explored locally but cannot call the save API.
- Demo setup shows realistic sample integration evidence without exposing a live proxy action.

- [ ] Render sample data immediately without access checks or API polling.
- [ ] Add a persistent Sample dashboard label and Create private meter action.
- [ ] Make all four views usable in sample mode.
- [ ] Disable server writes and live refresh/model-comparison actions in sample mode.
- [ ] Use browser history entries and respond to Back and Forward navigation.
- [ ] Add demo-specific metadata and validate the `view` query value on the server.
- [ ] Run the focused tests, lint, and TypeScript build.

### Task 3: Retired Route Compatibility

**Files:**
- Modify: `src/app/invoices/page.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/components/meter-selector.tsx`

**Interfaces:**
- `/invoices?demo=1` redirects to `/demo?view=overview`.
- `/settings?demo=1` redirects to `/demo?view=pricing`.
- Public sample links point only at the new demo.

- [ ] Replace retired public renders with server redirects.
- [ ] Update meter-selector sample links.
- [ ] Add browser checks for both legacy redirects.
- [ ] Run focused route checks.

### Task 4: Landing Alignment And FAQ

**Files:**
- Modify: `src/components/landing-experience.tsx`
- Modify: `src/components/product-film.tsx`
- Modify: `src/app/landing-redesign.css`
- Modify: `src/app/landing-interactions.css`

**Interfaces:**
- Header and hero expose `Explore sample dashboard` without hiding meter creation.
- Hero proof uses the same sample customers, totals, and product vocabulary as `/demo`.
- FAQ explains meter creation, recovery, session expiry, and unavailable cost.

- [ ] Point every landing demo action to `/demo` and add a visible header/hero entry.
- [ ] Replace broad claims with supported OpenAI and invoice-ready language.
- [ ] Align the hero proof and product film with the shared sample data.
- [ ] Replace duplicated FAQ entries with onboarding, recovery, and missing-cost answers.
- [ ] Keep How It Works as the detailed latency and technical-boundary source.
- [ ] Verify keyboard focus, modal closing, touch targets, and responsive layout.

### Task 5: Complete Browser Audit

**Files:**
- Modify: `scripts/verify-product-flow.cjs`

**Interfaces:**
- The browser suite covers landing, public sample navigation, legacy redirects, browser history, private onboarding, billing, recovery, errors, desktop, and mobile.

- [ ] Add demo navigation and read-only assertions for all four views.
- [ ] Assert demo pages make no protected dashboard data requests.
- [ ] Assert legacy URLs land on the correct sample view.
- [ ] Add landing CTA, FAQ, metadata, console-error, overflow, and touch-target checks.
- [ ] Run the complete suite twice and inspect new desktop/mobile screenshots.

### Task 6: Release Verification And Vercel Deployment

**Files:** Existing code and tests only.

- [ ] Run the full Vitest suite and record exact counts.
- [ ] Run ESLint with zero errors.
- [ ] Run the production Next.js build.
- [ ] Run `git diff --check` and review the implementation diff.
- [ ] Run the dependency audit and report any production vulnerability.
- [ ] Deploy the verified worktree with `vercel --prod`.
- [ ] Repeat public happy-path and unhappy-path smoke tests against the production URL.
- [ ] Confirm production metadata, redirects, desktop/mobile layout, and no browser errors.
