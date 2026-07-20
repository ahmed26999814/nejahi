import examSeoData from "../data/exam-seo.json";

const siteUrl = "https://mauri-results.vercel.app";

const staticRoutes = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/toppers", changeFrequency: "daily", priority: 0.9 },
  { path: "/statistics", changeFrequency: "daily", priority: 0.9 },
  { path: "/lessons", changeFrequency: "weekly", priority: 0.7 },
  { path: "/calculator", changeFrequency: "monthly", priority: 0.7 },
  { path: "/Apk/", changeFrequency: "weekly", priority: 0.7 },
];

const examRoutes = Object.entries(examSeoData).flatMap(([exam, details]) =>
  details.supportedYears.map((year) => ({
    path: `/results/${exam}/${year}`,
    changeFrequency: year === "2026" ? "daily" : "monthly",
    priority: exam === "bac" && year === "2026" ? 1 : year === "2026" ? 0.92 : 0.75,
  })),
);

export default function sitemap() {
  const lastModified = new Date();
  return [...staticRoutes, ...examRoutes].map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
