import Link from "next/link";
import { ArrowLeft, BookOpen, Download, Home, ShieldCheck } from "lucide-react";
import ExamLibrary from "../../components/documents/ExamLibrary";

export const metadata = {
  title: "مواضيع الامتحانات والتصحيحات",
  description:
    "مكتبة مواضيع باكالوريا وابريفه وكونكور والامتياز مع الحلول والمذكرات والمراجع، منظمة حسب المسابقة والسنة والمادة.",
  alternates: { canonical: "/documents" },
  openGraph: {
    title: "مواضيع الامتحانات والتصحيحات | MauriResults",
    description:
      "حمّل مواضيع باكالوريا وابريفه وكونكور والامتياز وحلولها ومراجعها من مكتبة MauriResults.",
    url: "/documents",
  },
};

export default function DocumentsPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#06110c] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[480px] w-[480px] rounded-full bg-amber-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-3" aria-label="التنقل">
          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            href="/"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            الرئيسية
          </Link>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">
            MauriResults
          </span>
        </nav>

        <header className="relative mt-5 overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-bl from-[#0a3d2a] via-[#0b2c20] to-[#07150f] px-5 py-8 text-white shadow-[0_28px_70px_rgba(5,46,32,.25)] sm:px-8 sm:py-12 lg:px-12">
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute -left-16 top-0 h-56 w-56 rounded-full border-[40px] border-emerald-300/20" />
            <div className="absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
          </div>
          <div className="relative grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-emerald-100">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                مكتبة الامتحانات الوطنية
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                المواضيع، الحلول والمراجع في مكان واحد
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-emerald-50/80 sm:text-base">
                اختر المسابقة والسنة والمادة، ثم حمّل الموضوع أو التصحيح مباشرة. تشمل المكتبة باكالوريا، ابريفه، كونكور، الامتياز ومسابقات تعليمية أخرى.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <Download className="h-5 w-5 text-amber-300" aria-hidden="true" />
                <strong className="mt-2 block text-sm">تنزيل مباشر</strong>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <ShieldCheck className="h-5 w-5 text-amber-300" aria-hidden="true" />
                <strong className="mt-2 block text-sm">مصادر مأذون بها</strong>
              </div>
              <div className="hidden rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:block">
                <ArrowLeft className="h-5 w-5 text-amber-300" aria-hidden="true" />
                <strong className="mt-2 block text-sm">تنظيم سهل</strong>
              </div>
            </div>
          </div>
        </header>

        <section className="py-7 sm:py-10">
          <ExamLibrary />
        </section>

        <footer className="border-t border-slate-200 py-7 text-center text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">
          الملفات مفهرسة من Rimbac بإذن صاحب الموقع، مع الحفاظ على اسم المصدر والحقوق.
        </footer>
      </div>
    </main>
  );
}
