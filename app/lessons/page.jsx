"use client";

import { useMemo, useState } from "react";

const GRADES = [
  { id: "1AF", label: "السنة الأولى", short: "1AF" },
  { id: "2AF", label: "السنة الثانية", short: "2AF" },
  { id: "3AF", label: "السنة الثالثة", short: "3AF" },
  { id: "4AF", label: "السنة الرابعة", short: "4AF" },
  { id: "5AF", label: "السنة الخامسة", short: "5AF" },
  { id: "6AF", label: "السنة السادسة", short: "6AF" },
];

const BOOKS = [
  { grade: "1AF", subject: "التربية الإسلامية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IMR-1AF-M.pdf" },
  { grade: "1AF", subject: "اللغة العربية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/Manuel_Arabe_1AP.pdf" },
  { grade: "1AF", subject: "اللغة العربية", type: "دفتر التمارين", url: "https://docs.bsimr.com/pdfs/fondamentals/Cahier_Arabe_1AP.pdf" },
  { grade: "1AF", subject: "التربية المدنية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IC1AF-M.pdf" },
  { grade: "1AF", subject: "الرياضيات", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/Math_1AP_Manuel_eleve.pdf" },
  { grade: "1AF", subject: "الرياضيات", type: "دفتر التمارين", url: "https://docs.bsimr.com/pdfs/fondamentals/Math_1AP_Cahier_exercice.pdf" },

  { grade: "2AF", subject: "التربية الإسلامية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IMR-2AF-M.pdf" },
  { grade: "2AF", subject: "اللغة العربية", type: "كتاب القراءة", url: "https://docs.bsimr.com/pdfs/student/MART05_Arabe%202AP.pdf" },
  { grade: "2AF", subject: "اللغة العربية", type: "دفتر الكتابة", url: "https://docs.bsimr.com/pdfs/student/MART06_Arabe_2AP.pdf" },
  { grade: "2AF", subject: "التربية المدنية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/ic-2AF-M.pdf" },
  { grade: "2AF", subject: "الرياضيات", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/MATHE-2AF.pdf" },
  { grade: "2AF", subject: "الرياضيات", type: "دفتر التمارين", url: "https://docs.bsimr.com/pdfs/fondamentals/MATHE-2AF-Exercices.pdf" },
  { grade: "2AF", subject: "الفرنسية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/FR_2AP_M_ELEVE.pdf" },

  { grade: "3AF", subject: "التربية الإسلامية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IMR-3AF-M.pdf" },
  { grade: "3AF", subject: "اللغة العربية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/AR-3AF-M.pdf" },
  { grade: "3AF", subject: "التربية المدنية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IC-3AF-M.pdf" },
  { grade: "3AF", subject: "الرياضيات", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/MA-3AF-M.pdf" },
  { grade: "3AF", subject: "العلوم الطبيعية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/SN-3AF-M.pdf" },
  { grade: "3AF", subject: "الجغرافيا", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/GEO-3AF-M.pdf" },
  { grade: "3AF", subject: "الفرنسية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/student/MART08%20livre%20de%20lecture%20Franc%CC%A7ais%203AP%20Livre_Inside.pdf" },
  { grade: "3AF", subject: "الفرنسية", type: "دفتر الكتابة", url: "https://docs.bsimr.com/pdfs/student/MART07_Article%2007%20Cahier%20Franc%CC%A7ais%203AP_Inside.pdf" },

  { grade: "4AF", subject: "التربية الإسلامية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IMR-4AF-M.pdf" },
  { grade: "4AF", subject: "اللغة العربية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/AR-4AF-M.pdf" },
  { grade: "4AF", subject: "التربية المدنية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IC-4AF-M.pdf" },
  { grade: "4AF", subject: "الرياضيات", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/MA-4AF-M.pdf" },
  { grade: "4AF", subject: "العلوم الطبيعية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/SN-4AF-M.pdf" },
  { grade: "4AF", subject: "الجغرافيا", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/GEO-4AF-M.pdf" },
  { grade: "4AF", subject: "الفرنسية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/FR-4AF-M.pdf" },

  { grade: "5AF", subject: "التربية الإسلامية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IMR-5AF-M.pdf" },
  { grade: "5AF", subject: "اللغة العربية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/AR-5AF-M.pdf" },
  { grade: "5AF", subject: "التربية المدنية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IC-5AF-M.pdf" },
  { grade: "5AF", subject: "الرياضيات", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/MA-5AF-M.pdf" },
  { grade: "5AF", subject: "العلوم الطبيعية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/SN-5AF-M.pdf" },
  { grade: "5AF", subject: "التاريخ", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/HIST-5AF-M.pdf" },
  { grade: "5AF", subject: "الجغرافيا", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/GEO-5AF-M.pdf" },
  { grade: "5AF", subject: "الفرنسية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/FR-5AF-M.pdf" },

  { grade: "6AF", subject: "التربية الإسلامية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IMR-6AF-M.pdf" },
  { grade: "6AF", subject: "اللغة العربية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/AR-6AF-M.pdf" },
  { grade: "6AF", subject: "التربية المدنية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/IC-6AF-M.pdf" },
  { grade: "6AF", subject: "الرياضيات", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/MA-6AF-M.pdf" },
  { grade: "6AF", subject: "التاريخ", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/HIST-6AF-M.pdf" },
  { grade: "6AF", subject: "الجغرافيا", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/GEO-6AF-M.pdf" },
  { grade: "6AF", subject: "الفرنسية", type: "كتاب التلميذ", url: "https://docs.bsimr.com/pdfs/fondamentals/FR-6AF-M.pdf" },
];

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
  const [grade, setGrade] = useState("1AF");
  const [query, setQuery] = useState("");

  const selectedGrade = GRADES.find((item) => item.id === grade);
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
              <h1 className="text-2xl font-black sm:text-4xl">كتب المرحلة الابتدائية</h1>
              <p className="mt-2 text-sm font-bold leading-7 text-emerald-50">اختر السنة والمادة، ثم اضغط على زر التحميل ليبدأ تنزيل الكتاب مباشرة بصيغة PDF.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {GRADES.map((item) => {
            const count = BOOKS.filter((book) => book.grade === item.id).length;
            const active = grade === item.id;
            return (
              <button key={item.id} type="button" onClick={() => setGrade(item.id)} className={`rounded-2xl border p-3 text-center transition ${active ? "border-mauri-green bg-mauri-green text-white shadow-lg" : "border-slate-200 bg-white hover:border-mauri-green/40 dark:border-white/10 dark:bg-white/5"}`}>
                <strong className="block text-sm font-black">{item.label}</strong>
                <span className={`mt-1 block text-xs font-bold ${active ? "text-white/80" : "text-slate-500"}`}>{item.short}</span>
                <span className={`mt-1 block text-[10px] font-bold ${active ? "text-white/75" : "text-slate-400"}`}>{count ? `${count} كتب` : "قريبًا"}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black">{selectedGrade?.label} ابتدائية</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{books.length ? `${books.length} ملفات متاحة للتحميل` : "ستُضاف كتب هذه السنة قريبًا"}</p>
          </div>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث عن مادة أو كتاب..." className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-mauri-green focus:ring-4 focus:ring-mauri-green/10 dark:border-white/10 dark:bg-white/5 sm:max-w-xs" />
        </div>

        {books.length ? (
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
        ) : (
          <div className="mt-5 rounded-[26px] border border-dashed border-slate-300 bg-white p-10 text-center dark:border-white/15 dark:bg-white/5">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-white/10"><BookIcon /></div>
            <h3 className="mt-4 font-black">لا توجد كتب متاحة حاليًا</h3>
            <p className="mt-2 text-sm font-bold text-slate-500">سيتم إضافة كتب {selectedGrade?.label} عند توفر روابطها.</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs font-bold leading-6 text-slate-400">عند الضغط على زر التحميل يبدأ تنزيل ملف PDF مباشرة على جهازك.</p>
      </section>
    </main>
  );
}
