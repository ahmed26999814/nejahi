import FeatureSeoPage from "../../components/seo/FeatureSeoPage";

const url = "https://mauri-results.vercel.app/statistics";

export const metadata = {
  title: "إحصائيات البكالوريا وابريفه والكونكور في موريتانيا 2026",
  description: "إحصائيات المسابقات الوطنية في موريتانيا: الناجحون ونسبة النجاح وأعلى معدل وترتيب الولايات والمدارس والمراكز.",
  alternates: { canonical: url },
  openGraph: {
    title: "إحصائيات المسابقات الوطنية في موريتانيا | MauriResults",
    description: "إحصائيات البكالوريا وابريفه والكونكور والامتياز بطريقة سريعة وواضحة.",
    url,
    type: "website",
    images: ["/logo.png"],
  },
};

export default function StatisticsPage() {
  return (
    <FeatureSeoPage
      slug="statistics"
      eyebrow="الإحصائيات"
      title="إحصائيات المسابقات الوطنية في موريتانيا"
      intro="تعرض MauriResults ملخصًا سريعًا لأعداد المترشحين والناجحين ونسبة النجاح وأعلى معدل، إضافة إلى ترتيب الولايات والمدارس والمراكز حسب البيانات المتاحة لكل مسابقة."
      ctaLabel="عرض الإحصائيات الآن"
      ctaHash="#analytics"
      sections={[
        { title: "مؤشرات عامة", description: "عدد المشاركين والناجحين والراسبين ونسبة النجاح وأعلى معدل بصورة مختصرة." },
        { title: "ترتيب تفصيلي", description: "مقارنة الولايات والمدارس والمراكز، مع الوصول إلى أفضل المترشحين حسب المعدل." },
      ]}
    />
  );
}
