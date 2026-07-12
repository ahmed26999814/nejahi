"use client";

import { useEffect, useMemo, useState } from "react";

type Exam = {
  table_name: string;
  source_key?: string;
  title_ar?: string;
  title_fr?: string;
  year?: string;
  total_rows?: number;
  is_active?: boolean;
  created_at?: string;
};

export default function PublishedResultsManager() {
  const [secret, setSecret] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [workingTable, setWorkingTable] = useState("");
  const [status, setStatus] = useState("جاري تحميل النتائج المنشورة...");

  const activeExams = useMemo(() => exams.filter((exam) => exam.is_active), [exams]);
  const hiddenExams = useMemo(() => exams.filter((exam) => !exam.is_active), [exams]);

  async function load(nextSecret = secret) {
    if (!nextSecret) {
      setStatus("أدخل ADMIN_SECRET في أعلى الصفحة أولًا.");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/published-exams", {
        headers: { "x-admin-secret": nextSecret },
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر تحميل النتائج");
      setExams(data.exams || []);
      setStatus(data.exams?.length ? "يمكنك إزالة أي نتيجة من الموقع أو إعادتها لاحقًا." : "لا توجد نتائج منشورة من لوحة الأدمن.");
    } catch (error) {
      setStatus(`فشل التحميل: ${String(error)}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const stored = localStorage.getItem("mauriresults-admin-secret") || "";
    setSecret(stored);
    void load(stored);
  }, []);

  async function setPublished(exam: Exam, isActive: boolean) {
    const action = isActive ? "إعادة النتيجة إلى الموقع" : "إزالة النتيجة من الموقع";
    if (!isActive && !window.confirm(`هل تريد ${action}؟\n${exam.title_ar || exam.table_name}\n\nلن تُحذف بيانات الجدول.`)) return;

    setWorkingTable(exam.table_name);
    setStatus(`جاري ${action}...`);
    try {
      const response = await fetch("/api/admin/published-exams", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ tableName: exam.table_name, isActive }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `تعذر ${action}`);

      setExams((current) => current.map((item) => item.table_name === exam.table_name ? { ...item, is_active: isActive } : item));
      setStatus(isActive ? "تمت إعادة النتيجة وزرها إلى الموقع." : "تمت إزالة النتيجة وزرها من الموقع، مع الاحتفاظ بالبيانات.");
      window.dispatchEvent(new Event("mauriresults:exams-updated"));
    } catch (error) {
      setStatus(`فشل الإجراء: ${String(error)}`);
    } finally {
      setWorkingTable("");
    }
  }

  function ExamCard({ exam, hidden = false }: { exam: Exam; hidden?: boolean }) {
    const busy = workingTable === exam.table_name;
    return (
      <article className={`published-result-item ${hidden ? "is-hidden" : "is-active"}`}>
        <div className="published-result-main">
          <span className="published-result-status">{hidden ? "مخفية" : "ظاهرة"}</span>
          <strong>{exam.title_ar || exam.table_name}</strong>
          <small>{exam.year || "بدون سنة"} · {(Number(exam.total_rows) || 0).toLocaleString("ar-MR")} نتيجة</small>
          <code>{exam.table_name}</code>
        </div>
        <button
          type="button"
          disabled={busy}
          className={hidden ? "published-result-restore" : "published-result-remove"}
          onClick={() => void setPublished(exam, hidden)}
        >
          {busy ? "جاري التنفيذ..." : hidden ? "إعادة إلى الموقع" : "إزالة من الموقع"}
        </button>
      </article>
    );
  }

  return (
    <section className="published-results-manager" dir="rtl">
      <header className="published-results-header">
        <div>
          <p>إدارة النتائج</p>
          <h2>النتائج المنشورة في الموقع</h2>
          <span>إزالة النتيجة هنا تخفي زرها من الموقع فقط، ولا تحذف جدول البيانات.</span>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading}>تحديث</button>
      </header>

      {loading ? (
        <div className="published-results-empty">جاري التحميل...</div>
      ) : (
        <>
          <div className="published-results-summary">
            <span><strong>{activeExams.length}</strong> ظاهرة</span>
            <span><strong>{hiddenExams.length}</strong> مخفية</span>
          </div>

          <div className="published-results-list">
            {activeExams.map((exam) => <ExamCard exam={exam} key={exam.table_name} />)}
            {!activeExams.length && <div className="published-results-empty">لا توجد نتائج ظاهرة حاليًا.</div>}
          </div>

          {!!hiddenExams.length && (
            <details className="published-results-hidden-list">
              <summary>النتائج المخفية ({hiddenExams.length})</summary>
              <div className="published-results-list">
                {hiddenExams.map((exam) => <ExamCard exam={exam} hidden key={exam.table_name} />)}
              </div>
            </details>
          )}
        </>
      )}

      <p className="published-results-message">{status}</p>
    </section>
  );
}
