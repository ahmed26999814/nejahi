import BepcSubjectsPageClient from "../../components/results/BepcSubjectsPageClient";

export const metadata = {
  title: "تفاصيل مواد ابريفه | MauriResults",
  description: "البحث عن درجات مواد ابريفه وعرض الكشف الرسمي في صفحة واحدة متوافقة مع الهاتف.",
};

export default async function BepcSubjectsPage({ searchParams }) {
  const params = await searchParams;
  const initialNumber = String(params?.number || "").replace(/\D/g, "").slice(0, 14);

  return <BepcSubjectsPageClient initialNumber={initialNumber} />;
}
