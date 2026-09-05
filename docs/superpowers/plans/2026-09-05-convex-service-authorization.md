# Convex Service Authorization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent direct unauthenticated reads and writes against Tollgate's Convex database while preserving the existing website, dashboard, provider proxy, and billing flows.

**Architecture:** Vercel and Convex share one high-entropy `CONVEX_SERVICE_TOKEN`. Every sensitive public Convex function validates that token before reading or changing data, and only Next.js server routes attach it. The public health query remains token-free because it returns no customer or project data.

**Tech Stack:** Next.js 16 Route Handlers, Convex 1.45 queries and mutations, TypeScript, Vitest, Vercel environment variables

**Spec:** `docs/DECISION_LOG.md` (2026-09-05 server-authorization decision)

## Global Constraints

- Preserve the existing dashboard cookie checks, Tollgate write-key checks, Stripe signature checks, and request privacy behavior.
- Never expose `CONVEX_SERVICE_TOKEN` through a `NEXT_PUBLIC_` variable, response body, log message, client component, tracked file, or test fixture.
- Fail closed when the token is absent, too short, or incorrect.
- Keep `health.check` public and free of private data.
- Do not rotate customer-facing write keys as part of this change.

---

### Task 1: Service authorization boundary

**Files:**
- Create: `convex/serviceAuth.ts`
- Create: `src/lib/convex-service-auth.test.ts`
- Create: `src/lib/convex-service.ts`
- Create: `src/lib/convex-service.test.ts`
- Modify: `.env.example`

**Interfaces:**
- Produces: `serviceAuthArgs`, `requireServiceToken(args)`, `getConvexServiceToken()`, and `withConvexServiceToken(args)`.
- Consumes: `process.env.CONVEX_SERVICE_TOKEN`, with a minimum length of 32 characters.

- [x] **Step 1: Write failing tests for missing, short, incorrect, and valid tokens**

```ts
expect(() => requireServiceToken({ serviceToken: "wrong" })).toThrow("Service authorization failed");
expect(withConvexServiceToken({ projectId: "meter-1" }, configured)).toEqual({
  projectId: "meter-1",
  serviceToken: configured,
});
```

- [x] **Step 2: Run the focused tests and verify they fail**

```bash
npx vitest run src/lib/convex-service-auth.test.ts src/lib/convex-service.test.ts
```

- [x] **Step 3: Implement the Convex validator and Next.js argument helper**

```ts
export const serviceAuthArgs = { serviceToken: v.string() };

export function requireServiceToken(args: { serviceToken: string }) {
  const expected = process.env.CONVEX_SERVICE_TOKEN;
  if (!expected || expected.length < 32 || !constantTimeEqual(args.serviceToken, expected)) {
    throw new ConvexError("Service authorization failed");
  }
}
```

- [x] **Step 4: Add the empty server-only variable to `.env.example` and rerun focused tests**

```text
CONVEX_SERVICE_TOKEN=replace-with-at-least-32-random-bytes
```

- [x] **Step 5: Commit the independently tested boundary**

```bash
git add .env.example convex/serviceAuth.ts src/lib/convex-service-auth.test.ts src/lib/convex-service.ts src/lib/convex-service.test.ts
git commit -m "security: add Convex service authorization"
```

### Task 2: Protect every sensitive database function

**Files:**
- Modify: `convex/applications.ts`
- Modify: `convex/billing.ts`
- Modify: `convex/billingRuns.ts`
- Modify: `convex/calls.ts`
- Modify: `convex/customers.ts`
- Modify: `convex/projects.ts`
- Modify: `convex/rateCards.ts`
- Modify: `convex/stripe.ts`
- Modify: `convex/taskPolicies.ts`
- Preserve: `convex/health.ts`

**Interfaces:**
- Consumes: `serviceAuthArgs` and `requireServiceToken(args)` from Task 1.
- Produces: the existing function names and return values with one additional required `serviceToken` argument.

- [x] **Step 1: Add `serviceAuthArgs` to every sensitive function validator**

```ts
args: {
  ...serviceAuthArgs,
  projectId: v.string(),
}
```

- [x] **Step 2: Make authorization the first handler operation**

```ts
handler: async (ctx, args) => {
  requireServiceToken(args);
  // Existing database logic remains unchanged.
}
```

- [x] **Step 3: Confirm `health.check` is the only unprotected exported Convex function**

```bash
rg -n "export const" convex/*.ts
```

- [x] **Step 4: Regenerate Convex types and typecheck the database layer**

