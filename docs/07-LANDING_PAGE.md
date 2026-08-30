# Landing Page Specification

## Purpose

Recruit qualified direct API-bill owners for one non-production Tollgate test.

## Primary action

`Apply to test Tollgate`

There is no second competing CTA. A small GitHub link may appear in the footer after the repository is public.

## Audience context

Visitors arrive from a direct message, GrowthX, or LinkedIn. They may understand model APIs but do not yet trust a new proxy. The page must answer three questions quickly: what is this, is it for me, and what data does it store?

## Page copy

### Navigation

Wordmark: `Tollgate`

Right-side label: `Built during GrowthX Build Week 2026`

### Hero

Eyebrow: `Early access · GrowthX Build Week 2026`

Headline: `Know what your AI agents cost before the bill arrives.`

Subheadline: `I’m building Tollgate for teams paying OpenAI directly: a live meter for supported API calls, with an honest same-token estimate against a cheaper model. Apply to test one non-production call this week.`

Primary CTA: `Apply to test Tollgate`

Trust line: `Your OpenAI key and content pass through for the request but are never stored or logged. No automatic routing. No claim that cheaper means equivalent.`

### Problem

Heading: `Agent spend moves faster than the dashboard review.`

Body: `A coding agent can make many model calls while you focus on the task. By the time the invoice or usage warning gets your attention, the spend has already happened. Provider dashboards show their part of the bill; Tollgate is being built as one early-warning layer across agents and providers.`

### How it works

Heading: `One change. One real call. One visible cost.`

1. `Point a non-production OpenAI Chat Completions client at your project URL.`
2. `Keep using your own OpenAI key; Tollgate forwards it for that request without storing it.`
3. `The call appears live with usage, estimated cost, and a same-token comparison.`

### Product proof

Heading: `See the call, not another abstract cost chart.`

Show one real dashboard screenshot only after the flow works. The image must display provider, model, tokens, estimated cost, latency, and the comparison limitation. Do not use fabricated traction numbers.

### Honest boundary

Heading: `An estimate you can trust for what it is.`

Body: `Tollgate re-prices the original input and output token counts. It does not re-run the task on the cheaper model, test output quality, account for retries, or prove savings. Your provider invoice remains the billing authority.`

### Test application

Heading: `Run one non-production call through Tollgate.`

Body: `I am looking for founders and engineering leads who pay OpenAI directly and can test one non-production Chat Completions call during Build Week.`

Fields:

- `Name`
- `Work email`
- `Which provider do you pay directly?`
- `What happened the last time usage surprised you? (optional)`
- Hidden `source` from the incoming link when available

Button: `Apply to test Tollgate`

Success message: `Application received. I’ll confirm whether the Build Week test supports your setup before sharing access.`

Error message: `That did not go through. Please try again—your form has not been recorded.`

### FAQ

**Does Tollgate route work to cheaper models?**  
Not in M1. It measures the current call and shows a clearly labelled same-token estimate.

**Does it store prompts or responses?**  
No. Your key, prompt, and response pass through the server for the request but are not persisted or logged. M1 stores usage metadata such as provider, model, tokens, estimated cost, latency, status, and time.

**Does it replace the provider invoice?**  
No. Tollgate gives an operational estimate; the provider invoice remains authoritative.

**Does it require OpenRouter?**  
No. Build Week testing supports direct OpenAI first. OpenRouter remains a later adapter until it passes a real-provider test.

**Can I connect a production workload?**  
Not during Build Week. The first release is for one non-production test.

### Final CTA

Heading: `Find the expensive call before it becomes an expensive month.`

Button: `Apply to test Tollgate`

## Alternatives to test later

Headline B: `See agent API spend while the work is still running.`

CTA B: `Run one test call`

Do not run a headline test during Build Week unless traffic is large enough to learn from it.

## Metadata

Page title: `Tollgate — See AI agent cost before the bill arrives`

Meta description: `Meter AI-agent API calls as they happen and compare the same token counts against a cheaper model. Apply to test Tollgate with one non-production call.`

## Acceptance test

- A target visitor can state what Tollgate does, who it is for, and what it does not prove after reading the first screen.
- The form stores one test application and shows the correct success state.
- No secret, fake testimonial, unsupported provider, or fabricated saving appears.
- The page says that credentials and content pass through but are not stored; it does not claim that Tollgate never sees them.
- Source is captured for GrowthX, LinkedIn, and direct links.
