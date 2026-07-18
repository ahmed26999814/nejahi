import BepcSubjectsPageClient from "../../components/results/BepcSubjectsPageClient";

const url = "https://mauri-results.vercel.app/bepc-subjects";

export const metadata = {
  title: "تفاصيل مواد أبريفه",
  description: "البحث عن درجات مواد أبريفه وعرض الكشف الرسمي في صفحة واحدة متوافقة مع الهاتف.",
  alternates: { canonical: url },
};

export default async function BepcSubjectsPage({ searchParams }) {
  const params = await searchParams;
  const initialNumber = String(params?.number || "").replace(/\D/g, "").slice(0, 14);

  return <BepcSubjectsPageClient initialNumber={initialNumber} />;
}
