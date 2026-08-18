import { ShieldCheck } from "lucide-react";
import CandidatureHeader from "../../components/candidatures/CandidatureHeader";
import CandidatureSearch from "../../components/candidatures/CandidatureSearch";

export const metadata = {
  title: "حالة الترشح في المسابقات",
  description: "تحقق من حالة ترشحك في مسابقات اللجنة الوطنية للمسابقات بموريتانيا عبر الاسم أو رقم الوصل.",
  alternates: { canonical: "/candidatures" },
  openGraph: {
    title: "حالة الترشح في المسابقات | MauriResults",
    description: "بحث سريع في ترشحات المسابقات بالاسم أو رقم الوصل.",
    url: "/candidatures",
  },
};

export default function CandidaturesPage() {
  return (
    <main className="min-h-screen bg-[#f5f8fb] pb-12 text-slate-950 dark:bg-[#071426] dark:text-white">
      <CandidatureHeader />

      <div className="app-shell mx-auto max-w-2xl py-5 sm:py-8">
        <section className="mb-5 px-1 text-center sm:mb-6">
          <span className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-600 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            خدمة الترشحات
          </span>
          <h1 className="mt-3 text-2xl font-black tracking-tight text-[#0d1d35] sm:text-3xl dark:text-white">تحقق من حالة ترشحك</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-7 text-slate-500 dark:text-slate-300">اكتب الاسم أو رقم الوصل في نفس خانة البحث، وسيحدد النظام الطريقة تلقائيًا.</p>
        </section>

        <CandidatureSearch />

        <p className="mx-auto mt-6 max-w-xl px-3 text-center text-[11px] font-semibold leading-6 text-slate-400 dark:text-slate-500">MauriResults يسهل البحث في اللوائح المنشورة، والقبول في هذه المرحلة لا يعني القبول النهائي.</p>
      </div>
    </main>
  );
}
