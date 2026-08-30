# Validation Plan

## Question to answer first

Will a direct API-bill owner let one non-production request, including their provider authorization, pass through Tollgate when neither key nor content is persisted?

## 30-minute no-code test

Send this to one qualified person:

> I keep learning what my agents cost after the work is done. I am building Tollgate: change one non-production client's base URL while keeping your own OpenAI key, then see the call's estimated cost immediately. The request passes through Tollgate, but the key, prompt, and response are never stored or logged. Would you test one call this week? If not, what stops you?

Pass: they agree to connect a non-production task and schedule a time.

Fail: they offer general encouragement but will not connect a task.

## Qualification questions

Ask in this order:

1. Do you or your team pay a model provider directly?
2. Which provider and tool create the spend?
3. When do you learn that spend is higher than expected?
4. What decision would earlier visibility change?
5. Would you let your provider key and content pass through a proxy for one non-production call if neither is persisted?

## Monday sessions — 31 August

Book three 20-minute observed sessions. In each session:

1. Give the project base URL and dashboard code without a live explanation.
2. Ask the user to send one non-production call.
3. Record where they stop, the words they use, and whether they trust the estimate.
4. Ask what they would do next because of the number.

Do not count a session as successful if the builder changes the user's configuration.

## Evidence table

| Person | Direct bill? | Provider | Accepted pass-through? | First call? | Dashboard opened? | Blocker | Decision changed? |
|---|---|---|---|---|---|---|---|

## Decision rule

- Continue: at least one external first call and one user names a decision the cost view changes.
- Narrow: installation works, but trust or comprehension blocks action; fix only that blocker.
- Stop or reposition: qualified users refuse the proxy itself, even for non-production traffic.
