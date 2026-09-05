# Code Review Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four confirmed proxy and dashboard reliability gaps, and add direct proof that private dashboard routes enforce project-scoped authorization and same-origin mutations.

**Architecture:** The proxy will derive an HMAC fingerprint from the exact prepared provider payload, using the Tollgate write key as the HMAC key so request content cannot be recovered from the stored fingerprint. Provider responses will be read through a fixed byte limit. Dashboard components will use one JSON request helper and always clear working state, while server routes will share one project-session and same-origin guard.

**Tech Stack:** Next.js 16 Route Handlers, React 19 client components, Web Fetch API, Node crypto, Convex, Vitest, Testing Library

**Spec:** `README.md`, `src/app/security/page.tsx`, and the six user-supplied code review findings from 2026-09-05

## Global Constraints

- Never store or log provider credentials, prompts, request bodies, response bodies, or the service token.
- Preserve fixed provider origins, non-streaming request behavior, write-key authentication, billing semantics, and test/live separation.
- Treat a missing or invalid customer header as a client error before provider spend; only an absent header maps to `unattributed`.
- Every dashboard mutation must verify both the signed project session and an exact same-origin `Origin` header.
- Network uncertainty must be stated honestly because a server mutation may have succeeded before the browser lost the response.

---

### Task 1: Strong retry identity and bounded proxy responses

**Files:**
- Modify: `src/lib/proxy.ts`
- Modify: `src/lib/proxy.test.ts`

**Interfaces:**
- Produces: `requestFingerprint(writeKey, customer, preparedRequest): string` using HMAC-SHA256 over the canonical URL, headers, and JSON body.
- Produces: `readResponseBytes(response, maximumBytes): Promise<ArrayBuffer>` which rejects before allocating beyond the limit.
- Consumes: `SAFE_PRIVATE_ID` for an optional `X-Tollgate-Customer` header.

- [x] **Step 1: Add failing tests for payload-sensitive retries, invalid customer IDs, and oversized responses**

```ts
expect(firstFingerprint).not.toBe(secondFingerprint);
expect(response.status).toBe(400); // invalid customer ID, no provider call
await expect(readResponseBytes(response, 4)).rejects.toThrow("Provider response exceeded 4 bytes");
```

- [x] **Step 2: Run the proxy tests and confirm the new cases fail**

```bash
npx vitest run src/lib/proxy.test.ts
```

- [x] **Step 3: Hash the canonical prepared payload with the write key and validate customer IDs**

```ts
const prepared = adapter.prepareRequest(body, matchedPath, routedModel, credentialHeaders);
const requestFingerprint = createHmac("sha256", rawWriteKey)
  .update(canonicalJson({ provider: adapter.id, path, customer: resolvedCustomerId, body: prepared.body }))
  .digest("hex");
```

- [x] **Step 4: Read provider responses through a 4 MiB streaming limit and record a safe failed event when exceeded**

```ts
const MAX_PROVIDER_RESPONSE_BYTES = 4 * 1024 * 1024;
const responseBytes = await readResponseBytes(upstream, MAX_PROVIDER_RESPONSE_BYTES);
```

- [x] **Step 5: Run proxy tests, typechecking, and lint**

```bash
npx vitest run src/lib/proxy.test.ts
npx tsc --noEmit
npm run lint
```

### Task 2: Dashboard network-failure recovery

**Files:**
- Create: `src/lib/dashboard-request.ts`
- Create: `src/lib/dashboard-request.test.ts`
- Create: `src/components/dashboard-network-errors.test.tsx`
- Create: `vitest.config.ts`
- Modify: `src/components/dashboard-pricing.tsx`
- Modify: `src/components/dashboard-customers.tsx`
- Modify: `src/components/dashboard-setup.tsx`
- Modify: `src/components/dashboard-billing-runs.tsx`
- Modify: `src/components/ab-test-runner.tsx`

**Interfaces:**
- Produces: `dashboardJson<T>(input, init): Promise<{ ok: boolean; status: number; data: Partial<T> }>`.
- Consumes: native `fetch`; network failures remain exceptions so each component can show operation-specific uncertainty.

- [x] **Step 1: Add failing helper and component tests for rejected fetches and non-JSON errors**

```ts
vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
fireEvent.click(screen.getByRole("button", { name: "Save customer" }));
expect(await screen.findByText(/connection was interrupted/i)).toBeTruthy();
expect(screen.getByRole("button", { name: "Save customer" })).not.toBeDisabled();
```

- [x] **Step 2: Run the focused dashboard tests and confirm the new cases fail**

```bash
npx vitest run src/lib/dashboard-request.test.ts src/components/dashboard-network-errors.test.tsx
```

- [x] **Step 3: Implement the JSON response helper and use `try/catch/finally` in every listed mutation**

