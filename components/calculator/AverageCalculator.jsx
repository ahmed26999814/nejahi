"use client";

import { useMemo, useState } from "react";

const TRACKS = {
  SN: {
    label: "شعبة العلوم الطبيعية",
    short: "Bac D",
    subjects: [
      ["العلوم الطبيعية", 8], ["الفيزياء والكيمياء", 7], ["الرياضيات", 6],
      ["العربية", 3], ["الفرنسية", 3], ["الإنجليزية", 2],
      ["التربية الإسلامية", 2], ["الرياضة البدنية", 1],
    ],
  },
  M: {
    label: "شعبة الرياضيات",
    short: "Bac C",
    subjects: [
      ["الرياضيات", 9], ["الفيزياء والكيمياء", 8], ["العلوم الطبيعية", 4],
      ["العربية", 3], ["الفرنسية", 3], ["الإنجليزية", 2],
      ["التربية الإسلامية", 2], ["الرياضة البدنية", 1],
    ],
  },
  LO: {
    label: "شعبة الآداب العصرية",
    short: "Bac A",
    subjects: [
      ["العربية", 6], ["الفلسفة", 6], ["الفرنسية", 6],
      ["التاريخ والجغرافيا", 5], ["الإنجليزية", 4], ["الرياضيات", 2],
      ["التربية الإسلامية", 2], ["الرياضة البدنية", 1],
    ],
  },
  LM: {
    label: "شعبة الآداب الأصلية",
    short: "Bac O",
    subjects: [
      ["التشريع الإسلامي", 7], ["العربية", 7], ["الفكر الإسلامي", 6],
      ["التاريخ والجغرافيا", 4], ["القرآن والحديث", 3], ["الفرنسية", 2],
      ["الرياضيات", 2], ["الرياضة البدنية", 1],
    ],
  },
  BREVET: {
    label: "شهادة ختم الدروس الإعدادية",
    short: "أبريفه",
    subjects: [
      ["الرياضيات", 5], ["العربية", 3], ["الفرنسية", 2], ["العلوم", 2],
      ["الفيزياء والكيمياء", 2], ["التربية الإسلامية", 2], ["التربية المدنية", 1],
      ["الإنجليزية", 1], ["التاريخ والجغرافيا", 1], ["الرياضة البدنية", 1],
    ],
  },
};

function CalculatorIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="4" y="2.5" width="16" height="19" rx="3" />
      <path d="M8 6.5h8M8 11h1M12 11h1M16 11h1M8 15h1M12 15h1M16 15h1M8 18h1M12 18h5" />
    </svg>
  );
}

function getDecision(track, average) {
  if (track === "BREVET") {
    if (average >= 8.5) {
      return {
        tone: "success",
        label: "ناجح",
        detail: "معدلك يساوي أو يتجاوز 8.50 من 20.",
      };
    }
    if (average >= 7) {
      return {
        tone: "warning",
        label: "متجاوز غير ناجح",
        detail: "معدلك بين 7.00 و8.49 من 20.",
      };
    }
    return {
      tone: "danger",
      label: "غير ناجح",
      detail: "معدلك أقل من 7.00 من 20.",
    };
  }

  if (average >= 10) {
    return {
      tone: "success",
      label: "ناجح",
      detail: "معدلك يساوي أو يتجاوز 10 من 20.",
    };
  }
  if (average >= 8) {
    return {
      tone: "warning",
      label: "دورة تكميلية",
      detail: "معدلك بين 8.00 و9.99 من 20، لذلك أنت في الدورة التكميلية.",
    };
  }
  return {
    tone: "danger",
    label: "غير ناجح",
    detail: "معدلك أقل من 8.00 من 20.",
  };
}

