"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { STUDY_BOOK_FILES } from "../../data/study-library.mjs";

const T = {
  ar: {
    library: "مكتبة MauriResults التعليمية", chooseStage: "اختر المرحلة الدراسية", chooseStageDesc: "اختر المرحلة أولًا، ثم ستظهر السنوات والكتب الخاصة بها فقط.",
    primary: "الابتدائية", middle: "الإعدادية", secondary: "الثانوية", primaryDesc: "من 1AF إلى 6AF", middleDesc: "من 1AS إلى ابريفه (3AS / 4AS)", secondaryDesc: "من 5AS إلى الباك",
    backStages: "تغيير المرحلة", chooseYear: "اختر السنة الدراسية", available: "ملفات متاحة للتحميل", search: "ابحث عن مادة أو شعبة...", download: "تحميل PDF", books: "كتب",
    grades: { "1AF":"السنة الأولى","2AF":"السنة الثانية","3AF":"السنة الثالثة","4AF":"السنة الرابعة","5AF":"السنة الخامسة","6AF":"السنة السادسة","1AS":"السنة الأولى","2AS":"السنة الثانية","3AS":"السنة الثالثة","4AS":"ابريفه (3AS / 4AS)","5AS":"السنة الخامسة","6AS":"السنة السادسة","7AS":"السنة السابعة (BAC)" },
  },
  fr: {
    library: "Bibliothèque éducative MauriResults", chooseStage: "Choisissez le niveau scolaire", chooseStageDesc: "Choisissez d’abord le niveau, puis ses années et ses livres seront affichés.",
    primary: "Primaire", middle: "Collège", secondary: "Lycée", primaryDesc: "De 1AF à 6AF", middleDesc: "De 1AS au BEPC (3AS / 4AS)", secondaryDesc: "De 5AS au BAC",
    backStages: "Changer de niveau", chooseYear: "Choisissez l’année", available: "fichiers disponibles", search: "Rechercher une matière ou une série...", download: "Télécharger PDF", books: "livres",
    grades: { "1AF":"1re année","2AF":"2e année","3AF":"3e année","4AF":"4e année","5AF":"5e année","6AF":"6e année","1AS":"1re année","2AS":"2e année","3AS":"3e année","4AS":"BEPC (3AS / 4AS)","5AS":"5e année","6AS":"6e année","7AS":"7e année (BAC)" },
  },
};

const STAGES = [
  { id: "primary", grades: ["1AF","2AF","3AF","4AF","5AF","6AF"], icon: "✦" },
  { id: "middle", grades: ["1AS","2AS","4AS"], icon: "▦" },
  { id: "secondary", grades: ["5AS","6AS","7AS"], icon: "◆" },
];

