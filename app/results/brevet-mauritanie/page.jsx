import ExamSeoPage from "../../../components/seo/ExamSeoPage";

const url = "https://mauriresults.vercel.app/results/brevet-mauritanie";

export const metadata = {
  title: "نتائج ابريفه موريتانيا 2026",
  description: "الاستعلام عن نتائج ابريفه Brevet في موريتانيا 2026 عبر MauriResults بالاسم أو رقم المترشح بسرعة من الهاتف.",
  alternates: { canonical: url },
  openGraph: {
    title: "نتائج ابريفه موريتانيا 2026 | MauriResults",
    description: "ابحث عن نتائج ابريفه Brevet في موريتانيا عبر MauriResults.",
    url,
    type: "website",
  },
};

export default function BrevetMauritaniePage() {
  return (
    <ExamSeoPage
      slug="brevet-mauritanie"
      arabicName="ابريفه"
      englishName="Brevet Mauritanie 2026"
      title="نتائج ابريفه في موريتانيا 2026"
      intro="توفر منصة MauriResults وصولًا سريعًا إلى نتائج ابريفه في موريتانيا عند نشر البيانات الرسمية، مع واجهة مناسبة للهاتف وسهولة الوصول إلى معلومات المترشح."
      searchHint="يمكنك الانتقال إلى صفحة البحث الرئيسية واختيار Brevet، ثم إدخال رقم المترشح أو استخدام خيارات البحث المتاحة."
      faq={[
        {
          question: "كيف أبحث عن نتيجة ابريفه؟",
          answer: "انتقل إلى البحث في MauriResults، اختر Brevet، ثم أدخل رقم المترشح أو بيانات البحث المطلوبة.",
        },
        {
          question: "ما الاسم الصحيح للامتحان؟",
          answer: "الاسم بالفرنسية هو Brevet، ويُعرض في العربية داخل المنصة باسم ابريفه.",
        },
      ]}
    />
  );
}
