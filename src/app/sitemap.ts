import type { MetadataRoute } from "next";

const origin = "https://tollgate-sigma.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { path: "", priority: 1 },
    { path: "/demo", priority: 0.9 },
    { path: "/how-it-works", priority: 0.8 },
    { path: "/docs", priority: 0.8 },
    { path: "/api-reference", priority: 0.7 },
    { path: "/security", priority: 0.7 },
    { path: "/privacy", priority: 0.5 },
    { path: "/changelog", priority: 0.5 },
    { path: "/status", priority: 0.5 },
    { path: "/contact", priority: 0.5 },
  ].map(({ path, priority }) => ({
    url: `${origin}${path}`,
    lastModified: new Date("2026-09-01T00:00:00+05:30"),
    changeFrequency: path === "/changelog" ? "weekly" as const : "monthly" as const,
    priority,
  }));
}
