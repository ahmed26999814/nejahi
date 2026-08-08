"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  ChevronLeft,
  Compass,
  ExternalLink,
  GraduationCap,
  Layers3,
  MapPin,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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

function InstitutionMark({ institution, large = false }) {
  const [failed, setFailed] = useState(false);
  const size = large ? "h-20 w-20 rounded-[24px]" : "h-14 w-14 rounded-[18px]";

  if (institution.logo && !failed) {
    return (
      <span className={`grid ${size} shrink-0 place-items-center overflow-hidden border border-slate-200 bg-white p-1.5 shadow-sm dark:border-white/10`}>
        <img
          alt={`شعار ${institution.name}`}
          className="h-full w-full object-contain"
          decoding="async"
          height={large ? 80 : 56}
          loading="lazy"
          onError={() => setFailed(true)}
          src={institution.logo}
          width={large ? 80 : 56}
        />
      </span>
    );
  }

  return (
    <span className={`grid ${size} shrink-0 place-items-center bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300`}>
      <Building2 className={large ? "h-9 w-9" : "h-6 w-6"} />
    </span>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white px-3 py-3 dark:border-white/10 dark:bg-white/[.055]">
      <strong className="block text-xl font-black text-mauri-green">{value}</strong>
      <span className="mt-1 block text-[11px] font-black text-slate-500 dark:text-slate-300">{label}</span>
    </div>
  );
}

function scoreText(range) {
  if (!range) return "—";
  if (range.min === range.max) return range.min.toFixed(2);
  return `${range.min.toFixed(2)} – ${range.max.toFixed(2)}`;
}

