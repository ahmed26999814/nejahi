import ExamSeoPage from "../../../components/seo/ExamSeoPage";

const url = "https://mauri-results.vercel.app/results/bac-mauritanie";

export const metadata = {
  title: "نتائج البكالوريا موريتانيا 2026",
  description: "الاستعلام عن نتائج البكالوريا في موريتانيا 2026 عبر MauriResults بالاسم أو رقم المترشح بسرعة من الهاتف.",
  alternates: { canonical: url },
  openGraph: {
    title: "نتائج البكالوريا موريتانيا 2026 | MauriResults",
    description: "ابحث عن نتائج البكالوريا في موريتانيا عبر MauriResults.",
    url,
    type: "website",
  },
};

export default function BacMauritaniePage() {
  return (
    <ExamSeoPage
      slug="bac-mauritanie"
      arabicName="البكالوريا"
      englishName="BAC Mauritanie 2026"
      title="نتائج البكالوريا في موريتانيا 2026"
      intro="توفر منصة MauriResults وصولًا سريعًا إلى نتائج البكالوريا في موريتانيا عند نشر البيانات الرسمية، مع واجهة مناسبة للهاتف وسهولة الوصول إلى معلومات المترشح."
      searchHint="يمكنك الانتقال إلى صفحة البحث الرئيسية واختيار البكالوريا، ثم إدخال رقم المترشح أو استخدام خيارات البحث المتاحة."
      faq={[
        {
          question: "كيف أبحث عن نتيجة البكالوريا؟",
          answer: "انتقل إلى البحث في MauriResults، اختر البكالوريا، ثم أدخل رقم المترشح أو بيانات البحث المطلوبة.",
        },
        {
          question: "هل نتائج MauriResults رسمية؟",
          answer: "تعرض المنصة البيانات المنشورة للنتائج، ويبقى المرجع النهائي هو الجهة الرسمية المسؤولة عن الامتحانات في موريتانيا.",
        },
      ]}
    />
  );
}
