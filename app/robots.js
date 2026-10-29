const siteUrl = "https://mauri-results.vercel.app";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/",
        "/admin/results",
        "/api/admin/",
        "/api/debug",
        "/api/health/",
        "/api/result-number/",
        "/api/result-shard/",
        "/api/concours-number/",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
