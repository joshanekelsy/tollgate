import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Telemetry } from "@/components/telemetry";
import "./globals.css";
import "./landing-redesign.css";
import "./landing-interactions.css";
import "./docs.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://tollgate-sigma.vercel.app"),
  title: "Tollgate — Turn AI usage into customer billing",
  description: "Meter supported AI usage by customer, close fixed monthly billing runs, and create Stripe draft invoices without storing prompts.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Tollgate — Know what to bill",
    description: "Meter supported AI usage by customer and close fixed monthly billing runs without storing prompts.",
    url: "/",
    siteName: "Tollgate",
    type: "website",
    images: [{
      url: "/social/tollgate-launch-v3.png",
      width: 1734,
      height: 907,
      alt: "Tollgate usage ledger with the headline Know what to bill.",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tollgate — Know what to bill",
    description: "AI usage to fixed customer billing runs, without storing prompts.",
    images: ["/social/tollgate-launch-v3.png"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>{children}<Telemetry /><Analytics /></body>
    </html>
  );
}
