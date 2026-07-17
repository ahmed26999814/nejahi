import FeatureSeoPage from "../../components/seo/FeatureSeoPage";

const url = "https://mauri-results.vercel.app/toppers";

export const metadata = {
  title: "أوائل البكالوريا والبريفيه والكونكور في موريتانيا 2026",
  description: "تعرف على أوائل البكالوريا والبريفيه والكونكور في موريتانيا عبر MauriResults، مع ترتيب واضح حسب المسابقة والشعبة.",
  alternates: { canonical: url },
  openGraph: {
    title: "أوائل المسابقات الوطنية في موريتانيا | MauriResults",
    description: "صفحة الأوائل في البكالوريا والبريفيه والكونكور والامتياز.",
    url,
    type: "website",
    images: ["/logo.png"],
  },
};

export default function ToppersPage() {
  return (
    <FeatureSeoPage
      slug="toppers"
      eyebrow="الأوائل"
      title="أوائل المسابقات الوطنية في موريتانيا"
      intro="تجمع صفحة الأوائل ترتيب أفضل المترشحين في البكالوريا والبريفيه والكونكور والامتياز، مع اختيار المسابقة والشعبة عند توفرها. يتم عرض الثلاثة الأوائل أولًا ثم بقية الترتيب بصورة مناسبة للهاتف."
      ctaLabel="عرض الأوائل الآن"
      ctaHash="#toppers"
      sections={[
        { title: "البكالوريا", description: "اختر الشعبة أولًا لعرض الأوائل حسب المعدل والترتيب الرسمي المتاح." },
        { title: "البريفيه والكونكور", description: "اعرض أفضل المترشحين في كل مسابقة دون إضافة شعب غير موجودة في البيانات." },
      ]}
    />
  );
}