export default function AverageCalculator() {
  const [track, setTrack] = useState("SN");
  const [scores, setScores] = useState({});
  const [skipSport, setSkipSport] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const selected = TRACKS[track];

  const calculation = useMemo(() => {
    let weighted = 0;
    let coefficientTotal = 0;
    let filled = 0;

    selected.subjects.forEach(([subject, coefficient]) => {
      if (skipSport && subject === "الرياضة البدنية") return;
      const raw = scores[subject];
      if (raw === "" || raw == null) return;
      const value = Number(raw);
      if (!Number.isFinite(value)) return;
      weighted += Math.min(20, Math.max(0, value)) * coefficient;
      coefficientTotal += coefficient;
      filled += 1;
    });

    return {
      average: coefficientTotal ? weighted / coefficientTotal : 0,
      coefficientTotal,
      filled,
      expected: selected.subjects.length - (skipSport ? 1 : 0),
    };
  }, [scores, selected, skipSport]);

  const decision = getDecision(track, calculation.average);

  function changeTrack(next) {
    setTrack(next);
    setScores({});
    setShowResult(false);
    setSkipSport(false);
  }

  function updateScore(subject, value) {
    if (value === "") {
      setScores((current) => ({ ...current, [subject]: "" }));
      setShowResult(false);
      return;
    }
    const number = Math.min(20, Math.max(0, Number(value)));
    setScores((current) => ({ ...current, [subject]: Number.isFinite(number) ? String(number) : "" }));
    setShowResult(false);
  }

  return (
    <main className="average-calculator-page" dir="rtl">
      <section className="average-calculator-shell">
        <header className="calculator-heading">
          <span className="calculator-heading-icon"><CalculatorIcon /></span>
          <div>
            <p>MauriResults</p>
            <h1>حاسبة المعدل</h1>
            <span>أدخل درجاتك من 20 وسنحسب المعدل والقرار حسب معاملات الشعبة.</span>
          </div>
        </header>

        <nav className="calculator-track-tabs" aria-label="اختيار الشعبة">
          {Object.entries(TRACKS).map(([key, item]) => (
            <button
              key={key}
              type="button"
              className={track === key ? "is-active" : ""}
              onClick={() => changeTrack(key)}
            >
              <strong>{item.short}</strong>
              <small>{key === "BREVET" ? "" : key}</small>
            </button>
          ))}
        </nav>

        <section className="calculator-card">
          <div className="calculator-card-title">
            <div>
              <span>الشعبة المختارة</span>
              <h2>{selected.label}</h2>
            </div>
            <strong>{selected.subjects.reduce((sum, [, coefficient]) => sum + coefficient, 0)} معامل</strong>
          </div>

          <div className="calculator-table-head" aria-hidden="true">
            <span>المادة</span><span>المعامل</span><span>النتيجة</span>
          </div>

          <div className="calculator-subjects">
            {selected.subjects.map(([subject, coefficient]) => {
              const sportDisabled = skipSport && subject === "الرياضة البدنية";
              return (
                <label className={`calculator-subject-row ${sportDisabled ? "is-disabled" : ""}`} key={subject}>
                  <span className="calculator-subject-name">{subject}</span>
                  <span className="calculator-coefficient">× {coefficient}</span>
                  <span className="calculator-score-field">
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="20"
                      step="0.25"
                      placeholder="0"
                      value={scores[subject] ?? ""}
                      disabled={sportDisabled}
                      onChange={(event) => updateScore(subject, event.target.value)}
                      aria-label={`نتيجة ${subject}`}
                    />
                    <em>/20</em>
                  </span>
                </label>
              );
            })}
          </div>

          <label className="calculator-sport-option">
            <span>
              <strong>لم أحضر الرياضة البدنية</strong>
              <small>سيتم حذف معامل الرياضة من الحساب.</small>
            </span>
            <input type="checkbox" checked={skipSport} onChange={(event) => { setSkipSport(event.target.checked); setShowResult(false); }} />
          </label>

          <button className="calculator-submit" type="button" onClick={() => setShowResult(true)} disabled={!calculation.filled}>
            <CalculatorIcon />
            احسب المعدل
          </button>

          {showResult && (
            <section className={`calculator-result ${decision.tone}`} aria-live="polite">
              <span>معدلك المحسوب</span>
              <strong>{calculation.average.toFixed(2)}</strong>
              <div className="calculator-decision-label">{decision.label}</div>
              <p className="calculator-decision-detail">{decision.detail}</p>
              <small>
                تم الحساب من {calculation.filled} مادة بمعامل إجمالي {calculation.coefficientTotal}.
                {calculation.filled < calculation.expected ? " المواد الفارغة لم تدخل في الحساب." : ""}
              </small>
            </section>
          )}
        </section>

        <p className="calculator-note">هذه الحاسبة مساعدة للتقدير فقط. تأكد من المعاملات والقرارات المعتمدة رسميًا عند صدور أي تحديث.</p>
        <a href="/" className="calculator-home-link">العودة إلى النتائج</a>
      </section>
    </main>
  );
}
