import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  GraduationCap,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { notFound } from "next/navigation";
import {
  ORIENTATION_SOURCE_URL,
  getOrientationProgram,
  orientationPrograms,
} from "../../../data/orientation-programs";
import { getSpecialtyGuide } from "../../../data/orientation-specialty-guides";

export function generateStaticParams() {
  return orientationPrograms.map((program) => ({ id: program.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const program = getOrientationProgram(id);
  if (!program) return {};
  const guide = getSpecialtyGuide(program.name, program.category);

  return {
    title: `${program.name} - ${program.institution}`,
    description: `${guide.summary} آخر معدل توجيه مسجل في ${program.institution}: ${program.lastScore.toFixed(2)} لشعبة ${program.stream}.`,
    alternates: { canonical: `/orientation/${program.id}` },
  };
}

function InfoList({ icon: Icon, items, title }) {
  if (!items?.length) return null;
  return (
    <section className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300"><Icon className="h-4.5 w-4.5" /></span>
        <h2 className="font-black">{title}</h2>
      </div>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-700 dark:bg-white/5 dark:text-slate-200" key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export default async function OrientationProgramPage({ params }) {
  const { id } = await params;
  const program = getOrientationProgram(id);
  if (!program) notFound();
  const guide = getSpecialtyGuide(program.name, program.category);

  const sameProgramRows = orientationPrograms
    .filter((item) => item.name === program.name)
    .sort((a, b) => b.lastScore - a.lastScore);

  const uniquePlaces = [...new Map(
    sameProgramRows.map((item) => [`${item.institution}|${item.faculty}|${item.stream}`, item]),
  ).values()];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: program.name,
    description: guide.summary,
    provider: { "@type": "EducationalOrganization", name: program.institution },
    educationalProgramMode: program.admissionMode,
    areaServed: program.country,
    url: `https://mauri-results.vercel.app/orientation/${program.id}`,
  };

  return (
    <main dir="rtl" className="min-h-screen bg-[#f7faf8] pb-16 text-slate-950 dark:bg-[#06110b] dark:text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />

      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/90">
        <div className="app-shell flex min-h-14 items-center justify-between gap-3">
          <Link className="inline-flex items-center gap-2 text-sm font-black text-mauri-green" href="/orientation"><ArrowLeft className="h-4 w-4 rotate-180" />دليل التخصصات</Link>
          <Link className="text-xs font-black text-slate-500 dark:text-slate-300" href="/">الرئيسية</Link>
        </div>
      </header>

      <div className="app-shell grid gap-3 py-4 md:gap-5 md:py-8">
        <section className="rounded-[26px] border border-emerald-200/80 bg-white p-5 shadow-soft dark:border-emerald-300/15 dark:bg-white/[.055] md:p-6">
          <span className="text-xs font-black text-mauri-green">{program.category}</span>
          <h1 className="mt-1 text-3xl font-black leading-tight md:text-4xl">{program.name}</h1>
          <p className="mt-4 text-sm font-bold leading-7 text-slate-700 dark:text-slate-200 md:text-base">{guide.summary}</p>
        </section>

        <section className="grid grid-cols-2 gap-2.5">
          <article className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.055]">
            <Building2 className="h-5 w-5 text-mauri-green" />
            <span className="mt-2 block text-[11px] font-black text-slate-400">المؤسسة</span>
            <strong className="mt-1 block text-sm font-black leading-6">{program.institution}</strong>
          </article>
          <article className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.055]">
            <GraduationCap className="h-5 w-5 text-mauri-green" />
            <span className="mt-2 block text-[11px] font-black text-slate-400">الكلية أو المعهد</span>
            <strong className="mt-1 block text-sm font-black leading-6">{program.faculty}</strong>
          </article>
          <article className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.055]">
            <MapPin className="h-5 w-5 text-mauri-green" />
            <span className="mt-2 block text-[11px] font-black text-slate-400">مكان الدراسة</span>
            <strong className="mt-1 block text-sm font-black leading-6">{program.country}</strong>
          </article>
          <article className="rounded-[20px] border border-amber-200 bg-amber-50 p-3 dark:border-amber-300/15 dark:bg-amber-300/10">
            <CheckCircle2 className="h-5 w-5 text-amber-700 dark:text-amber-200" />
            <span className="mt-2 block text-[11px] font-black text-amber-700 dark:text-amber-200">آخر معدل · {program.stream}</span>
            <strong className="mt-1 block text-xl font-black text-amber-800 dark:text-amber-100">{program.lastScore.toFixed(2)}</strong>
          </article>
        </section>

        <InfoList icon={BookOpen} items={guide.subjects} title="مواد تُدرّس عادة" />
        <InfoList icon={BriefcaseBusiness} items={guide.careers} title="الآفاق المستقبلية" />

        {uniquePlaces.length > 1 && (
          <section className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055]">
            <h2 className="font-black">أماكن وشعب أخرى للتخصص</h2>
            <div className="mt-3 grid gap-2">
              {uniquePlaces.map((item) => (
                <Link className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-mauri-green/5 dark:bg-white/5" href={`/orientation/${item.id}`} key={item.id}>
                  <MapPin className="h-4 w-4 shrink-0 text-mauri-green" />
                  <span className="min-w-0 flex-1"><strong className="block text-sm font-black leading-5">{item.institution}</strong><small className="mt-0.5 block text-xs font-bold text-slate-500">{item.faculty} · {item.stream}</small></span>
                  <strong className="shrink-0 text-base font-black text-mauri-green">{item.lastScore.toFixed(2)}</strong>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-6 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
          <div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /><p>المواد المذكورة تعريفية وشائعة وقد تختلف حسب المؤسسة والخطة الدراسية. المعدل تاريخي للاستئناس فقط وليس ضماناً للقبول. <a className="font-black underline" href={ORIENTATION_SOURCE_URL} target="_blank" rel="noopener noreferrer">مصدر المعدلات</a></p></div>
        </section>
      </div>
    </main>
  );
}
