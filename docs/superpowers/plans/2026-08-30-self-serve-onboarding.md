# Self-Serve Onboarding Implementation Plan

> **For agentic workers:** Implement inline, task by task, with tests before production deployment.

**Goal:** Let a stranger create a private Tollgate meter and complete a real two-model comparison without founder help.

**Architecture:** Keep the existing `/apply` provisioning route, but reduce the first form to one email field and OpenAI. Unlock the newly-created dashboard from the setup screen. Make the empty dashboard contain the same comparison runner as an established task, using `first-comparison` as the first safe task ID.

**Tech Stack:** Next.js, React, Convex, Vitest, Vercel.

**Spec:** `docs/02-PRODUCT_SPEC.md`

## Global Constraints

- Never place an OpenAI key in a URL, cookie, Convex, logs, or browser storage.
- Show the dashboard access code before entry and allow it to be downloaded.
- A first-time user must reach useful cost-and-output evidence without manually entering the dashboard code.
- Do not add accounts, tours, email delivery, teams, routing, or another provider.

---

### Task 1: Remove application friction

**Files:** `src/components/test-application-form.tsx`, `src/app/apply/route.ts`, existing form tests.

- [x] Ask only for a work email and provision OpenAI automatically.
- [x] Preserve source attribution and create a valid project record.
- [x] Test the user-facing setup contract.

Acceptance: one email creates a private meter and returns its URL and one-time access code.

### Task 2: Enter the new meter without a second credential step

**Files:** `src/components/test-application-form.tsx`

- [x] Unlock the dashboard using the just-issued access code when the user chooses “Open meter.”
- [x] Navigate only after the secure dashboard cookie is set.
- [x] Keep copy and download recovery actions.

Acceptance: clicking “Open meter and run a comparison” lands on the unlocked dashboard.

### Task 3: Deliver value in an empty meter

**Files:** `src/components/dashboard-client.tsx`, `src/components/ab-test-runner.tsx`, `src/app/dashboard.css`.

- [x] Put the two-model runner in the zero-call state with task ID `first-comparison`.
- [x] Preserve both results until the user records a winner.
- [x] Refresh the dashboard after the winner is recorded.

Acceptance: a fresh meter can run both calls, compare output/cost/latency, and record a winner without leaving Tollgate.

### Task 4: Verify the stranger journey

- [x] Run tests, lint, and production build.
- [x] Deploy to Vercel.
- [x] In a clean browser, create a meter with a test email, enter it, run the comparison, and record a winner.

Acceptance: the entire path works in production without manual provisioning or explanation.
