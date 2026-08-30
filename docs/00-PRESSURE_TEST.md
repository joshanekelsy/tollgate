# Pre-Build Pressure Test

## Verdict

**Resolved on 30 August 2026.** The audit originally stopped implementation because the server-held-key design measured the builder's bill. The approved correction is now reflected in the scope and product artifacts: caller-owned provider authorization passes through without persistence, calls are assigned to a random project route, and dashboard access uses a separate hashed code.

## Critical contradiction

### The tester does not measure their own bill

The current product spec says Tollgate uses a server-held OpenAI key. That means calls made by Eshant, Murali, or a GrowthX tester are charged to the builder's provider account. They can experience the interface, but Tollgate is not telling them what *their* agents cost.

This breaks:

- The JTBD: `tell me what my agents are costing me`.
- The target customer: owner of a direct provider bill.
- The external-first-call metric: it is external usage funded by the builder, not observation of the user's bill.
- The landing-page phrase `your configured provider connection`, which the product does not currently provide.

**Resolution:** the tester's standard provider authorization pays for the call, exists only in request memory, and is forbidden from storage and logs.

## High risks

### 1. The dashboard is called private but has no access design

The scope calls `/dashboard` private, while accounts and authentication are excluded. A public dashboard could expose provider, model, timing, tokens, spend, and errors across testers.

Resolution: each project has a separate dashboard access code stored only as a secure hash; reads are server-verified and project-scoped.

### 2. One shared proxy secret cannot identify a user or project

The data model contains `trafficType`, but the request contract does not say how a call becomes internal, demo, or external. Manual labels will become unreliable, and a shared secret cannot isolate users.

Resolution: the random project route identifies the ledger and the project record assigns traffic type server-side.

### 3. The pitch says agents, but M1 proves only a generic API client

Many agents use streaming, provider-native endpoints, tools, or endpoints other than Chat Completions. M1 rejects streaming and supports only one request shape. A curl command or SDK script passing does not prove a coding agent works.

Required correction: name one exact compatible client for the acceptance test. Until it passes, say `AI app or agent using non-streaming Chat Completions`, not all agents.

### 4. The cost estimate is incomplete for current OpenAI pricing

A flat input/output calculation can be wrong when cached input, long-context rates, regional processing, tool charges, or other provider-specific fees apply.

Required correction: either capture the usage details needed for the supported model or tightly limit M1 and disclose which costs are excluded. Unknown or exceptional calls must show `Unavailable`, not a confident estimate.

### 5. Landing-page work competes with the decisive flow

The full landing scope includes multiple sections, a form, attribution, FAQ, and product proof. That is reasonable for GTM but risky within a 3–4 hour Sunday build window.

Required correction: Sunday P0 is hero, trust boundary, tester form, and success state. Problem, FAQ, screenshot, and polished design wait until the real call passes.

## Medium risks

### 6. The first three users are not yet three qualified users

Eshant and Murali are names, but their direct-bill ownership is unknown. “One named GrowthX founder” is still unnamed.

Gate: do not count the list complete until three names confirm they pay or influence a direct API bill and can change a non-production client's configuration.

### 7. The revenue question tests a future product

The current question asks about budgets and multiple providers, neither of which M1 delivers. A positive answer would validate the imagined roadmap, not today's meter.

Correction: after a real call, ask for a paid or written pilot commitment for the meter first. Then ask which next control makes it valuable enough to keep.

### 8. The kill rule waits too long

Waiting until Friday to discover nobody will put a proxy in the path leaves no recovery time.

Correction: require one scheduled install by Sunday night and one attempted external connection by Monday. If neither happens, narrow or reposition on Tuesday.

### 9. The provider roadmap can distract from the wedge

Anthropic, Gemini, Meta, and OpenRouter are correctly parked, but their repeated presence makes the product appear broader than the release.

Correction: the landing page mentions direct OpenAI only until another adapter passes its real-provider acceptance contract.

## Artifact consistency score

| Area | Result | Reason |
|---|---|---|
| Personal pain | Pass | The founder has repeatedly experienced cost, limits, switching, and delivery impact. |
| Target user | Conditional | Direct API-bill owner is clear but named users are not qualified. |
| JTBD | Pass | One outcome: see cost before the bill arrives. |
| M1 outcome | Resolved in artifacts | Caller-owned authorization now pays for the call. Implementation still needs the security tests in the technical contract. |
| Scope control | Pass | Routing, budgets, teams, and native providers are parked. |
| Security | Resolved in artifacts | Pass-through authorization and separate hashed dashboard access are specified; implementation must prove both. |
| Cost honesty | Conditional | Same-token wording is strong; exceptional pricing handling is incomplete. |
| Sunday feasibility | Conditional | Core meter is plausible; full landing page and second adapter are not. |
| GTM | Conditional | Channels and message exist; three qualified testers do not. |
| Revenue proof | Weak | Current prompt asks about future features instead of paying for M1. |
| Build Week story | Pass if one external bill is metered | Personal pain → live call → early cost signal is easy to demonstrate. |

## Recommended correction

For Build Week, use a **hosted pass-through proxy with one isolated test project per user**:

1. The tester keeps using their own provider API key in the standard authorization header.
2. Tollgate holds that key only in memory while forwarding the request and never writes or logs it.
3. A random project route identifies the call ledger, for example a project-specific base URL.
4. The project route is an unguessable access link for M1, explicitly limited to non-production testing.
5. The dashboard shows only that project's metadata.
6. Direct OpenAI is the only required provider.

This is still not enterprise security. It is the smallest version that tests the real job on the user's real provider bill without collecting their key in a form or storing it.

## Revised build gate

Implementation may begin only when the product spec answers all four:

1. Whose provider key pays for the call?
2. Where does the key exist, and where is it forbidden to appear?
3. How is a call assigned to exactly one project?
4. Who can view that project's call metadata?

## Final call

**Conditional build approval.** The architecture blocker is resolved in the documents. Before feature work, the implementation must prove that authorization, prompts, and responses do not enter Convex or application logs and that cross-project dashboard reads fail.
