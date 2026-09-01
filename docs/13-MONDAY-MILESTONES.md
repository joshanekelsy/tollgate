# Monday milestones

## Product by midnight

| Item | State | Evidence |
| --- | --- | --- |
| Landing page | Done | Live product page, exact product boundary, working private-meter CTA, public sample dashboard. |
| Onboarding | Done | Email creates a meter, shows the recovery code and test/live write keys once, then opens Setup. |
| Product | Done | Overview, Events, Customers, Pricing, Billing runs, Setup, CSV, and Stripe draft output. |

## Observability

| Item | State | Evidence |
| --- | --- | --- |
| Sentry error logging | Code complete; account key required | Browser, server, edge, request-error, and global-error capture are installed. Request bodies, headers, cookies, form data, user data, and known secret formats are removed before sending. |
| Amplitude | Code complete; account key required | Page/session/web-vital tracking plus explicit activation events. Automatic form, click, network, and download capture are disabled to protect secrets. |
| Vercel basic traffic | Done | `@vercel/analytics` is loaded from the root layout and Web Analytics is enabled on the linked Vercel project. |

Required account values:

```text
NEXT_PUBLIC_SENTRY_DSN
SENTRY_DSN
SENTRY_ORG
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
NEXT_PUBLIC_AMPLITUDE_API_KEY
```

## Launch by 2am

| Item | State | Evidence |
| --- | --- | --- |
| Positioning | Done | `docs/14-POSITIONING-AND-NICHES.md` |
| Niches | Done | One launch niche, two later niches, and explicit disqualifiers are defined. |
| Post | Done | `docs/15-LAUNCH-POST.md` contains ready-to-publish LinkedIn and X versions. |

The launch CTA is **create a private beta meter**, not **join a waitlist**. The product is already usable, so calling it a waitlist would make the offer look less complete than it is.
