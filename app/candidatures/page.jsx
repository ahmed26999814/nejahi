import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import CandidatureSearch from "../../components/candidatures/CandidatureSearch";

export const metadata = {
  title: "حالة الترشح في المسابقات",
  description: "تحقق من حالة ترشحك في مسابقات اللجنة الوطنية للمسابقات بموريتانيا عبر رقم الوصل أو الاسم وجزء من الاسم.",
  alternates: { canonical: "/candidatures" },
  openGraph: {
    title: "حالة الترشح في المسابقات | MauriResults",
    description: "بحث سريع بالاسم أو رقم الوصل لمعرفة حالة الترشح والقبول المؤقت وسبب الرفض عند توفره.",
    url: "/candidatures",
  },
};

export default function CandidaturesPage() {
  return (
    <main className="app-background min-h-screen pb-12 text-mauri-ink dark:text-white">
      <header className="sticky top-0 z-50 border-b border-mauri-border/75 bg-white/[.92] shadow-[0_8px_28px_rgba(15,23,42,.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.92]">
        <nav className="app-shell flex h-14 items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 rounded-2xl text-start transition active:scale-[.98]" aria-label="MauriResults">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[14px] border border-emerald-200 bg-gradient-to-br from-emerald-500 to-mauri-green text-[11px] font-black tracking-tight text-white shadow-[0_8px_20px_rgba(21,128,61,.2)] dark:border-emerald-400/20">MR</span>
            <span className="min-w-0">
              <strong className="block truncate text-sm font-black tracking-tight">MauriResults</strong>
              <small className="block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">منصة النتائج الوطنية</small>
            </span>
          </Link>

          <Link href="/" className="inline-flex min-h-10 items-center gap-1.5 rounded-xl px-2 text-sm font-black text-slate-700 transition hover:bg-slate-100 active:scale-[.98] dark:text-white dark:hover:bg-white/10">
            الرئيسية
            <ArrowRight className="h-4 w-4" />
          </Link>
        </nav>
      </header>

      <div className="app-shell mx-auto max-w-2xl py-5 sm:py-8">
        <section className="mb-5 px-1 text-center sm:mb-6">
          <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-mauri-green/15 bg-mauri-green/5 px-3 py-1.5 text-xs font-black text-mauri-green dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            خدمة الترشحات
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl dark:text-white">تحقق من حالة ترشحك</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-7 text-slate-500 dark:text-slate-400">اكتب الاسم وستظهر الاقتراحات مباشرة، أو استخدم رقم الوصل للوصول السريع إلى حالة الملف.</p>
        </section>

        <CandidatureSearch />

        <p className="mx-auto mt-6 max-w-xl px-3 text-center text-[11px] font-semibold leading-6 text-slate-400 dark:text-slate-500">MauriResults يسهل الوصول إلى اللوائح المنشورة رسميًا، والمرجع النهائي لأي قبول أو تظلم هو الجهة المنظمة.</p>
      </div>
    </main>
  );
}
