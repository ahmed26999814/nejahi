import Link from "next/link";

const SITE_URL = "https://mauriresults.vercel.app";

export default function ExamSeoPage({
  slug,
  arabicName,
  englishName,
  title,
  intro,
  searchHint,
  faq,
}) {
  const pageUrl = `${SITE_URL}/results/${slug}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "MauriResults",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: title,
        item: pageUrl,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <article className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <nav aria-label="مسار الصفحة" className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span>{arabicName}</span>
        </nav>

        <p className="mb-3 text-sm font-semibold text-emerald-700">{englishName}</p>
        <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-5 leading-8 text-slate-700">{intro}</p>
        <p className="mt-3 leading-8 text-slate-700">{searchHint}</p>

        <Link
          href="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 font-semibold text-white transition hover:bg-emerald-800"
        >
          البحث في النتائج
        </Link>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-2xl font-bold">الأسئلة الشائعة</h2>
          <div className="mt-5 space-y-5">
            {faq.map((item) => (
              <div key={item.question}>
                <h3 className="font-bold">{item.question}</h3>
                <p className="mt-2 leading-7 text-slate-700">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold">نتائج أخرى في موريتانيا</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
            <Link href="/results/bac-mauritanie" className="rounded-full border px-4 py-2">البكالوريا</Link>
            <Link href="/results/brevet-mauritanie" className="rounded-full border px-4 py-2">ابريفه</Link>
            <Link href="/results/concours-mauritanie" className="rounded-full border px-4 py-2">الكونكور</Link>
            <Link href="/results/excellence-mauritanie" className="rounded-full border px-4 py-2">الامتياز</Link>
          </div>
        </section>
      </article>
    </main>
  );
}