const rows = [];
const add = (grade, subject, type, url) => rows.push({ grade, subject, type, url });
[
["1AF","التربية الإسلامية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/IMR-1AF-M.pdf"],["1AF","اللغة العربية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/Manuel_Arabe_1AP.pdf"],["1AF","اللغة العربية","دفتر التمارين","https://docs.bsimr.com/pdfs/fondamentals/Cahier_Arabe_1AP.pdf"],["1AF","التربية المدنية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/IC1AF-M.pdf"],["1AF","الرياضيات","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/Math_1AP_Manuel_eleve.pdf"],["1AF","الرياضيات","دفتر التمارين","https://docs.bsimr.com/pdfs/fondamentals/Math_1AP_Cahier_exercice.pdf"],
["2AF","التربية الإسلامية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/IMR-2AF-M.pdf"],["2AF","اللغة العربية","كتاب القراءة","https://docs.bsimr.com/pdfs/student/MART05_Arabe%202AP.pdf"],["2AF","اللغة العربية","دفتر الكتابة","https://docs.bsimr.com/pdfs/student/MART06_Arabe_2AP.pdf"],["2AF","التربية المدنية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/ic-2AF-M.pdf"],["2AF","الرياضيات","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/MATHE-2AF.pdf"],["2AF","الرياضيات","دفتر التمارين","https://docs.bsimr.com/pdfs/fondamentals/MATHE-2AF-Exercices.pdf"],["2AF","الفرنسية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/FR_2AP_M_ELEVE.pdf"],
["3AF","التربية الإسلامية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/IMR-3AF-M.pdf"],["3AF","اللغة العربية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/AR-3AF-M.pdf"],["3AF","التربية المدنية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/IC-3AF-M.pdf"],["3AF","الرياضيات","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/MA-3AF-M.pdf"],["3AF","العلوم الطبيعية","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/SN-3AF-M.pdf"],["3AF","الجغرافيا","كتاب التلميذ","https://docs.bsimr.com/pdfs/fondamentals/GEO-3AF-M.pdf"],["3AF","الفرنسية","كتاب التلميذ","https://docs.bsimr.com/pdfs/student/MART08%20livre%20de%20lecture%20Franc%CC%A7ais%203AP%20Livre_Inside.pdf"],["3AF","الفرنسية","دفتر الكتابة","https://docs.bsimr.com/pdfs/student/MART07_Article%2007%20Cahier%20Franc%CC%A7ais%203AP_Inside.pdf"],
].forEach((x)=>add(...x));
["4AF","5AF","6AF"].forEach((g)=>[["التربية الإسلامية","IMR"],["اللغة العربية","AR"],["التربية المدنية","IC"],["الرياضيات","MA"],["العلوم الطبيعية","SN"],...(g==="4AF"?[]:[["التاريخ","HIST"]]),["الجغرافيا","GEO"],["الفرنسية","FR"]].forEach(([s,c])=>add(g,s,"كتاب التلميذ",`https://docs.bsimr.com/pdfs/fondamentals/${c}-${g}-M.pdf`)));
const mid=[["التربية الإسلامية","IMR",1],["اللغة العربية","AR",1],["التربية المدنية","IC",1],["الرياضيات","MA",1],["العلوم الطبيعية","SN",1],["الجغرافيا","GEO",1],["التاريخ","HIS",0],["الفرنسية","FR",1],["الإنجليزية","ANG",1]];
["1AS","2AS","3AS","4AS"].forEach((g)=>(g==="3AS"||g==="4AS"?[...mid,["الفيزياء","PHY",1]]:mid).forEach(([s,c,m])=>{
  const url = g === "4AS" && c === "HIS"
    ? "https://docs.bsimr.com/pdfs/secondaire2s/HIS-4AS-M.pdf"
    : `https://docs.bsimr.com/pdfs/secondaire1s/${c}-${g}${m?"-M":""}.pdf`;
  add(g,s,"كتاب التلميذ",url);
}));
[
["5AS","التربية الإسلامية","كتاب التلميذ","IMR-5AS-M.pdf"],["5AS","اللغة العربية","الشعبة العلمية (C وD)","AR-5AS-CD.pdf"],["5AS","اللغة العربية","الشعبة الأدبية (LM)","AR-5AS-LM.pdf"],["5AS","التربية المدنية","كتاب التلميذ","IC-5AS-M.pdf"],["5AS","الرياضيات","كتاب التلميذ","MA-5AS-M.pdf"],["5AS","الفيزياء","الشعبة العلمية (C وD)","PHY-5AS-M.pdf"],["5AS","الكيمياء","كتاب التلميذ","CHI-5AS-M.pdf"],["5AS","العلوم الطبيعية","شعبة العلوم (D)","SN-5AS-D.pdf"],["5AS","التاريخ","كتاب التلميذ","HIS-5AS-M.pdf"],["5AS","الجغرافيا","الشعبة الأدبية (LM)","GEO-5AS-LM.pdf"],["5AS","الفلسفة","كتاب التلميذ","PHI-5AS-M.pdf"],["5AS","الفلسفة","الشعبة العلمية (C وD)","PHI-5AS-CD.pdf"],["5AS","الفرنسية","الشعبة العلمية (C وD)","FR-5AS-CD.pdf"],["5AS","الفرنسية","الشعبة الأدبية (LM)","FR-5AS-LM.pdf"],["5AS","الإنجليزية","كتاب التلميذ","ANG-5AS-M.pdf"],
["6AS","التربية الإسلامية","كتاب التلميذ","IMR-6AS-M.pdf"],["6AS","اللغة العربية","الشعبة العلمية (C وD)","AR-6AS-M.pdf"],["6AS","اللغة العربية","الشعبة الأدبية (LM)","AR-6AS-LM.pdf"],["6AS","التربية المدنية","كتاب التلميذ","IC-6AS-M.pdf"],["6AS","الرياضيات","كتاب التلميذ","MA-6AS-M.pdf"],["6AS","الفيزياء","كتاب التلميذ","PHY-6AS-M.pdf"],["6AS","الكيمياء","كتاب التلميذ","CHI-6AS-M.pdf"],["6AS","العلوم الطبيعية","شعبة العلوم (D)","SN-6AS-D.pdf"],["6AS","العلوم الطبيعية","النسخة العامة","SN-6AS-M.pdf"],["6AS","التاريخ","كتاب التلميذ","HIS-6AS-M.pdf"],["6AS","الجغرافيا","الشعبة العلمية (C وD)","GEO-6AS-CD.pdf"],["6AS","الفلسفة","النسخة العامة","PHI-6AS-M.pdf"],["6AS","الفلسفة","شعبة العلوم (D)","Philo%206AS%20D%20.pdf"],["6AS","الفرنسية","الشعبة العلمية (C وD)","FR-6AS-CD.pdf"],["6AS","الفرنسية","الشعبة الأدبية (LM)","FR-6AS-LM.pdf"],["6AS","الإنجليزية","كتاب التلميذ","ANG-6AS-M.pdf"],
["7AS","التربية الإسلامية","الفقه والأصول","L.G-7AS-M.pdf"],["7AS","التربية الإسلامية","القرآن والحديث","Coran%20%26%20Hadith-7AS-LM.pdf"],["7AS","التربية الإسلامية","الشعبة العامة","https://bsimr.s3.us-east-2.amazonaws.com/pdfs/secondaire2s/IMR-7AS-M.pdf"],["7AS","اللغة العربية","الشعبة العلمية (C وD)","AR-7AS-CD.pdf"],["7AS","اللغة العربية","الشعبة الأدبية (LM)","AR-7AS-LM.pdf"],["7AS","الرياضيات","شعبة الرياضيات (C)","MA-7AS-C.pdf"],["7AS","الرياضيات","شعبة العلوم (D)","MA-7AS-D.pdf"],["7AS","الفيزياء","شعبة الرياضيات (C)","PHY-7AS-C.pdf"],["7AS","الفيزياء","شعبة العلوم (D)","PHY-7AS-D.pdf"],["7AS","الكيمياء","كتاب التلميذ","CHI-7AS-M.pdf"],["7AS","العلوم الطبيعية","شعبة الرياضيات (C)","SN-7AS-C.pdf"],["7AS","العلوم الطبيعية","شعبة العلوم (D)","SN-7AS-D.pdf"],["7AS","التاريخ","شعبة الآداب الأصلية (A)","HIS-7AS-A.pdf"],["7AS","الجغرافيا","الشعبة الأدبية (LM)","GEO-7AS-LM.pdf"],["7AS","الفلسفة","الآداب الأصلية (A)","PHI-7AS-A.pdf"],["7AS","الفلسفة","الآداب العصرية (LM)","PHI-7AS-M.pdf"],["7AS","الفرنسية","الشعبة العلمية (C وD)","FR-7AS-M.pdf"],["7AS","الفرنسية","الشعبة الأدبية (LM)","FR-7AS-LM.pdf"],["7AS","الإنجليزية","كتاب التلميذ","ANG-7AS-M.pdf"],
].forEach(([g,s,t,f])=>add(g,s,t,f.startsWith("https://")?f:`https://docs.bsimr.com/pdfs/secondaire2s/${f}`));

