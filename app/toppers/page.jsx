import FeatureSeoPage from "../../components/seo/FeatureSeoPage";

const url = "https://mauri-results.vercel.app/toppers";
const title = "أوائل المسابقات الوطنية في موريتانيا 2026";
const description = "تعرف على أوائل المسابقات الوطنية في موريتانيا 2026 وأعلى المعدلات في باكالوريا وابريفه وكونكور والامتياز، مع ترتيب الأوائل حسب المسابقة والشعبة عند توفرها.";

export const metadata = {
  title,
  description,
  keywords: [
    "أوائل المسابقات الوطنية موريتانيا 2026",
    "أوائل باكالوريا موريتانيا 2026",
    "أوائل البكالوريا موريتانيا 2026",
    "أعلى معدل في باكالوريا موريتانيا",
    "ترتيب أوائل باكالوريا 2026",
    "أوائل باكالوريا حسب الشعبة",
    "أوائل ابريفه موريتانيا 2026",
    "أوائل Brevet موريتانيا 2026",
    "أوائل كونكور موريتانيا 2026",
    "أوائل الامتياز موريتانيا 2026",
  ],
  alternates: { canonical: url },
  openGraph: {
    title: `${title} | MauriResults`,
    description,
    url,
    type: "website",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | MauriResults`,
    description,
    images: ["/logo.png"],
  },
};

export default function ToppersPage() {
  return (
    <FeatureSeoPage
      slug="toppers"
      eyebrow="الأوائل"
      title={title}
      intro="تجمع صفحة الأوائل ترتيب أفضل المترشحين في باكالوريا وابريفه وكونكور والامتياز. في باكالوريا تختار الشعبة أولًا، ثم يظهر الثلاثة الأوائل وأعلى معدل قبل بقية الترتيب بصورة سريعة ومناسبة للهاتف."
      ctaLabel="عرض الأوائل الآن"
      ctaHash="#toppers"
      sections={[
        { title: "أوائل باكالوريا حسب الشعبة", description: "اختر شعبة SN أو M أو LO أو LM أو TM أو TS أو LA لعرض الأوائل حسب المعدل والترتيب المتاح." },
        { title: "أعلى المعدلات في المسابقات الوطنية", description: "يعرض الترتيب أعلى المعدلات المسجلة في البيانات المنشورة لكل مسابقة وشعبة عند توفرها." },
        { title: "أوائل ابريفه وكونكور والامتياز", description: "اعرض أفضل المترشحين في كل مسابقة دون إضافة شعب غير موجودة في البيانات." },
        { title: "ترتيب سريع للهاتف", description: "تظهر المراكز الثلاثة الأولى أولًا ثم بقية الترتيب في واجهة خفيفة وواضحة." },
      ]}
    />
  );
}
