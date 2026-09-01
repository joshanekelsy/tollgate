# Launch posts

## LinkedIn

Your AI provider bill tells you what you owe.

It does not tell you what each customer should pay.

Today I am launching the private beta of **Tollgate** for early AI SaaS teams.

Tollgate meters selected OpenAI, Anthropic, Gemini, and OpenRouter text-generation requests by customer. Add a customer ID and a unique retry ID, and it builds the usage record needed for billing without storing prompts or responses.

From one dashboard you can:

- inspect accepted, failed, duplicate, unattributed, and unpriced events
- keep test and live usage separate
- map usage to billing customers
- set default or customer-specific pricing
- close a completed month into fixed billing records
- export CSV or create Stripe draft invoices

This version is deliberately narrow. It supports selected non-streaming generation endpoints and US Stripe accounts. It does not handle tax, subscriptions, payment collection, streaming, image, audio, or every AI workflow.

I am looking for technical founders with their first 0-10 customers who currently reconcile model usage by hand, from logs, or in a spreadsheet.

Create a private beta meter or inspect the public sample dashboard:

https://tollgate-sigma.vercel.app

How are you currently deciding what each AI customer should pay?

#GrowthX #build-week

## GrowthX community

**Build Week launch: Tollgate**

The problem I chose was simple to describe and painful to operate:

AI provider invoices show total model spend, but early SaaS teams still have to work out what each customer should be billed.

I built Tollgate to connect those two records.

The private beta now includes:

- customer-level metering for selected OpenAI, Anthropic, Gemini, and OpenRouter generation requests
- separate test and live write keys
- duplicate-safe request handling
- an event debugger for failed, duplicate, unattributed, and unpriced calls
- customer records and pricing rules
- fixed monthly billing runs
- CSV export and Stripe draft invoice creation
- no prompt or response storage

The biggest Build Week lesson was that adding more providers was not the same as finishing the product. The useful product only appeared after the complete loop worked: request → customer → price → fixed month → billing output.

I am looking for a few technical founders with 0-10 customers who are already feeling this problem. The product is intentionally limited to selected non-streaming workflows while I validate the billing loop.

Try the private beta or explore the sample dashboard:

https://tollgate-sigma.vercel.app

Feedback I would value most: what would stop you from routing one test customer through this?

#GrowthX #build-week

## Launch image

`public/social/tollgate-launch-v3.png`
