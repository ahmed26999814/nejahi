"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const SOURCES = [
  { value: "bac", label: "الباكالوريا", table: "bac_results" },
  { value: "brevet", label: "البريفيه", table: "brevet_results" },
  { value: "concours", label: "الكونكور", table: "concours_results" },
  { value: "bac_session", label: "الدورة التكميلية", table: "bac_session2_results" },
  { value: "excellence_1as", label: "الامتياز الأولى إعدادية", table: "excellence_1as_results" },
  { value: "custom", label: "مسابقة جديدة / جدول مخصص", table: "" },
];

type UploadResult = {
  ok?: boolean;
  dryRun?: boolean;
  createTable?: boolean;
  tableCreated?: boolean;
  speedSetup?: boolean;
  speedResult?: unknown;
  speedError?: string;
  table?: string;
  fileName?: string;
  sheetName?: string;
  totalRows?: number;
  inserted?: number;
  columns?: string[];
  previewRows?: Record<string, unknown>[];
  message?: string;
  error?: string;
  hint?: string;
  warning?: boolean;
};

export default function ResultsUploadAdminPage() {
  const [secret, setSecret] = useState("");
  const [source, setSource] = useState("custom");
  const [customTable, setCustomTable] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [numberColumn, setNumberColumn] = useState("");
  const [nameColumn, setNameColumn] = useState("");
  const [scoreColumn, setScoreColumn] = useState("");
  const [speedSetup, setSpeedSetup] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [createTable, setCreateTable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  useEffect(() => {
    setSecret(localStorage.getItem("mauriresults-admin-secret") || "");
  }, []);

  const selectedSource = useMemo(() => SOURCES.find((item) => item.value === source), [source]);
  const targetTable = source === "custom" ? customTable.trim() : selectedSource?.table || "";
  const isCustom = source === "custom";

  function saveSecret(value: string) {
    setSecret(value);
    localStorage.setItem("mauriresults-admin-secret", value);
  }

  function setSuggestedColumns(columns: string[] = []) {
    if (!columns.length) return;
    const findColumn = (patterns: RegExp[]) => columns.find((column) => patterns.some((pattern) => pattern.test(column))) || "";
    if (!numberColumn) setNumberColumn(findColumn([/numero/i, /num/i, /nodos/i, /doss/i, /رقم/i]));
    if (!nameColumn) setNameColumn(findColumn([/^nom/i, /name/i, /اسم/i]));
    if (!scoreColumn) setScoreColumn(findColumn([/moy/i, /mod/i, /mg/i, /total/i, /score/i, /معدل/i, /مجموع/i]));
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!secret.trim()) {
      setResult({ ok: false, error: "أدخل ADMIN_SECRET أولًا." });
      return;
    }
    if (!file) {
      setResult({ ok: false, error: "اختر ملف XLSX من الهاتف." });
      return;
    }
    if (!targetTable) {
      setResult({ ok: false, error: "اكتب اسم جدول Supabase للمسابقة الجديدة." });
      return;
    }

    const form = new FormData();
    form.set("file", file);
    form.set("source", isCustom ? "" : source);
    form.set("table", isCustom ? customTable.trim() : "");
    form.set("sheetName", sheetName.trim());
    form.set("dryRun", dryRun ? "true" : "false");
    form.set("createTable", isCustom && createTable ? "true" : "false");
    form.set("speedSetup", speedSetup ? "true" : "false");
    form.set("numberColumn", numberColumn.trim());
    form.set("nameColumn", nameColumn.trim());
    form.set("scoreColumn", scoreColumn.trim());

    setLoading(true);
    try {
      const response = await fetch("/api/admin/results-upload", {
        method: "POST",
        headers: { "x-admin-secret": secret.trim() },
        body: form,
      });
      const data = await response.json();
      setResult(data);
      if (data?.columns?.length) setSuggestedColumns(data.columns);
    } catch (error) {
      setResult({ ok: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-5 text-white">
      <section className="mx-auto grid max-w-2xl gap-4">
        <header className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-black text-emerald-300">MauriResults Admin</p>
          <h1 className="mt-1 text-2xl font-black">نشر نتائج XLSX من الهاتف</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-300">
            ارفع ملف Excel، راجع المعاينة أولًا، ثم ألغِ وضع المعاينة واضغط نشر النتائج.
          </p>
        </header>

        <form onSubmit={submitUpload} className="grid gap-3 rounded-[28px] border border-white/10 bg-white p-4 text-slate-950 shadow-2xl">
          <label className="grid gap-1 text-sm font-black">
            ADMIN_SECRET
            <input
              value={secret}
              onChange={(event) => saveSecret(event.target.value)}
              placeholder="أدخل سر الأدمن"
              type="password"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-emerald-500"
            />
          </label>

          <label className="grid gap-1 text-sm font-black">
            المسابقة
            <select
              value={source}
              onChange={(event) => {
                setSource(event.target.value);
                if (event.target.value === "custom") setCreateTable(true);
              }}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-emerald-500"
            >
              {SOURCES.map((item) => (
                <option value={item.value} key={item.value}>{item.label}</option>
              ))}
            </select>
          </label>

          {isCustom && (
            <label className="grid gap-1 text-sm font-black">
              اسم جدول Supabase للمسابقة الجديدة
              <input
                value={customTable}
                onChange={(event) => setCustomTable(event.target.value)}
                placeholder="مثال: probatoire_2026_results"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-base outline-none focus:border-emerald-500"
                dir="ltr"
              />
              <span className="text-xs font-bold text-slate-500">يمكن إنشاء الجدول تلقائيًا عند النشر بعد تشغيل SQL الخاص بهذه الميزة.</span>
            </label>
          )}

          <label className="grid gap-1 text-sm font-black">
            اسم الورقة داخل Excel اختياري
            <input
              value={sheetName}
              onChange={(event) => setSheetName(event.target.value)}
              placeholder="اتركه فارغًا لاستخدام أول ورقة"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-emerald-500"
            />
          </label>

          <label className="grid gap-1 text-sm font-black">
            ملف النتائج XLSX
            <input
              accept=".xlsx,.xls"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              type="file"
              className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm file:ml-3 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-black file:text-white"
            />
          </label>

          {isCustom && (
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-950">
              <span>
                إنشاء الجدول تلقائيًا عند النشر
                <span className="block text-xs font-bold text-emerald-700">مفيد عند صدور مسابقة جديدة وملف XLSX فقط.</span>
              </span>
              <input checked={createTable} onChange={(event) => setCreateTable(event.target.checked)} type="checkbox" className="h-6 w-6" />
            </label>
          )}

          <section className="grid gap-3 rounded-2xl bg-slate-50 p-4">
            <label className="flex items-center justify-between gap-3 text-sm font-black">
              <span>
                تجهيز السرعة تلقائيًا
                <span className="block text-xs font-bold text-slate-500">ينشئ فهارس و View للترتيب حتى تظهر النتائج الجديدة بسرعة.</span>
              </span>
              <input checked={speedSetup} onChange={(event) => setSpeedSetup(event.target.checked)} type="checkbox" className="h-6 w-6" />
            </label>

            <div className="grid gap-2 sm:grid-cols-3">
              <label className="grid gap-1 text-xs font-black">
                عمود رقم المترشح
                <input value={numberColumn} onChange={(event) => setNumberColumn(event.target.value)} placeholder="Numero" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left outline-none focus:border-emerald-500" dir="ltr" />
              </label>
              <label className="grid gap-1 text-xs font-black">
                عمود الاسم
                <input value={nameColumn} onChange={(event) => setNameColumn(event.target.value)} placeholder="NOM" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left outline-none focus:border-emerald-500" dir="ltr" />
              </label>
              <label className="grid gap-1 text-xs font-black">
                عمود المعدل/المجموع
                <input value={scoreColumn} onChange={(event) => setScoreColumn(event.target.value)} placeholder="MOD أو TOTAL" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left outline-none focus:border-emerald-500" dir="ltr" />
              </label>
            </div>
            <p className="text-xs font-bold text-slate-500">بعد المعاينة، ستظهر الأعمدة. اكتب أسماءها كما هي تمامًا قبل النشر.</p>
          </section>

          <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black">
            <span>
              وضع المعاينة فقط
              <span className="block text-xs font-bold text-slate-500">أبقِه مفعّلًا أول مرة حتى تتأكد من الأعمدة وعدد الصفوف.</span>
            </span>
            <input checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} type="checkbox" className="h-6 w-6" />
          </label>

          <div className="rounded-2xl bg-slate-100 p-3 text-xs font-bold text-slate-600">
            الهدف الحالي: <span dir="ltr" className="font-black text-slate-950">{targetTable || "غير محدد"}</span>
            {isCustom && createTable && <span className="mt-1 block text-emerald-700">سيحاول النظام إنشاء هذا الجدول عند النشر.</span>}
            {speedSetup && <span className="mt-1 block text-emerald-700">سيتم تجهيز فهارس السرعة و Ranked View بعد رفع النتائج.</span>}
          </div>

          <button
            disabled={loading}
            type="submit"
            className="rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/25 disabled:opacity-60"
          >
            {loading ? "جاري المعالجة..." : dryRun ? "معاينة الملف" : "نشر النتائج الآن"}
          </button>
        </form>

        {result && (
          <section className={`rounded-[28px] border p-4 shadow-2xl ${result.ok ? "border-emerald-300/30 bg-emerald-950/70" : "border-red-300/30 bg-red-950/70"}`}>
            <h2 className="text-lg font-black">{result.ok ? "تمت العملية" : "حدث خطأ"}</h2>
            {result.error && <p className="mt-2 rounded-2xl bg-black/20 p-3 text-sm font-bold text-red-100">{result.error}</p>}
            {result.speedError && <p className="mt-2 rounded-2xl bg-yellow-400/10 p-3 text-sm font-bold text-yellow-100">تحذير السرعة: {result.speedError}</p>}
            {result.hint && <p className="mt-2 rounded-2xl bg-yellow-400/10 p-3 text-sm font-bold text-yellow-100">{result.hint}</p>}
            {result.message && <p className="mt-2 text-sm font-bold text-slate-200">{result.message}</p>}
            <div className="mt-3 grid gap-2 text-sm font-bold text-slate-200">
              {result.table && <p>الجدول: <span dir="ltr" className="font-black text-white">{result.table}</span></p>}
              {result.fileName && <p>الملف: {result.fileName}</p>}
              {result.sheetName && <p>الورقة: {result.sheetName}</p>}
              {typeof result.totalRows === "number" && <p>عدد الصفوف: {result.totalRows.toLocaleString("ar-MR")}</p>}
              {typeof result.inserted === "number" && <p>تم نشر: {result.inserted.toLocaleString("ar-MR")} صف</p>}
              {result.tableCreated && <p>تم إنشاء الجدول تلقائيًا.</p>}
              {result.speedSetup && <p>تم تجهيز السرعة أو محاولة تجهيزها.</p>}
              {result.columns?.length ? <p>الأعمدة: <span className="text-xs">{result.columns.join("، ")}</span></p> : null}
            </div>

            {result.previewRows?.length ? (
              <div className="mt-4 overflow-x-auto rounded-2xl bg-black/20 p-3" dir="ltr">
                <pre className="text-xs leading-6 text-slate-100">{JSON.stringify(result.previewRows, null, 2)}</pre>
              </div>
            ) : null}
          </section>
        )}
      </section>
    </main>
  );
}
