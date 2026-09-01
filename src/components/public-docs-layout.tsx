import Link from "next/link";
import type { ReactNode } from "react";

export type PublicPage = "docs" | "api" | "security" | "privacy" | "changelog" | "status" | "contact";

const links: Array<{ id: PublicPage; label: string; href: string }> = [
  { id: "docs", label: "Docs", href: "/docs" },
  { id: "api", label: "API reference", href: "/api-reference" },
  { id: "security", label: "Security", href: "/security" },
  { id: "changelog", label: "Changelog", href: "/changelog" },
  { id: "status", label: "Status", href: "/status" },
  { id: "contact", label: "Contact", href: "/contact" },
];

export function PublicDocsLayout({ current, eyebrow, title, description, children }: {
  current: PublicPage;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return <main className="public-docs">
    <nav className="public-docs-nav">
      <Link className="public-docs-mark" href="/"><span>T</span>Tollgate</Link>
      <div>{links.map((link) => <Link key={link.id} href={link.href} aria-current={current === link.id ? "page" : undefined}>{link.label}</Link>)}</div>
      <Link className="public-docs-demo" href="/demo">Sample dashboard</Link>
    </nav>
    <header className="public-docs-hero">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </header>
    <div className="public-docs-body">{children}</div>
    <footer className="public-docs-footer">
      <Link className="public-docs-mark" href="/"><span>T</span>Tollgate</Link>
      <p>Selected AI workflows to fixed customer billing runs. <Link href="/privacy">Privacy</Link></p>
      <Link href="/#get-started">Create a private meter</Link>
    </footer>
  </main>;
}
