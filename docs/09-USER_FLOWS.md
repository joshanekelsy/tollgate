# User Flows

## Flow 1 - create and enter a meter

Landing -> enter work email -> meter created -> save the one-time recovery code, test write key, and live write key -> continue to Setup -> automatic private-session unlock.

If automatic unlock fails, the three one-time secrets and download remain available with a retry path. A returning user opens the meter with its recovery code. A session lasts up to 12 hours and can be ended from Sign out.

## Flow 2 - send protected usage

Setup -> choose Test or Live -> copy a request example -> keep the provider key in the application -> send `X-Tollgate-Key`, `X-Tollgate-Idempotency-Key`, and `X-Tollgate-Customer` -> inspect the event.

A missing or wrong write key is rejected before provider spend. Reusing a retry ID does not send or record the request twice. Reusing it with a different request is rejected as a conflict. Test and live events remain separate.

## Flow 3 - create customers and pricing

Customers -> add display name, billing email, optional Stripe customer ID, and active status. Calls create placeholder customer records when an unseen customer ID arrives, but month close requires complete active customer details.

Pricing -> set a project default or customer override -> choose percentage markup or fixed USD per 1,000 tokens -> add optional base charge and included tokens -> save. Add exact provider/model input and output rates when provider cost is unavailable.

## Flow 4 - inspect events

Events -> filter by environment, status, customer, provider, model, or request ID -> inspect accepted, duplicate, failed, unattributed, and unpriced calls. Stored evidence excludes provider keys, prompts, responses, and tool arguments.

## Flow 5 - close a month

Billing runs -> select a completed UTC month -> review blockers -> close. Tollgate saves a fixed customer statement with the applied price and source-call IDs. Repeating the close returns the same run rather than duplicating charges.

Download CSV for another billing system. With a connected US Stripe account and mapped customers, create draft invoices. Tollgate does not finalize, send, or collect them.

## Flow 6 - explore the public sample

Landing -> Sample dashboard -> explore Overview, Events, Customers, Pricing, Billing runs, and Setup with one read-only dataset -> Create a private meter.

## Acceptance

The full product test covers meter creation, recovery, write-key rejection, real provider ingestion when a test provider key is available, duplicate and conflict handling, test/live isolation, customer setup, pricing, event filters, completed-month close, repeat-close safety, CSV output, Stripe-without-connection failure, and public sample navigation on desktop and mobile.

## Failure states

Missing or expired sessions show recovery. Wrong recovery codes do not lose the meter ID. Missing customer details, missing pricing, unattributed usage, and unpriced percentage usage block month close with a specific reason. Missing provider cost is never treated as zero. Invalid or unsupported provider requests are rejected. Failed loading offers retry without claiming that data changed.
