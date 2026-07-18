const siteUrl = "https://mauri-results.vercel.app";

const routes = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/toppers", changeFrequency: "daily", priority: 0.9 },
  { path: "/statistics", changeFrequency: "daily", priority: 0.9 },
  { path: "/results/bac-mauritanie", changeFrequency: "daily", priority: 0.95 },
  { path: "/results/brevet-mauritanie", changeFrequency: "daily", priority: 0.95 },
  { path: "/results/concours-mauritanie", changeFrequency: "daily", priority: 0.95 },
  { path: "/results/excellence-mauritanie", changeFrequency: "daily", priority: 0.9 },
  { path: "/lessons", changeFrequency: "weekly", priority: 0.7 },
  { path: "/calculator", changeFrequency: "monthly", priority: 0.7 },
  { path: "/Apk/", changeFrequency: "weekly", priority: 0.7 },
];

export default function sitemap() {
  const lastModified = new Date();
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
