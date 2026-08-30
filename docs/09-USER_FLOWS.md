# M1 User Flows

Only Flow 3 delivers the core product value. Flows 1 and 2 acquire and prepare the tester; Flow 4 lets them understand the result; Flow 5 handles predictable failures.

## Flow 1 — apply to test

**Actor:** API-bill owner  
**Entry:** `/` from GrowthX, LinkedIn, or a direct link  
**Outcome:** one qualified test application exists

1. Visitor reads the promise and security boundary.
2. Visitor selects `Apply to test Tollgate`.
3. Visitor enters name, work email, direct provider, and optional pain.
4. Tollgate validates the required fields.
5. Tollgate stores the application and its source.
6. Visitor sees confirmation without an automatic access promise.

Failure states:

- Invalid field: keep entered values and explain the exact field.
- Duplicate email: show the same success message; do not create another row.
- Server failure: preserve the form and state that nothing was recorded.

Acceptance: one valid submission creates one application and no provider key is requested.

## Flow 2 — manually provision one tester

**Actor:** builder-admin  
**Entry:** qualified applicant agrees to a non-production test  
**Outcome:** tester receives an isolated project base URL and dashboard code

1. Builder confirms the tester pays OpenAI directly and can change a client's base URL.
2. Builder creates a random project ID and a separate random dashboard code.
3. Tollgate stores the project, server-assigned `external` traffic type, provider, active state, and only the dashboard-code hash.
4. Builder sends the project base URL, dashboard URL, dashboard code, supported model, and limitation statement privately.

Failure states:

- Applicant is subscription-only: do not provision; record as unqualified.
- Applicant needs streaming or another provider: do not pretend support; record the blocker.
- Plain dashboard code appears in storage or logs: stop the release and rotate it.

Acceptance: the plain dashboard code exists only in the private handoff and the tester's possession.

## Flow 3 — send the first metered call

**Actor:** technical operator  
**Entry:** project handoff received  
**Outcome:** a call paid by the tester's OpenAI key is metered

1. Tester sets `OPENAI_BASE_URL` to `https://<host>/p/<projectId>/v1`.
2. Tester keeps `OPENAI_API_KEY` set to their own non-production OpenAI key.
3. Tester sends one supported non-streaming Chat Completions request.
4. Tollgate resolves the project and validates provider, model, body, and authorization presence without logging sensitive values.
5. Tollgate forwards the request and original authorization to direct OpenAI.
6. OpenAI returns the response and usage.
7. Tollgate returns the response to the client without changing its meaning.
8. Tollgate stores only project-scoped metadata and the cost status.

Failure states:

- Unknown or inactive project: reject before OpenAI.
- Missing authorization: reject before OpenAI.
- Streaming or unsupported model: reject before OpenAI and name the supported boundary.
- OpenAI rejects the key or request: preserve the safe status; store no provider response body.
- Usage cannot be priced honestly: record the call with cost `Unavailable`.

Acceptance: one successful row has non-zero usage, belongs to the correct external project, and contains no content or authorization.

## Flow 4 — unlock and understand the dashboard

**Actor:** API-bill owner  
**Entry:** `/p/{projectId}/dashboard`  
**Outcome:** owner sees the latest call and understands the estimate

1. Dashboard requests the separate access code.
2. Tester enters the code.
3. Server verifies the stored hash and creates a short-lived project-scoped session.
4. Dashboard shows spend today, spend this week, and the latest 50 project calls.
5. Dashboard polls every two seconds.
6. The new call appears with provider, model, tokens, latency, status, and estimated cost.
7. The comparison reads `Same-token estimate—not tested savings` with its limitation.

Failure states:

- Wrong or missing code: reveal no project metadata.
- Project A session opens Project B: return `403` and no metadata.
- No calls: show `Waiting for your first request` and setup lines.
- Price unavailable: explain why instead of showing zero.

Acceptance: the tester finds their first call without refresh or spoken guidance and can explain what the comparison does not prove.

## Flow 5 — give evidence after the first call

**Actor:** API-bill owner  
**Entry:** first call visible  
**Outcome:** one product decision is captured

1. Builder asks whether the number is trusted.
2. Builder asks what decision the number would change today.
3. Builder records the largest blocker in the validation table.
4. Builder asks for a $20 paid 30-day meter pilot.
5. Builder records payment, written commitment, rejection reason, or requested must-have.

Acceptance: evidence is recorded as observed behavior, direct statement, or inference—never blended together.

