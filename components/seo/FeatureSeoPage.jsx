import Link from "next/link";

const SITE_URL = "https://mauri-results.vercel.app";

export default function FeatureSeoPage({ slug, title, eyebrow, intro, ctaLabel, ctaHash, sections }) {
  const pageUrl = `${SITE_URL}/${slug}`;
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "MauriResults", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: title, item: pageUrl },
    ],
  };

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    url: pageUrl,
    inLanguage: "ar-MR",
    isPartOf: { "@type": "WebSite", name: "MauriResults", url: SITE_URL },
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900 sm:py-14">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPage) }} />

      <article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <nav aria-label="مسار الصفحة" className="mb-6 text-sm text-slate-500">
          <Link href="/" className="hover:text-slate-900">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span>{eyebrow}</span>
        </nav>

        <p className="text-sm font-bold text-emerald-700">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
        <p className="mt-5 max-w-3xl leading-8 text-slate-700">{intro}</p>

        <Link
          href={`/${ctaHash}`}
          className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 font-bold text-white transition hover:bg-emerald-800"
        >
          {ctaLabel}
        </Link>

        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-lg font-black">{section.title}</h2>
              <p className="mt-2 leading-7 text-slate-600">{section.description}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 border-t border-slate-200 pt-7">
          <h2 className="text-xl font-black">صفحات المسابقات</h2>
          <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
            <Link href="/results/bac-mauritanie" className="rounded-full border border-slate-200 px-4 py-2 hover:border-emerald-600">البكالوريا</Link>
            <Link href="/results/brevet-mauritanie" className="rounded-full border border-slate-200 px-4 py-2 hover:border-emerald-600">ابريفه</Link>
            <Link href="/results/concours-mauritanie" className="rounded-full border border-slate-200 px-4 py-2 hover:border-emerald-600">الكونكور</Link>
            <Link href="/results/excellence-mauritanie" className="rounded-full border border-slate-200 px-4 py-2 hover:border-emerald-600">الامتياز</Link>
          </div>
        </section>
      </article>
    </main>
  );
}
