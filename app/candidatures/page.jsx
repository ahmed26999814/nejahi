import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import CandidatureSearch from "../../components/candidatures/CandidatureSearch";

export const metadata = {
  title: "حالة الترشح في المسابقات",
  description: "تحقق من حالة ترشحك في مسابقات اللجنة الوطنية للمسابقات بموريتانيا عبر رقم الوصل أو الاسم وجزء من الاسم.",
  alternates: {
    canonical: "/candidatures",
  },
  openGraph: {
    title: "حالة الترشح في المسابقات | MauriResults",
    description: "بحث سريع بالاسم أو رقم الوصل لمعرفة حالة الترشح والقبول المؤقت وسبب الرفض عند توفره.",
    url: "/candidatures",
  },
};

export default function CandidaturesPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-12 text-slate-950 dark:bg-[#06110b] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/90">
        <div className="app-shell flex h-14 items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl px-1 text-sm font-black text-slate-800 transition active:scale-[.98] dark:text-white">
            <ArrowRight className="h-5 w-5" />
            الرئيسية
          </Link>
          <Link href="/" className="flex items-center gap-2" aria-label="MauriResults">
            <img src="/brand-logo.svg" alt="" className="h-9 w-9 rounded-xl" />
            <strong className="hidden text-sm font-black sm:block">MauriResults</strong>
          </Link>
        </div>
      </header>

      <div className="app-shell mx-auto max-w-3xl py-7 sm:py-10">
        <section className="mb-6 px-1 text-center sm:mb-8">
          <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-mauri-green/15 bg-mauri-green/5 px-3 py-1.5 text-xs font-black text-mauri-green dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            خدمة الترشحات
          </span>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-4xl dark:text-white">تحقق من حالة ترشحك</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-7 text-slate-500 sm:text-base dark:text-slate-400">
            ابحث بسرعة بالاسم، بجزء من الاسم، أو برقم الوصل لمعرفة حالة ملفك حسب آخر لائحة رسمية منشورة.
          </p>
        </section>

        <CandidatureSearch />

        <p className="mx-auto mt-7 max-w-xl px-3 text-center text-xs leading-6 text-slate-400 dark:text-slate-500">
          MauriResults يعرض البيانات المنشورة رسميًا لتسهيل البحث فقط. المرجع النهائي لأي قبول أو تظلم هو اللجنة الوطنية للمسابقات.
        </p>
      </div>
    </main>
  );
}
