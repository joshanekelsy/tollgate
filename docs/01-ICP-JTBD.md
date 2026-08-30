# ICP and JTBD Lock

## Ideal customer profile

### One-sentence ICP

A technical founder or engineering lead who pays OpenAI directly, runs frequent non-production Chat Completions workloads, can change a client's base URL, and discovers unexpected model spend too late to act on it.

### Required qualification

A person is in the M1 ICP only when all five are true:

1. They own or directly influence an OpenAI API bill.
2. They run an AI application, automation, or agent using non-streaming Chat Completions.
3. They can change that client's API base URL.
4. Spend has surprised them, crossed an internal expectation, or required manual checking.
5. They will test one non-production request through a third-party proxy after hearing the data boundary.

### Disqualifiers

- Uses only fixed-price Cursor, Claude, or ChatGPT subscriptions.
- Has no direct OpenAI API key or responsibility for its bill.
- Cannot change the client's base URL.
- Requires streaming, Responses API, native Anthropic, Gemini, or a hosted Meta endpoint immediately.
- Requires production security review before any test.
- Has no recurring cost surprise or decision that earlier visibility would change.

### Buyer, user, and operator

| Role | M1 person |
|---|---|
| Buyer | Founder or engineering lead responsible for the API bill. |
| User | The same bill owner viewing the cost dashboard. |
| Operator | The same person, or a developer who can change the client's base URL. |

For the first three tests, prefer one person who holds all three roles. That removes team coordination from the experiment.

## Pain moment

The trigger is not merely “AI is expensive.” The moment is:

> An agent or AI workflow is still running, usage is accumulating, and the bill owner cannot see the cost early enough to decide whether to stop, change, or investigate it.

## Current workaround

- Wait for the provider dashboard or invoice.
- Check usage manually after a run.
- Compare token counts and model price pages by hand.
- Set informal limits outside the request path.

These are hypotheses until external interviews confirm them.

## JTBD

### Functional job

> When my agents are running, tell me what they are costing me before the bill arrives.

### Emotional job

Avoid the anxiety of discovering after an important run that model usage exceeded expectations.

### Social job

Explain model spend to a manager, cofounder, or team with a credible call-level record rather than a guess.

The functional job controls M1. Emotional and social jobs inform interviews but do not add features.

## Job success

The job is completed when the bill owner sees a recent supported call, its usage, and an honestly labelled estimated cost soon enough to name a decision they would change.

Dashboard views, form submissions, and compliments do not complete the job.

## Buying trigger

One of these has happened recently:

- An API usage alert or invoice arrived later than the useful decision point.
- An agent run consumed more than expected.
- The team manually switched models or stopped work because of cost or limits.
- The owner was asked to explain which workload caused the spend.

## Riskiest assumption

The qualified owner will let their provider key and non-production content pass through Tollgate for one request when neither is persisted or logged.

## Qualification script

Ask in this order and record the words used:

1. Which model-provider bill do you personally own or review?
2. What was the last run whose cost surprised you?
3. When did you discover the cost, and what was already too late to change?
4. Which client made the calls, and can you change its base URL?
5. Would you test one non-production OpenAI Chat Completions request if the key and content pass through but are never persisted or logged?

## Evidence status

### Stated by the founder

- Model usage limits and manual model switching interrupted urgent work.
- Available usage was exhausted faster than expected and required additional budget.
- The interruption contributed to a missed stakeholder deliverable.

### Verified externally

- No external ICP interview or successful pass-through test has been recorded yet.

### Our inference

- Direct API-bill owners may experience a related pain.
- Earlier call-level visibility may change a spend decision.
- Trust in the proxy may be a larger blocker than the dashboard's usefulness.

## First-user gate

Do not call Eshant, Murali, or any GrowthX member an M1 user until the required qualification conditions are confirmed. Replace anyone who is subscription-only or cannot run the supported flow.

