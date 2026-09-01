# Four Conversion Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Tollgate CTA anchor, API-key trust text, keyless sample evidence, and mobile tap targets without redesigning the site or changing unrelated copy.

**Architecture:** Keep all behavior in the existing Next.js App Router pages and client components. Use a shared global tap-target utility, targeted anchor id/scroll CSS, the existing sample data shape, and focused component tests.

**Tech Stack:** Next.js App Router, React client components, TypeScript, CSS, Vitest, Testing Library, Playwright verification.

**Spec:** User request from 2026-08-30.

## Global Constraints

- Do not redesign anything.
- Do not change copy that is not named here.
- Do not touch the comparison logic.
- The signup wrapper must be `id="get-started"` with about `96px` scroll margin.
- The API-key helper phrase `project-scoped key` must link to `https://platform.openai.com/api-keys` with `target="_blank"` and `rel="noopener"`.
- Phone interactive links and buttons on home, demo, and how-it-works must have at least a `44px` by `44px` rendered box.

---

### Task 1: CTA Anchor

**Files:**
- Modify: `src/components/landing-experience.tsx`
- Modify: `src/app/demo/page.tsx`
- Modify: `src/app/how-it-works/page.tsx`
- Modify: `src/app/landing-redesign.css`

- [x] Ensure the signup section wrapper has `id="get-started"`.
- [x] Point every create-meter link on the home page to `#get-started`.
- [x] Point every create-meter link from secondary pages to `/#get-started`.
- [x] Add `scroll-margin-top:96px` for `.cinematic-start`.

### Task 2: API-Key Safety Text

**Files:**
- Modify: `src/components/ab-test-runner.tsx`
- Modify: `src/app/dashboard.css`
- Test: `src/components/ab-test-runner.test.tsx`

- [x] Add the exact safe-key helper below the OpenAI API key input.
- [x] Link only the phrase `project-scoped key`.
- [x] Keep the helper visually small and muted.
- [x] Test link URL, target, and rel.

### Task 3: Keyless Sample Evidence

**Files:**
- Modify: `src/lib/ab-test.ts`
- Modify: `src/components/ab-test-runner.tsx`
- Modify: `src/app/dashboard.css`
- Test: `src/lib/ab-test.test.ts`
- Test: `src/components/ab-test-runner.test.tsx`

- [x] Change the sample task wording to `in 25 words or fewer`.
- [x] Add instruction-compliance data for both sample outputs.
- [x] Render cost, speed, and `Follows the instruction` for each sample column.
- [x] Confirm the sample choice still records locally.

### Task 4: Mobile Tap Targets

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/landing-experience.tsx`
- Modify: `src/components/product-film.tsx`
- Modify: `src/components/test-application-form.tsx`
- Modify: `src/app/demo/page.tsx`
- Modify: `src/app/how-it-works/page.tsx`

- [x] Add a shared `.tap-target` utility with `min-height:44px`, `min-width:44px`, `display:inline-flex`, and centered alignment.
- [x] Apply it to the Tollgate logo links, Pause control, reading links, and create-meter links.
- [x] Apply it to other link/button controls on the three public pages where needed.

### Task 5: Verification

**Files:**
- Verify only.

- [x] Run `npm test -- --run`.
- [x] Run `npm run build`.
- [x] Browser-check home CTA at `1440px` and `390px`.
- [x] Browser-check the keyless sample, recorded choice, and real-task form at `1440px` and `390px`.
- [x] Inspect mobile tap target dimensions at `390px`.
