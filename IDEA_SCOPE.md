# Tollgate — Locked Idea Scope

## Idea

Tollgate is a proxy that records the cost of AI-agent API calls and shows what the same token counts would cost on a cheaper model.

## Who it is for

Founders and engineering leads who pay OpenAI, Anthropic, Gemini, OpenRouter, or hosted open-model API bills directly. Subscription-only Cursor, Claude, and ChatGPT users are not the M1 customer.

## Job to be done

> When my agents are running, tell me what they are costing me before the bill arrives.

## Core action

Owner points an OpenAI-compatible client at Tollgate → makes a real model call → sees that call and its estimated cost appear live.

## M1 does

- Accept `POST /p/{projectId}/v1/chat/completions` with non-streaming JSON.
- Give each tester a random project-specific proxy URL that assigns calls to one project.
- Forward the tester's provider API key from the standard authorization header; hold it only in request memory and never store or log it.
- Protect each project dashboard with a separate access code stored only as a secure hash.
- Work with direct OpenAI first.
- Keep OpenRouter as the second supported adapter, not a dependency.
- Record provider, model, input tokens, output tokens, estimated cost, latency, status, and time.
- Show spend today, spend this week, and the latest 50 calls.
- Publish a landing page at `/` with one action: apply to test Tollgate with a direct API bill.
- Show the private meter at `/p/{projectId}/dashboard`; the separate dashboard access code is required to view it.
- Show a clearly labelled same-token estimate for a cheaper model.
- Store no prompt text, response text, authorization header, or provider key.

## M1 does not do

- Route requests automatically.
- Claim the cheaper model would produce equivalent work.
- Support streaming, teams, accounts, budgets, alerts, invoices, or chargeback.
- Support native Anthropic Messages or Gemini GenerateContent request shapes.
- Support every model or provider.
- Measure Cursor or Claude subscription usage.
- Build pricing, checkout, a blog, or a multi-page marketing site.
- Create self-service accounts or project provisioning; the builder provisions the first three projects manually.

## Riskiest assumption

An owner of a direct model API bill will let their provider key pass through Tollgate for one non-production request when the key and content are never persisted.

## Proof required

One external API-bill owner sends a real call through the deployed product without the builder operating it for them.

## First three users

- Eshant — qualify whether he owns or influences a direct model API bill.
- Murali — qualify whether he owns or influences a direct model API bill.
- One named GrowthX founder or engineering lead who pays a direct model API bill.

If Eshant or Murali only use subscriptions, replace them; do not count polite feedback as validation.

## Saturday numbers

- Qualified API-bill owners contacted.
- Setup attempts.
- Successful external first calls.
- Calls metered.
- Estimated spend observed.
- Users who ask to continue, add a budget, or add another provider.

## Parking lot

Routing, budgets, alerts, teams, projects, chargeback, native Anthropic, native Gemini, hosted Meta adapters, streaming, provider fallback, quality evaluation, and automatic price updates.
