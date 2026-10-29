import Link from "next/link";

export const metadata = {
  title: "شروط الاستخدام",
  description: "شروط استخدام نتائج المسابقات وخدمات التوجيه والدروس والحاسبة في موقع MauriResults.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <main dir="rtl" className="app-shell mx-auto max-w-3xl pb-28 pt-7 text-slate-800 dark:text-slate-100">
      <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-mauri-border px-4 text-sm font-bold text-mauri-green dark:text-emerald-300">العودة إلى الرئيسية</Link>
      <article className="mt-5 space-y-5 rounded-[1.6rem] border border-mauri-border bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#10233b] sm:p-8">
        <h1 className="text-2xl font-black">شروط الاستخدام</h1>
        <p className="leading-8">هدف MauriResults تسهيل الوصول إلى النتائج والمعلومات التعليمية. استخدامك للخدمة يفترض احترام خصوصية أصحاب النتائج وعدم إساءة استخدام الموقع.</p>
        <section className="space-y-2"><h2 className="text-lg font-extrabold">المعلومات والنتائج</h2><p className="leading-8">نحرص على عرض النتائج المنشورة بدقة، لكن المرجع الحاسم عند التعارض هو الإعلان أو المستند الرسمي الصادر عن الجهة المختصة. قد تتغير البيانات أو مواعيد النشر.</p></section>
        <section className="space-y-2"><h2 className="text-lg font-extrabold">التوجيه وحاسبة المعدل</h2><p className="leading-8">المعدلات المحسوبة وإرشادات التخصصات أدوات مساعدة وليست قرار قبول أو وثيقة مدرسية رسمية. تحقق من المعاملات وشروط الالتحاق الحالية لدى الجهات المختصة.</p></section>
        <section className="space-y-2"><h2 className="text-lg font-extrabold">الاستعمال المقبول</h2><p className="leading-8">لا تستخدم الموقع لاستخراج معلومات الآخرين على نطاق واسع أو لمحاولة تعطيل الخدمة أو تجاوز صلاحيات الإدارة. استخدم روابط المواد والمصادر بما يحترم حقوق أصحابها.</p></section>
        <section className="space-y-2"><h2 className="text-lg font-extrabold">التوفر والروابط الخارجية</h2><p className="leading-8">قد تتوقف بعض الخدمات مؤقتًا لأسباب فنية أو بسبب خوادم خارجية، بما فيها تنزيل تطبيق Android. تظل النسخة الإلكترونية متاحة حين تعمل خدمات الاستضافة.</p></section>
        <p className="text-sm">اقرأ أيضًا <Link className="font-bold text-mauri-green underline" href="/privacy">سياسة الخصوصية</Link> أو <Link className="font-bold text-mauri-green underline" href="/about">تعرف على الموقع</Link>.</p>
        <p className="text-xs text-slate-500 dark:text-slate-300">آخر تحديث: 29 أكتوبر 2026.</p>
      </article>
    </main>
  );
}
