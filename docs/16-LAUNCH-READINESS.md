# Launch readiness — September 1, 2026

## Verdict

**Go for a limited private-beta launch today. Do not position this as a general billing platform or production-ready support for every provider workflow.**

## Ready

- Production application and Convex data layer are live and healthy.
- Landing page, private-meter creation, one-time secrets, Setup, and all six dashboard views work.
- Write keys, retry protection, test/live isolation, event states, customers, pricing, rate cards, fixed month close, CSV, and Stripe draft code are present.
- Public sample dashboard, docs, API reference, security, privacy, changelog, status, and contact pages are reachable.
- Vercel Web Analytics is active.
- LinkedIn/Twitter Open Graph metadata points to a real 1.91:1 launch image.
- `robots.txt` and `sitemap.xml` expose public pages and block private product routes from crawling.
- The full production browser suite passed at desktop and mobile sizes, including a real OpenAI request and expected failure paths.

## Launch limits that must stay in the copy

- Selected non-streaming OpenAI/OpenRouter Chat Completions, Anthropic Messages, and Gemini GenerateContent only.
- A real successful provider call has been verified with OpenAI. Anthropic, Gemini, and OpenRouter still need valid-key production happy-path tests.
- Stripe behavior is tested in code, but a real Stripe test-account draft has not been created yet.
- Access uses a recovery-code session, not team accounts, OAuth, or SSO.
- Sentry and Amplitude code is installed but inactive until account keys are supplied. Vercel traffic and runtime logs remain available.
- The launch uses a Vercel domain. A custom domain will improve trust but does not block a small private beta.

## Before charging customers

- Complete one real Stripe test-account draft flow.
- Add reviewed beta terms and a data-processing agreement where required.
- Add normal account and team access.
- Define retention and deletion operations.
- Test every provider workflow claimed in sales copy with valid production keys.

## Launch operating plan

1. Publish the LinkedIn and GrowthX posts with `public/social/tollgate-launch-v3.png`.
2. Recruit a small number of qualified technical founders rather than broad consumer traffic.
3. Manually help each tester send the first test request and create the first customer price rule.
4. Watch Vercel traffic, runtime logs, Status, and Contact submissions after publishing.
5. Record every onboarding failure before adding more provider endpoints or dashboard features.
