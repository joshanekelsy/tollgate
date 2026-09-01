# Reachable Billing Routes Implementation Plan

**Goal:** Make Settings and Invoices usable from a direct visit, with secure meter selection, read-only sample data, and a useful zero-usage invoice state.

**Constraints:** Keep the current design and comparison logic. Add no payments, plans, subscriptions, exports, or multi-user accounts.

## Tasks

1. Add a deterministic, non-reversible lookup value for new access codes and index it in Convex.
2. Add a meter-selection endpoint that verifies the access code, opens the existing signed meter session, and returns non-secret meter details.
3. Add a shared direct-route selector that remembers only meter IDs and names in the browser, never access codes.
4. Add read-only sample Settings and Invoices states with no database requests or writes.
5. Render the full invoice table headings when a real meter has no current-month calls.
6. Add focused tests, run the full test suite and production build, then walk the requested desktop and phone flows in a clean browser.

