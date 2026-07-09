const siteUrl = "https://mauri-results.vercel.app";

export default function sitemap() {
  const now = new Date();
  const routes = [
    { path: "", priority: 1, changeFrequency: "hourly" },
    { path: "#year-2025", priority: 0.95, changeFrequency: "daily" },
    { path: "#year-2026", priority: 0.95, changeFrequency: "hourly" },
    { path: "#analytics", priority: 0.8, changeFrequency: "daily" },
    { path: "#toppers", priority: 0.8, changeFrequency: "daily" },
  ];

  return routes.map((route) => ({
    url: `${siteUrl}/${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
