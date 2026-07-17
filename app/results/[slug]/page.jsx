import Link from "next/link";
import { notFound } from "next/navigation";

const siteUrl = "https://mauriresults.vercel.app";

const pages = {
  "bac-mauritanie": {
    title: "نتائج البكالوريا في موريتانيا | MauriResults",
    heading: "نتائج البكالوريا في موريتانيا",
    description: "البحث عن نتائج البكالوريا في موريتانيا بالاسم أو رقم المترشح، مع عرض المعدل والقرار والمؤسسة والولاية بشكل واضح ومناسب للهاتف.",
    keywords: ["نتائج البكالوريا موريتانيا", "نتائج باكالوريا موريتانيا", "Bac Mauritanie", "Résultats Bac Mauritanie"],
    hash: "year-2025",
  },
  "brevet-mauritanie": {
    title: "نتائج ابريفه في موريتانيا | MauriResults",
    heading: "نتائج ابريفه في موريتانيا",
    description: "الوصول بسرعة إلى نتائج ابريفه في موريتانيا عبر رقم المترشح أو الاسم، مع بطاقة نتيجة واضحة ومهيأة للهاتف.",
    keywords: ["نتائج ابريفه موريتانيا", "نتائج BEPC موريتانيا", "Brevet Mauritanie", "Résultats BEPC Mauritanie"],
    hash: "year-2025",
  },
  "concours-mauritanie": {
    title: "نتائج الكونكور في موريتانيا | MauriResults",
    heading: "نتائج الكونكور في موريتانيا",
    description: "البحث عن نتائج الكونكور في موريتانيا حسب الولاية والمقاطعة والمركز ورقم المترشح من خلال واجهة سريعة وواضحة.",
    keywords: ["نتائج الكونكور موريتانيا", "Concours Mauritanie", "نتائج دخول السنة الأولى إعدادية", "Résultats Concours Mauritanie"],
    hash: "year-2025",
  },
  "excellence-mauritanie": {
    title: "نتائج مسابقة الامتياز في موريتانيا | MauriResults",
    heading: "نتائج مسابقة الامتياز في موريتانيا",
    description: "نتائج مسابقة الامتياز الأولى إعدادية في موريتانيا، مع عرض بيانات المترشح والدرجات والقرار بشكل منظم.",
    keywords: ["نتائج الامتياز موريتانيا", "مسابقة الامتياز الأولى إعدادية", "Excellence 1AS Mauritanie"],
    hash: "year-2025",
  },
};

export function generateStaticParams() {
  return Object.keys(pages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) return {};

  const canonical = `${siteUrl}/results/${slug}`;
  return {
    title: page.title,
    description: page.description,
    keywords: page.keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "ar_MR",
      url: canonical,
      title: page.title,
      description: page.description,
      siteName: "MauriResults",
      images: [{ url: "/logo.png", width: 1200, height: 1200, alt: "MauriResults" }],
    },
    twitter: {
      card: "summary_large_image",
      title: page.title,
      description: page.description,
      images: ["/logo.png"],
    },
  };
}

export default async function ResultLandingPage({ params }) {
  const { slug } = await params;
  const page = pages[slug];
  if (!page) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.heading,
    description: page.description,
    url: `${siteUrl}/results/${slug}`,
    isPartOf: {
      "@type": "WebSite",
      name: "MauriResults",
      url: siteUrl,
    },
    inLanguage: "ar-MR",
  };

  return (
    <main className="min-h-screen bg-[#f5f8f5] px-4 py-12 text-[#17211b] dark:bg-[#0d1712] dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <article className="mx-auto max-w-2xl rounded-[28px] border border-emerald-900/10 bg-white p-6 shadow-xl shadow-emerald-950/5 dark:border-white/10 dark:bg-[#122019] md:p-9">
        <p className="text-xs font-black text-[#14633f] dark:text-emerald-300">MauriResults</p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">{page.heading}</h1>
        <p className="mt-4 text-sm font-bold leading-8 text-slate-600 dark:text-slate-300">{page.description}</p>

        <section className="mt-6 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-base font-black">طريقة البحث</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
            افتح منصة MauriResults، اختر سنة المسابقة ثم اختر نوع الامتحان، وأدخل رقم المترشح أو البيانات المطلوبة لعرض النتيجة الرسمية.
          </p>
        </section>

        <Link href={`/#${page.hash}`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#14633f] px-5 text-sm font-black text-white transition hover:bg-[#0f4f34]">
          البحث عن النتيجة الآن
        </Link>

        <Link href="/" className="mt-3 block text-center text-xs font-black text-slate-500 hover:text-[#14633f] dark:text-slate-400">
          العودة إلى الصفحة الرئيسية
        </Link>
      </article>
    </main>
  );
}
