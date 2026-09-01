# Customer-One Billing Loop Implementation Plan

> **For agentic workers:** Execute this plan task-by-task in the current worktree. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a US-based Tollgate user accept trusted AI usage, investigate bad events, freeze a monthly customer statement, and create one reviewed Stripe draft invoice without duplicate charges.

**Architecture:** Keep provider request translation in the existing adapter registry. Add a separate Tollgate write-key check before any provider request, record each retry key once, resolve customers and model rates from project-owned records, and copy billable calls into fixed billing-run items at month close. Stripe remains an output connection: Tollgate owns the usage ledger and sends only frozen USD totals.

**Tech Stack:** Next.js 16.3.3 App Router, React 19.2.8, Convex 1.45, TypeScript, Vitest, Playwright, Stripe REST API.

**Spec:** `docs/09-USER_FLOWS.md`, `docs/11-ARCHITECTURE.md`, and the customer-one gap list approved in this conversation.

## Global Constraints

- Tollgate is treated as a US product for V1; money is USD.
- The product never stores provider keys, prompts, responses, authorization headers, or tool payloads.
- A provider adapter supports model IDs only for its listed request workflow; marketing cannot claim every AI workflow.
- Live ingestion requires a rotatable Tollgate write key and an idempotency key, which is a retry ID that prevents the same request being counted twice.
- Test usage and live usage are separate and test usage can never enter a live billing run.
- Only successful, attributed, priced calls can enter a billing run.
- Closed billing-run items never recalculate when pricing or source events change.
- Stripe invoices use `send_invoice`, USD, 30-day terms, and one stable Stripe retry key per billing-run item.

---

### Task 1: Trusted And Repeatable Event Ingestion

**Files:**
- Modify: `convex/schema.ts`
- Modify: `convex/projects.ts`
- Modify: `convex/calls.ts`
- Modify: `src/lib/types.ts`
- Modify: `src/lib/proxy.ts`
- Modify: provider route handlers under `src/app/p/[projectId]/`
- Test: `src/lib/proxy.test.ts`

**Interfaces:**
- `projects.authenticateWriteKey({ projectId, keyHash })` returns `{ environment: "test" | "live" }` or `null`.
- `calls.reserve({ projectId, environment, idempotencyKey, requestFingerprint, now })` returns `"accepted" | "duplicate" | "conflict"`.
- `SafeCallRecord` includes `environment`, `idempotencyKey`, `eventStatus`, and `pricingStatus`.

- [ ] Add failing proxy tests for missing keys, invalid keys, duplicate retry IDs, conflicting retry IDs, and test/live assignment.
- [ ] Add key and event-receipt tables with project-scoped indexes.
- [ ] Generate one test and one live write key during meter creation and store only SHA-256 hashes.
- [ ] Require `X-Tollgate-Key` and `X-Tollgate-Idempotency-Key` before contacting a provider.
- [ ] Reserve the retry ID before the upstream request and finalize it after metadata is stored.
- [ ] Run `npm test -- src/lib/proxy.test.ts src/lib/access-code.test.ts` and confirm all security paths pass.

### Task 2: Customers, Rate Cards, And Event Diagnosis

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/customers.ts`
- Create: `convex/rateCards.ts`
- Modify: `convex/calls.ts`
- Create: dashboard route handlers for customers, rates, events, and key rotation
- Create: `src/lib/rate-card.ts`
- Test: `src/lib/rate-card.test.ts`

**Interfaces:**
- Customer records contain a stable header ID, display name, billing email, optional Stripe customer ID, and active/archived status.
- Exact provider/model rate cards contain input and output USD per million tokens.
- Event results expose `accepted`, `failed`, `duplicate`, `unattributed`, and `unpriced` states without sensitive request data.

- [ ] Write failing tests for exact rate lookup and input/output cost calculation.
- [ ] Add customer upsert and archive mutations scoped to a project and environment.
- [ ] Add exact rate-card save, list, and delete operations.
- [ ] Apply a rate-card estimate when a provider does not report cost.
- [ ] Add a recent-events query that combines calls with duplicate attempt counts.
- [ ] Add authenticated JSON routes with validation for every mutation.
- [ ] Run focused rate, event, and route tests.

### Task 3: Customer-Aware Pricing

**Files:**
- Modify: `convex/schema.ts`
- Replace: `convex/billing.ts`
- Modify: `src/lib/billing.ts`
- Test: `src/lib/billing.test.ts`

**Interfaces:**
- Price rules may be the project default or assigned to one customer.
- Rules support percentage markup, price per 1,000 tokens, and a fixed monthly base plus included usage.
- `billing.previewPeriod` returns blockers and billable customer rows for one live period.

- [ ] Write failing tests for customer override, base charge, included usage, unknown cost, failed calls, and unattributed calls.
- [ ] Store versioned default and customer price rules instead of overwriting one calculation silently.
- [ ] Exclude test, failed, and duplicate events from billable totals.
- [ ] Return explicit blockers rather than turning unknown values into zero.
- [ ] Keep the existing global rule readable during migration.
- [ ] Run `npm test -- src/lib/billing.test.ts`.

### Task 4: Fixed Billing Runs And CSV

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/billingRuns.ts`
- Create: dashboard route handlers for billing runs and CSV export
- Create: `src/lib/csv.ts`
- Test: `src/lib/csv.test.ts`

