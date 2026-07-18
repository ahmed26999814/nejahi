import ExamSeoPage from "../../../components/seo/ExamSeoPage";

const url = "https://mauri-results.vercel.app/results/concours-mauritanie";

export const metadata = {
  title: "نتائج الكونكور موريتانيا 2026",
  description: "الاستعلام عن نتائج الكونكور في موريتانيا 2026 عبر MauriResults حسب الولاية والمقاطعة والمركز ورقم المترشح.",
  alternates: { canonical: url },
  openGraph: {
    title: "نتائج الكونكور موريتانيا 2026 | MauriResults",
    description: "ابحث عن نتائج الكونكور في موريتانيا عبر MauriResults.",
    url,
    type: "website",
  },
};

export default function ConcoursMauritaniePage() {
  return (
    <ExamSeoPage
      slug="concours-mauritanie"
      arabicName="الكونكور"
      englishName="Concours Mauritanie 2026"
      title="نتائج الكونكور في موريتانيا 2026"
      intro="تساعد منصة MauriResults التلاميذ وأولياء الأمور على الوصول إلى نتائج الكونكور في موريتانيا عند نشر البيانات الرسمية، من خلال بحث واضح ومناسب للهاتف."
      searchHint="انتقل إلى البحث الرئيسي، اختر الكونكور، ثم حدد الولاية والمقاطعة والمركز وأدخل رقم المترشح."
      faq={[
        { question: "كيف أبحث عن نتيجة الكونكور؟", answer: "اختر الكونكور في MauriResults، ثم حدد الولاية والمقاطعة والمركز وأدخل رقم المترشح." },
        { question: "هل يمكن البحث من الهاتف؟", answer: "نعم، صُممت منصة MauriResults لتكون سهلة الاستخدام على الهواتف والأجهزة المختلفة." },
      ]}
    />
  );
}
