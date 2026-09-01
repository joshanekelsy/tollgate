# Product Story and Artifact Sync Implementation Plan

> **For agentic workers:** Implement inline with verification gates after each product surface.

**Goal:** Make Tollgate's public story and control documents match the working self-serve, two-model decision product.

**Architecture:** Keep the single-page conversion path and replace the old same-token-only proof with a real measured A/B decision. Add a server-rendered `/how-it-works` trust page using the existing visual system. Rewrite stale product artifacts around the live journey and preserve future routing as an explicit non-goal.

**Tech Stack:** Next.js, React, CSS, Markdown, Vitest, Vercel.

**Spec:** `docs/02-PRODUCT_SPEC.md`

## Global Constraints

- One landing-page CTA: create a private meter.
- No fabricated customers, savings, security certifications, or competitive claims.
- Real comparisons show measured cost, latency, output quality choice, and limitations.
- OpenAI non-streaming Chat Completions only.
- Keys, prompts, responses, and tool payloads are never persisted.
- Routing, budgets, alerts, teams, streaming, and additional providers remain out of scope.

---

### Task 1: Update the landing argument

**Files:** `src/components/landing-experience.tsx`, `src/app/landing-redesign.css`, `src/app/layout.tsx`.

- [x] Replace the old same-token hero proof with the measured two-model comparison from production.
- [x] Update supporting copy to describe self-serve creation and real comparison.
- [x] Add an honest alternatives table without claiming unique capabilities.
- [x] Link to the technical product page without competing with the primary CTA.

Acceptance: the first screen states the pain, shows a real decision, and offers one primary action.

### Task 2: Add the technical product page

**Files:** `src/app/how-it-works/page.tsx`, `src/app/how-it-works/how-it-works.css`.

- [x] Explain the request path, stored metadata, excluded content, pricing boundary, supported contract, and current limitations.
- [x] Show the observe → compare → decide → later enforce thesis without claiming routing exists.
- [x] Provide one route back to creating a meter.

Acceptance: a technical buyer can determine what crosses Tollgate and what the product cannot yet do.

### Task 3: Synchronize control documents

**Files:** core Markdown files in `docs/`.

- [x] Update product spec, user stories, GTM, metrics, landing spec, technical contract, user flows, architecture, and decision log.
- [x] Preserve dated pressure-test history while separating resolved findings from current gaps.
- [x] Mark the completed onboarding and dashboard implementation plans.

Acceptance: no active document calls for manual provisioning, a multi-provider application form, or estimate-only value delivery.

### Task 4: Prepare external validation

**Files:** `docs/03-VALIDATION_PLAN.md`.

- [x] Provide a direct invite that asks a qualified bill owner to create a meter and complete one comparison.
- [x] Record the exact activation, value, and payment questions.
- [x] Name the user-provided candidates without claiming qualification.

Acceptance: the founder can send three messages without rewriting the ask.

### Task 5: Verify and ship

- [x] Run tests, lint, and production build.
- [x] Inspect landing and technical pages at desktop and mobile sizes.
- [x] Deploy to Vercel and verify both public URLs.

Acceptance: production is live, readable, and consistent with the working product.
