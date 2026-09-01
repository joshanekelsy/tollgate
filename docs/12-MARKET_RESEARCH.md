# Market Research — Tollgate

Checked: 30 August 2026

## Executive conclusion

There is a real market for AI cost visibility and control. Enterprise foundation-model API spending is large, FinOps teams increasingly manage AI spend, and established products already sell request-level cost tracking, budgets, and gateways.

That proves the category, not Tollgate.

Tollgate M1 is a narrow product in a competitive market. [Helicone](https://www.ycombinator.com/companies/helicone) and [LiteLLM](https://www.ycombinator.com/companies/litellm) were both funded by Y Combinator in W23, and [Respan](https://www.ycombinator.com/companies/respan) was funded in W24; each covers parts of gateway, observability, evaluation or routing. This validates the category and removes “basic cost dashboard” as a defensible position.

Tollgate's sharper thesis is task-level model decisions: observe what recurring agent work costs, compare real outputs across models, record the approved result, and eventually enforce and measure that decision. The compounding advantage would be customer-specific task, quality and routing history—not the proxy itself. Build Week must validate whether a bill owner completes and acts on that loop.

## Market definition

### Category

AI gateway cost observability: software placed in or beside the model request path to record usage, calculate cost, attribute spend, and eventually enforce controls.

### M1 market

Technical founders and engineering leads who:

- Pay OpenAI directly.
- Run non-streaming Chat Completions workloads.
- Can change a client's base URL.
- Experience cost surprise before provider billing catches up with the decision.
- Will allow one non-production request to pass through a third-party proxy.

### Expansion market

Teams operating models across OpenAI, Anthropic, Gemini, OpenRouter, and hosted open models that need project attribution, budgets, alerts, governance, quality-aware routing, or internal chargeback.

## Evidence ledger

### Stated by the founder

- Model usage limits and manual switching interrupted urgent work.
- Roughly $500 of available usage could be exhausted in about 15 days, requiring more budget.
- Personal model subscriptions were used when work access was constrained.
- The interruption contributed to a missed stakeholder deliverable.

This proves founder pain, but it mostly arose from subscriptions and usage limits. It does not yet prove direct-API customer demand.

### Verified from sources

- Menlo Ventures estimated 2025 enterprise foundation-model API spending at **$12.5 billion**, based on a survey of 495 U.S. enterprise AI decision-makers plus a market model. Menlo also estimated OpenAI at **27%** of enterprise LLM spend, Anthropic at 40%, and Google at 21%. Menlo explicitly notes that these are estimates and the survey is limited to U.S. enterprises. [Menlo Ventures enterprise AI report](https://menlovc.com/perspective/2025-the-state-of-generative-ai-in-the-enterprise/)
- The FinOps Foundation's 2026 survey reports that **98% of respondents manage AI spend**, AI cost management is the top skillset teams want to develop, and most surveyed FinOps practices report into CTO/CIO organizations. The sample represents FinOps practitioners, not all businesses. [State of FinOps 2026](https://data.finops.org/)
- OpenAI reported **more than one million business customers**, including both ChatGPT business subscriptions and organizations consuming models through the developer platform. OpenAI does not separate direct API organizations in that figure, so it is an upper bound—not a usable customer count for Tollgate. [OpenAI business customer announcement](https://openai.com/index/1-million-businesses-putting-ai-to-work/)
- Portkey documents real-time per-request cost, token tracking, provider breakdowns, budgets, and a $49/month Pro plan. [Portkey cost management](https://portkey.ai/docs/product/observability/cost-management), [Portkey plan comparison](https://portkey.ai/docs/product/product-feature-comparison)
- Helicone documents multi-provider cost tracking, gateway pricing, session-level unit economics, alerts, and automatic model selection. [Helicone cost tracking](https://docs.helicone.ai/guides/cookbooks/cost-tracking)

### Our inference

- AI cost management has budget and executive attention.
- A lightweight meter may appeal to smaller technical teams that find broader gateways excessive.
- A pass-through proxy creates trust and switching costs before it creates value.
- Native provider dashboards and established gateways make cost visibility alone a weak long-term moat.

## TAM — total addressable market

TAM represents the future multi-provider AI cost-control platform, not the OpenAI-only M1.

### Spend-pool method

Verified foundation-model API spend estimate:

```text
$12.5B annual enterprise foundation-model API spend
```

Assumption: companies may spend **0.5%–2.0%** of managed API cost on visibility, allocation, controls, and optimization software.

```text
Low TAM  = $12.5B × 0.5% = $62.5M annual software revenue
High TAM = $12.5B × 2.0% = $250M annual software revenue
```

**Estimated TAM: $62.5M–$250M in annual revenue.**

This is a scenario range, not an observed market size. The capture-rate assumption must be tested through competitor revenue, customer budgets, and paid pilots.

### Customer method cross-check

OpenAI's one-million-business figure combines subscriptions and API users. If **2%–10%** were direct-API organizations with a cost-control need, that would imply **20,000–100,000** potential OpenAI organizations. At **$240–$1,200 annual revenue per customer**, the implied OpenAI-only opportunity would be:

```text
Low  = 20,000 × $240  = $4.8M ARR
High = 100,000 × $1,200 = $120M ARR
```

Every percentage and price in this cross-check is our assumption. It is included to expose the model, not to claim precision.

## SAM — serviceable available market

SAM applies the current wedge: direct OpenAI users who can run the supported pass-through flow and do not yet require enterprise controls.

Menlo's estimates imply roughly:

```text
$12.5B foundation-model API spend × 27% OpenAI share = $3.375B OpenAI API spend
```

Assumption: only **5%–20%** of this spend sits in teams matching the M1 technical and trust constraints.

```text
Potential managed spend = $169M–$675M
At a 1% software capture rate = $1.7M–$6.8M annual revenue
```

**Estimated M1 SAM: $1.7M–$6.8M in annual revenue.**

This deliberately excludes subscription-only users, streaming-only workloads, Responses API users, other providers, regulated production workloads, and companies already satisfied with a gateway.

## SOM — serviceable obtainable market

SOM is calculated from reach, not global market share.

### Build Week SOM

```text
10 qualified direct contacts
→ 3 setup attempts
→ 1 activated external tester
→ target: 1 paid or written $20–$100 pilot commitment
```

**Build Week SOM: one committed pilot and one real customer-funded call.**

### First 12-month scenario

Base case assumptions:

```text
200 qualified owners reached
× 20% agreeing to a pilot = 40 pilots
× 50% converting to paid = 20 customers
× $49/month reference price
= $11,760 ARR
```

Upside case:

```text
50 paying customers × $99/month = $59,400 ARR
```

**Estimated 12-month SOM: approximately $12K–$59K ARR.**

These are execution targets, not forecasts. The $49 reference is informed by Portkey's documented Pro price; Tollgate has not validated either $49 or $99.

## Competitive landscape

| Alternative | What it already offers | Implication for Tollgate |
|---|---|---|
| OpenAI provider dashboard | Native account usage and billing | Tollgate must be earlier, more actionable, or eventually cross-provider. |
| Portkey | Gateway, per-request cost, budgets, analytics, multiple providers, enterprise controls | Tollgate cannot win by copying a smaller version feature-for-feature. |
| Helicone | Gateway and observability, cost tracking, sessions, alerts, optimization | “Proxy plus cost dashboard” is proven but not differentiated. |
| Manual price comparison | Free and trusted, but delayed and fragmented | Tollgate must make installation easier than continued manual checking. |
| Internal logging | Custom attribution and security control | Tollgate must beat the engineering time and maintenance burden. |

## Wedge and differentiation hypothesis

The defensible claim is not currently “better observability.” The proposed wedge is:

> The fastest honest way for a direct API-bill owner to see a supported agent call's estimated cost before the bill arrives, without persisting prompt or response content.

This may win an initial test through simplicity and privacy boundaries. It is not yet a moat. Potential moats require evidence and later product depth:

- Reliable cross-provider normalized cost data.
- Project and task attribution embedded in agent workflows.
- Historical decisions and quality outcomes tied to routing.
- Budget policies that prevent spend rather than merely report it.
- Distribution through coding-agent or platform integrations.

## YC-scale test

M1 alone is unlikely to support a venture-scale outcome; it is a feature-sized wedge. A stronger company thesis is:

> Tollgate becomes the financial control plane for AI agents: every request is attributed, budgeted, evaluated, and routed against cost and quality policy before spend occurs.

Evidence required before making that pitch confidently:

1. Multiple customers install the meter on real workloads.
2. They ask for project attribution, budgets, or controls without being prompted.
3. Tollgate identifies a decision or saving the provider dashboard did not.
4. At least one customer pays for continued use.
5. Provider expansion increases retained usage instead of only demo appeal.

## Risks that could collapse the market for Tollgate

- Existing gateways already solve the job well enough.
- Provider dashboards become sufficiently real-time and cross-project.
- Teams refuse third-party pass-through for keys or content.
- Small teams do not spend enough to pay for another tool.
- Cost without quality context does not change routing decisions.
- The first personal pain remains subscription-specific and does not transfer to API-bill owners.

## Research gaps

Resolve these with primary interviews rather than more desk research:

- What direct-API spend level creates urgency?
- How late is “too late” in the current workflow?
- Which client can the buyer actually redirect?
- Who approves a proxy in non-production and production?
- Which is the first paid job: visibility, alerting, attribution, or prevention?
- Are buyers replacing a current tool or adding their first one?

## Market verdict

**Proceed with the Build Week wedge. Do not use TAM as proof of demand.** The market category is real, competitors prove willingness to use gateways and cost analytics, and AI cost management is becoming a formal responsibility. Tollgate still needs to prove that its narrower, privacy-conscious setup earns installation and payment.
