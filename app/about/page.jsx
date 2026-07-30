import Link from "next/link";

const siteUrl = "https://mauri-results.vercel.app";
const pageUrl = `${siteUrl}/about`;

export const dynamic = "force-static";

export const metadata = {
  title: "عن MauriResults | منصة نتائج المسابقات في موريتانيا",
  description:
    "تعرف على MauriResults، منصة موريتانية مستقلة وسريعة للبحث في نتائج المسابقات الوطنية ومتابعة الأوائل والإحصائيات والتوجيه.",
  alternates: { canonical: pageUrl },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "ar_MR",
    url: pageUrl,
    siteName: "MauriResults",
    title: "عن MauriResults | منصة نتائج المسابقات في موريتانيا",
    description:
      "منصة موريتانية مستقلة تركز على سرعة الوصول إلى نتائج المسابقات والأوائل والإحصائيات والتوجيه.",
    images: ["/logo.png"],
  },
};

export default function AboutPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "@id": `${pageUrl}#about`,
    url: pageUrl,
    name: "عن MauriResults",
    description:
      "منصة موريتانية مستقلة وسريعة للبحث في نتائج المسابقات الوطنية ومتابعة الأوائل والإحصائيات والتوجيه.",
    isPartOf: { "@id": `${siteUrl}/#website` },
    about: { "@id": `${siteUrl}/#organization` },
    inLanguage: "ar-MR",
  };

  return (
    <main className="min-h-screen bg-[#f5f8f5] px-4 py-8 text-[#17211b] dark:bg-[#0d1712] dark:text-white md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <article className="mx-auto max-w-4xl rounded-[28px] border border-emerald-900/10 bg-white p-5 shadow-xl shadow-emerald-950/5 dark:border-white/10 dark:bg-[#122019] md:p-9">
        <nav aria-label="مسار الصفحة" className="mb-5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-[#14633f]">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span>عن المنصة</span>
        </nav>

        <p className="text-xs font-black text-[#14633f] dark:text-emerald-300">MauriResults</p>
        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">منصة سريعة لنتائج المسابقات في موريتانيا</h1>
        <p className="mt-4 text-sm font-bold leading-8 text-slate-600 dark:text-slate-300">
          MauriResults منصة موريتانية مستقلة صُممت لتسهيل الوصول إلى نتائج المسابقات الوطنية من الهاتف بسرعة ووضوح، مع صفحات للأوائل والإحصائيات والتوجيه والخدمات التعليمية.
        </p>

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-black">السرعة أولًا</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">تم تصميم تجربة البحث لتكون مباشرة وخفيفة، خصوصًا في فترات إعلان النتائج وارتفاع عدد الزوار.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-black">مناسبة للهاتف</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">الواجهة مبنية للاستخدام من الهاتف أولًا، مع خطوات قصيرة للوصول إلى المسابقة ثم النتيجة.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-black">أكثر من البحث</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">تجمع المنصة الأوائل وأعلى المعدلات والإحصائيات، إضافة إلى أدوات التوجيه والخدمات المساندة للطلاب.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
            <h2 className="text-base font-black">منصة مستقلة</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">MauriResults ليست موقعًا حكوميًا ولا تستبدل الجهات الرسمية؛ هدفها تقديم تجربة أسرع وأسهل لعرض البيانات المتاحة للمستخدم.</p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-900/10 p-4 dark:border-white/10">
          <h2 className="text-lg font-black">ابدأ من الصفحات الأساسية</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/results/bac/2026" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#14633f] hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-300">باكالوريا 2026</Link>
            <Link href="/results/brevet/2026" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#14633f] hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-300">ابريفه 2026</Link>
            <Link href="/results/concours/2026" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#14633f] hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-300">كونكور 2026</Link>
            <Link href="/toppers" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#14633f] hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-300">الأوائل وأعلى المعدلات</Link>
            <Link href="/statistics" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#14633f] hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-300">الإحصائيات</Link>
            <Link href="/apk" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#14633f] hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-300">تطبيق MauriResults</Link>
          </div>
        </section>
      </article>
    </main>
  );
}
