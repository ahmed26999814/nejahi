import ExamSeoPage from "../../../components/seo/ExamSeoPage";

const url = "https://mauri-results.vercel.app/results/excellence-mauritanie";

export const metadata = {
  title: "نتائج الامتياز موريتانيا 2026",
  description: "الاستعلام عن نتائج مدارس الامتياز في موريتانيا 2026 عبر MauriResults بالاسم أو رقم المترشح بسرعة من الهاتف.",
  alternates: { canonical: url },
  openGraph: {
    title: "نتائج الامتياز موريتانيا 2026 | MauriResults",
    description: "ابحث عن نتائج مدارس الامتياز في موريتانيا عبر MauriResults.",
    url,
    type: "website",
  },
};

export default function ExcellenceMauritaniePage() {
  return (
    <ExamSeoPage
      slug="excellence-mauritanie"
      arabicName="الامتياز"
      englishName="Excellence Mauritanie 2026"
      title="نتائج مدارس الامتياز في موريتانيا 2026"
      intro="توفر منصة MauriResults وصولًا سريعًا إلى نتائج مدارس الامتياز في موريتانيا عند نشر البيانات الرسمية، مع تجربة واضحة ومناسبة للهاتف."
      searchHint="انتقل إلى صفحة البحث الرئيسية، اختر الامتياز، ثم أدخل رقم المترشح أو بيانات البحث المطلوبة."
      faq={[
        { question: "كيف أبحث عن نتيجة الامتياز؟", answer: "انتقل إلى البحث في MauriResults، اختر الامتياز، ثم أدخل رقم المترشح أو بيانات البحث المطلوبة." },
        { question: "هل تعمل صفحة النتائج على الهاتف؟", answer: "نعم، يمكن استخدام MauriResults من الهاتف للوصول إلى النتائج بسهولة." },
      ]}
    />
  );
}
