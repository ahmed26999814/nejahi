"use client";

import { useEffect, useState } from "react";
import { ArrowUpLeft, ChevronDown } from "lucide-react";
import { STUDY_COLLECTIONS } from "../../data/study-resource-collections.mjs";
import IndexedStudyFiles from "./IndexedStudyFiles";
import LiteraryStudyFiles from "./LiteraryStudyFiles";

const COPY = {
  ar: {
    extra: "مكتبات أخرى",
    open: "فتح المكتبة",
  },
  fr: {
    extra: "Autres bibliothèques",
    open: "Ouvrir la collection",
  },
};
const COLLECTIONS = STUDY_COLLECTIONS.filter(item => item.id !== "literary-ushare");

function getLanguage() {
  if (typeof window === "undefined") return "ar";
  return localStorage.getItem("mauriresults-lang") === "fr" ? "fr" : "ar";
}

export default function ExternalResourceCollections() {
  const [lang, setLang] = useState("ar");
  useEffect(() => {
    const sync = event => {
      const value = event?.detail?.lang || getLanguage();
      setLang(value === "fr" ? "fr" : "ar");
    };
    sync();
    window.addEventListener("mauriresults:language-change", sync);
    return () => window.removeEventListener("mauriresults:language-change", sync);
  }, []);
  const t = COPY[lang];

  return (
    <section data-no-auto-translate dir={lang === "fr" ? "ltr" : "rtl"} className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-5 text-slate-900 dark:text-white sm:px-6 lg:px-8">
      <IndexedStudyFiles />
      <LiteraryStudyFiles />

      <details className="group mt-6 rounded-2xl border border-slate-200 bg-white shadow-sm open:pb-4 dark:border-white/10 dark:bg-[#12231a]">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-black text-slate-800 marker:hidden dark:text-white sm:text-base">
          <span>{t.extra}</span>
          <ChevronDown className="h-5 w-5 shrink-0 text-mauri-green transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="border-t border-slate-100 px-4 pt-4 dark:border-white/10 sm:px-5">
          
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COLLECTIONS.map(item => (
              <article key={item.id} className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                <h3 className="text-sm font-black leading-6 text-slate-900 dark:text-white">{item.title[lang] || item.title.ar}</h3>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {item.levels.map(level => <span key={level} className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{level}</span>)}
                  {item.branches.length > 0 && <span className="rounded-lg bg-white px-2 py-1 text-xs font-bold text-slate-600 dark:bg-white/10 dark:text-slate-300">{item.branches.join(" / ")}</span>}
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-mauri-green px-3 py-2 text-sm font-black text-mauri-green transition hover:bg-mauri-green/10">
                  {t.open}<ArrowUpLeft className="h-4 w-4" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </div>
      </details>
    </section>
  );
}
