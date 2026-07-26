"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  Compass,
  GraduationCap,
  Layers3,
  MapPin,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ORIENTATION_SOURCE_URL, orientationPrograms } from "../../data/orientation-programs";
import { getSpecialtyGuide } from "../../data/orientation-specialty-guides";

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ًٌٍَُِّْـ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SPECIALTIES = (() => {
  const groups = new Map();
  orientationPrograms.forEach((program) => {
    const current = groups.get(program.name) || {
      name: program.name,
      category: program.category,
      programs: [],
    };
    current.programs.push(program);
    groups.set(program.name, current);
  });

  return [...groups.values()].map((item) => {
    const programs = item.programs
      .slice()
      .sort((a, b) => b.lastScore - a.lastScore || a.institution.localeCompare(b.institution, "ar"));
    const institutions = [...new Set(programs.map((program) => program.institution))];
    const streams = [...new Set(programs.map((program) => program.stream))];
    const scores = programs.map((program) => program.lastScore);
    return {
      ...item,
      programs,
      institutions,
      streams,
      minimumScore: Math.min(...scores),
      maximumScore: Math.max(...scores),
      searchText: normalize(`${item.name} ${item.category} ${institutions.join(" ")} ${streams.join(" ")}`),
    };
  }).sort((a, b) => a.name.localeCompare(b.name, "ar"));
})();

const POPULAR_NAMES = ["الطب", "الذكاء الاصطناعي", "الإعلام والاتصال", "القانون الخاص", "المالية والمحاسبة", "هندسة النفط والغاز"];
const POPULAR = POPULAR_NAMES.map((name) => SPECIALTIES.find((item) => item.name === name)).filter(Boolean);

