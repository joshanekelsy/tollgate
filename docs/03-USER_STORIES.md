# User Stories

## Attribute customer usage

As an AI-product operator, I can include a customer ID on each supported model call so usage belongs to the customer who caused it.

Acceptance: `X-Tollgate-Customer` is stored as `customerId`; absent or blank values become `unattributed`.

## Set one price

As the person responsible for monetization, I can set either a percentage markup on raw model cost or a fixed USD price per 1,000 combined tokens.

Acceptance: one non-negative rule is stored per project and saving a replacement recalculates the view.

## Review invoice-ready totals

As the bill owner, I can see current-month calls, tokens, raw model cost, billed amount and margin for every customer.

Acceptance: rows are grouped by customer ID and sorted by billed amount, highest first.

## Preserve privacy

As a security-conscious operator, I can meter usage without Tollgate persisting provider keys, prompts, responses or tool payloads.

Acceptance: only safe usage and attribution metadata enters Convex.
