"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  GraduationCap,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { ORIENTATION_SOURCE_URL, orientationPrograms } from "../../data/orientation-programs";
import { getSpecialtyGuide } from "../../data/orientation-specialty-guides";

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

const FRENCH_RULES = [
  { keys: ["الذكاء الاصطناعي"], aliases: ["intelligence artificielle", "ia", "artificial intelligence"], title: "Intelligence artificielle" },
  { keys: ["علوم البيانات", "هندسة البيانات"], aliases: ["science des donnees", "data science", "data engineering", "donnees"], title: "Science des données" },
  { keys: ["علوم الحاسوب", "الحاسوب", "المعلوماتية", "تطوير الويب", "نظم المعلومات"], aliases: ["informatique", "developpement web", "systemes d information", "computer science", "web"], title: "Informatique" },
  { keys: ["الشبكات", "الأمن السيبراني", "الأنظمة الاتصالية"], aliases: ["reseaux", "cybersecurite", "securite informatique", "telecommunications"], title: "Réseaux et cybersécurité" },
  { keys: ["الطب العام", "الطب"], aliases: ["medecine", "medecine generale", "medicine"], title: "Médecine" },
  { keys: ["طب الأسنان"], aliases: ["odontologie", "medecine dentaire", "dentiste"], title: "Odontologie" },
  { keys: ["الصيدلة"], aliases: ["pharmacie", "pharmacy"], title: "Pharmacie" },
  { keys: ["التحاليل", "الأحياء الجزيئي", "التغذية والصحة"], aliases: ["analyses biologiques", "biologie moleculaire", "nutrition", "laboratoire"], title: "Sciences biomédicales" },
  { keys: ["القانون"], aliases: ["droit", "sciences juridiques", "juridique"], title: "Droit" },
  { keys: ["الإعلام والاتصال"], aliases: ["communication", "journalisme", "information et communication", "media"], title: "Information et communication" },
  { keys: ["المالية", "المحاسبة"], aliases: ["finance", "comptabilite", "audit", "gestion financiere"], title: "Finance et comptabilité" },
  { keys: ["إدارة الأعمال", "التسيير"], aliases: ["gestion", "management", "administration des affaires"], title: "Gestion" },
  { keys: ["التسويق"], aliases: ["marketing", "commerce"], title: "Marketing" },
  { keys: ["الموارد البشرية"], aliases: ["ressources humaines", "rh"], title: "Ressources humaines" },
  { keys: ["اللوجستيات"], aliases: ["logistique", "transport"], title: "Logistique" },
  { keys: ["الهندسة المدنية"], aliases: ["genie civil", "batiment", "travaux publics"], title: "Génie civil" },
  { keys: ["الهندسة الكهربائية", "الإلكترونيات"], aliases: ["genie electrique", "electronique", "electricite"], title: "Génie électrique" },
  { keys: ["الهندسة الميكانيكية", "الكهروميكانيكية"], aliases: ["genie mecanique", "electromecanique", "mecanique"], title: "Génie mécanique" },
  { keys: ["النفط والغاز", "المحروقات"], aliases: ["petrole et gaz", "hydrocarbures", "petroleum"], title: "Pétrole et gaz" },
  { keys: ["الطاقة", "الطاقات المتجددة"], aliases: ["energie", "energies renouvelables", "energetique"], title: "Énergie" },
  { keys: ["الجيولوجيا", "المناجم"], aliases: ["geologie", "mines", "exploration geologique"], title: "Géologie et mines" },
  { keys: ["الترجمة"], aliases: ["traduction", "interpretariat"], title: "Traduction" },
  { keys: ["الإنجليزية"], aliases: ["anglais", "etudes anglaises"], title: "Anglais" },
  { keys: ["الفرنسية"], aliases: ["francais", "etudes francaises"], title: "Français" },
  { keys: ["الإسبانية"], aliases: ["espagnol", "etudes espagnoles"], title: "Espagnol" },
  { keys: ["علم الاجتماع"], aliases: ["sociologie", "sciences sociales"], title: "Sociologie" },
  { keys: ["الفلسفة"], aliases: ["philosophie"], title: "Philosophie" },
  { keys: ["التاريخ"], aliases: ["histoire"], title: "Histoire" },
  { keys: ["الجغرافيا"], aliases: ["geographie"], title: "Géographie" },
  { keys: ["الرياضيات"], aliases: ["mathematiques", "maths"], title: "Mathématiques" },
  { keys: ["الفيزياء"], aliases: ["physique"], title: "Physique" },
  { keys: ["الكيمياء"], aliases: ["chimie"], title: "Chimie" },
  { keys: ["الأحياء", "علوم الحياة"], aliases: ["biologie", "sciences de la vie"], title: "Biologie" },
  { keys: ["الزراعة"], aliases: ["agriculture", "agronomie"], title: "Agronomie" },
  { keys: ["البيطرة"], aliases: ["veterinaire", "medecine veterinaire"], title: "Médecine vétérinaire" },
  { keys: ["الصيد", "البحرية", "السواحل"], aliases: ["peche", "sciences marines", "maritime", "littoral"], title: "Sciences marines" },
  { keys: ["التربية", "التعليم"], aliases: ["education", "enseignement", "pedagogie"], title: "Sciences de l’éducation" },
  { keys: ["الشريعة", "الدراسات الإسلامية", "الفقه", "أصول الدين"], aliases: ["etudes islamiques", "charia", "theologie islamique"], title: "Études islamiques" },
];