**Interfaces:**
- `billingRuns.closePeriod` atomically creates one run per project, environment, and UTC period.
- Every run item stores integer cents, call IDs, token totals, the applied price rule, and customer details as a snapshot.
- CSV export reads only run items, never current calls.

- [ ] Write failing CSV escaping and stable-column tests.
- [ ] Add unique period lookup and return the existing run on a repeated close request.
- [ ] Reject close when any successful live call is unattributed, unpriced, or missing an active customer.
- [ ] Copy approved rows into immutable run items and store source call IDs.
- [ ] Add list, detail, close, and CSV routes protected by the project session.
- [ ] Run focused tests and Convex code generation.

### Task 5: Stripe Draft Invoice Output

**Files:**
- Modify: `convex/schema.ts`
- Create: `convex/stripe.ts`
- Create: `src/lib/stripe.ts`
- Create: `src/lib/secret-box.ts`
- Create: Stripe settings, export, and webhook route handlers
- Test: `src/lib/stripe.test.ts`
- Test: `src/lib/secret-box.test.ts`

**Interfaces:**
- A project Stripe connection stores only an AES-256-GCM encrypted restricted key and encrypted webhook secret.
- `createDraftInvoice(runItem)` creates a Stripe invoice and line item with retry keys derived from the fixed run and customer.
- Webhook events update run-item state after signature verification and deduplicate Stripe event IDs.

- [ ] Write failing tests for encryption round-trip, tamper rejection, Stripe form encoding, stable retry keys, and webhook signatures.
- [ ] Validate the Stripe key against `/v1/account` before storing encrypted values.
- [ ] Create one draft invoice per eligible run item using `send_invoice`, USD, and 30-day terms.
- [ ] Persist Stripe invoice IDs before retrying any remaining items.
- [ ] Verify project-specific webhook signatures and ignore repeated event IDs.
- [ ] Map Stripe draft, open, paid, void, and failed states into the billing run.
- [ ] Run focused Stripe tests with mocked HTTP and no real charges.

### Task 6: Six-View Operating Dashboard

**Files:**
- Replace: `src/components/dashboard-client.tsx`
- Modify: `src/app/dashboard.css`
- Modify: `src/lib/meter-links.ts`
- Modify: `src/lib/dashboard-sample.ts`
- Test: dashboard pure-helper and component tests

**Interfaces:**
- Navigation is `Overview · Events · Customers · Pricing · Billing runs · Setup`.
- Overview leads with blockers and the next billing action.
- Events supports state, customer, provider, and text filters.
- Customers edits billing identity and Stripe mapping.
- Pricing manages the default rule and exact model rates.
- Billing runs previews, closes, exports CSV, and pushes drafts to Stripe.
- Setup rotates masked test/live keys and configures Stripe without returning stored secrets.

- [ ] Add all six view IDs to URL helpers and compatibility redirects.
- [ ] Build loading, empty, error, success, disabled, and retry states for every screen.
- [ ] Keep actions as native buttons, inputs, tables, details, and dialogs with visible keyboard focus.
- [ ] Keep the existing restrained neutral dashboard style, 4px spacing unit, borders-only depth, and tabular money values.
- [ ] Verify no horizontal overflow at 1440x900 and 390x844.
- [ ] Run component tests, lint, and production build.

### Task 7: Account And Environment Safety

**Files:**
- Modify: project access and session files
- Modify: onboarding result component and setup copy
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- New meters expose each test/live write key once and never return it again.
- Rotating a key invalidates the previous key immediately.
- Browser sessions renew securely and users can explicitly sign out.

- [ ] Preserve the one-time recovery path while adding explicit sign-out and 12-hour secure sessions for early private customers.
- [ ] Bind every read and write route to the session project ID.
- [ ] Show environment state everywhere a key, event, or billing action appears.
- [ ] Document the supported provider workflows and the US Stripe boundary precisely.
- [ ] Document every required environment variable without secret values.
- [ ] Run access, session, and onboarding tests.

### Task 8: Complete Product Verification And Deployment

**Files:**
- Modify: `scripts/verify-product-flow.cjs`
- Modify: `package.json` only if an exact test command is missing
- Update: `docs/09-USER_FLOWS.md`
- Update: `docs/11-ARCHITECTURE.md`

- [ ] Test happy path: create meter, unlock, rotate test key, record a test event, add a customer and live key, save rates and pricing, record live usage, close a run, download CSV, configure mocked Stripe, and create one draft.
- [ ] Test unhappy paths: missing/invalid write key, duplicate/conflicting retry ID, provider failure, unattributed usage, unpriced usage, inactive customer, repeated close, repeated Stripe export, bad Stripe signature, expired session, and test data isolation.
- [ ] Run `npm test`, `npm run lint`, `npm run build`, and `npm run test:e2e` twice.
- [ ] Inspect desktop and mobile screenshots for clipping, overlap, empty data, error messages, and blocked action clarity.
- [ ] Run `git diff --check` and inspect the final diff without reverting pre-existing work.
- [ ] Deploy the verified commit to Vercel and run production smoke tests against the deployed URL.
