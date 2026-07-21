import Link from "next/link";
import { ArrowLeft, BookOpen, Download, FileCheck2 } from "lucide-react";

export default function ExamLibraryPromo() {
  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-emerald-900/10 bg-gradient-to-bl from-[#0c4a32] via-[#0b3425] to-[#071b13] p-5 text-white shadow-[0_22px_55px_rgba(6,78,59,.18)] sm:p-7">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full border-[35px] border-white/5" />
        <div className="absolute -bottom-24 right-1/3 h-52 w-52 rounded-full bg-amber-300/10 blur-3xl" />
      </div>

      <div className="relative grid items-center gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-emerald-100">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            جديد في MauriResults
          </div>
          <h2 className="mt-4 text-2xl font-black sm:text-3xl">مكتبة مواضيع الامتحانات والتصحيحات</h2>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-emerald-50/80">
            مواضيع باكالوريا وابريفه وكونكور والامتياز، مرتبة حسب السنة والمادة، مع الحلول والمذكرات والمراجع المتوفرة.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-black text-emerald-50/90">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              تنزيل مباشر
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <FileCheck2 className="h-3.5 w-3.5" aria-hidden="true" />
              مواضيع وحلول
            </span>
          </div>
        </div>

        <Link
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-[#0b3d2a] shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:bg-emerald-50 active:translate-y-0"
          href="/documents"
        >
          فتح المكتبة
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
