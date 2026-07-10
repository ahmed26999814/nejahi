from pathlib import Path

p = Path("components/home/HomeApplication.jsx")
s = p.read_text(encoding="utf-8").replace("\r\n", "\n")


def rep(old, new, label):
    global s
    if old not in s:
        raise SystemExit(f"missing {label}")
    s = s.replace(old, new, 1)


rep('import { useEffect, useMemo, useState } from "react";', 'import { useEffect, useMemo, useRef, useState } from "react";', "useRef import")
rep('  const [publishedExams, setPublishedExams] = useState([]);\n', '  const [publishedExams, setPublishedExams] = useState([]);\n  const sharedResultRequestRef = useRef("");\n', "shared ref")

route_hook = '''  useHashRoute(examCards, (route) => {
    const savedExamId = localStorage.getItem("mauriresults-selected-exam") || "";
    setActiveView(route.view);
    if (route.yearId) setSelectedYearId(route.yearId);
    const nextExamId = route.examId || savedExamId;
    if (nextExamId && examCards.some((exam) => exam.id === nextExamId)) {
      setSelectedExamId(nextExamId);
      localStorage.setItem("mauriresults-selected-exam", nextExamId);
    }
    if (route.view === "result") {
      try {
        const savedStudent = JSON.parse(sessionStorage.getItem("mauriresults-selected-result") || "null");
        if (savedStudent) {
          setSelectedStudent(savedStudent);
          setResultPageOpen(true);
        }
      } catch {}
    }
    if (route.view === "ranking") {
      try {
        const savedRanking = JSON.parse(sessionStorage.getItem("mauriresults-ranking-target") || "null");
        if (savedRanking) setRankingTarget(savedRanking);
      } catch {}
    }
    if (route.view !== "result") {
      setResultPageOpen(false);
      setSelectedStudent(null);
    }
  });
'''
shared_effect = route_hook + '''
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = cleanText(params.get("source"));
    const candidate = cleanText(params.get("candidate"));
    if (!source || !candidate) return undefined;

    const exam = examCards.find((item) => item.available && item.source === source);
    if (!exam) return undefined;
    const requestKey = `${source}:${candidate}`;
    if (sharedResultRequestRef.current === requestKey) return undefined;
    sharedResultRequestRef.current = requestKey;

    let cancelled = false;
    setSelectedExamId(exam.id);
    setSelectedYearId(`year-${getExamYear(exam)}`);
    localStorage.setItem("mauriresults-selected-exam", exam.id);
    setActiveView("result");
    setResultLoading(true);
    setError("");

    searchResults(candidate, exam)
      .then((rows) => {
        if (cancelled) return;
        const student = rows[0];
        if (!student) {
          setActiveView("exam");
          setError(UI_TEXT[lang]?.notFound || UI_TEXT.ar.notFound);
          return;
        }
        setSelectedStudent(student);
        setResultPageOpen(true);
        sessionStorage.setItem("mauriresults-selected-result", JSON.stringify(student));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error("[MauriResults Shared Result Error]", error);
        setActiveView("exam");
        setError(UI_TEXT[lang]?.connectionError || UI_TEXT.ar.connectionError);
      })
      .finally(() => {
        if (!cancelled) setResultLoading(false);
      });

    return () => { cancelled = true; };
  }, [examCards, lang]);
'''
rep(route_hook, shared_effect, "shared result effect")

