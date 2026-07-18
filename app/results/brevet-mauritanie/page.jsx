import ExamSeoPage from "../../../components/seo/ExamSeoPage";

const url = "https://mauri-results.vercel.app/results/brevet-mauritanie";

export const metadata = {
  title: "نتائج البريفيه موريتانيا 2026",
  description: "الاستعلام عن نتائج البريفيه Brevet في موريتانيا 2026 عبر MauriResults بالاسم أو رقم المترشح بسرعة من الهاتف.",
  alternates: { canonical: url },
  openGraph: {
    title: "نتائج البريفيه موريتانيا 2026 | MauriResults",
    description: "ابحث عن نتائج البريفيه Brevet في موريتانيا عبر MauriResults.",
    url,
    type: "website",
  },
};

export default function BrevetMauritaniePage() {
  return (
    <ExamSeoPage
      slug="brevet-mauritanie"
      arabicName="البريفيه"
      englishName="Brevet Mauritanie 2026"
      title="نتائج البريفيه في موريتانيا 2026"
      intro="توفر منصة MauriResults وصولًا سريعًا إلى نتائج البريفيه في موريتانيا عند نشر البيانات الرسمية، مع واجهة مناسبة للهاتف وسهولة الوصول إلى معلومات المترشح."
      searchHint="يمكنك الانتقال إلى صفحة البحث الرئيسية واختيار Brevet، ثم إدخال رقم المترشح أو استخدام خيارات البحث المتاحة."
      faq={[
        { question: "كيف أبحث عن نتيجة البريفيه؟", answer: "انتقل إلى البحث في MauriResults، اختر Brevet، ثم أدخل رقم المترشح أو بيانات البحث المطلوبة." },
        { question: "ما الاسم الصحيح للامتحان؟", answer: "الاسم بالفرنسية هو Brevet، ويُعرف في موريتانيا بالبريفيه أو ختم الدروس الإعدادية." },
      ]}
    />
  );
}