export default function OrientationHub({ institutions, sources }) {
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const detailRef = useRef(null);
  const normalizedQuery = normalize(query);

  const filtered = useMemo(() => {
    if (!normalizedQuery) return institutions;
    return institutions.filter((institution) => {
      const searchable = normalize(
        `${institution.name} ${institution.city} ${institution.parent} ${institution.specialties.map((item) => item.name).join(" ")} ${institution.faculties.map((item) => item.name).join(" ")}`,
      );
      return searchable.includes(normalizedQuery);
    });
  }, [institutions, normalizedQuery]);

  const selected = useMemo(
    () => institutions.find((institution) => institution.name === selectedName) || null,
    [institutions, selectedName],
  );

  function openInstitution(name) {
    setSelectedName(name);
    window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 40);
  }

  return (
    <main dir="rtl" className="min-h-screen overflow-x-clip bg-[#f7faf8] pb-20 text-slate-950 dark:bg-[#06110b] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
        <div className="app-shell flex min-h-14 items-center justify-between gap-3">
          {selected ? (
            <button
              className="inline-flex items-center gap-2 text-sm font-black text-mauri-green"
              onClick={() => setSelectedName("")}
              type="button"
            >
              <ArrowRight className="h-4 w-4" />المؤسسات
            </button>
          ) : (
            <Link className="inline-flex items-center gap-2 text-sm font-black text-mauri-green" href="/">
              <ArrowLeft className="h-4 w-4 rotate-180" />MauriResults
            </Link>
          )}
          <strong className="text-sm font-black text-slate-700 dark:text-slate-100">التوجيه</strong>
        </div>
      </header>

      <div className="app-shell grid gap-4 py-4 md:gap-5 md:py-7">
        {!selected ? (
          <>
            <section className="overflow-hidden rounded-[30px] bg-mauri-green p-5 text-white shadow-[0_18px_46px_rgba(21,128,61,.2)] md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-black ring-1 ring-white/15">
                    <Compass className="h-4 w-4" />دليل الطالب بعد الباك
                  </span>
                  <h1 className="mt-4 text-3xl font-black leading-tight md:text-4xl">اختر مسارك الجامعي بوضوح</h1>
                  <p className="mt-3 text-sm font-bold leading-7 text-white/85 md:text-base">
                    الجامعات والمعاهد، الكليات، التخصصات، المواد وآخر معدلات التوجيه في مكان واحد.
                  </p>
                </div>
                <span className="hidden h-20 w-20 shrink-0 place-items-center rounded-[26px] bg-white/12 ring-1 ring-white/15 sm:grid">
                  <GraduationCap className="h-10 w-10" />
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <Link
                  className="flex min-h-14 items-center gap-3 rounded-2xl bg-white px-3 text-sm font-black text-mauri-green shadow-sm transition active:scale-[.985]"
                  href="/orientation/specialties"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mauri-green/10"><BookOpen className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">التخصصات والمواد</span>
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                </Link>
                <Link
                  className="flex min-h-14 items-center gap-3 rounded-2xl bg-white/12 px-3 text-sm font-black text-white ring-1 ring-white/20 transition active:scale-[.985]"
                  href="/orientation/match"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/12"><SlidersHorizontal className="h-5 w-5" /></span>
                  <span className="min-w-0 flex-1">المتاح حسب معدلي</span>
                  <ChevronLeft className="h-4 w-4 shrink-0" />
                </Link>
              </div>
            </section>

            <section className="grid grid-cols-3 gap-2.5">
              <Stat label="مؤسسة" value={institutions.length} />
              <Stat label="تخصصاً" value={new Set(institutions.flatMap((item) => item.specialties.map((specialty) => specialty.name))).size} />
              <Stat label="مدينة" value={new Set(institutions.map((item) => item.city)).size} />
            </section>

            <section className="rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055] md:p-5">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black">الجامعات والمعاهد</h2>
                  <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">ابحث باسم المؤسسة أو الكلية أو التخصص.</p>
                </div>
                <Building2 className="h-6 w-6 shrink-0 text-mauri-green" />
              </div>

              <div className="relative mt-4">
                <Search className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-mauri-green" />
                <input
                  aria-label="البحث في الجامعات والمعاهد والتخصصات"
                  autoComplete="off"
                  className="h-13 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-12 pl-4 text-sm font-black outline-none transition placeholder:text-slate-400 focus:border-mauri-green focus:bg-white focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/5"
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="مثال: جامعة نواذيبو، الطب، المحاسبة..."
                  type="search"
                  value={query}
                />
              </div>
            </section>

            <section className="grid gap-2.5 md:grid-cols-2">
              {filtered.map((institution) => (
                <button
                  className="group flex min-h-32 items-start gap-3 rounded-[24px] border border-slate-200/80 bg-white p-4 text-right shadow-soft transition hover:border-emerald-200 hover:bg-emerald-50/35 active:scale-[.992] dark:border-white/10 dark:bg-white/[.055] dark:hover:border-emerald-300/15 dark:hover:bg-emerald-300/[.06]"
                  key={institution.name}
                  onClick={() => openInstitution(institution.name)}
                  type="button"
                >
                  <InstitutionMark institution={institution} />
                  <span className="min-w-0 flex-1">
                    <strong className="block text-base font-black leading-6">{institution.name}</strong>
                    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-slate-500 dark:text-slate-300">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{institution.city}</span>
                      <span>{institution.specialtyCount} تخصصاً</span>
                      {institution.facultyCount > 0 && <span>{institution.facultyCount} كلية/معهد</span>}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-1.5">
                      {institution.specialties.slice(0, 3).map((specialty) => (
                        <small className="rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-600 dark:bg-white/5 dark:text-slate-300" key={specialty.name}>{specialty.name}</small>
                      ))}
                    </span>
                  </span>
                  <ChevronLeft className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:text-mauri-green" />
                </button>
              ))}
            </section>

            {!filtered.length && (
              <section className="rounded-[24px] border border-dashed border-slate-300 bg-white p-7 text-center dark:border-white/15 dark:bg-white/[.045]">
                <Search className="mx-auto h-8 w-8 text-mauri-green" />
                <h2 className="mt-3 text-lg font-black">لا توجد نتيجة مطابقة</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">جرّب اسم المؤسسة أو جزءاً من اسم التخصص.</p>
              </section>
            )}
          </>
        ) : (
          <section className="grid scroll-mt-20 gap-3" ref={detailRef}>
            <section className="rounded-[28px] border border-emerald-200/80 bg-white p-5 shadow-soft dark:border-emerald-300/15 dark:bg-white/[.055] md:p-6">
              <div className="flex items-start gap-4">
                <InstitutionMark institution={selected} large />
                <div className="min-w-0 flex-1">
                  <span className="inline-flex items-center gap-1 text-xs font-black text-mauri-green"><MapPin className="h-3.5 w-3.5" />{selected.city}</span>
                  <h1 className="mt-1 text-2xl font-black leading-tight md:text-3xl">{selected.name}</h1>
                  {selected.parent && <p className="mt-1 text-xs font-black text-slate-500 dark:text-slate-300">تابعة لـ {selected.parent}</p>}
                </div>
              </div>
              {selected.description && <p className="mt-4 text-sm font-bold leading-7 text-slate-700 dark:text-slate-200">{selected.description}</p>}
              {selected.website && (
                <a className="mt-4 inline-flex items-center gap-2 rounded-xl bg-mauri-green/10 px-3 py-2 text-xs font-black text-mauri-green" href={selected.website} rel="noopener noreferrer" target="_blank">
                  الموقع الرسمي <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </section>

            <section className="grid grid-cols-3 gap-2.5">
              <Stat label="تخصصاً" value={selected.specialtyCount} />
              <Stat label="الشعب" value={selected.streams.length} />
              <Stat label="مدى المعدل" value={scoreText(selected.scoreRange)} />
            </section>

            {selected.officialPrograms?.length > 0 && (
              <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055]">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green"><Layers3 className="h-5 w-5" /></span>
                  <div><h2 className="font-black">تكوينات حالية بالمؤسسة</h2><p className="mt-0.5 text-xs font-bold text-slate-500">معلومات تعريفية من المصادر الرسمية المتاحة.</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selected.officialPrograms.map((program) => (
                    <span className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 dark:bg-white/5 dark:text-slate-200" key={program}>{program}</span>
                  ))}
                </div>
              </section>
            )}

            <section className="grid gap-3">
              {selected.faculties.map((faculty) => (
                <article className="rounded-[24px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055]" key={faculty.name}>
                  <div className="flex items-center gap-2.5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green"><GraduationCap className="h-5 w-5" /></span>
                    <div className="min-w-0"><h2 className="font-black leading-6">{faculty.name}</h2><p className="text-xs font-bold text-slate-500">{faculty.specialties.length} تخصصاً</p></div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {faculty.specialties.map((specialty) => (
                      <Link
                        className="flex min-h-14 items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-mauri-green/5 dark:bg-white/5"
                        href={`/orientation/${specialty.id}`}
                        key={`${faculty.name}-${specialty.name}`}
                      >
                        <BookOpen className="h-4.5 w-4.5 shrink-0 text-mauri-green" />
                        <span className="min-w-0 flex-1">
                          <strong className="block text-sm font-black leading-5">{specialty.name}</strong>
                          <small className="mt-0.5 block text-[11px] font-bold text-slate-500">{specialty.stream} · المواد والآفاق</small>
                        </span>
                        <strong className="shrink-0 text-sm font-black text-mauri-green">{specialty.lastScore.toFixed(2)}</strong>
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </section>

            <Link className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-mauri-green font-black text-white shadow-[0_12px_28px_rgba(21,128,61,.18)]" href="/orientation/specialties">
              <Search className="h-5 w-5" />البحث في كل التخصصات والمواد
            </Link>
          </section>
        )}

        <section className="rounded-[22px] border border-slate-200/80 bg-white p-4 text-xs font-bold leading-6 text-slate-500 dark:border-white/10 dark:bg-white/[.045] dark:text-slate-300">
          <p>التخصصات ومعدلات التوجيه السابقة للاستئناس، وقد تتغير عروض التكوين وشروط القبول من سنة إلى أخرى. راجع المصدر الرسمي عند ترتيب رغباتك.</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {sources.map((source) => (
              <a className="inline-flex items-center gap-1 font-black text-mauri-green underline" href={source.url} key={source.url} rel="noopener noreferrer" target="_blank">
                {source.label}<ExternalLink className="h-3 w-3" />
              </a>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
