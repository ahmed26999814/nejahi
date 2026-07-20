import { notFound, permanentRedirect } from "next/navigation";

const legacyRoutes = {
  "bac-mauritanie": "/results/bac/2026",
  "brevet-mauritanie": "/results/brevet/2026",
  "concours-mauritanie": "/results/concours/2026",
  "excellence-mauritanie": "/results/excellence/2026",
};

export function generateStaticParams() {
  return Object.keys(legacyRoutes).map((slug) => ({ slug }));
}

export default async function LegacyResultLandingPage({ params }) {
  const { slug } = await params;
  const destination = legacyRoutes[slug];
  if (!destination) notFound();
  permanentRedirect(destination);
}
