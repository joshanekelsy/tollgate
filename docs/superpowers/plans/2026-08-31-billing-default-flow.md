# Billing Default Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make customer billing the first signed-in Tollgate experience while preserving model comparison at a secondary URL.

**Architecture:** Keep the existing invoice, settings, and comparison components. Change route ownership so the private dashboard URL redirects to the invoice page, mount the existing comparison client at a dedicated comparison route, and make signup unlock the meter before opening invoices. Use ordinary anchors for invoice-to-settings navigation so mobile clicks always complete as full page loads.

**Tech Stack:** Next.js 16 App Router, React 19, Convex, Vitest, Playwright browser verification.

**Spec:** User request in the 31 August 2026 conversation turn beginning “The product has pivoted from model comparison to usage-based billing”.

## Global Constraints

- Do not redesign layouts, colours, or navigation.
- Do not add payments or Stripe.
- Do not delete comparison code.
- Comparison must not be a post-signup or primary-navigation destination.

---

### Task 1: Billing-first signup handoff

**Files:**
- Modify: `src/components/test-application-form.tsx`
- Modify: `src/app/apply/route.ts`
- Test: `src/components/test-application-form.test.ts`

**Interfaces:**
- Consumes: the existing `POST /apply` meter setup response and dashboard unlock endpoint.
- Produces: a success card with four billing steps and an invoice-summary destination.

- [ ] Replace comparison wording with the four ordered billing next steps.
- [ ] Keep access-code and connection setup controls unchanged where they remain relevant.
- [ ] After successful unlock, navigate to `/invoices?projectId=<id>`.
- [ ] Assert the setup text and component source contain no first-run comparison claim.

### Task 2: Billing becomes the private default

**Files:**
- Modify: `src/app/p/[projectId]/dashboard/page.tsx`
- Create: `src/app/p/[projectId]/comparison/page.tsx`
- Modify: `src/components/invoice-view.tsx`

**Interfaces:**
- Consumes: existing signed dashboard cookie and `DashboardClient` comparison component.
- Produces: `/dashboard` → invoice redirect and `/comparison` → preserved comparison UI.

- [ ] Redirect the dashboard route to the project invoice summary.
- [ ] Mount `DashboardClient` unchanged at the dedicated comparison route.
- [ ] Add one secondary invoice-page link to the comparison route.
- [ ] Keep customer usage, billed amount, margin, and pricing-rule state visible even when a real meter has no calls or no price rule.

### Task 3: Reliable price-rule navigation

**Files:**
- Modify: `src/components/invoice-view.tsx`

**Interfaces:**
- Consumes: `/settings?projectId=<id>` and `/settings?demo=1` routes.
- Produces: normal browser navigations from both “Price rule” and “Change rule”.

- [ ] Replace client-intercepted settings links with ordinary anchors.
- [ ] Preserve their existing classes, labels, and locations.
- [ ] Verify both links at 1440px and 390px.

### Task 4: Full-flow verification and release

**Files:**
- Verify only: marketing, signup, invoices, settings, comparison.

**Interfaces:**
- Consumes: the production build and a fresh meter.
- Produces: a deployed, browser-verified billing-first journey.

- [ ] Run `npm test`, `npm run lint`, and `npm run build`.
- [ ] At 1440px and 390px: create a fresh meter, inspect the success card, open invoices, reach the sample customer switcher, open settings from both price-rule links, save a changed rule, and open comparison only from its secondary link.
- [ ] Deploy to Vercel and repeat critical public-route checks.

