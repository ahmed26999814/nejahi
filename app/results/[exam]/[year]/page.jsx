import Link from "next/link";
import { notFound } from "next/navigation";
import examSeoData from "../../../../data/exam-seo.json";

const siteUrl = "https://mauri-results.vercel.app";

function formatTemplate(value, year) {
  return String(value || "").replaceAll("{year}", year);
}

function getExamPage(examKey, year) {
  const exam = examSeoData[examKey];
  if (!exam || !exam.supportedYears.includes(year)) return null;

  const availability = exam.availability?.[year] || "upcoming";
  return {
    ...exam,
    examKey,
    year,
    availability,
    title: `نتائج ${exam.nameAr} ${year} في موريتانيا`,
    heading: `نتائج ${exam.nameAr} ${year} في موريتانيا`,
    description: formatTemplate(exam.introAr, year),
    keywords: [...(exam.keywordsAr || []), ...(exam.keywordsFr || [])].map((keyword) => formatTemplate(keyword, year)),
    searchSteps: (exam.searchStepsAr || []).map((step) => formatTemplate(step, year)),
    topics: (exam.topicsAr || []).map((topic) => ({
      title: formatTemplate(topic.title, year),
      description: formatTemplate(topic.description, year),
    })),
    faqs: (exam.faqsAr || []).map((faq) => ({
      question: formatTemplate(faq.question, year),
      answer: formatTemplate(faq.answer, year),
    })),
  };
}

export function generateStaticParams() {
  return Object.entries(examSeoData).flatMap(([exam, details]) =>
    details.supportedYears.map((year) => ({ exam, year })),
  );
}

export async function generateMetadata({ params }) {
  const { exam, year } = await params;
  const page = getExamPage(exam, year);
  if (!page) return {};

  const canonical = `${siteUrl}/results/${exam}/${year}`;
  const title = `${page.heading} | MauriResults`;

  return {
    title: { absolute: title },
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-snippet": -1,
        "max-image-preview": "large",
      },
    },
    openGraph: {
      type: "website",
      locale: "ar_MR",
      url: canonical,
      title,
      description: page.description,
      siteName: "MauriResults",
      images: [{ url: "/logo.png", width: 1200, height: 1200, alt: page.heading }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: page.description,
      images: ["/logo.png"],
    },
  };
}

export default async function ExamYearPage({ params }) {
  const { exam, year } = await params;
  const page = getExamPage(exam, year);
  if (!page) notFound();

  const canonical = `${siteUrl}/results/${exam}/${year}`;
  const isPublished = page.availability === "published";
  const isBac2026 = page.examKey === "bac" && page.year === "2026";
  const statusLabel = isPublished ? "البحث متاح" : isBac2026 ? "قريباً" : "عند صدور النتائج";
  const ctaLabel = isPublished ? `فتح نتائج ${page.nameAr} ${page.year}` : `متابعة ${page.nameAr} ${page.year}`;
  const searchHref = `/#year-${page.year}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${canonical}#webpage`,
        name: page.heading,
        description: page.description,
        url: canonical,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: {
          "@type": "Thing",
          name: `${page.nameAr} ${page.year}`,
          alternateName: `${page.nameFr} ${page.year}`,
        },
        inLanguage: ["ar-MR", "fr-MR"],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MauriResults", item: siteUrl },
          { "@type": "ListItem", position: 2, name: page.heading, item: canonical },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f5f8f5] px-4 py-8 text-[#17211b] dark:bg-[#0d1712] dark:text-white md:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <article className="mx-auto max-w-4xl rounded-[28px] border border-emerald-900/10 bg-white p-5 shadow-xl shadow-emerald-950/5 dark:border-white/10 dark:bg-[#122019] md:p-9">
        <nav aria-label="مسار الصفحة" className="mb-5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-[#14633f]">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span>{page.nameAr}</span>
          <span className="mx-2">/</span>
          <span>{page.year}</span>
        </nav>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-black text-[#14633f] dark:text-emerald-300">MauriResults</p>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${isPublished ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-300/10 dark:text-emerald-300" : "bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-300"}`}>
            {statusLabel}
          </span>
        </div>

        <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">{page.heading}</h1>
        <p className="mt-4 text-sm font-bold leading-8 text-slate-600 dark:text-slate-300">{page.description}</p>
        <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          بالفرنسية: <span dir="ltr">{page.nameFr} {page.year}</span>
        </p>

        {isBac2026 ? (
          <section className="mt-6 rounded-2xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-300/20 dark:bg-amber-300/5">
            <h2 className="text-base font-black">نتائج باكالوريا 2026 ستظهر فور صدورها رسمياً</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
              لا تعتمد على الشائعات. ستُحدّث هذه الصفحة وتُفتح أداة البحث بمجرد نشر البيانات الرسمية.
            </p>
          </section>
        ) : null}

        <Link href={searchHref} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#14633f] px-5 text-sm font-black text-white transition hover:bg-[#0f4f34]">
          {ctaLabel}
        </Link>

        <section className="mt-8 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-lg font-black">طريقة البحث</h2>
          <ol className="mt-3 grid gap-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
            {page.searchSteps.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#14633f] text-xs text-white">{index + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {page.topics.map((topic) => (
            <article key={topic.title} className="rounded-2xl border border-emerald-900/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h2 className="text-base font-black">{topic.title}</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{topic.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-900/10 p-4 dark:border-white/10">
          <h2 className="text-lg font-black">بعد صدور النتائج</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/toppers" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#14633f] hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-300">الأوائل وأعلى المعدلات</Link>
            <Link href="/statistics" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#14633f] hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-300">نسبة النجاح والإحصائيات</Link>
          </div>
        </section>

        <section className="mt-8 border-t border-emerald-900/10 pt-6 dark:border-white/10">
          <h2 className="text-xl font-black">الأسئلة الشائعة</h2>
          <div className="mt-4 grid gap-3">
            {page.faqs.map((faq) => (
              <article key={faq.question} className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5">
                <h3 className="text-sm font-black">{faq.question}</h3>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <Link href="/" className="mt-6 block text-center text-xs font-black text-slate-500 hover:text-[#14633f] dark:text-slate-400">
          العودة إلى الصفحة الرئيسية
        </Link>
      </article>
    </main>
  );
}
