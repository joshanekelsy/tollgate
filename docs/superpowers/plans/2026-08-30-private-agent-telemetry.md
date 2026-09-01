# Private Agent Telemetry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add task/session attribution, agent labels, tool-call metadata, and human quality feedback without storing model content or credentials.

**Architecture:** Clients may send three tightly validated Tollgate headers that are consumed but never forwarded. The proxy extracts tool function names and counts from the provider response, stores only safe metadata in Convex, and exposes protected feedback through the existing dashboard session.

**Tech Stack:** Next.js App Router, TypeScript, Convex, Vitest, React.

**Spec:** `IDEA_SCOPE.md`, `docs/08-TECHNICAL_CONTRACT.md`

## Global Constraints

- Privacy mode is `private` and is visible on every dashboard.
- Never store or log API keys, authorization, prompts, responses, tool arguments, or tool results.
- Accept only `x-tollgate-task-id`, `x-tollgate-session-id`, and `x-tollgate-agent` values matching `[A-Za-z0-9._:-]` with a maximum of 80 characters.
- Tollgate attribution headers are never forwarded to OpenAI.
- Tool telemetry contains function names and count only.
- Quality feedback is `helpful` or `not_helpful`, is project-scoped, and requires a valid dashboard session.

---

### Task 1: Lock the private telemetry contract

**Files:**
- Modify: `src/lib/types.ts`
- Modify: `convex/schema.ts`
- Modify: `convex/calls.ts`

**Interfaces:**
- Produces optional `taskId`, `sessionId`, `agentName`, `toolNames`, `toolCallCount`, `qualityScore`, `qualityRecordedAt`, and `privacyMode` fields.

- [ ] Add only optional fields so existing production rows remain valid.
- [ ] Add a project-scoped feedback mutation that rejects calls from another project.
- [ ] Deploy the additive schema and regenerate Convex bindings.

### Task 2: Capture attribution without content

**Files:**
- Modify: `src/lib/proxy.ts`
- Modify: `src/lib/proxy.test.ts`

**Interfaces:**
- Consumes validated Tollgate headers and provider response tool-call structures.
- Produces safe call metadata while forwarding only authorization, content type, and the original JSON body.

- [ ] Write tests for accepted attribution, rejected free-form attribution, tool-name extraction, and forbidden-content absence.
- [ ] Implement the 80-character identifier validator.
- [ ] Extract unique function names and total tool-call count without arguments.
- [ ] Run proxy tests and the production build.

### Task 3: Add protected quality feedback

**Files:**
- Create: `src/app/p/[projectId]/dashboard/feedback/route.ts`
- Modify: `src/components/dashboard-client.tsx`

**Interfaces:**
- Accepts `{ callId, score: "helpful" | "not_helpful" }` only after project-cookie verification.
- Produces one quality value on the exact project call.

- [ ] Verify the dashboard cookie before mutation.
- [ ] Return `401`, `403`, or `400` without mutation for invalid requests.
- [ ] Add Helpful / Not helpful controls and refresh after selection.

### Task 4: Make private traces understandable

**Files:**
- Modify: `src/components/dashboard-client.tsx`
- Modify: `src/app/dashboard.css`
- Modify: `src/components/test-application-form.tsx`

**Interfaces:**
- Shows privacy mode, task, session, agent, tool names/count, and quality without exposing content.

- [ ] Add a persistent `Private metadata` badge and a precise no-content statement.
- [ ] Add the three optional environment-header examples to saved setup instructions.
- [ ] Render missing attribution as an em dash, not invented data.
- [ ] Run tests, lint, build, production deployment, and one attributed live call.