old_exam_page = '''function ExamPage({ error, exam, handleSubmit, lang, loading, matches, message, onPickSuggestion, onSelect, query, searchPool, setQuery, suggestions, text }) {
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.search} title={exam.title[lang]} description={text.examPageDesc} icon={exam.icon} />
      <section className="scroll-mt-20" id="resultArea">
        {exam.source === "concours" ? (
          <ConcoursSearchPanel onSelect={onSelect} text={text} />
        ) : (
          <SearchPanel error={error} examTitle={exam.title[lang]} handleSubmit={handleSubmit} loading={loading} message={message} onPickSuggestion={onPickSuggestion} query={query} setQuery={setQuery} suggestions={suggestions} text={text} />
        )}
        {loading && <ResultLoadingCard text={text} />}
        {exam.source !== "concours" && !loading && matches.length > 0 && <MatchesList matches={matches} onSelect={onSelect} text={text} />}
      </section>
    </section>
  );
}
'''
new_exam_page = '''function ExamPage({ error, exam, handleSubmit, lang, loading, matches, message, onPickSuggestion, onSelect, query, searchPool, setQuery, suggestions, text }) {
  const uploadedConcours = String(exam?.source || "").startsWith("upload:") && exam?.searchMode === "concours";
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.search} title={exam.title[lang]} description={text.examPageDesc} icon={exam.icon} />
      <section className="scroll-mt-20" id="resultArea">
        {exam.source === "concours" ? (
          <ConcoursSearchPanel onSelect={onSelect} text={text} />
        ) : uploadedConcours ? (
          <UploadedConcoursSearchPanel exam={exam} onSelect={onSelect} text={text} />
        ) : (
          <SearchPanel error={error} examTitle={exam.title[lang]} handleSubmit={handleSubmit} loading={loading} message={message} onPickSuggestion={onPickSuggestion} query={query} setQuery={setQuery} suggestions={suggestions} text={text} />
        )}
        {loading && <ResultLoadingCard text={text} />}
        {exam.source !== "concours" && !uploadedConcours && !loading && matches.length > 0 && <MatchesList matches={matches} onSelect={onSelect} text={text} />}
      </section>
    </section>
  );
}
'''
rep(old_exam_page, new_exam_page, "uploaded concours ExamPage")

select_marker = '''function SelectField({ disabled, label, onChange, options, value }) {
'''
uploaded_panel = '''function UploadedConcoursSearchPanel({ exam, onSelect, text }) {
  const [wilaya, setWilaya] = useState("");
  const [moughataa, setMoughataa] = useState("");
  const [centre, setCentre] = useState("");
  const [number, setNumber] = useState("");
  const [searching, setSearching] = useState(false);
  const [localError, setLocalError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLocalError("");
    if (![wilaya, moughataa, centre, number].every((value) => cleanText(value))) {
      setLocalError(text.enterQuery);
      return;
    }

    setSearching(true);
    try {
      const params = new URLSearchParams({ source: exam.source, wilaya: wilaya.trim(), moughataa: moughataa.trim(), centre: centre.trim(), number: number.trim() });
      const response = await fetch(`/api/uploaded-concours-search?${params.toString()}`, { headers: { Accept: "application/json" }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
      const students = prepareRowsForExam(exam, data.rows || []);
      if (!students.length) {
        setLocalError(text.notFound);
        return;
      }
      onSelect(students[0]);
    } catch (error) {
      console.error("[MauriResults Uploaded Concours Search Error]", error);
      setLocalError(text.connectionError);
    } finally {
      setSearching(false);
    }
  }

  const fields = [
    { label: text.chooseWilaya || "الولاية", value: wilaya, setValue: setWilaya },
    { label: text.chooseMoughataa || "المقاطعة", value: moughataa, setValue: setMoughataa },
    { label: text.chooseCentre || "المركز", value: centre, setValue: setCentre },
    { label: text.candidateNumber || text.number || "رقم المترشح", value: number, setValue: setNumber, inputMode: "numeric" },
  ];

  return (
    <form className="search-card animate-slide-up" onSubmit={submit}>
      {fields.map((field) => (
        <label className="grid gap-1" key={field.label}>
          <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-400">{field.label}</span>
          <input className="search-input pr-4" disabled={searching} inputMode={field.inputMode} onChange={(event) => field.setValue(event.target.value)} placeholder={field.label} value={field.value} />
        </label>
      ))}
      <button className="tap-button h-12 rounded-[16px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(21,128,61,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(21,128,61,.28)] active:scale-[.98] disabled:cursor-wait disabled:opacity-70" disabled={searching} type="submit">
        {searching ? text.searching : text.searchButton}
      </button>
      {localError && <p className="col-span-full text-center text-xs font-black text-red-600 dark:text-red-300 md:text-start">{localError}</p>}
    </form>
  );
}

''' + select_marker
rep(select_marker, uploaded_panel, "uploaded concours panel")

p.write_text(s, encoding="utf-8")
print("Home phase 3 applied")
