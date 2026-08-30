# Tollgate

Tollgate shows API-bill owners what their AI agents are costing before the bill arrives.

## Build Week target

By 11:00 AM IST on 5 September 2026, ship a live proxy and dashboard that records a real direct-OpenAI call, shows its estimated cost, and compares the same token counts with a cheaper model. OpenRouter is a second adapter, not a dependency.

## Control documents

Read these in order:

1. [docs/00-PRESSURE_TEST.md](docs/00-PRESSURE_TEST.md) — pre-build blockers and the current build/no-build verdict.
2. [IDEA_SCOPE.md](IDEA_SCOPE.md) — the locked promise and boundaries.
3. [docs/01-ICP-JTBD.md](docs/01-ICP-JTBD.md) — qualified customer, disqualifiers, trigger, workaround, and locked job.
4. [docs/01-PRODUCT_STRATEGY.md](docs/01-PRODUCT_STRATEGY.md) — customer, job, wedge, and risks.
5. [docs/02-PRODUCT_SPEC.md](docs/02-PRODUCT_SPEC.md) — product behavior, data, states, and release tests.
6. [docs/03-USER_STORIES.md](docs/03-USER_STORIES.md) — prioritized stories with acceptance criteria.
7. [docs/02-PROVIDER_STRATEGY.md](docs/02-PROVIDER_STRATEGY.md) — provider sequence and boundaries.
8. [docs/03-VALIDATION_PLAN.md](docs/03-VALIDATION_PLAN.md) — tests before and during the build.
9. [docs/04-EXECUTION_PLAN.md](docs/04-EXECUTION_PLAN.md) — dated shipping plan and acceptance gates.
10. [docs/07-LANDING_PAGE.md](docs/07-LANDING_PAGE.md) — page structure, copy, CTA, and tracking.
11. [docs/08-TECHNICAL_CONTRACT.md](docs/08-TECHNICAL_CONTRACT.md) — credential flow, project isolation, dashboard access, and security tests.
12. [docs/09-USER_FLOWS.md](docs/09-USER_FLOWS.md) — exact happy paths, failure states, and flow acceptance.
13. [docs/10-SUNDAY_PLAN.md](docs/10-SUNDAY_PLAN.md) — today's timeboxed build order and cuts.
14. [docs/11-ARCHITECTURE.md](docs/11-ARCHITECTURE.md) — system, security, route, and visual user-flow diagrams.
15. [docs/12-MARKET_RESEARCH.md](docs/12-MARKET_RESEARCH.md) — market evidence, competition, TAM, SAM, SOM, and YC-scale test.
16. [docs/superpowers/plans/2026-08-30-tollgate-pass-through-v1.md](docs/superpowers/plans/2026-08-30-tollgate-pass-through-v1.md) — approved test-first implementation plan.
17. [docs/05-GTM_PLAN.md](docs/05-GTM_PLAN.md) — first users, outreach, launch, and sales motion.
18. [docs/06-METRICS.md](docs/06-METRICS.md) — definitions for the Saturday numbers.
19. [docs/DECISION_LOG.md](docs/DECISION_LOG.md) — decisions that must not silently drift.

## Working rule

If a proposed feature does not help a real API-bill owner see cost before the bill arrives, it goes into the parking lot.