function InfoCard({ icon: Icon, title, items }) {
  return (
    <article className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_34px_rgba(15,23,42,.045)] dark:border-white/10 dark:bg-white/[.055]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300"><Icon className="h-4.5 w-4.5" /></span>
        <h3 className="font-black">{title}</h3>
      </div>
      <ul className="mt-3 grid gap-2.5">
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

function ScoreRange({ specialty }) {
  return specialty.minimumScore === specialty.maximumScore
    ? specialty.minimumScore.toFixed(2)
    : `${specialty.minimumScore.toFixed(2)} – ${specialty.maximumScore.toFixed(2)}`;
}

export default function SpecialtyGuideExplorer() {
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [focused, setFocused] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const resultRef = useRef(null);
  const normalizedQuery = normalize(query);

  const suggestions = useMemo(() => {
    if (!normalizedQuery) return POPULAR;
    return SPECIALTIES
      .filter((item) => item.searchText.includes(normalizedQuery))
      .sort((a, b) => Number(!normalize(a.name).startsWith(normalizedQuery)) - Number(!normalize(b.name).startsWith(normalizedQuery)) || a.name.length - b.name.length)
      .slice(0, 8);
  }, [normalizedQuery]);

  const specialty = useMemo(() => SPECIALTIES.find((item) => item.name === selectedName) || null, [selectedName]);
  const guide = specialty ? getSpecialtyGuide(specialty.name, specialty.category) : null;
  const offers = specialty ? specialty.programs.slice(0, showAll ? specialty.programs.length : 6) : [];
  const showSuggestions = focused && (query.trim() || !specialty);

  function choose(item) {
    setQuery(item.name);
    setSelectedName(item.name);
    setFocused(false);
    setShowAll(false);
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  function clear() {
    setQuery("");
    setSelectedName("");
    setShowAll(false);
    setFocused(true);
  }

  return (
    <main dir="rtl" className="min-h-screen overflow-x-clip bg-[#f7faf8] pb-20 text-slate-950 dark:bg-[#06110b] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
        <div className="app-shell flex min-h-14 items-center justify-between gap-3">
          <Link className="inline-flex items-center gap-2 text-sm font-black text-mauri-green" href="/"><ArrowLeft className="h-4 w-4 rotate-180" />MauriResults</Link>
          <strong className="text-sm font-black text-slate-700 dark:text-slate-100">التوجيه</strong>
        </div>
      </header>

      <div className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
        <section className="relative overflow-hidden rounded-[30px] border border-emerald-200/70 bg-white p-5 shadow-premium dark:border-emerald-300/15 dark:bg-white/[.055] md:p-7">
          <span className="pointer-events-none absolute -left-14 -top-20 h-56 w-56 rounded-full bg-emerald-100/80 blur-3xl dark:bg-emerald-400/10" />
          <div className="relative grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-mauri-green/10 px-3 py-1.5 text-xs font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300"><Sparkles className="h-3.5 w-3.5" />ميزة جديدة</span>
              <h1 className="mt-3 text-2xl font-black leading-9 md:text-4xl">اكتب اسم أي تخصص واعرفه قبل أن تختاره</h1>
              <p className="mt-2 max-w-2xl text-sm font-bold leading-7 text-slate-500 dark:text-slate-300 md:text-base">شرح مبسط لما ستدرسه، والمهارات المطلوبة، وفرص العمل، والجهات التي توفر التخصص وآخر المعدلات المسجلة.</p>
            </div>
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-[26px] bg-mauri-green text-white shadow-[0_18px_42px_rgba(21,128,61,.28)]"><GraduationCap className="h-10 w-10" /></span>
          </div>
        </section>

        <section className="relative z-20 rounded-[28px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055] md:p-5">
          <div className="flex items-end justify-between gap-3">
            <div><p className="text-xs font-black text-mauri-green">دليل التخصصات</p><h2 className="mt-1 text-xl font-black">ما التخصص الذي تريد معرفته؟</h2></div>
            <span className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-[11px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">{SPECIALTIES.length} تخصصاً</span>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute right-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-mauri-green" />
            <input
              aria-label="ابحث عن تخصص"
              autoComplete="off"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-12 pl-12 text-base font-black outline-none transition placeholder:text-slate-400 focus:border-mauri-green focus:bg-white focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/5"
              onBlur={() => window.setTimeout(() => setFocused(false), 120)}
              onChange={(event) => { setQuery(event.target.value); if (event.target.value !== selectedName) setSelectedName(""); }}
              onFocus={() => setFocused(true)}
              placeholder="مثال: الإعلام والاتصال أو الذكاء الاصطناعي"
              type="search"
              value={query}
            />
            {query && <button aria-label="مسح البحث" className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10" onClick={clear} type="button"><X className="h-4 w-4" /></button>}

            {showSuggestions && (
              <div className="absolute inset-x-0 top-[calc(100%+.5rem)] z-30 overflow-hidden rounded-[22px] border border-slate-200 bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,.18)] dark:border-white/10 dark:bg-[#0a1710]">
                {suggestions.length ? suggestions.map((item) => (
                  <button className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-right transition hover:bg-mauri-green/7" key={item.name} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(item)} type="button">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green"><Compass className="h-4.5 w-4.5" /></span>
                    <span className="min-w-0 flex-1"><strong className="block truncate text-sm font-black">{item.name}</strong><small className="block truncate text-xs font-bold text-slate-500 dark:text-slate-300">{item.category} · {item.programs.length} عرض</small></span>
                  </button>
                )) : <p className="p-4 text-center text-sm font-bold text-slate-500">لا يوجد تخصص مطابق. جرّب جزءاً آخر من الاسم.</p>}
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {POPULAR.map((item) => <button className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-mauri-green hover:text-mauri-green dark:border-white/10 dark:bg-white/5 dark:text-slate-200" key={item.name} onClick={() => choose(item)} type="button">{item.name}</button>)}
          </div>
        </section>

        {specialty && guide ? (
          <section className="grid scroll-mt-20 gap-4" ref={resultRef}>
            <article className="relative overflow-hidden rounded-[30px] border border-emerald-200/70 bg-white p-5 shadow-premium dark:border-emerald-300/15 dark:bg-white/[.055] md:p-7">
              <div className="relative flex items-start justify-between gap-3">
                <div><span className="inline-flex rounded-full bg-mauri-green/10 px-3 py-1.5 text-xs font-black text-mauri-green">{specialty.category}</span><h2 className="mt-3 text-3xl font-black md:text-4xl">{specialty.name}</h2></div>
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-mauri-green text-white"><Compass className="h-7 w-7" /></span>
              </div>
              <div className="mt-5 rounded-[22px] bg-slate-50 p-4 text-sm font-bold leading-7 text-slate-700 dark:bg-white/5 dark:text-slate-200 md:text-base"><strong className="mb-1 block text-xs font-black text-mauri-green">ما هو هذا التخصص؟</strong>{guide.summary}</div>
            </article>

            <section className="grid grid-cols-3 gap-2.5">
              <article className="rounded-[20px] border border-slate-200 bg-white p-3 text-center dark:border-white/10 dark:bg-white/[.055]"><Building2 className="mx-auto h-5 w-5 text-mauri-green" /><strong className="mt-1 block text-xl font-black">{specialty.institutions.length}</strong><span className="text-[10px] font-black text-slate-500">مؤسسة</span></article>
              <article className="rounded-[20px] border border-slate-200 bg-white p-3 text-center dark:border-white/10 dark:bg-white/[.055]"><Layers3 className="mx-auto h-5 w-5 text-mauri-green" /><strong className="mt-1 block text-xl font-black">{specialty.streams.length}</strong><span className="text-[10px] font-black text-slate-500">شعبة باك</span></article>
              <article className="rounded-[20px] border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-300/15 dark:bg-amber-300/10"><BarChart3 className="mx-auto h-5 w-5 text-amber-700" /><strong className="mt-1 block text-sm font-black text-amber-800"><ScoreRange specialty={specialty} /></strong><span className="text-[10px] font-black text-amber-700">آخر معدل</span></article>
            </section>

            <section className="grid gap-3 md:grid-cols-3"><InfoCard icon={BookOpen} title="ماذا ستدرس؟" items={guide.subjects} /><InfoCard icon={Sparkles} title="مهارات مهمة" items={guide.skills} /><InfoCard icon={Briefcase} title="فرص العمل" items={guide.careers} /></section>

            <section className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-300/15 dark:bg-emerald-300/10"><h3 className="font-black text-emerald-900 dark:text-emerald-100">هل يمكن أن يناسبك؟</h3><p className="mt-1 text-sm font-bold leading-7 text-emerald-800 dark:text-emerald-200">{guide.suitableFor}</p></section>

            <section className="grid gap-3">
              <div><p className="text-xs font-black text-mauri-green">بيانات التوجيه</p><h3 className="mt-1 text-xl font-black">أين يوجد هذا التخصص؟</h3><p className="mt-1 text-sm font-bold text-slate-500">{specialty.programs.length} عرضاً حسب المؤسسة وشعبة الباك.</p></div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {offers.map((program) => (
                  <Link className="rounded-[22px] border border-slate-200/80 bg-white p-4 shadow-[0_10px_32px_rgba(15,23,42,.045)] transition hover:border-mauri-green/35 dark:border-white/10 dark:bg-white/[.055]" href={`/orientation/${program.id}`} key={program.id}>
                    <div className="flex items-start justify-between gap-3"><span className="rounded-xl bg-mauri-green/10 px-2.5 py-1.5 text-xs font-black text-mauri-green">{program.stream}</span><strong className="text-xl font-black text-mauri-green">{program.lastScore.toFixed(2)}</strong></div>
                    <h4 className="mt-3 font-black leading-6">{program.institution}</h4>
                    <p className="mt-2 flex items-start gap-2 text-xs font-bold leading-5 text-slate-500"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-mauri-green" />{program.faculty}</p>
                  </Link>
                ))}
              </div>
              {!showAll && specialty.programs.length > offers.length && <button className="mx-auto min-h-11 rounded-2xl border border-mauri-green/25 bg-white px-5 text-sm font-black text-mauri-green shadow-soft dark:bg-white/5" onClick={() => setShowAll(true)} type="button">عرض بقية العروض ({specialty.programs.length - offers.length})</button>}
            </section>

            <section className="rounded-[22px] border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-900 dark:border-amber-300/20 dark:bg-amber-300/10 dark:text-amber-100">الشرح عام للتعريف بالتخصص، وقد تختلف المواد وفرص العمل حسب المؤسسة والبلد. أما المعدلات فهي تاريخية للاستئناس ولا تضمن القبول.<a className="mr-1 font-black underline underline-offset-4" href={ORIENTATION_SOURCE_URL} target="_blank" rel="noopener noreferrer">المصدر</a></section>
          </section>
        ) : (
          <section className="rounded-[28px] border border-dashed border-slate-300 bg-white p-7 text-center dark:border-white/15 dark:bg-white/[.045]"><Search className="mx-auto h-8 w-8 text-mauri-green" /><h2 className="mt-3 text-lg font-black">ابدأ بكتابة اسم التخصص</h2><p className="mt-1 text-sm font-bold leading-7 text-slate-500">اكتب الاسم كاملاً أو جزءاً منه، وستظهر لك التخصصات الموجودة في بيانات التوجيه.</p></section>
        )}

        <Link className="rounded-[28px] bg-mauri-green p-5 text-white shadow-[0_18px_46px_rgba(21,128,61,.24)] transition hover:bg-emerald-700" href="/orientation/match"><div className="flex items-center gap-4"><span className="grid h-12 w-12 shrink-0 place-items-center rounded-[18px] bg-white/15"><GraduationCap className="h-6 w-6" /></span><div className="min-w-0 flex-1"><strong className="block text-lg font-black">اعرف التخصصات المناسبة لمعدلك</strong><span className="mt-1 block text-sm font-bold leading-6 text-white/80">اختر شعبة الباك وأدخل معدلك لتظهر الخيارات الأقرب.</span></div></div></Link>
      </div>
    </main>
  );
}
