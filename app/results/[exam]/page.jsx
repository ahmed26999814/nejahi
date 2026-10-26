import { notFound, permanentRedirect } from "next/navigation";

// Keep legacy single-segment results URLs working without conflicting with
// the /results/[exam]/[year] route's dynamic segment name.
const legacyRoutes = {
  "bac-mauritanie": "/results/bac/2026",
  "brevet-mauritanie": "/results/brevet/2026",
  "concours-mauritanie": "/results/concours/2026",
  "excellence-mauritanie": "/results/excellence/2026",
};

export function generateStaticParams() {
  return Object.keys(legacyRoutes).map((exam) => ({ exam }));
}

export default async function LegacyResultLandingPage({ params }) {
  const { exam } = await params;
  const destination = legacyRoutes[exam];
  if (!destination) notFound();
  permanentRedirect(destination);
}