```ts
try {
  const result = await dashboardJson<{ error?: string }>(url, init);
  if (!result.ok) setMessage(result.data.error ?? "The change was rejected.");
} catch {
  setMessage("Connection was interrupted. Refresh to confirm whether the change was saved.");
} finally {
  setSaving(false);
}
```

- [x] **Step 4: Disable mutation buttons while their request is running and safely handle reload failures**

```tsx
<ActionButton disabled={saving}>{saving ? "Saving" : "Save customer"}</ActionButton>
```

- [x] **Step 5: Run the focused component tests, typechecking, and lint**

```bash
npx vitest run src/lib/dashboard-request.test.ts src/components/dashboard-network-errors.test.tsx src/components/ab-test-runner.test.tsx
npx tsc --noEmit
npm run lint
```

### Task 3: Central dashboard authorization and route proof

**Files:**
- Modify: `src/lib/dashboard-auth.ts`
- Create: `src/lib/dashboard-auth.test.ts`
- Create: `src/app/dashboard-routes-auth.test.ts`
- Modify: every mutation route under `src/app/p/[projectId]/dashboard/`
- Modify: `src/app/p/[projectId]/dashboard/unlock/route.ts`
- Modify: `src/app/meter/select/route.ts`

**Interfaces:**
- Produces: `isTrustedDashboardMutation(request): boolean` and `dashboardMutationClient(request, projectId)`.
- Consumes: exact request URL origin, browser `Origin` header, signed HTTP-only dashboard cookie, and expected route project ID.

- [x] **Step 1: Add failing unit tests for missing, malformed, and cross-origin mutation headers**

```ts
expect(isTrustedDashboardMutation(new Request("https://tollgate.test", { method: "POST" }))).toBe(false);
expect(isTrustedDashboardMutation(requestWithOrigin("https://evil.test"))).toBe(false);
expect(isTrustedDashboardMutation(requestWithOrigin("https://tollgate.test"))).toBe(true);
```

- [x] **Step 2: Add failing route tests proving every private GET and mutation rejects when its shared guard returns no client**

```ts
expect(await customersRoute.POST(request, context)).toHaveProperty("status", 403);
expect(dashboardMutationClient).toHaveBeenCalledWith(request, "meter-a");
```

- [x] **Step 3: Centralize duplicated cookie checks and require the mutation guard in each private write route**

```ts
const convex = await dashboardMutationClient(request, projectId);
if (!convex) return noStoreJson({ error: "Access denied" }, { status: 403 });
```

- [x] **Step 4: Apply the origin check to recovery unlock and selector routes before checking recovery codes**

```ts
if (!isTrustedDashboardMutation(request)) return noStoreJson({ error: "Access denied" }, { status: 403 });
```

- [x] **Step 5: Run all dashboard authorization tests and the existing session, encryption, and Stripe signature tests**

```bash
npx vitest run src/lib/dashboard-auth.test.ts src/app/dashboard-routes-auth.test.ts src/lib/session.test.ts src/lib/secret-box.test.ts src/lib/stripe.test.ts
```

### Task 4: Documentation, full verification, and deployment

**Files:**
- Modify: `README.md`
- Modify: `src/app/api-reference/page.tsx`
- Modify: `src/app/security/page.tsx`
- Modify: `docs/DECISION_LOG.md`
- Modify: `docs/superpowers/plans/2026-09-05-review-hardening.md`

**Interfaces:**
- Documents: payload-sensitive private retry fingerprints, 4 MiB response cap, bounded customer IDs, and same-origin dashboard mutations.

- [x] **Step 1: Update the public security contract and engineering decision record**

```text
Retry fingerprints cover the prepared request without storing it; provider responses above 4 MiB are rejected; dashboard writes require a signed project session and same-origin request.
```

- [x] **Step 2: Run the complete local verification suite**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
git diff --check
gitleaks git --redact .
```

- [x] **Step 3: Commit with the GitHub private email and push to `main`**

```bash
git commit -m "security: harden proxy and dashboard operations"
git push origin main
```

- [x] **Step 4: Deploy Vercel and verify health, direct rejection, and one bounded live provider call**

```bash
vercel --prod --yes
curl -fsS https://tollgate-sigma.vercel.app/api/health
```

## Self-Review

- Spec coverage: the retry payload, response memory, network failure, customer ID, dashboard authorization evidence, and comparison privacy findings are each resolved or proven by a named task.
- Placeholder scan: every task names concrete files, functions, tests, commands, and expected behavior; no deferred implementation placeholders remain.
- Type consistency: the proxy helper accepts the prepared JSON body, the dashboard JSON helper returns partial typed data, and all mutation routes consume the same request-plus-project guard.
