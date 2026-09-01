# Public demo and product film

## Outcome

Turn the synthetic, measured demo traffic into public proof without exposing a private dashboard or overstating automatic routing.

## Public demo contract

- Hard-code the existing demo project on the server.
- Publish task ID, model, token count, estimated cost, latency, status and measurement time only.
- Never publish access codes, database IDs, provider request IDs, session IDs, agent names, prompts or responses.
- Label tasks as synthetic and measurements as real.
- Explain that lower cost does not prove equal quality.

## Product film

- Four scenes: invisible calls, task attribution, measured comparison, recorded decision.
- Use real measured proposal-rewrite costs.
- Autoplay as a restrained interface sequence with pause and scene controls.
- Respect reduced-motion preferences.
- Describe routing policy as the next step, not a current capability.

## Acceptance checks

- `/demo` loads without a dashboard access code.
- `/demo` contains three synthetic tasks and seven real calls.
- No sensitive identifiers appear in the rendered page.
- Homepage links to `/demo` and the film can be paused.
- Desktop, mobile, reduced-motion and production build checks pass.
