"use client";

import { useId, useState } from "react";
import { sanitizeCandidateNumber } from "../search/searchUtils";

export default function HomeResultsFinder({ exams = [], lang = "ar", status, onSearch, onRetry }) {
  const id = useId();
  const [yearChoice, setYearChoice] = useState("");
  const [examId, setExamId] = useState("");
  const [number, setNumber] = useState("");
  const french = lang === "fr";
  const years = [...new Set(exams.map((exam) => String(exam.year)))].sort((a, b) => Number(b) - Number(a));
  const year = yearChoice || years[0] || "";
  const choices = exams.filter((exam) => exam.available && String(exam.year) === year);
  const selected = choices.find((exam) => exam.id === examId);
  const locationSearch = selected?.searchMode === "concours" || selected?.source === "concours";
  const t = french ? {
    heading: "Votre résultat, en quelques secondes",
    description: "Choisissez l’année et le concours, puis saisissez votre numéro.",
    year: "Année", exam: "Concours", choose: "Choisir un concours", number: "Numéro du candidat",
    hint: "Les chiffres arabes et latins sont acceptés. Vérifiez votre numéro sur la convocation.",
    submit: "Afficher mon résultat", locations: "Choisir mon centre", locationHint: "Ce concours nécessite aussi la région, le département et le centre d’examen.",
    loading: "Chargement des concours…", error: "Impossible de charger les concours. Vérifiez votre connexion.", retry: "Réessayer",
    empty: "Aucun concours publié pour le moment.",
  } : {
    heading: "نتيجتك، بخطوات بسيطة",
    description: "اختر السنة والمسابقة، ثم أدخل رقم المترشح.",
    year: "السنة", exam: "المسابقة", choose: "اختر المسابقة", number: "رقم المترشح",
    hint: "نقبل الأرقام العربية واللاتينية. تأكد من الرقم الموجود في الاستدعاء.",
    submit: "عرض نتيجتي", locations: "اختيار مركز الامتحان", locationHint: "تتطلب هذه المسابقة اختيار الولاية والمقاطعة ومركز الامتحان أيضًا.",
    loading: "جارٍ تحميل المسابقات…", error: "تعذّر تحميل المسابقات. تحقق من الاتصال وأعد المحاولة.", retry: "إعادة المحاولة",
    empty: "لا توجد مسابقات منشورة حاليًا.",
  };

  return (
    <section className="home-finder" aria-labelledby={`${id}-title`}>
      <div className="home-finder-heading">
        <span className="home-finder-symbol" aria-hidden="true">⌕</span>
        <div><h2 id={`${id}-title`}>{t.heading}</h2><p>{t.description}</p></div>
      </div>
      {status === "error" ? (
        <div className="home-catalog-status" role="alert"><p>{t.error}</p><button type="button" onClick={onRetry}>{t.retry}</button></div>
      ) : status !== "ready" ? (
        <p className="home-catalog-status home-catalog-status-loading" role="status">{t.loading}</p>
      ) : !years.length ? (
        <p className="home-catalog-status" role="status">{t.empty}</p>
      ) : (
        <form className="home-finder-form" onSubmit={(event) => {
          event.preventDefault();
          if (selected) onSearch(selected, locationSearch ? "" : number);
        }}>
          <label htmlFor={`${id}-year`}><span>01 · {t.year}</span>
            <select id={`${id}-year`} value={year} onChange={(event) => { setYearChoice(event.target.value); setExamId(""); setNumber(""); }}>
              {years.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label htmlFor={`${id}-exam`}><span>02 · {t.exam}</span>
            <select id={`${id}-exam`} value={selected ? examId : ""} required onChange={(event) => { setExamId(event.target.value); setNumber(""); }}>
              <option value="" disabled>{t.choose}</option>
              {choices.map((exam) => <option key={exam.id} value={exam.id}>{exam.title[lang]}</option>)}
            </select>
          </label>
          {!locationSearch && <label htmlFor={`${id}-number`}><span>03 · {t.number}</span>
            <input id={`${id}-number`} name="candidate" value={number} onChange={(event) => setNumber(sanitizeCandidateNumber(event.target.value))} placeholder="12345" type="text" inputMode="numeric" dir="ltr" enterKeyHint="search" autoComplete="off" spellCheck={false} pattern="[0-9]{1,20}" maxLength={20} required disabled={!selected} aria-describedby={`${id}-hint`} />
          </label>}
          <button className="home-finder-submit" type="submit" disabled={!selected}>{locationSearch ? t.locations : t.submit}<span aria-hidden="true">{french ? "→" : "←"}</span></button>
          <p className="home-finder-hint" id={`${id}-hint`}>{locationSearch ? t.locationHint : t.hint}</p>
        </form>
      )}
    </section>
  );
}
