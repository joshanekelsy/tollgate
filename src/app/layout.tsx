import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tollgate — See AI agent cost before the bill arrives",
  description: "Apply to test an early cost meter for non-production OpenAI calls.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
