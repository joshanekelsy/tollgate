# M1 Architecture and Flow Map

## System architecture

```mermaid
flowchart LR
    subgraph User[Tester]
        Client[OpenAI-compatible client<br/>Own OpenAI API key]
        Browser[Browser]
    end

    subgraph Vercel[Tollgate on Vercel]
        Landing[Landing page<br/>/]
        Apply[Test application handler]
        Proxy[Project proxy<br/>/p/projectId/v1/chat/completions]
        Guard[Project validation<br/>Model and request checks]
        Meter[Usage normalizer<br/>Cost estimator]
        Unlock[Dashboard code verifier]
        Dashboard[Protected dashboard<br/>/p/projectId/dashboard]
        DataAPI[Project-scoped dashboard API<br/>2-second polling]
    end

    subgraph Convex[Convex — safe persistent data]
        Applications[(testApplications)]
        Projects[(projects<br/>hashed dashboard code)]
        Calls[(calls<br/>metadata only)]
    end

    OpenAI[Direct OpenAI<br/>Chat Completions]
    Builder[Builder-only local<br/>project provision command]

    Browser --> Landing
    Landing --> Apply --> Applications

    Builder -->|create project; print code once| Projects

    Client -->|project URL + provider key + request| Proxy
    Proxy --> Guard
    Guard -->|resolve active project| Projects
    Guard -->|key and content forwarded<br/>in memory only| OpenAI
    OpenAI -->|response + usage| Meter
    Meter -->|safe metadata only| Calls
    Meter -->|response unchanged| Client

    Browser --> Dashboard
    Dashboard -->|dashboard code| Unlock
    Unlock -->|verify secure hash| Projects
    Unlock -->|short-lived secure cookie| Browser
    Browser -->|cookie| DataAPI
    DataAPI -->|exact project filter| Calls
    DataAPI -->|project rows only| Dashboard
```

## Security boundary

```mermaid
flowchart TB
    Sensitive[Transient sensitive data<br/>OpenAI key, prompt, response]
    Memory[Vercel request memory only]
    Provider[OpenAI]

    Safe[Allowed persistent data<br/>project, model, tokens, cost estimate,<br/>latency, status, time]
    Database[Convex]

    Forbidden[Forbidden destinations<br/>logs, analytics, source control,<br/>browser output, Convex content fields]

    Sensitive --> Memory --> Provider
    Memory -->|extract approved metadata| Safe --> Database
    Sensitive -. must never enter .-> Forbidden
```

## Trust model

| Item | Purpose | Storage |
|---|---|---|
| Tester OpenAI key | Pays for the provider call | Tester client and request memory only |
| Project ID | Routes writes to one project | Plain value in project record and base URL |
| Dashboard access code | Protects project reads | Plain value shown once; only secure hash stored |
| Dashboard session cookie | Allows short-lived dashboard reads | Secure, HTTP-only, same-site browser cookie |
| Provider response content | Returned to the client | Request memory only |
| Call metadata | Powers the meter | Project-scoped Convex record |

The project ID is not a read secret. Someone who knows it and has their own valid OpenAI key could add calls to that project's ledger. This is accepted only for the M1 non-production test. The separate dashboard code protects reads.

## User-flow map

```mermaid
flowchart TD
    A[Visitor opens landing page] --> B{Pays OpenAI directly<br/>and can change base URL?}
    B -->|No| C[Record as unqualified<br/>or unsupported]
    B -->|Yes| D[Submit test application]
    D --> E[Builder qualifies applicant]
    E --> F[Builder provisions random project ID<br/>and separate dashboard code]
    F --> G[Tester receives project base URL,<br/>dashboard URL, code, and boundary]
    G --> H[Tester keeps their own OpenAI key<br/>and changes base URL]
    H --> I[Send supported non-streaming call]
    I --> J{Request valid?}
    J -->|No| K[Reject before provider where possible<br/>show precise recovery message]
    J -->|Yes| L[Forward key and content in memory only]
    L --> M[OpenAI returns response and usage]
    M --> N[Return response unchanged]
    M --> O[Store safe project metadata]
    O --> P[Tester opens project dashboard]
    P --> Q{Dashboard code valid?}
    Q -->|No| R[Return no project data]
    Q -->|Yes| S[Issue project-scoped session]
    S --> T[Show first call and estimate]
    T --> U[Ask: trusted? decision changed?<br/>commit to paid pilot?]
```

## Screen and route map

| Surface | Actor | Purpose | P0 state |
|---|---|---|---|
| `/` | Visitor | Understand promise and apply | Hero, trust line, four-field form |
| Builder-only provision command | Builder | Create project and print access once | Local command; not a public admin page |
| `/p/{projectId}/v1/chat/completions` | Client | Send tester-funded request | Non-streaming direct OpenAI only |
| `/p/{projectId}/dashboard` | Tester | Unlock and view project cost | Code gate, empty state, latest call, totals |
| Project dashboard data API | Dashboard | Return only authorized project rows | Server-verified session; two-second polling |

## M1 deployment units

- One Next.js application on Vercel: landing page, proxy, dashboard access, and project-scoped data API.
- One Convex deployment: applications, projects, and safe call metadata.
- One public GitHub repository.
- One direct OpenAI upstream provider.
- No OpenRouter dependency and no native Anthropic, Gemini, or Meta integration.

## Product layer map

| Layer | Tollgate M1 | Essential today? |
|---|---|---|
| Frontend | Landing page, tester form, dashboard-code screen, empty dashboard, totals, latest-call table, setup block, error states | Yes |
| Backend | Application handler, manual project provisioning, project validation, pass-through proxy, usage extraction, pricing, dashboard session, project-scoped data API | Yes |
| Database | `testApplications`, `projects`, and safe `calls` metadata in Convex | Yes |
| Integrations | Direct OpenAI for model calls, Convex for persistence, Vercel for hosting, GitHub for the public repository | Yes |
| Payments | None | No; use a written paid-pilot commitment as revenue evidence |
| Notifications | None | No; builder contacts testers manually |
| Additional model providers | OpenRouter, Anthropic, Gemini, and hosted Meta models | No; parking lot |

## Architecture acceptance

The architecture passes only when:

1. A tester-funded call succeeds through the project route.
2. No key, prompt, or response is found in Convex or application logs.
3. The call appears only under the resolved project.
4. Missing or wrong dashboard access reveals no data.
5. A Project A session cannot read Project B.
6. Unsupported requests are rejected before provider spend whenever possible.
