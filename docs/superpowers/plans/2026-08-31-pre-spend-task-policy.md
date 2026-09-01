# Pre-spend task policy

## Outcome

A user approves one OpenAI model for a named task. When a later request carries that task ID, Tollgate replaces the requested model before sending the call, records both models, and returns headers proving whether the rule was applied.

## Build

1. Store one active model rule per project and task.
2. Add an authenticated dashboard endpoint to create, change, or remove that rule.
3. Resolve the rule before provider spend and keep the original request model in safe metadata.
4. Let the dashboard approve a measured model and show the active rule plus enforced calls.
5. Test rule lookup, routing, metadata privacy, dashboard actions, build, and the browser flow.

## Explicit cuts

- OpenAI models only.
- A task header remains required for enforcement.
- Manual approval only; no automatic quality judgment.
- No budgets, alerts, multi-provider credentials, or customer billing.
