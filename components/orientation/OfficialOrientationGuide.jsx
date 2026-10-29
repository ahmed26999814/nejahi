import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";

const STEPS = [
  {
    title: "استكشف التخصصات والمؤسسات",
    description: "ابدأ بالتخصص الذي تريده، ثم قارن البرامج والمواد والمؤسسات المناسبة لشعبة الباكالوريا.",
  },
  {
    title: "قارن معدلك بالمعدلات السابقة",
    description: "استخدم أداة «المتاح حسب معدلي» للاستئناس فقط؛ معدلات السنوات الماضية لا تعني قبولاً مضموناً هذا العام.",
  },
  {
    title: "رتّب رغباتك في المنصة الرسمية",
    description: "عند فتح فترة التوجيه، أدخل اختياراتك ورتّبها حسب أفضليتك عبر منصة وزارة التعليم العالي، وراجع الشروط والآجال المعلنة.",
  },
  {
    title: "تابع قرار التوجيه ثم التسجيل",
    description: "التوجيه النهائي يعتمد على ترتيب المترشحين والرغبات والطاقة الاستيعابية. بعد إعلان التوجيه، اتبع تعليمات التسجيل في مؤسستك.",
  },
];

export default function OfficialOrientationGuide() {
  return (
    <section aria-labelledby="official-orientation-guide" className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055] md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-black text-mauri-green">دليلك قبل تقديم اختيارات التوجيه</span>
          <h2 id="official-orientation-guide" className="mt-1 text-xl font-black">من اختيار التخصص إلى التوجيه الرسمي</h2>
          <p className="mt-2 max-w-3xl text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">
            دليل MauriResults للمقارنة والتخطيط، أما ترتيب الرغبات وإعلان التوجيه فيتمّان عبر الجهات الرسمية.
          </p>
        </div>
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green">
          <ShieldCheck className="h-6 w-6" aria-hidden="true" />
        </span>
      </div>
      <ol className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50 p-3.5 dark:border-white/10 dark:bg-white/[.04]">
            <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mauri-green text-sm font-black text-white">
              {index + 1}
            </span>
            <div>
              <h3 className="text-sm font-black">{step.title}</h3>
              <p className="mt-1 text-xs font-bold leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <a
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-mauri-green px-4 py-3 text-center text-sm font-black text-white transition hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mauri-green"
          href="https://etudiants-mesrs.app/"
          target="_blank"
          rel="noopener noreferrer"
        >
          منصة التوجيه التابعة للوزارة
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
        </a>
        <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-mauri-green/20 bg-mauri-green/10 px-4 py-3 text-center text-sm font-black text-mauri-green dark:text-emerald-300" href="/orientation/match">
          قارن التخصصات حسب معدلك
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-bold leading-6 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-100">
        تنبيه: المنحة الدراسية ليست نتيجة تلقائية للتوجيه، وتُراجع شروطها وإعلاناتها الرسمية بصورة مستقلة. المعلومات هنا إرشادية ولا تُستعمل لتقديم الطلبات أو حفظ بيانات الطالب.
      </p>
      <p className="mt-2 text-[11px] font-bold leading-5 text-slate-500 dark:text-slate-400">
        تُحدَّث عروض التكوين، شروط القبول، المواعيد والطاقة الاستيعابية من الوزارة؛ تحقّق منها قبل تثبيت أي اختيار.
      </p>
    </section>
  );
}