function frenchData(name, category) {
  const text = normalize(`${name} ${category}`);
  const matches = FRENCH_RULES.filter((rule) => rule.keys.some((key) => text.includes(normalize(key))));
  return {
    aliases: [...new Set(matches.flatMap((rule) => rule.aliases))],
    title: matches[0]?.title || "",
  };
}

const SPECIALTIES = (() => {
  const groups = new Map();
  orientationPrograms.forEach((program) => {
    const current = groups.get(program.name) || { name: program.name, category: program.category, programs: [] };
    current.programs.push(program);
    groups.set(program.name, current);
  });

  return [...groups.values()]
    .map((item) => {
      const programs = item.programs
        .slice()
        .sort((a, b) => b.lastScore - a.lastScore || a.institution.localeCompare(b.institution, "ar"));
      const institutions = [...new Set(programs.map((program) => program.institution))];
      const faculties = [...new Set(programs.map((program) => program.faculty).filter(Boolean))];
      const streams = [...new Set(programs.map((program) => program.stream))];
      const scores = programs.map((program) => program.lastScore);
      const french = frenchData(item.name, item.category);
      return {
        ...item,
        programs,
        institutions,
        faculties,
        streams,
        frenchTitle: french.title,
        minimumScore: Math.min(...scores),
        maximumScore: Math.max(...scores),
        searchText: normalize(`${item.name} ${item.category} ${french.aliases.join(" ")} ${institutions.join(" ")} ${faculties.join(" ")}`),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "ar"));
})();

const POPULAR_NAMES = ["الطب", "الذكاء الاصطناعي", "الإعلام والاتصال", "القانون الخاص", "المالية والمحاسبة", "هندسة النفط والغاز"];
const POPULAR = POPULAR_NAMES.map((name) => SPECIALTIES.find((item) => item.name === name)).filter(Boolean);

function ScoreRange({ specialty }) {
  return specialty.minimumScore === specialty.maximumScore
    ? specialty.minimumScore.toFixed(2)
    : `${specialty.minimumScore.toFixed(2)} – ${specialty.maximumScore.toFixed(2)}`;
}

function SimpleList({ icon: Icon, items, title }) {
  if (!items?.length) return null;
  return (
    <section className="rounded-[22px] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[.055]">
      <div className="flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <h3 className="font-black">{title}</h3>
      </div>
      <ul className="mt-3 grid gap-2">
        {items.map((item) => (
          <li className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-bold leading-6 text-slate-700 dark:bg-white/5 dark:text-slate-200" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function SpecialtyGuideExplorer() {
  const [view, setView] = useState("home");
  const [query, setQuery] = useState("");
  const [selectedName, setSelectedName] = useState("");
  const [focused, setFocused] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const resultRef = useRef(null);
  const normalizedQuery = normalize(query);

  const suggestions = useMemo(() => {
    const source = normalizedQuery
      ? SPECIALTIES.filter((item) => item.searchText.includes(normalizedQuery))
      : POPULAR;
    return source
      .slice()
      .sort((a, b) => Number(!normalize(a.name).startsWith(normalizedQuery)) - Number(!normalize(b.name).startsWith(normalizedQuery)) || a.name.length - b.name.length)
      .slice(0, 8);
  }, [normalizedQuery]);

  const specialty = useMemo(() => SPECIALTIES.find((item) => item.name === selectedName) || null, [selectedName]);
  const guide = specialty ? getSpecialtyGuide(specialty.name, specialty.category) : null;
  const offers = specialty ? specialty.programs.slice(0, showAll ? specialty.programs.length : 5) : [];
  const showSuggestions = focused && !specialty;

  function choose(item) {
    setQuery(item.name);
    setSelectedName(item.name);
    setFocused(false);
    setShowAll(false);
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function clearSearch() {
    setQuery("");
    setSelectedName("");
    setShowAll(false);
    setFocused(true);
  }

  function openGuide() {
    setView("guide");
    setQuery("");
    setSelectedName("");
    setFocused(false);
  }

  return (
    <main dir="rtl" className="min-h-screen overflow-x-clip bg-[#f7faf8] pb-20 text-slate-950 dark:bg-[#06110b] dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
        <div className="app-shell flex min-h-14 items-center justify-between gap-3">
          {view === "guide" ? (
            <button className="inline-flex items-center gap-2 text-sm font-black text-mauri-green" onClick={() => setView("home")} type="button">
              <ArrowRight className="h-4 w-4" />الرجوع
            </button>
          ) : (
            <Link className="inline-flex items-center gap-2 text-sm font-black text-mauri-green" href="/">
              <ArrowLeft className="h-4 w-4 rotate-180" />MauriResults
            </Link>
          )}
          <strong className="text-sm font-black text-slate-700 dark:text-slate-100">التوجيه</strong>
        </div>
      </header>

      {view === "home" ? (
        <div className="app-shell grid min-h-[calc(100vh-5rem)] content-center gap-3 py-6 sm:grid-cols-2">
          <button className="group rounded-[28px] border border-emerald-200/80 bg-white p-5 text-right shadow-soft transition active:scale-[.985] dark:border-emerald-300/15 dark:bg-white/[.055]" onClick={openGuide} type="button">
            <span className="grid h-14 w-14 place-items-center rounded-[19px] bg-mauri-green text-white shadow-[0_12px_28px_rgba(21,128,61,.22)]"><BookOpen className="h-7 w-7" /></span>
            <h1 className="mt-5 text-2xl font-black">دليل التخصصات</h1>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">ابحث بالعربية أو الفرنسية واعرف التخصص والكلية والمواد وآفاقه المستقبلية.</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-mauri-green">فتح الدليل <ChevronLeft className="h-4 w-4" /></span>
          </button>

          <Link className="group rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-soft transition active:scale-[.985] dark:border-white/10 dark:bg-white/[.055]" href="/orientation/match">
            <span className="grid h-14 w-14 place-items-center rounded-[19px] bg-slate-900 text-white dark:bg-white dark:text-slate-900"><SlidersHorizontal className="h-7 w-7" /></span>
            <h2 className="mt-5 text-2xl font-black">المتاح حسب معدلي</h2>
            <p className="mt-2 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">أدخل شعبة الباك ومعدلك لتظهر لك الكليات والتخصصات الأقرب.</p>
            <span className="mt-5 inline-flex items-center gap-1 text-sm font-black text-slate-700 dark:text-slate-200">إدخال المعدل <ChevronLeft className="h-4 w-4" /></span>
          </Link>
        </div>
      ) : (
        <div className="app-shell grid gap-4 py-4 md:gap-5 md:py-7">
          <section className="relative z-20 rounded-[26px] border border-slate-200/80 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[.055] md:p-5">
            <h1 className="text-xl font-black">ابحث عن تخصص</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">يمكنك الكتابة بالعربية أو الفرنسية.</p>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute right-4 top-1/2 z-10 h-5 w-5 -translate-y-1/2 text-mauri-green" />
              <input
                aria-label="ابحث عن تخصص بالعربية أو الفرنسية"
                autoComplete="off"
                className="h-14 w-full rounded-2xl border border-slate-200 bg-slate-50 pr-12 pl-12 text-base font-black outline-none transition placeholder:text-slate-400 focus:border-mauri-green focus:bg-white focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/5"
                onBlur={() => window.setTimeout(() => setFocused(false), 120)}
                onChange={(event) => { setQuery(event.target.value); if (event.target.value !== selectedName) setSelectedName(""); }}
                onFocus={() => setFocused(true)}
                onKeyDown={(event) => { if (event.key === "Enter" && suggestions[0]) choose(suggestions[0]); }}
                placeholder="مثال: الإعلام والاتصال أو informatique"
                type="search"
                value={query}
              />
              {query && <button aria-label="مسح البحث" className="absolute left-3 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-xl text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10" onClick={clearSearch} type="button"><X className="h-4 w-4" /></button>}

              {showSuggestions && (
                <div className="absolute inset-x-0 top-[calc(100%+.5rem)] z-30 overflow-hidden rounded-[20px] border border-slate-200 bg-white p-2 shadow-[0_18px_55px_rgba(15,23,42,.18)] dark:border-white/10 dark:bg-[#0a1710]">
                  {suggestions.length ? suggestions.map((item) => (
                    <button className="flex min-h-14 w-full items-center gap-3 rounded-2xl px-3 text-right transition hover:bg-mauri-green/7" key={item.name} onMouseDown={(event) => event.preventDefault()} onClick={() => choose(item)} type="button">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-mauri-green/10 text-mauri-green"><GraduationCap className="h-4.5 w-4.5" /></span>
                      <span className="min-w-0 flex-1">
                        <strong className="block truncate text-sm font-black">{item.name}</strong>
                        <small className="block truncate text-xs font-bold text-slate-500 dark:text-slate-300">{item.frenchTitle || item.category}</small>
                      </span>
                    </button>
                  )) : <p className="p-4 text-center text-sm font-bold text-slate-500">لا يوجد تخصص مطابق. جرّب كلمة أخرى.</p>}
                </div>
              )}
            </div>
          </section>

          {specialty && guide ? (
            <section className="grid scroll-mt-20 gap-3" ref={resultRef}>
              <section className="rounded-[26px] border border-emerald-200/80 bg-white p-5 shadow-soft dark:border-emerald-300/15 dark:bg-white/[.055]">
                <span className="text-xs font-black text-mauri-green">{specialty.category}</span>
                <h2 className="mt-1 text-3xl font-black leading-tight">{specialty.name}</h2>
                {specialty.frenchTitle && <p className="mt-1 text-sm font-bold text-slate-400" dir="ltr">{specialty.frenchTitle}</p>}
                <p className="mt-4 text-sm font-bold leading-7 text-slate-700 dark:text-slate-200 md:text-base">{guide.summary}</p>
              </section>

              <section className="grid grid-cols-2 gap-2.5">
                <article className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.055]">
                  <Building2 className="h-5 w-5 text-mauri-green" />
                  <span className="mt-2 block text-[11px] font-black text-slate-400">الكلية أو المعهد</span>
                  <strong className="mt-1 block text-sm font-black leading-6">{specialty.faculties[0] || specialty.institutions[0]}</strong>
                  {specialty.faculties.length > 1 && <small className="mt-1 block font-bold text-slate-500">و{specialty.faculties.length - 1} جهة أخرى</small>}
                </article>
                <article className="rounded-[20px] border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/[.055]">
                  <GraduationCap className="h-5 w-5 text-mauri-green" />
                  <span className="mt-2 block text-[11px] font-black text-slate-400">الشعب المتاحة</span>
                  <strong className="mt-1 block text-sm font-black leading-6">{specialty.streams.join("، ")}</strong>
                </article>
              </section>

              <SimpleList icon={BookOpen} items={guide.subjects} title="مواد تُدرّس عادة" />
              <SimpleList icon={BriefcaseBusiness} items={guide.careers} title="الآفاق المستقبلية" />

              <section className="rounded-[22px] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[.055]">
                <div className="flex items-end justify-between gap-3">
                  <div><h3 className="font-black">أين يوجد التخصص؟</h3><p className="mt-1 text-xs font-bold text-slate-500">المؤسسات وآخر المعدلات المسجلة</p></div>
                  <strong className="text-sm font-black text-mauri-green"><ScoreRange specialty={specialty} /></strong>
                </div>
                <div className="mt-3 grid gap-2">
                  {offers.map((program) => (
                    <Link className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-mauri-green/5 dark:bg-white/5" href={`/orientation/${program.id}`} key={program.id}>
                      <MapPin className="h-4 w-4 shrink-0 text-mauri-green" />
                      <span className="min-w-0 flex-1"><strong className="block text-sm font-black leading-5">{program.institution}</strong><small className="mt-0.5 block text-xs font-bold text-slate-500">{program.faculty} · {program.stream}</small></span>
                      <strong className="shrink-0 text-base font-black text-mauri-green">{program.lastScore.toFixed(2)}</strong>
                    </Link>
                  ))}
                </div>
                {!showAll && specialty.programs.length > offers.length && <button className="mt-3 min-h-10 w-full rounded-xl border border-mauri-green/25 text-sm font-black text-mauri-green" onClick={() => setShowAll(true)} type="button">عرض البقية</button>}
              </section>

              <p className="px-1 text-xs font-bold leading-6 text-slate-500">المواد المذكورة تعريفية وشائعة في التخصص، وقد تختلف الخطة من مؤسسة إلى أخرى. المعدلات السابقة للاستئناس فقط. <a className="font-black text-mauri-green underline" href={ORIENTATION_SOURCE_URL} target="_blank" rel="noopener noreferrer">مصدر المعدلات</a></p>
            </section>
          ) : (
            <section className="rounded-[24px] border border-dashed border-slate-300 bg-white p-7 text-center dark:border-white/15 dark:bg-white/[.045]">
              <Search className="mx-auto h-8 w-8 text-mauri-green" />
              <h2 className="mt-3 text-lg font-black">اكتب اسم التخصص</h2>
              <p className="mt-1 text-sm font-bold leading-7 text-slate-500">مثال: القانون، الإعلام والاتصال، informatique أو médecine.</p>
            </section>
          )}
        </div>
      )}
    </main>
  );
}
