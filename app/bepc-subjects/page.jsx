import BepcSubjectsPageClient from "../../components/results/BepcSubjectsPageClient";
import BepcSubjectsThemeToggle from "../../components/results/BepcSubjectsThemeToggle";

export const metadata = {
  title: "تفاصيل مواد البريفيه | MauriResults",
  description: "البحث عن درجات مواد البريفيه وعرض الكشف الرسمي في صفحة واحدة متوافقة مع الهاتف.",
};

export default async function BepcSubjectsPage({ searchParams }) {
  const params = await searchParams;
  const initialNumber = String(params?.number || "").replace(/\D/g, "").slice(0, 14);

  return (
    <>
      <BepcSubjectsPageClient initialNumber={initialNumber} />
      <BepcSubjectsThemeToggle />
    </>
  );
}