const ownedBooks = STUDY_BOOK_FILES.map(file => ({
  grade: file.level, subject: file.subject, type: "كتاب ومراجع إضافية",
  title: file.displayTitle || file.title, id: file.id, fileType: file.fileType,
}));
const byGrade = (book, grade) => book.grade === grade || (grade === "4AS" && book.grade === "3AS");
const localCopyNames = new Set(ownedBooks.map(file => String(file.title || "").replace(/[^a-z0-9]/gi, "").toLowerCase()));
const catalogBooks = [
  ...rows.filter(file => !localCopyNames.has(decodeURIComponent(file.url.split("/").pop() || "").replace(/[^a-z0-9]/gi, "").toLowerCase())),
  ...ownedBooks,
];
function lessonSelectionFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const stage = STAGES.find(value => value.id === params.get("stage"));
  const grade = stage?.grades.includes(params.get("grade")) ? params.get("grade") : stage?.grades[0] || null;
  return { stageId: stage?.id || null, grade };
}
function lessonPath(stage, grade) {
  const url = new URL(window.location.href);
  url.searchParams.set("tab", "lessons");
  if (stage && grade) { url.searchParams.set("stage", stage); url.searchParams.set("grade", grade); }
  else { url.searchParams.delete("stage"); url.searchParams.delete("grade"); }
  return url.pathname + url.search + url.hash;
}
function downloadUrl(book){
  if (book.id) return `/api/study-files/download?id=${encodeURIComponent(book.id)}`;
  const n = `${book.subject} - ${book.type} - ${book.grade}.pdf`;
  return `/api/books/download?url=${encodeURIComponent(book.url)}&name=${encodeURIComponent(n)}`;
}
function readUrl(book, stage, grade){
  const context = "&stage=" + encodeURIComponent(stage) + "&grade=" + encodeURIComponent(grade);
  if (book.id) return `/study/reader?id=${encodeURIComponent(book.id)}&from=books` + context;
  return `/study/book-reader?url=${encodeURIComponent(book.url)}&name=${encodeURIComponent(book.subject + " - " + book.grade)}` + context;
}

