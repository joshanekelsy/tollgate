import type { Metadata } from "next";
import { PublicDocsLayout } from "@/components/public-docs-layout";
import { StatusCheck } from "@/components/status-check";

export const metadata: Metadata = { title: "Tollgate status", description: "Live web application and metering datastore health check." };

export default function StatusPage() {
  return <PublicDocsLayout current="status" eyebrow="Service / Live check" title="Current system status." description="This page runs a fresh check against the Tollgate web application and metering datastore. Provider availability is controlled by each connected provider.">
    <section className="docs-section"><header><p>Live now</p><h2>Application and datastore.</h2></header><StatusCheck /></section>
    <section className="docs-section"><header><p>Boundary</p><h2>What this check covers.</h2></header><div className="docs-grid"><article><h3>Included</h3><p>The Next.js application can serve the request and execute a public read against Convex.</p></article><article><h3>Not included</h3><p>This is not historical uptime monitoring. It does not claim OpenAI, Anthropic, Gemini, OpenRouter, Stripe, or Vercel are incident-free.</p></article></div></section>
  </PublicDocsLayout>;
}
