import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Sparkles,
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

function DetailItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
      <span className="text-[11px] font-black text-slate-500 dark:text-slate-300">{label}</span>
      <strong className="mt-1 block text-sm font-black text-slate-950 dark:text-white">{value}</strong>
    </div>
  );
}

function GuideList({ icon: Icon, items, title }) {
  return (
    <article className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055] md:p-5">
      <div className="flex items-center gap-2.5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300"><Icon className="h-5 w-5" /></span>
        <h2 className="text-lg font-black">{title}</h2>
      </div>
      <ul className="mt-4 grid gap-2.5">
        {items.map((item) => (
          <li className="flex items-start gap-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300" key={item}>
            <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-mauri-green" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default async function OrientationProgramPage({ params }) {
  const { id } = await params;
  const program = getOrientationProgram(id);
  if (!program) notFound();
  const guide = getSpecialtyGuide(program.name, program.category);

  const sameProgramRows = orientationPrograms
    .filter((item) => item.name === program.name && item.institution === program.institution)
    .sort((a, b) => b.lastScore - a.lastScore);

  const similarPrograms = orientationPrograms
    .filter((item) => item.id !== program.id && item.category === program.category && item.stream === program.stream)
    .sort((a, b) => Math.abs(a.lastScore - program.lastScore) - Math.abs(b.lastScore - program.lastScore))
    .slice(0, 4);

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

      <div className="app-shell grid gap-5 py-5 md:gap-8 md:py-10">
        <section className="relative overflow-hidden rounded-[32px] border border-emerald-200/70 bg-white p-5 shadow-premium dark:border-emerald-300/15 dark:bg-white/[.055] md:p-8">
          <div className="absolute -left-16 -top-20 h-56 w-56 rounded-full bg-emerald-200/35 blur-3xl dark:bg-emerald-400/10" aria-hidden="true" />
          <div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <span className="inline-flex rounded-full bg-mauri-green/10 px-3 py-1.5 text-xs font-black text-mauri-green dark:text-emerald-300">{program.category}</span>
              <h1 className="mt-4 text-3xl font-black leading-tight md:text-5xl">{program.name}</h1>
              <div className="mt-4 grid gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
                <span className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-mauri-green" />{program.institution}</span>
                <span className="flex items-start gap-2"><GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-mauri-green" />{program.faculty}</span>
                <span className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mauri-green" />{program.country} · {program.studyType}</span>
              </div>
            </div>
            <div className="rounded-[26px] bg-mauri-green p-5 text-center text-white shadow-glow">
              <span className="text-xs font-black text-white/80">آخر معدل مسجل</span>
              <strong className="mt-1 block text-4xl font-black">{program.lastScore.toFixed(2)}</strong>
              <span className="mt-1 block text-xs font-bold text-white/80">{program.stream}</span>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[.055] md:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300"><Sparkles className="h-5 w-5" /></span>
            <div><p className="text-xs font-black text-mauri-green dark:text-mauri-gold">شرح التخصص</p><h2 className="mt-1 text-xl font-black">ما هو {program.name}؟</h2><p className="mt-2 text-sm font-bold leading-7 text-slate-600 dark:text-slate-300 md:text-base">{guide.summary}</p></div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <DetailItem label="شعبة الباك" value={program.stream} />
          <DetailItem label="طريقة القبول" value={program.admissionMode} />
          <DetailItem label="مكان الدراسة" value={program.country} />
          <DetailItem label="درجة التحقق" value={program.confidence} />
        </section>

        <section className="grid gap-3 md:grid-cols-3">
          <GuideList icon={BookOpen} items={guide.subjects} title="ماذا ستدرس؟" />
          <GuideList icon={Sparkles} items={guide.skills} title="المهارات المناسبة" />
          <GuideList icon={Briefcase} items={guide.careers} title="فرص العمل" />
        </section>

        <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/15 dark:bg-emerald-300/10 md:p-5">
          <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-200" /><div><h2 className="text-base font-black text-emerald-900 dark:text-emerald-100">هل يناسبك هذا التخصص؟</h2><p className="mt-1 text-sm font-bold leading-7 text-emerald-800 dark:text-emerald-200">{guide.suitableFor}</p></div></div>
        </section>

        {sameProgramRows.length > 1 && (
          <section className="rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055] md:p-5">
            <h2 className="text-xl font-black">المعدلات حسب شعبة الباك</h2>
            <div className="mt-4 grid gap-2">
              {sameProgramRows.map((item) => <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 dark:bg-white/5" key={item.id}><span className="text-sm font-black">{item.stream}</span><strong className="text-lg font-black text-mauri-green dark:text-mauri-gold">{item.lastScore.toFixed(2)}</strong></div>)}
            </div>
          </section>
        )}

        <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">
          <div className="flex items-start gap-3"><ShieldCheck className="mt-1 h-5 w-5 shrink-0" /><p>الشرح عام للتعريف بالتخصص، وقد تختلف المواد وفرص العمل حسب المؤسسة والخطة الدراسية. وهذا المعدل تاريخي للاستئناس فقط وليس ضماناً للقبول.<a className="mr-1 font-black underline underline-offset-4" href={ORIENTATION_SOURCE_URL} target="_blank" rel="noopener noreferrer">المصدر الرسمي للإحصائيات</a></p></div>
        </section>

        {similarPrograms.length > 0 && (
          <section className="grid gap-4">
            <div><p className="text-xs font-black text-mauri-green dark:text-mauri-gold">قد تهمك أيضاً</p><h2 className="text-2xl font-black">تخصصات قريبة</h2></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {similarPrograms.map((item) => (
                <Link className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-soft transition hover:-translate-y-1 hover:border-mauri-green/30 dark:border-white/10 dark:bg-white/[.055]" href={`/orientation/${item.id}`} key={item.id}>
                  <span className="text-[11px] font-black text-mauri-green">{item.category}</span><h3 className="mt-1 line-clamp-2 min-h-12 text-base font-black">{item.name}</h3><p className="mt-2 line-clamp-2 text-xs font-bold text-slate-500 dark:text-slate-300">{item.institution}</p><strong className="mt-3 block text-xl font-black text-mauri-green dark:text-mauri-gold">{item.lastScore.toFixed(2)}</strong>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
