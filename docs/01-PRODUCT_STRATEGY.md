# Product Strategy

## One-paragraph test

An engineering lead running several AI agents sees usage accumulate across models and provider dashboards. Every time agents run, they try to control spend, but learn the cost after the work or after the bill. Today they inspect provider dashboards and manually compare model prices. Tollgate: route a call through the proxy → see its estimated cost immediately. It worked if they can identify meaningful spend before the bill arrives.

## Evidence ledger

### Stated by the founder

- Model limits and manual switching have interrupted urgent work.
- Roughly $500 of available usage can be exhausted in about 15 days, followed by a request for another $500.
- The problem has caused lost time, personal Claude spend, and a missed stakeholder deliverable.
- Eshant, Murali, GrowthX, and LinkedIn are reachable.

### Verified from sources

- OpenAI exposes Chat Completions and reports model token pricing publicly.
- OpenRouter exposes an OpenAI-compatible API and model pricing metadata.
- Provider request formats and usage fields are not universal across OpenAI, Anthropic, and Gemini.

Sources and check dates belong in `docs/DECISION_LOG.md` and must be refreshed before publishing price claims.

### Our inference

- Power users with direct API bills may share the founder's pain, but no external buyer has confirmed willingness to install a proxy yet.
- Visibility is the narrowest credible wedge. Routing is a later outcome and must be earned with observed call data.
- Trust, setup effort, latency, and sending traffic through a new proxy are larger adoption risks than dashboard design.

## Product wedge

Start with one promise: see agent API cost before the bill arrives.

The M1 wedge is deliberately smaller than an AI cost-management platform. Its expansion path is:

1. Meter calls accurately enough to earn trust.
2. Attribute calls to a project, agent, or task.
3. Add budgets and alerts.
4. Recommend cheaper candidates using observed usage.
5. Route only after measuring quality and actual savings.

## Buyer and user

- Economic buyer: founder or engineering leader accountable for the API bill.
- First user: the same person, or a developer who can change an agent's base URL.
- Not M1: finance teams, procurement, or employees using only fixed-price subscriptions.

## Competitive frame

Tollgate is not initially “another model router.” It is an early-warning meter placed in the request path. Provider dashboards show their own usage; Tollgate's long-term advantage would be one control layer across providers, projects, and agents. This advantage is only a thesis until multiple providers and real users are live.

## Kill conditions

Pause or change the idea if any two occur:

- Ten qualified API-bill owners are contacted and fewer than three accept a 15-minute conversation.
- Three observed setup attempts fail because users will not place a third-party proxy in the request path.
- Users say provider dashboards already solve the job and cannot name a decision Tollgate would change.
- No external user completes a real call by Friday evening.

