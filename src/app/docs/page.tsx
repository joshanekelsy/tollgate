import type { Metadata } from "next";
import Link from "next/link";
import { PublicDocsLayout } from "@/components/public-docs-layout";

export const metadata: Metadata = { title: "Tollgate docs - Quickstart", description: "Create a meter, send protected AI usage, set pricing, and close a billing run." };

const request = `curl https://YOUR_TOLLGATE_HOST/p/YOUR_METER_ID/providers/openai/v1/chat/completions \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -H "X-Tollgate-Key: $TOLLGATE_WRITE_KEY" \\
  -H "X-Tollgate-Idempotency-Key: req_01JSTABLE" \\
  -H "X-Tollgate-Customer: customer-acme" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"gpt-5.4-mini","messages":[{"role":"user","content":"Hello"}]}'`;

export default function DocsPage() {
  return <PublicDocsLayout current="docs" eyebrow="Documentation / Quickstart" title="From first request to fixed billing run." description="The shortest supported path: protect one provider request, attach a customer, verify pricing, and close a completed UTC month.">
    <section className="docs-section"><header><p>01 / Create</p><h2>Save all three one-time secrets.</h2></header><div className="docs-grid"><article><h3>Recovery code</h3><p>Reopens the private dashboard. The browser session lasts up to 12 hours and can be ended earlier.</p></article><article><h3>Test and live write keys</h3><p>Use test first. Each key sends events to a separate ledger. Full keys are shown once and stored only as hashes.</p></article></div></section>
    <section className="docs-section"><header><p>02 / Send</p><h2>Protect and identify every request.</h2></header><pre className="docs-code"><code>{request}</code></pre><p className="docs-note">Keep the same idempotency key when retrying the same logical request. Use a new key for a new request. Tollgate rejects duplicate and conflicting retry IDs before another provider call.</p></section>
    <section className="docs-section"><header><p>03 / Prepare billing</p><h2>Resolve the close blockers.</h2></header><div className="docs-grid"><article><h3>Customer</h3><ol><li>Open Customers.</li><li>Add a display name and billing email.</li><li>Add the existing Stripe customer ID when using Stripe drafts.</li></ol></article><article><h3>Pricing</h3><ol><li>Set a live default or customer override.</li><li>Add a model rate card if provider cost is unavailable.</li><li>Review unattributed and unpriced events.</li></ol></article></div></section>
    <section className="docs-section"><header><p>04 / Close</p><h2>Freeze, export, then review.</h2></header><div className="docs-grid"><article><h3>Fixed billing run</h3><p>Only a completed UTC month can close. Later customer and pricing edits cannot rewrite the saved amount or source-call list.</p></article><article><h3>Output</h3><p>Download CSV or create Stripe draft invoices. Tollgate does not finalize, send, or collect those invoices.</p><p><Link href="/api-reference">Read the exact API contract</Link></p></article></div></section>
  </PublicDocsLayout>;
}
