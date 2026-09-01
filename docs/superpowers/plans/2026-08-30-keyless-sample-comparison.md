# Keyless Sample Comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a first-time meter owner complete and record one clearly labelled sample model comparison before Tollgate asks for an API key.

**Architecture:** Keep sample results as immutable client-side product evidence so they never enter Convex or contaminate live telemetry. Reuse the existing comparison result cards and winner state, then reveal the paid live-comparison form after the sample decision. Translate provider failures at the UI boundary so raw provider JSON never reaches the visitor.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, existing CSS.

**Spec:** User feedback received 30 August 2026: keyless sample first, safe API-key error, and a meaningful empty dashboard.

## Global Constraints

- Sample data must always be labelled as pre-run sample data.
- Sample values must not be added to live spend, call counts, or Convex.
- API keys, prompts, and outputs must not be stored.
- OpenAI remains the only supported provider in this milestone.
- Routing, budgets, alerts, and enforcement remain out of scope.

---

### Task 1: Sample evidence and safe error copy

**Files:**
- Modify: `src/lib/ab-test.ts`
- Modify: `src/lib/ab-test.test.ts`

**Interfaces:**
- Produces: `SAMPLE_COMPARISON_RESULTS`, `SAMPLE_COMPARISON_TASK`, and `friendlyProviderError(status, body)`.

- [ ] Add failing tests for the fixed sample evidence and invalid-key sanitisation.
- [ ] Run `npm test -- src/lib/ab-test.test.ts` and confirm failure.
- [ ] Add immutable sample data and map invalid-key responses to: “That key was rejected by OpenAI. Check it starts with sk- and has not been revoked.”
- [ ] Run the focused test and confirm it passes.

### Task 2: Keyless first comparison

**Files:**
- Modify: `src/components/ab-test-runner.tsx`
- Modify: `src/components/dashboard-client.tsx`
- Modify: `src/app/dashboard.css`

**Interfaces:**
- Consumes: sample evidence and `friendlyProviderError` from Task 1.
- Produces: `ABTestRunner` with optional `startWithSample?: boolean`.

- [ ] Start an empty meter in sample mode with both outputs, costs, and latency visible.
- [ ] Let either sample output be recorded locally as the sample winner.
- [ ] After the choice, show “Run with your own task” and only then reveal the API-key form.
- [ ] Deduplicate two identical provider failures into one safe error message.
- [ ] Keep live task comparisons in live mode.
- [ ] Style sample labels, decision confirmation, and mobile states.

### Task 3: Honest empty dashboard

**Files:**
- Modify: `src/components/dashboard-client.tsx`
- Modify: `src/app/dashboard.css`

**Interfaces:**
- Consumes: existing live summary only.
- Produces: verbal empty metrics without sample/live data mixing.

- [ ] Replace empty `$0.000000`, `0%`, and `0 of 0` metrics with “No live calls” and “Not started.”
- [ ] Explain that the sample comparison stays separate from telemetry.
- [ ] Preserve numeric metrics once the first live call exists.

### Task 4: Verification

**Files:**
- No product files added.

- [ ] Run `npm test`.
- [ ] Run `npm run build` and `git diff --check`.
- [ ] Create a fresh meter locally and verify sample → choose → live form.
- [ ] Verify invalid-key copy contains no raw JSON or key fragment.
- [ ] Capture desktop and mobile dashboard screenshots.
- [ ] Deploy to Vercel only after all checks pass.

