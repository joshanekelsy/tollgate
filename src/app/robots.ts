import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/apply", "/invoices", "/meter/", "/monitoring", "/p/", "/settings"],
    },
    sitemap: "https://tollgate-sigma.vercel.app/sitemap.xml",
  };
}
