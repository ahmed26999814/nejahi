const siteUrl = "https://mauri-results.vercel.app";

export default function sitemap() {
  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
