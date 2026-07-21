import examSeoData from "../data/exam-seo.json";
import { orientationPrograms } from "../data/orientation-programs";

const siteUrl = "https://mauri-results.vercel.app";

const staticRoutes = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/toppers", changeFrequency: "daily", priority: 0.9 },
  { path: "/statistics", changeFrequency: "daily", priority: 0.9 },
  { path: "/orientation", changeFrequency: "monthly", priority: 0.88 },
  { path: "/lessons", changeFrequency: "weekly", priority: 0.92 },
  { path: "/calculator", changeFrequency: "monthly", priority: 0.7 },
  { path: "/apk", changeFrequency: "weekly", priority: 0.7 },
];

const examRoutes = Object.entries(examSeoData).flatMap(([exam, details]) =>
  details.supportedYears.map((year) => ({
    path: `/results/${exam}/${year}`,
    changeFrequency: year === "2026" ? "daily" : "monthly",
    priority: exam === "bac" && year === "2026" ? 1 : year === "2026" ? 0.92 : 0.75,
  })),
);

const orientationRoutes = orientationPrograms.map((program) => ({
  path: `/orientation/${program.id}`,
  changeFrequency: "monthly",
  priority: 0.66,
}));

export default function sitemap() {
  const lastModified = new Date();
  return [...staticRoutes, ...examRoutes, ...orientationRoutes].map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
