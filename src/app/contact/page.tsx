import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { PublicDocsLayout } from "@/components/public-docs-layout";

export const metadata: Metadata = { title: "Contact Tollgate", description: "Ask a private-beta product or onboarding question." };

export default function ContactPage() {
  return <PublicDocsLayout current="contact" eyebrow="Contact / Private beta" title="Bring one real billing workflow." description="Share the provider path, customer identity, and pricing method you use. The answer may be that V1 does not support it yet.">
    <section className="docs-section"><header><p>Send a question</p><h2>Product fit before integration work.</h2></header><ContactForm /></section>
    <section className="docs-section"><header><p>Useful context</p><h2>What helps us answer.</h2></header><div className="docs-grid"><article><h3>Request workflow</h3><p>Provider, exact endpoint, streaming or non-streaming, model IDs, and whether tool calls are involved.</p></article><article><h3>Billing workflow</h3><p>How customers are identified, current pricing, monthly volume, Stripe usage, and where manual work happens today.</p></article></div></section>
  </PublicDocsLayout>;
}
