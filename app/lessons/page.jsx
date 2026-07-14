"use client";

import { useMemo, useState } from "react";

const STAGES = [
  {
    id: "primary",
    label: "الابتدائية",
    title: "كتب المرحلة الابتدائية",
    grades: ["1AF", "2AF", "3AF", "4AF", "5AF", "6AF"],
  },
  {
    id: "middle",
    label: "الإعدادية",
    title: "كتب المرحلة الإعدادية",
    grades: ["1AS", "2AS", "3AS", "4AS"],
  },
];

const GRADE_LABELS = {
  "1AF": "السنة الأولى", "2AF": "السنة الثانية", "3AF": "السنة الثالثة",
  "4AF": "السنة الرابعة", "5AF": "السنة الخامسة", "6AF": "السنة السادسة",
  "1AS": "السنة الأولى", "2AS": "السنة الثانية", "3AS": "السنة الثالثة", "4AS": "السنة الرابعة",
};

const PRIMARY_BOOKS = [
  ["1AF", "التربية الإسلامية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IMR-1AF-M.pdf"],
  ["1AF", "اللغة العربية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/Manuel_Arabe_1AP.pdf"],
  ["1AF", "اللغة العربية", "دفتر التمارين", "https://docs.bsimr.com/pdfs/fondamentals/Cahier_Arabe_1AP.pdf"],
  ["1AF", "التربية المدنية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IC1AF-M.pdf"],
  ["1AF", "الرياضيات", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/Math_1AP_Manuel_eleve.pdf"],
  ["1AF", "الرياضيات", "دفتر التمارين", "https://docs.bsimr.com/pdfs/fondamentals/Math_1AP_Cahier_exercice.pdf"],
  ["2AF", "التربية الإسلامية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IMR-2AF-M.pdf"],
  ["2AF", "اللغة العربية", "كتاب القراءة", "https://docs.bsimr.com/pdfs/student/MART05_Arabe%202AP.pdf"],
  ["2AF", "اللغة العربية", "دفتر الكتابة", "https://docs.bsimr.com/pdfs/student/MART06_Arabe_2AP.pdf"],
  ["2AF", "التربية المدنية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/ic-2AF-M.pdf"],
  ["2AF", "الرياضيات", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/MATHE-2AF.pdf"],
  ["2AF", "الرياضيات", "دفتر التمارين", "https://docs.bsimr.com/pdfs/fondamentals/MATHE-2AF-Exercices.pdf"],
  ["2AF", "الفرنسية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/FR_2AP_M_ELEVE.pdf"],
  ["3AF", "التربية الإسلامية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IMR-3AF-M.pdf"],
  ["3AF", "اللغة العربية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/AR-3AF-M.pdf"],
  ["3AF", "التربية المدنية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IC-3AF-M.pdf"],
  ["3AF", "الرياضيات", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/MA-3AF-M.pdf"],
  ["3AF", "العلوم الطبيعية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/SN-3AF-M.pdf"],
  ["3AF", "الجغرافيا", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/GEO-3AF-M.pdf"],
  ["3AF", "الفرنسية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/student/MART08%20livre%20de%20lecture%20Franc%CC%A7ais%203AP%20Livre_Inside.pdf"],
  ["3AF", "الفرنسية", "دفتر الكتابة", "https://docs.bsimr.com/pdfs/student/MART07_Article%2007%20Cahier%20Franc%CC%A7ais%203AP_Inside.pdf"],
  ...["4AF", "5AF", "6AF"].flatMap((grade) => {
    const subjects = [
      ["التربية الإسلامية", "IMR"], ["اللغة العربية", "AR"], ["التربية المدنية", "IC"],
      ["الرياضيات", "MA"], ["العلوم الطبيعية", "SN"],
      ...(grade === "4AF" ? [] : [["التاريخ", "HIST"]]),
      ["الجغرافيا", "GEO"], ["الفرنسية", "FR"],
    ];
    return subjects.map(([subject, code]) => [grade, subject, "كتاب التلميذ", `https://docs.bsimr.com/pdfs/fondamentals/${code}-${grade}-M.pdf`]);
  }),
];

const MIDDLE_SUBJECTS = [
  ["التربية الإسلامية", "IMR", true],
  ["اللغة العربية", "AR", true],
  ["التربية المدنية", "IC", true],
  ["الرياضيات", "MA", true],
  ["العلوم الطبيعية", "SN", true],
  ["الجغرافيا", "GEO", true],
  ["التاريخ", "HIS", false],
  ["الفرنسية", "FR", true],
  ["الإنجليزية", "ANG", true],
];

const MIDDLE_BOOKS = ["1AS", "2AS", "3AS", "4AS"].flatMap((grade) => {
  const subjects = grade === "3AS" || grade === "4AS"
    ? [...MIDDLE_SUBJECTS, ["الفيزياء", "PHY", true]]
    : MIDDLE_SUBJECTS;

  return subjects.map(([subject, code, hasManualSuffix]) => {
    const filename = `${code}-${grade}${hasManualSuffix ? "-M" : ""}.pdf`;
    return [grade, subject, "كتاب التلميذ", `https://docs.bsimr.com/pdfs/secondaire1s/${filename}`];
  });
});

const BOOKS = [...PRIMARY_BOOKS, ...MIDDLE_BOOKS].map(([grade, subject, type, url]) => ({ grade, subject, type, url }));

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-2" aria-hidden="true">
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H6.5A2.5 2.5 0 0 0 4 19.5z" />
      <path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v17a3 3 0 0 1 3-3h.5a2.5 2.5 0 0 1 2.5 2.5z" />
    </svg>
  );
}

function downloadUrl(book) {
  const filename = `${book.subject} - ${book.type} - ${book.grade}.pdf`;
  return `/api/books/download?url=${encodeURIComponent(book.url)}&name=${encodeURIComponent(filename)}`;
}

export default function LessonsPage() {
  const [stageId, setStageId] = useState("primary");
  const [grade, setGrade] = useState("1AF");
  const [query, setQuery] = useState("");
  const stage = STAGES.find((item) => item.id === stageId) || STAGES[0];

  function chooseStage(nextStage) {
    setStageId(nextStage.id);
    setGrade(nextStage.grades[0]);
    setQuery("");
  }

  const books = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return BOOKS.filter((book) => book.grade === grade && (!normalized || `${book.subject} ${book.type}`.toLowerCase().includes(normalized)));
  }, [grade, query]);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 pb-16 text-slate-900 dark:bg-[#06110b] dark:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
        <div className="app-shell flex h-14 items-center justify-between gap-3">
          <a href="/" className="rounded-xl px-3 py-2 text-sm font-black text-mauri-green hover:bg-mauri-green/10">← الرئيسية</a>
          <strong className="text-base font-black">الدروس والكتب</strong>
          <span className="w-20" aria-hidden="true" />
        </div>
      </header>

      <section className="app-shell py-7">
        <div className="overflow-hidden rounded-[30px] bg-gradient-to-l from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-[0_20px_55px_rgba(5,150,105,.22)] sm:p-9">
          <div className="flex max-w-2xl items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15"><BookIcon /></div>
            <div>
              <p className="mb-1 text-xs font-black text-emerald-100">مكتبة MauriResults التعليمية</p>
              <h1 className="text-2xl font-black sm:text-4xl">{stage.title}</h1>
              <p className="mt-2 text-sm font-bold leading-7 text-emerald-50">اختر المرحلة والسنة والمادة، ثم اضغط على زر التحميل ليبدأ تنزيل الكتاب مباشرة بصيغة PDF.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          {STAGES.map((item) => (
            <button key={item.id} type="button" onClick={() => chooseStage(item)} className={`rounded-2xl border px-4 py-4 text-base font-black transition ${stageId === item.id ? "border-mauri-green bg-mauri-green text-white shadow-lg" : "border-slate-200 bg-white hover:border-mauri-green/40 dark:border-white/10 dark:bg-white/5"}`}>
              {item.label}
            </button>
          ))}
        </div>

        <div className={`mt-4 grid gap-2 ${stage.grades.length === 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3 sm:grid-cols-6"}`}>
          {stage.grades.map((item) => {
            const count = BOOKS.filter((book) => book.grade === item).length;
            const active = grade === item;
            return (
              <button key={item} type="button" onClick={() => setGrade(item)} className={`rounded-2xl border p-3 text-center transition ${active ? "border-mauri-green bg-mauri-green text-white shadow-lg" : "border-slate-200 bg-white hover:border-mauri-green/40 dark:border-white/10 dark:bg-white/5"}`}>
                <strong className="block text-sm font-black">{GRADE_LABELS[item]}</strong>
                <span className={`mt-1 block text-xs font-bold ${active ? "text-white/80" : "text-slate-500"}`}>{item}</span>
                <span className={`mt-1 block text-[10px] font-bold ${active ? "text-white/75" : "text-slate-400"}`}>{count} كتب</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">{GRADE_LABELS[grade]} {stage.label}</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{books.length} ملفات متاحة للتحميل</p>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن مادة أو كتاب..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/5 sm:max-w-xs" />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <article key={`${book.grade}-${book.subject}-${book.type}`} className="flex min-h-40 flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mauri-green/10 text-mauri-green"><BookIcon /></div>
                <div className="min-w-0">
                  <h3 className="text-base font-black">{book.subject}</h3>
                  <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{book.type}</p>
                </div>
              </div>
              <a href={downloadUrl(book)} className="mt-auto flex h-11 items-center justify-center rounded-2xl bg-mauri-green px-4 text-sm font-black text-white transition hover:brightness-110">تحميل PDF</a>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-xs font-bold leading-6 text-slate-400">عند الضغط على زر التحميل يبدأ تنزيل ملف PDF مباشرة على جهازك.</p>
      </section>
    </main>
  );
}
