"use client";

import Link from "next/link";
import { BookOpen, ClipboardCheck, Home, LibraryBig } from "lucide-react";
import { useEffect, useState } from "react";
import ExamLibrary from "../../components/documents/ExamLibrary";
import LessonsExplorer from "./LessonsExplorer";

const COPY = {
  ar: {
    title: "الدروس ومواضيع الامتحانات",
    description: "الكتب والدروس المدرسية، ومواضيع المسابقات الوطنية مع الحلول والمذكرات والمراجع، في قسم واحد منظم وسهل التحميل.",
    lessons: "الدروس والكتب",
    lessonsDesc: "كتب المراحل الابتدائية والإعدادية والثانوية",
    exams: "مواضيع الامتحانات",
    examsDesc: "باكالوريا وابريفه وكونكور والامتياز مع الحلول",
    home: "الرئيسية",
    source: "ملفات مواضيع الامتحانات مفهرسة من Rimbac بإذن صاحب الموقع، مع الحفاظ على اسم المصدر والحقوق.",
  },
  fr: {
    title: "Cours et sujets d’examens",
    description: "Les manuels scolaires, les cours et les sujets des concours nationaux avec corrigés et références, réunis dans une seule rubrique.",
    lessons: "Cours et livres",
    lessonsDesc: "Manuels du primaire, collège et lycée",
    exams: "Sujets d’examens",
    examsDesc: "Bac, Brevet, Concours et Excellence avec corrigés",
    home: "Accueil",
    source: "Les sujets d’examens sont indexés depuis Rimbac avec l’autorisation du propriétaire, tout en conservant la source et les droits.",
  },
};

function tabFromLocation() {
  if (typeof window === "undefined") return "lessons";
  return new URLSearchParams(window.location.search).get("tab") === "exams" ? "exams" : "lessons";
}

export default function LessonsAndExams({ initialTab = "lessons" }) {
  const [lang, setLang] = useState("ar");
  const [tab, setTab] = useState(initialTab === "exams" ? "exams" : "lessons");

  useEffect(() => {
    const syncLanguage = (event) => {
      setLang(event?.detail?.lang || localStorage.getItem("mauriresults-lang") || "ar");
    };
    syncLanguage();
    setTab(tabFromLocation());
    window.addEventListener("mauriresults:language-change", syncLanguage);
    return () => window.removeEventListener("mauriresults:language-change", syncLanguage);
  }, []);

  const text = COPY[lang] || COPY.ar;

  function selectTab(nextTab) {
    setTab(nextTab);
    const url = new URL(window.location.href);
    if (nextTab === "exams") url.searchParams.set("tab", "exams");
    else url.searchParams.delete("tab");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div data-no-auto-translate dir={lang === "ar" ? "rtl" : "ltr"} className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#06110c] dark:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -left-48 h-[480px] w-[480px] rounded-full bg-amber-400/5 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-3 pt-5 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between gap-3" aria-label={lang === "ar" ? "التنقل" : "Navigation"}>
          <Link className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-white/5 dark:text-slate-200" href="/">
            <Home className="h-4 w-4" aria-hidden="true" />
            {text.home}
          </Link>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300">MauriResults</span>
        </nav>

        <header className="relative mt-5 overflow-hidden rounded-[2rem] border border-emerald-900/10 bg-gradient-to-bl from-[#0a3d2a] via-[#0b2c20] to-[#07150f] px-5 py-8 text-white shadow-[0_28px_70px_rgba(5,46,32,.25)] sm:px-8 sm:py-11 lg:px-12">
          <div className="absolute inset-0 opacity-20" aria-hidden="true">
            <div className="absolute -left-16 top-0 h-56 w-56 rounded-full border-[40px] border-emerald-300/20" />
            <div className="absolute bottom-0 right-1/3 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
          </div>
          <div className="relative max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-emerald-100">
              <LibraryBig className="h-4 w-4" aria-hidden="true" />
              MauriResults
            </div>
            <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{text.title}</h1>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-emerald-50/80 sm:text-base">{text.description}</p>
          </div>
        </header>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-[1.6rem] border border-slate-200 bg-white p-2 shadow-sm dark:border-white/10 dark:bg-white/5">
          <button className={`rounded-[1.2rem] px-3 py-4 text-start transition ${tab === "lessons" ? "bg-mauri-green text-white shadow-lg shadow-emerald-900/15" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"}`} onClick={() => selectTab("lessons")} type="button" aria-pressed={tab === "lessons"}>
            <span className="flex items-center gap-2 text-sm font-black sm:text-base"><BookOpen className="h-5 w-5" aria-hidden="true" />{text.lessons}</span>
            <span className="mt-1 hidden text-xs font-semibold opacity-80 sm:block">{text.lessonsDesc}</span>
          </button>
          <button className={`rounded-[1.2rem] px-3 py-4 text-start transition ${tab === "exams" ? "bg-mauri-green text-white shadow-lg shadow-emerald-900/15" : "text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5"}`} onClick={() => selectTab("exams")} type="button" aria-pressed={tab === "exams"}>
            <span className="flex items-center gap-2 text-sm font-black sm:text-base"><ClipboardCheck className="h-5 w-5" aria-hidden="true" />{text.exams}</span>
            <span className="mt-1 hidden text-xs font-semibold opacity-80 sm:block">{text.examsDesc}</span>
          </button>
        </div>
      </div>

      {tab === "lessons" ? (
        <LessonsExplorer />
      ) : (
        <section className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
          <ExamLibrary />
          <footer className="mt-8 border-t border-slate-200 py-7 text-center text-xs font-semibold text-slate-500 dark:border-white/10 dark:text-slate-400">{text.source}</footer>
        </section>
      )}
    </div>
  );
}
