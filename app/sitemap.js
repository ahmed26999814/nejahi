import examSeoData from "../data/exam-seo.json";
import { orientationPrograms } from "../data/orientation-programs";

const siteUrl = "https://mauri-results.vercel.app";

const staticRoutes = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/toppers", changeFrequency: "daily", priority: 0.96 },
  { path: "/statistics", changeFrequency: "daily", priority: 0.96 },
  { path: "/orientation", changeFrequency: "monthly", priority: 0.82 },
  { path: "/orientation/match", changeFrequency: "monthly", priority: 0.76 },
  { path: "/lessons", changeFrequency: "weekly", priority: 0.8 },
  { path: "/calculator", changeFrequency: "monthly", priority: 0.7 },
  { path: "/apk", changeFrequency: "weekly", priority: 0.7 },
];

const examRoutes = Object.entries(examSeoData).flatMap(([exam, details]) =>
  details.supportedYears.map((year) => ({
    path: `/results/${exam}/${year}`,
    changeFrequency: year === "2026" ? "daily" : "monthly",
    priority: exam === "bac" && year === "2026" ? 1 : year === "2026" ? 0.92 : 0.75,
    lastModified: details.publishedDates?.[year],
  })),
);

const orientationRoutes = orientationPrograms.map((program) => ({
  path: `/orientation/${program.id}`,
  changeFrequency: "monthly",
  priority: 0.62,
}));

export default function sitemap() {
  return [...staticRoutes, ...examRoutes, ...orientationRoutes].map(({ path, changeFrequency, priority, lastModified }) => ({
    url: `${siteUrl}${path}`,
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    changeFrequency,
    priority,
  }));
}