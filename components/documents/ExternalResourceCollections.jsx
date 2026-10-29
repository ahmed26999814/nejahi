"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpLeft, BookOpen, FolderOpen, Search } from "lucide-react";
import { STUDY_COLLECTIONS, STUDY_COLLECTION_STAGES } from "../../data/study-resource-collections.mjs";

const COPY = {
  ar: {
    title: "مراجع تعليمية إضافية",
    intro: "مجلدات تعليمية شاركها أصحابها عبر خدمات خارجية، مرتبة حسب المستوى والشعبة. افتح المصدر لاختيار الملفات المتاحة فيه.",
    caution: "هذه روابط لمجلدات خارجية وليست ملفات PDF مستضافة على MauriResults. لم يتم التحقق من محتوياتها فرديًا أو من حقوق إعادة نشرها. سنة المجلد لا تعني سنة الامتحان المستهدف.",
    search: "ابحث عن شعبة أو مستوى أو مصدر…",
    all: "كل المستويات",
    bac: "الباكالوريا",
    secondary: "الثانوية",
    middle: "الإعدادية",
    primary: "الابتدائية",
    source: "المصدر",
    year: "عنوان المجلد",
    level: "المستوى",
    branch: "الشعب",
    link: "فتح المجلد الأصلي",
    empty: "لا توجد مجلدات مطابقة. جرّب تغيير المستوى أو كلمات البحث.",
    count: "مجلد",
  },
  fr: {
    title: "Ressources complémentaires",
    intro: "Dossiers pédagogiques hébergés sur des plateformes externes, classés par niveau et par série. Ouvrez la source pour voir les fichiers disponibles.",
    caution: "Il s’agit de liens vers des dossiers externes, et non de PDF hébergés par MauriResults. Le contenu et les droits de republication de chaque fichier n’ont pas été vérifiés. La date du dossier ne garantit pas une édition pour l’examen visé.",
    search: "Rechercher une série, un niveau ou une source…",
    all: "Tous les niveaux",
    bac: "Baccalauréat",
    secondary: "Lycée",
    middle: "Collège",
    primary: "Primaire",
    source: "Source",
    year: "Dossier",
    level: "Niveau",
    branch: "Séries",
    link: "Ouvrir le dossier d’origine",
    empty: "Aucun dossier correspondant. Modifiez votre recherche.",
    count: "dossier(s)",
  },
};

function getLanguage() {
  if (typeof window === "undefined") return "ar";
  return localStorage.getItem("mauriresults-lang") === "fr" ? "fr" : "ar";
}

export default function ExternalResourceCollections() {
  const [lang, setLang] = useState("ar");
  const [stage, setStage] = useState("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const sync = (event) => {
      const value = event?.detail?.lang || getLanguage();
      setLang(value === "fr" ? "fr" : "ar");
    };
    sync();
    window.addEventListener("mauriresults:language-change", sync);
    return () => window.removeEventListener("mauriresults:language-change", sync);
  }, []);

  const t = COPY[lang] || COPY.ar;
  const results = useMemo(() => {
    const needle = query.toLocaleLowerCase().trim();
    return STUDY_COLLECTIONS.filter((item) => {
      if (stage !== "all" && item.stage !== stage) return false;
      if (!needle) return true;
      return [item.title.ar, item.title.fr, item.source, item.sourceYear || "", ...item.levels, ...item.branches]
        .join(" ")
        .toLocaleLowerCase()
        .includes(needle);
    });
  }, [stage, query]);

  return (
    <section data-no-auto-translate dir={lang === "fr" ? "ltr" : "rtl"} className="relative mx-auto w-full max-w-7xl px-4 pb-16 pt-5 text-slate-900 dark:text-white sm:px-6 lg:px-8">
      <div className="rounded-[28px] border border-emerald-800/10 bg-gradient-to-l from-emerald-700 to-teal-700 p-5 text-white shadow-lg sm:p-7">
        <div className="flex items-center gap-2 text-sm font-black text-emerald-50">
          <FolderOpen className="h-5 w-5" aria-hidden="true" /> {t.title}
        </div>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/90">{t.intro}</p>
      </div>

      <p className="mt-4 rounded-2xl border border-amber-500/25 bg-amber-50 p-4 text-sm font-semibold leading-7 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100" role="note">
        {t.caution}
      </p>

      <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
        <div className="flex flex-wrap gap-2" aria-label={t.title}>
          {STUDY_COLLECTION_STAGES.map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={stage === value}
              onClick={() => setStage(value)}
              className={stage === value
                ? "min-h-11 rounded-xl bg-mauri-green px-4 py-2 text-xs font-black text-white shadow-sm sm:text-sm"
                : "min-h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-black text-slate-700 hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-white/5 dark:text-slate-200 sm:text-sm"}
            >
              {t[value]}
            </button>
          ))}
        </div>
        <label className="relative mt-4 block">
          <span className="sr-only">{t.search}</span>
          <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.search}
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 ps-12 pe-4 text-sm font-semibold text-slate-900 outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-[#07130d] dark:text-white"
          />
        </label>
      </div>

      <p className="mt-5 text-xs font-black text-slate-600 dark:text-slate-300" aria-live="polite">
        {results.length} {t.count}
      </p>

      {results.length ? (
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.map((item) => (
            <article key={item.id} className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex min-h-7 items-center rounded-full bg-mauri-green/10 px-3 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">
                  {t[item.stage]}
                </span>
                <BookOpen className="h-5 w-5 shrink-0 text-mauri-green" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-black leading-7">{item.title[lang] || item.title.ar}</h3>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 dark:bg-white/10 dark:text-slate-200">{t.source}: {item.source}</span>
                {item.sourceYear && <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 dark:bg-white/10 dark:text-slate-200">{t.year}: {item.sourceYear}</span>}
                {item.levels.map((level) => <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-700 dark:bg-white/10 dark:text-slate-200" key={level}>{level}</span>)}
                {item.branches.length > 0 && <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-200">{t.branch}: {item.branches.join(" / ")}</span>}
              </div>
              <p className="mt-3 flex-1 text-sm font-medium leading-6 text-slate-600 dark:text-slate-300">{item.note[lang] || item.note.ar}</p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-mauri-green px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mauri-green"
                aria-label={`${t.link}: ${item.title[lang] || item.title.ar}`}
              >
                {t.link}
                <ArrowUpLeft className="h-4 w-4" aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm font-semibold text-slate-600 dark:border-white/15 dark:bg-[#12231a] dark:text-slate-300">{t.empty}</p>
      )}
    </section>
  );
}
