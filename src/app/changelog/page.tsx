import type { Metadata } from "next";
import { PublicDocsLayout } from "@/components/public-docs-layout";

export const metadata: Metadata = { title: "Tollgate changelog", description: "Verified Tollgate product changes and current limits." };

export default function ChangelogPage() {
  return <PublicDocsLayout current="changelog" eyebrow="Product / Changelog" title="What changed, with the boundary attached." description="Only shipped and tested work appears here. Planned support is not presented as available.">
    <section className="docs-section"><header><p>Latest</p><h2>Customer-one billing loop.</h2></header><div className="release-list"><article><time dateTime="2026-08-31">31 August 2026<br />V1 private beta</time><div><h3>Protected metering to Stripe drafts</h3><ul><li>Added hashed, rotatable test and live write keys.</li><li>Added retry-ID reservation and duplicate/conflict visibility.</li><li>Added OpenAI, Anthropic, Gemini, and OpenRouter adapter boundaries for four non-streaming request formats.</li><li>Added customer records, billing contacts, and Stripe customer mapping.</li><li>Added default/customer pricing, base charges, included tokens, and exact model rate cards.</li><li>Added accepted, failed, duplicate, unattributed, and unpriced event inspection.</li><li>Added fixed completed-month billing runs and CSV export.</li><li>Added encrypted US Stripe connection and draft invoice creation.</li><li>Replaced the prototype with six dashboard views and isolated test/live data.</li></ul></div></article><article><time dateTime="2026-08-31">Current limits</time><div><h3>Not included in V1</h3><p>Streaming, OpenAI Responses, embeddings, images, audio, realtime, batch, subscriptions, tax, proration, credits, refunds, automatic collection, team accounts, and enterprise compliance controls.</p></div></article></div></section>
  </PublicDocsLayout>;
}
