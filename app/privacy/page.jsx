import Link from "next/link";

export const metadata = {
  title: "سياسة الخصوصية",
  description: "كيف يتعامل موقع MauriResults مع البحث عن النتائج وبيانات الاستخدام والخيارات المخزنة على جهازك.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main dir="rtl" className="app-shell mx-auto max-w-3xl pb-28 pt-7 text-slate-800 dark:text-slate-100">
      <Link href="/" className="inline-flex min-h-11 items-center rounded-xl border border-mauri-border px-4 text-sm font-bold text-mauri-green dark:text-emerald-300">العودة إلى الرئيسية</Link>
      <article className="mt-5 space-y-5 rounded-[1.6rem] border border-mauri-border bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#10233b] sm:p-8">
        <h1 className="text-2xl font-black">سياسة الخصوصية</h1>
        <p className="leading-8">يوفر MauriResults خدمة البحث عن نتائج المسابقات والخدمات التعليمية. نوضح هنا بصورة مبسطة أنواع المعلومات التي قد تعالج عند استخدام الموقع.</p>
        <section className="space-y-2"><h2 className="text-lg font-extrabold">البحث عن النتائج</h2><p className="leading-8">يُرسل رقم المترشح ومعايير البحث المطلوبة إلى خوادم الموقع لاسترجاع النتيجة المنشورة. قد تتضمن النتائج المعروضة بيانات شخصية منشورة ضمن قوائم المسابقات؛ تجنب مشاركة روابط النتائج أو صورها مع غير المعنيين.</p></section>
        <section className="space-y-2"><h2 className="text-lg font-extrabold">بيانات الاستخدام</h2><p className="leading-8">قد يستخدم الموقع أدوات تحليل وقياس للزيارات والأداء، وسجلات تقنية للتشخيص والحماية. قد تحفظ بعض خيارات الواجهة، مثل اللغة والوضع الليلي، في متصفحك لتحسين تجربتك.</p></section>
        <section className="space-y-2"><h2 className="text-lg font-extrabold">الإشعارات والخدمات الاختيارية</h2><p className="leading-8">عند استخدام خدمة تنبيه أو إرسال بيانات طوعًا، تعالج البيانات اللازمة لتقديم الخدمة. لا تدخل كلمات مرورك أو معلومات غير مطلوبة في حقول البحث العامة.</p></section>
        <section className="space-y-2"><h2 className="text-lg font-extrabold">الخدمات الخارجية</h2><p className="leading-8">يستعمل الموقع خدمات استضافة وقاعدة بيانات وتحليلات، وقد تخضع معالجة المعلومات الفنية لسياسات تلك الخدمات. الروابط الخارجية للمراجع والمصادر الرسمية تفتح مواقع مستقلة.</p></section>
        <section className="space-y-2"><h2 className="text-lg font-extrabold">الأسئلة والتصحيح</h2><p className="leading-8">للإبلاغ عن بيانات غير دقيقة أو مشكلة خصوصية، استخدم وسائل التواصل المبينة في <Link className="font-bold text-mauri-green underline" href="/about">صفحة التعريف بالموقع</Link>. لا ترسل معلومات حساسة في رسالة عامة.</p></section>
        <p className="text-xs text-slate-500 dark:text-slate-300">آخر تحديث: 29 أكتوبر 2026.</p>
      </article>
    </main>
  );
}