```bash
npx convex codegen
npx tsc -p convex/tsconfig.json --noEmit
```

- [x] **Step 5: Commit the protected database layer**

```bash
git add convex
git commit -m "security: require authorization for Convex data access"
```

### Task 3: Authorize every trusted server call

**Files:**
- Modify: `src/lib/dashboard-auth.ts`
- Modify: `src/app/apply/route.ts`
- Modify: `src/app/meter/select/route.ts`
- Modify: `src/app/p/[projectId]/v1/chat/completions/route.ts`
- Modify: `src/app/p/[projectId]/providers/[provider]/[...path]/route.ts`
- Modify: every route under `src/app/p/[projectId]/dashboard/`
- Modify: `src/app/api/stripe/webhook/[projectId]/route.ts`
- Modify: `scripts/provision-project.ts`
- Modify: `scripts/verify-product-flow.cjs`

**Interfaces:**
- Consumes: `withConvexServiceToken(args)` from Task 1.
- Produces: unchanged HTTP request and response contracts; the token exists only between the Next.js server or trusted script and Convex.

- [x] **Step 1: Make server configuration checks require the service token**

```ts
const serviceToken = getConvexServiceToken();
if (!convexUrl || !serviceToken) return Response.json({ error: "Service is not configured" }, { status: 503 });
```

- [x] **Step 2: Attach the token to every Convex query and mutation**

```ts
await convex.query(api.customers.list, withConvexServiceToken({ projectId, environment }, serviceToken));
```

- [x] **Step 3: Keep the public health query unchanged**

```ts
await new ConvexHttpClient(convexUrl).query(api.health.check, {});
```

- [x] **Step 4: Update trusted provisioning and acceptance-test scripts to require the token**

```js
assert(serviceToken, "CONVEX_SERVICE_TOKEN is required");
```

- [x] **Step 5: Run typechecking and all unit tests**

```bash
npx tsc --noEmit
npm test
```

- [x] **Step 6: Commit the server integration**

```bash
git add src scripts convex/_generated
git commit -m "security: authenticate server database calls"
```

### Task 4: Documentation, deployment, and live rejection test

**Files:**
- Modify: `README.md`
- Modify: `src/app/security/page.tsx`
- Modify: `docs/DECISION_LOG.md`

**Interfaces:**
- Consumes: one identical 64-character random token configured in Vercel and the production Convex deployment.
- Produces: a live deployment where authorized product flows work and direct database calls fail.

- [x] **Step 1: Document the server-only authorization boundary**

```text
CONVEX_SERVICE_TOKEN authorizes Vercel's server routes to call protected Convex functions. Configure the same random value in Vercel and Convex; never prefix it with NEXT_PUBLIC_.
```

- [x] **Step 2: Generate and configure one token without printing it**

```bash
service_token=$(openssl rand -hex 32)
npx convex env set --prod CONVEX_SERVICE_TOKEN "$service_token"
printf '%s' "$service_token" | vercel env add CONVEX_SERVICE_TOKEN production
```

- [x] **Step 3: Run the complete verification suite before deployment**

```bash
npm test
npm run lint
npx tsc --noEmit
npm run build
```

- [x] **Step 4: Deploy Convex and Vercel, then verify product health**

```bash
npx convex deploy
vercel --prod
curl -fsS https://tollgate-sigma.vercel.app/api/health
```

- [x] **Step 5: Prove missing and incorrect tokens are rejected without printing private records**

```bash
npx convex run --prod customers:list '{"projectId":"meter-security-check","environment":"live","serviceToken":"incorrect-token"}'
```

Expected: the call fails with `Service authorization failed` before any database read.

- [x] **Step 6: Verify the live meter creation and provider proxy paths still work, then rerun the secret scan**

```bash
npm run test:e2e
gitleaks git --redact .
```

- [x] **Step 7: Commit the documentation and deployment record**

```bash
git add README.md src/app/security/page.tsx docs/DECISION_LOG.md docs/superpowers/plans/2026-09-05-convex-service-authorization.md
git commit -m "docs: record Convex authorization boundary"
```

## Self-Review

- Spec coverage: all 39 sensitive deployed functions, all Next.js callers, both trusted scripts, environment configuration, privacy documentation, and live rejection verification are included.
- Placeholder scan: all implementation examples contain concrete function names, environment names, commands, and expected results.
- Type consistency: `serviceToken` is the only new Convex argument; `withConvexServiceToken` returns the same argument object plus that required string.
