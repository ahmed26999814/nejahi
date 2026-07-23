import Bac2026AverageFrequencyStandalone from "../../components/analytics/Bac2026AverageFrequencyStandalone";

const url = "https://mauri-results.vercel.app/average-frequency";

export const metadata = {
  title: "تكرار معدلات باكالوريا 2026 للناجحين",
  description: "اعرف عدد مرات تكرار كل معدل بين الناجحين في باكالوريا موريتانيا 2026.",
  alternates: { canonical: url },
  openGraph: {
    title: "تكرار معدلات باكالوريا 2026 | MauriResults",
    description: "قسم مستقل لمعرفة عدد مرات تكرار المعدلات بين الناجحين في باكالوريا 2026.",
    url,
    type: "website",
    images: ["/logo.png"],
  },
};

export default function AverageFrequencyPage() {
  return <Bac2026AverageFrequencyStandalone />;
}
