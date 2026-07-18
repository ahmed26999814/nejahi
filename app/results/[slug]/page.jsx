import Link from "next/link";
import { notFound } from "next/navigation";

const siteUrl = "https://mauri-results.vercel.app";

const pages = {
  "bac-mauritanie": {
    title: "نتائج البكالوريا موريتانيا 2026 برقم المترشح",
    heading: "نتائج البكالوريا موريتانيا 2026 برقم المترشح",
    description: "رابط سريع للبحث عن نتائج البكالوريا في موريتانيا 2026 برقم المترشح، مع متابعة موعد النتائج والأوائل ونسبة النجاح وأعلى معدل والنتائج حسب الولاية والشعبة.",
    keywords: [
      "نتائج البكالوريا موريتانيا 2026",
      "نتائج البكالوريا 2026 برقم المترشح",
      "نتائج باكالوريا موريتانيا 2026",
      "نتائج الباك موريتانيا 2026",
      "رابط نتائج البكالوريا موريتانيا 2026",
      "موعد نتائج البكالوريا موريتانيا 2026",
      "لوائح البكالوريا موريتانيا 2026",
      "أوائل البكالوريا موريتانيا 2026",
      "نسبة النجاح في البكالوريا 2026",
      "أعلى معدل في البكالوريا موريتانيا",
      "نتائج البكالوريا حسب الولاية",
      "نتائج البكالوريا حسب الشعبة",
      "لوائح الناجحين PDF",
      "البكالوريا الدورة التكميلية 2026",
      "Bac Mauritanie 2026",
      "Résultats Bac Mauritanie 2026",
      "Résultats Bac Mauritanie par numéro",
    ],
    hash: "year-2026",
    topics: [
      {
        title: "البحث برقم المترشح",
        description: "أدخل رقم المترشح كما هو لعرض نتيجة البكالوريا الرسمية بسرعة، دون الحاجة إلى البحث بالاسم.",
      },
      {
        title: "موعد ورابط النتائج",
        description: "تُحدّث الصفحة عند الإعلان الرسمي عن موعد نتائج البكالوريا في موريتانيا وفتح البحث للمترشحين.",
      },
      {
        title: "الأوائل وأعلى معدل",
        description: "بعد نشر البيانات يمكنك متابعة أوائل البكالوريا وأعلى معدل حسب الشعبة من صفحة الأوائل.",
      },
      {
        title: "نسبة النجاح والولايات",
        description: "تعرض صفحة الإحصائيات نسبة النجاح وترتيب الولايات والمدارس والنتائج حسب الشعبة عند توفر البيانات.",
      },
      {
        title: "لوائح الناجحين PDF",
        description: "يركز MauriResults على البحث المباشر السريع، وتُضاف روابط اللوائح الرسمية بصيغة PDF عند توفرها.",
      },
      {
        title: "الدورة التكميلية",
        description: "تظهر نتائج البكالوريا الدورة التكميلية 2026 كمسابقة مستقلة فور نشر بياناتها رسميًا.",
      },
    ],
    faqs: [
      {
        question: "كيف أبحث عن نتائج البكالوريا 2026 برقم المترشح؟",
        answer: "افتح MauriResults واختر نتائج البكالوريا 2026، ثم أدخل رقم المترشح واضغط بحث لعرض النتيجة.",
      },
      {
        question: "أين أجد رابط نتائج البكالوريا موريتانيا 2026؟",
        answer: "هذه الصفحة هي صفحة الوصول المخصصة لنتائج البكالوريا في موريتانيا، وتتحول إلى البحث المباشر عند فتح النتائج رسميًا.",
      },
      {
        question: "كيف أعرف أوائل البكالوريا وأعلى معدل؟",
        answer: "انتقل إلى صفحة الأوائل واختر البكالوريا ثم الشعبة لعرض الترتيب وأعلى المعدلات المتاحة.",
      },
      {
        question: "أين تظهر نسبة النجاح والنتائج حسب الولاية؟",
        answer: "تتوفر نسبة النجاح وترتيب الولايات والمدارس والشعب في صفحة الإحصائيات بعد اكتمال معالجة البيانات.",
      },
    ],
  },
  "brevet-mauritanie": {
    title: "نتائج البريفيه موريتانيا 2026 برقم المترشح",
    heading: "نتائج البريفيه موريتانيا 2026 برقم المترشح",
    description: "البحث السريع عن نتائج البريفيه أو أبريفه في موريتانيا 2026 برقم المترشح، مع عرض المعدل والقرار والولاية والمقاطعة والمركز والمدرسة.",
    keywords: [
      "نتائج البريفيه موريتانيا 2026",
      "نتائج أبريفه موريتانيا 2026",
      "نتائج البريفيه برقم المترشح",
      "رابط نتائج البريفيه موريتانيا",
      "BEPC Mauritanie 2026",
      "Résultats BEPC Mauritanie 2026",
      "Brevet Mauritanie 2026",
    ],
    hash: "year-2026",
    topics: [
      {
        title: "البحث برقم المترشح",
        description: "أدخل رقم المترشح للوصول إلى نتيجة البريفيه مباشرة وبأقل عدد من الخطوات.",
      },
      {
        title: "الولاية والمقاطعة",
        description: "يمكن استعراض بيانات الولاية والمقاطعة والمركز والمدرسة حسب المعلومات المنشورة رسميًا.",
      },
    ],
    faqs: [
      {
        question: "كيف أبحث عن نتائج البريفيه موريتانيا 2026؟",
        answer: "اختر البريفيه 2026 في MauriResults ثم أدخل رقم المترشح واضغط بحث.",
      },
      {
        question: "هل أبريفه والبريفيه هما نفس المسابقة؟",
        answer: "تُستخدم العبارتان في البحث للدلالة على مسابقة ختم الدروس الإعدادية BEPC في موريتانيا.",
      },
    ],
  },
  "concours-mauritanie": {
    title: "نتائج الكونكور موريتانيا 2026 برقم المترشح",
    heading: "نتائج الكونكور موريتانيا 2026 برقم المترشح",
    description: "البحث عن نتائج الكونكور ودخول السنة الأولى إعدادية في موريتانيا 2026 حسب الولاية والمقاطعة والمركز ورقم المترشح.",
    keywords: [
      "نتائج الكونكور موريتانيا 2026",
      "نتائج كونكور موريتانيا 2026",
      "نتائج دخول السنة الأولى إعدادية",
      "نتائج دخول أولى إعدادية موريتانيا 2026",
      "رابط نتائج الكونكور موريتانيا",
      "Concours Mauritanie 2026",
      "Résultats Concours Mauritanie 2026",
    ],
    hash: "year-2026",
    topics: [
      {
        title: "اختيار مكان الامتحان",
        description: "اختر الولاية ثم المقاطعة ثم المركز قبل إدخال رقم المترشح للوصول إلى النتيجة الصحيحة.",
      },
      {
        title: "البحث بالرقم",
        description: "يدعم البحث رقم المترشح المحلي ورقم NODOSS حسب البيانات المتاحة للمسابقة.",
      },
    ],
    faqs: [
      {
        question: "كيف أبحث عن نتائج الكونكور موريتانيا 2026؟",
        answer: "اختر الولاية والمقاطعة والمركز، ثم أدخل رقم المترشح واضغط بحث.",
      },
      {
        question: "هل الكونكور هو دخول السنة الأولى إعدادية؟",
        answer: "نعم، تُستخدم عبارة الكونكور للدلالة على مسابقة دخول السنة الأولى إعدادية في موريتانيا.",
      },
    ],
  },
  "excellence-mauritanie": {
    title: "نتائج مسابقة الامتياز موريتانيا 2026",
    heading: "نتائج مسابقة الامتياز موريتانيا 2026",
    description: "نتائج مسابقة الامتياز الأولى إعدادية في موريتانيا 2026 برقم المترشح، مع عرض بيانات المترشح والدرجات والقرار بشكل منظم.",
    keywords: [
      "نتائج الامتياز موريتانيا 2026",
      "مسابقة الامتياز الأولى إعدادية",
      "نتائج Excellence 1AS Mauritanie",
      "Excellence 1AS Mauritanie 2026",
    ],
    hash: "year-2026",
    topics: [
      {
        title: "النتيجة الرسمية",
        description: "ابحث برقم المترشح لعرض الدرجات والبيانات المنشورة رسميًا للمسابقة.",
      },
      {
        title: "عرض مناسب للهاتف",
        description: "تظهر النتيجة في بطاقة خفيفة وواضحة مصممة للاستخدام السريع على الهاتف.",
      },
    ],
    faqs: [
      {
        question: "كيف أبحث عن نتائج مسابقة الامتياز؟",
        answer: "اختر مسابقة الامتياز ثم أدخل رقم المترشح واضغط بحث لعرض البيانات المتاحة.",
      },
    ],
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
      images: [{ url: "/logo.png", width: 1200, height: 1200, alt: page.heading }],
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

  const canonical = `${siteUrl}/results/${slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: page.heading,
        description: page.description,
        url: canonical,
        isPartOf: {
          "@type": "WebSite",
          name: "MauriResults",
          url: siteUrl,
        },
        inLanguage: "ar-MR",
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
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#f5f8f5] px-4 py-12 text-[#17211b] dark:bg-[#0d1712] dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <article className="mx-auto max-w-3xl rounded-[28px] border border-emerald-900/10 bg-white p-6 shadow-xl shadow-emerald-950/5 dark:border-white/10 dark:bg-[#122019] md:p-9">
        <nav aria-label="مسار الصفحة" className="mb-5 text-xs font-bold text-slate-500 dark:text-slate-400">
          <Link href="/" className="hover:text-[#14633f]">الرئيسية</Link>
          <span className="mx-2">/</span>
          <span>{page.heading}</span>
        </nav>

        <p className="text-xs font-black text-[#14633f] dark:text-emerald-300">MauriResults</p>
        <h1 className="mt-2 text-3xl font-black leading-tight md:text-4xl">{page.heading}</h1>
        <p className="mt-4 text-sm font-bold leading-8 text-slate-600 dark:text-slate-300">{page.description}</p>

        <section className="mt-6 rounded-2xl border border-emerald-900/10 bg-emerald-50/70 p-4 dark:border-white/10 dark:bg-white/5">
          <h2 className="text-base font-black">طريقة البحث</h2>
          <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
            افتح منصة MauriResults، اختر سنة المسابقة ثم نوع الامتحان، وأدخل رقم المترشح لعرض النتيجة الرسمية.
          </p>
        </section>

        <Link href={`/#${page.hash}`} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#14633f] px-5 text-sm font-black text-white transition hover:bg-[#0f4f34]">
          البحث عن النتيجة الآن
        </Link>

        <section className="mt-8 grid gap-3 sm:grid-cols-2">
          {page.topics.map((topic) => (
            <article key={topic.title} className="rounded-2xl border border-emerald-900/10 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h2 className="text-base font-black">{topic.title}</h2>
              <p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{topic.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-emerald-900/10 p-4 dark:border-white/10">
          <h2 className="text-lg font-black">روابط مهمة بعد صدور النتائج</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Link href="/toppers" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-black text-[#14633f] hover:bg-emerald-100 dark:bg-white/5 dark:text-emerald-300">أوائل المسابقات وأعلى المعدلات</Link>
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