export default function LessonsExplorer(){
  const [lang,setLang]=useState("ar"); const [stageId,setStageId]=useState(null); const [grade,setGrade]=useState(null); const [query,setQuery]=useState("");
  useEffect(()=>{
  const syncLanguage=e=>setLang(e?.detail?.lang||localStorage.getItem("mauriresults-lang")||"ar");
  const syncNavigation=()=>{
    const state=lessonSelectionFromUrl();
    setStageId(state.stageId);setGrade(state.grade);setQuery("");
  };
  syncLanguage();syncNavigation();
  window.addEventListener("mauriresults:language-change",syncLanguage);
  window.addEventListener("popstate",syncNavigation);
  return()=>{window.removeEventListener("mauriresults:language-change",syncLanguage);window.removeEventListener("popstate",syncNavigation);};
},[]);
  const tx=T[lang]; const stage=STAGES.find(s=>s.id===stageId);
  const books=useMemo(()=>catalogBooks.filter(b=>byGrade(b,grade)&&(!query.trim()||`${b.subject} ${b.type} ${b.title||""}`.toLowerCase().includes(query.trim().toLowerCase()))),[grade,query]);
  function navigateTo(stage, nextGrade){
  window.history.pushState({ ...window.history.state }, "", lessonPath(stage, nextGrade));
  setStageId(stage);setGrade(nextGrade);setQuery("");
}
function chooseStage(s){navigateTo(s.id,s.grades[0]);window.scrollTo({top:0,behavior:"smooth"});}
  return <main data-no-auto-translate dir={lang==="ar"?"rtl":"ltr"} className="min-h-screen bg-slate-50 pb-16 text-slate-900 dark:bg-[#07130d] dark:text-white">
    <section className="app-shell py-6 sm:py-8">
      {!stage ? <>
        <div className="rounded-[30px] bg-gradient-to-l from-emerald-700 via-emerald-600 to-teal-600 p-6 text-white shadow-xl sm:p-9"><p className="text-xs font-black text-emerald-100">{tx.library}</p><h1 className="mt-2 text-2xl font-black sm:text-4xl">{tx.chooseStage}</h1><p className="mt-3 max-w-2xl text-sm font-bold leading-7 text-emerald-50">{tx.chooseStageDesc}</p></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">{STAGES.map(s=><button key={s.id} onClick={()=>chooseStage(s)} className="group rounded-[26px] border border-slate-200 bg-white p-6 text-start shadow-sm transition hover:-translate-y-1 hover:border-mauri-green hover:shadow-xl dark:border-white/10 dark:bg-[#12231a]"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-mauri-green/10 text-xl text-mauri-green">{s.icon}</span><strong className="mt-5 block text-xl font-black">{tx[s.id]}</strong><span className="mt-2 block text-sm font-bold text-slate-500 dark:text-slate-300">{tx[`${s.id}Desc`]}</span><span className="mt-5 block text-xs font-black text-mauri-green">{s.grades.reduce((n,g)=>n+catalogBooks.filter(b=>byGrade(b,g)).length,0)} {tx.books}</span></button>)}</div>
      </> : <>
        <button onClick={()=>navigateTo(null,null)} className="mb-4 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-mauri-green dark:border-white/10 dark:bg-[#12231a]">← {tx.backStages}</button>
        <div className="rounded-[28px] bg-gradient-to-l from-emerald-700 to-teal-600 p-6 text-white"><p className="text-xs font-black text-emerald-100">{tx.library}</p><h1 className="mt-2 text-2xl font-black">{tx[stage.id]}</h1><p className="mt-2 text-sm font-bold text-emerald-50">{tx.chooseYear}</p></div>
        <div className={`mt-5 grid gap-3 ${stage.grades.length===3?"grid-cols-3":stage.grades.length===4?"grid-cols-2 sm:grid-cols-4":"grid-cols-3 sm:grid-cols-6"}`}>{stage.grades.map(g=>{const c=catalogBooks.filter(b=>byGrade(b,g)).length;return <button key={g} onClick={()=>navigateTo(stageId,g)} className={`rounded-2xl border p-4 text-center transition ${grade===g?"border-mauri-green bg-mauri-green text-white shadow-lg":"border-slate-200 bg-white dark:border-white/10 dark:bg-[#12231a]"}`}><strong className="block text-sm font-black">{tx.grades[g]}</strong><span className="mt-1 block text-xs font-bold opacity-80">{g}</span><span className="mt-1 block text-[11px] font-bold opacity-75">{c} {tx.books}</span></button>})}</div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-black">{tx.grades[grade]} — {tx[stage.id]}</h2><p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-300">{books.length} {tx.available}</p></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={tx.search} className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-mauri-green dark:border-white/10 dark:bg-[#12231a] sm:max-w-xs"/></div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{books.map(b=><article key={b.id||`${b.grade}-${b.subject}-${b.type}-${b.url}`}
          className="flex min-w-0 min-h-44 flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#12231a]">
          <h3 className="break-words text-base font-black leading-7">{b.subject}</h3>
          <p className="mt-1 line-clamp-3 break-words text-sm font-semibold text-slate-500 dark:text-slate-300" title={b.title||b.type}>{b.title ? b.title.replace(/\.(pdf|docx?)$/i,"").replace(/_/g," ") : b.type}</p>
          <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
            {(b.fileType==="DOC"||b.fileType==="DOCX") ? null : <Link href={readUrl(b,stageId,grade)}
              className="flex min-h-11 items-center justify-center rounded-2xl bg-mauri-green px-2 text-sm font-black text-white">{lang==="ar"?"قراءة":"Lire"}</Link>}
            <a href={downloadUrl(b)} className={`flex min-h-11 items-center justify-center rounded-2xl border border-mauri-green px-2 text-sm font-black text-mauri-green ${(b.fileType==="DOC"||b.fileType==="DOCX")?"col-span-2":""}`}>{tx.download}</a>
          </div>
        </article>)}</div>
      </>}
    </section>
  </main>;
}
