import ExamSeoPage from "../../../components/seo/ExamSeoPage";

const url = "https://mauri-results.vercel.app/results/brevet-mauritanie";

export const metadata = {
  title: "أبريفه موريتانيا 2026",
  description: "الاستعلام عن نتائج أبريفه Brevet في موريتانيا 2026 عبر MauriResults بالاسم أو رقم المترشح بسرعة من الهاتف.",
  alternates: { canonical: url },
  openGraph: {
    title: "أبريفه موريتانيا 2026 | MauriResults",
    description: "ابحث عن نتائج أبريفه Brevet في موريتانيا عبر MauriResults.",
    url,
    type: "website",
  },
};

export default function BrevetMauritaniePage() {
  return (
    <ExamSeoPage
      slug="brevet-mauritanie"
      arabicName="أبريفه"
      englishName="Brevet Mauritanie 2026"
      title="أبريفه موريتانيا 2026"
      intro="توفر منصة MauriResults وصولًا سريعًا إلى نتائج أبريفه في موريتانيا عند نشر البيانات الرسمية، مع واجهة مناسبة للهاتف وسهولة الوصول إلى معلومات المترشح."
      searchHint="يمكنك الانتقال إلى صفحة البحث الرئيسية واختيار أبريفه، ثم إدخال رقم المترشح أو استخدام خيارات البحث المتاحة."
      faq={[
        { question: "كيف أبحث عن نتيجة أبريفه؟", answer: "انتقل إلى البحث في MauriResults، اختر أبريفه، ثم أدخل رقم المترشح أو بيانات البحث المطلوبة." },
        { question: "ما الاسم الرسمي للامتحان؟", answer: "الاسم بالفرنسية هو Brevet أو BEPC، ويُعرف محليًا باسم أبريفه أو شهادة ختم الدروس الإعدادية." },
      ]}
    />
  );
}
