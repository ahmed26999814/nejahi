const siteUrl = "https://mauri-results.vercel.app";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/debug"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
