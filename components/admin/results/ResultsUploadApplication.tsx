"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";

const SOURCES = [
  { value: "bac", label: "الباكالوريا", table: "bac_results" },
  { value: "brevet", label: "البريفيه", table: "brevet_results" },
  { value: "concours", label: "الكونكور", table: "concours_results" },
  { value: "bac_session", label: "الدورة التكميلية", table: "bac_session2_results" },
  { value: "excellence_1as", label: "الامتياز الأولى إعدادية", table: "excellence_1as_results" },
  { value: "custom", label: "مسابقة جديدة / جدول مخصص", table: "" },
];

const CLIENT_CHUNK_SIZE = 1500;
const MAX_ROWS = 250_000;

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
  progress?: string;
  progressPercent?: number;
  published?: boolean;
  publishError?: string;
};

type ParsedXlsx = {
  sheetName: string;
  rows: Record<string, unknown>[];
  columns: string[];
};

function normalizeTableName(value: string) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!normalized) return "";
  return /^[a-z_]/.test(normalized) ? normalized : `results_${normalized}`;
}

function cleanCell(value: unknown) {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "boolean") return value;
  const text = String(value).replace(/\u0000/g, "").trim();
  return text === "" ? null : text;
}

function cleanColumnName(value: unknown) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

function normalizeRow(row: Record<string, unknown>) {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row || {})) {
    const cleanKey = cleanColumnName(key);
    if (!cleanKey || cleanKey.startsWith("__EMPTY")) continue;
    output[cleanKey] = cleanCell(value);
  }
  return output;
}

function inferColumns(rows: Record<string, unknown>[]) {
  return Array.from(new Set(rows.flatMap((row) => Object.keys(row || {})).map(cleanColumnName).filter(Boolean)));
}

async function yieldToBrowser() {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

async function parseXlsxFile(file: File, requestedSheetName?: string): Promise<ParsedXlsx> {
  await yieldToBrowser();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true, dense: false });
  const sheetName = requestedSheetName && workbook.SheetNames.includes(requestedSheetName)
    ? requestedSheetName
    : workbook.SheetNames[0];

  if (!sheetName) return { sheetName: "", rows: [], columns: [] };

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: false });
  await yieldToBrowser();

  const rows = rawRows
    .map(normalizeRow)
    .filter((row) => Object.values(row).some((value) => value !== null && value !== ""));

  return { sheetName, rows, columns: inferColumns(rows) };
}

function chunkRows(rows: Record<string, unknown>[], size = CLIENT_CHUNK_SIZE) {
  const chunks: Record<string, unknown>[][] = [];
  for (let index = 0; index < rows.length; index += size) chunks.push(rows.slice(index, index + size));
  return chunks;
}

async function readJsonOrText(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, error: text.replace(/\s+/g, " ").slice(0, 500) };
  }
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1 text-sm font-black">
      <span>{label}</span>
      {children}
      {hint && <span className="text-xs font-bold leading-5 text-slate-500">{hint}</span>}
    </label>
  );
}

function StepCard({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-600 text-sm font-black text-white">{number}</span>
        <h2 className="text-base font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ColumnField({ columns, label, value, onChange, placeholder }: { columns: string[]; label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return <Field label={label}>{columns.length ? (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left outline-none focus:border-emerald-500" dir="ltr">
      <option value="">— غير محدد —</option>
      {value && !columns.includes(value) && <option value={value}>{value}</option>}
      {columns.map((column) => <option value={column} key={column}>{column}</option>)}
    </select>
  ) : <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-left outline-none focus:border-emerald-500" dir="ltr" />}</Field>;
}

export default function ResultsUploadAdminPage() {
  const [secret, setSecret] = useState("");
  const [source, setSource] = useState("custom");
  const [customTable, setCustomTable] = useState("");
  const [sheetName, setSheetName] = useState("");
  const [searchMode, setSearchMode] = useState("simple");
  const [numberColumn, setNumberColumn] = useState("");
  const [nameColumn, setNameColumn] = useState("");
  const [scoreColumn, setScoreColumn] = useState("");
  const [decisionColumn, setDecisionColumn] = useState("");
  const [trackColumn, setTrackColumn] = useState("");
  const [wilayaColumn, setWilayaColumn] = useState("");
  const [moughataaColumn, setMoughataaColumn] = useState("");
  const [schoolColumn, setSchoolColumn] = useState("");
  const [centreColumn, setCentreColumn] = useState("");
  const [birthPlaceColumn, setBirthPlaceColumn] = useState("");
  const [birthDateColumn, setBirthDateColumn] = useState("");
  const [speedSetup, setSpeedSetup] = useState(true);
  const [publishToSite, setPublishToSite] = useState(true);
  const [publicTitle, setPublicTitle] = useState("نتائج باكالوريا 2026");
  const [publicYear, setPublicYear] = useState("2026");
  const [file, setFile] = useState<File | null>(null);
  const [dryRun, setDryRun] = useState(true);
  const [createTable, setCreateTable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState("جاهز");
  const [result, setResult] = useState<UploadResult | null>(null);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    setSecret(localStorage.getItem("mauriresults-admin-secret") || "");
  }, []);

  const selectedSource = useMemo(() => SOURCES.find((item) => item.value === source), [source]);
  const normalizedCustomTable = normalizeTableName(customTable);
  const targetTable = source === "custom" ? normalizedCustomTable : selectedSource?.table || "";
  const isCustom = source === "custom";
  const isConcoursMode = searchMode === "concours";
  const uploadModeNote = isConcoursMode
    ? "سيُحفظ هذا الرفع ككونكور: الولاية → المقاطعة → المركز → رقم المترشح."
    : "بحث سريع بالرقم أو الاسم، مناسب للباك والبريفيه وباقي النتائج العادية.";

  function saveSecret(value: string) {
    setSecret(value);
    localStorage.setItem("mauriresults-admin-secret", value);
  }

  function inputClass() {
    return "rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none focus:border-emerald-500";
  }

  function smallInputClass() {
    return "rounded-xl border border-slate-200 bg-white px-3 py-2 text-left outline-none focus:border-emerald-500";
  }

  function setSuggestedColumns(columns: string[] = []) {
    if (!columns.length) return;
    const findColumn = (patterns: RegExp[]) => columns.find((column) => patterns.some((pattern) => pattern.test(column))) || "";
    if (!numberColumn) setNumberColumn(findColumn([/num_bac/i, /numero/i, /num/i, /nodos/i, /doss/i, /رقم/i]));
    if (!nameColumn) setNameColumn(findColumn([/nom_ar/i, /^nom/i, /name/i, /اسم/i]));
    if (!scoreColumn) setScoreColumn(findColumn([/moy_bac/i, /moy/i, /mod/i, /mg/i, /total/i, /score/i, /معدل/i, /مجموع/i]));
    if (!decisionColumn) setDecisionColumn(findColumn([/decision/i, /kr/i, /قرار/i]));
    if (!trackColumn) setTrackColumn(findColumn([/^serie$/i, /serie_ar/i, /ts/i, /type/i, /شعبة/i]));
    if (!wilayaColumn) setWilayaColumn(findColumn([/wilaya_ar/i, /wilaya/i, /^wl$/i, /ولاية/i]));
    if (!moughataaColumn) setMoughataaColumn(findColumn([/moughataa_ar/i, /moughataa/i, /مقاطعة/i]));
    if (!schoolColumn) setSchoolColumn(findColumn([/etablissement_ar/i, /ecole/i, /^ms$/i, /مدرسة/i, /مؤسسة/i]));
    if (!centreColumn) setCentreColumn(findColumn([/centre examen ar/i, /centre/i, /مركز/i]));
    if (!birthPlaceColumn) setBirthPlaceColumn(findColumn([/lieu/i, /lieun/i, /مكان/i]));
    if (!birthDateColumn) setBirthDateColumn(findColumn([/date/i, /datn/i, /annee/i, /تاريخ/i, /ميلاد/i]));
  }

  async function handleFileSelection(nextFile: File | null) {
    setFile(nextFile);
    setDetectedColumns([]);
    setPreviewRows([]);
    if (!nextFile) return;
    setPhase("قراءة رؤوس الأعمدة");
    try {
      const parsed = await parseXlsxFile(nextFile, sheetName.trim());
      setDetectedColumns(parsed.columns);
      setPreviewRows(parsed.rows.slice(0, 5));
      setSuggestedColumns(parsed.columns);
      const detectedYear = [publicTitle, nextFile.name, parsed.sheetName].join(" ").match(/20\d{2}/)?.[0];
      if (detectedYear) setPublicYear(detectedYear);
      if (/wilaya|moughataa|centre|ولاية|مقاطعة|مركز/i.test(parsed.columns.join(" "))) setSearchMode("concours");
      setPhase("تم اكتشاف الأعمدة");
    } catch (error) {
      setResult({ ok: false, error: `تعذر تحليل الملف: ${String(error)}` });
    }
  }

  async function publishExam(totalRows: number) {
    const response = await fetch("/api/admin/publish-exam", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": secret.trim(),
      },
      body: JSON.stringify({
        tableName: targetTable,
        titleAr: publicTitle.trim() || `نتائج ${targetTable}`,
        titleFr: publicTitle.trim() || `Résultats ${targetTable}`,
        year: publicYear.trim() || "2026",
        totalRows,
        searchMode,
        numberColumn: numberColumn.trim(),
        nameColumn: nameColumn.trim(),
        scoreColumn: scoreColumn.trim(),
        decisionColumn: decisionColumn.trim(),
        trackColumn: trackColumn.trim(),
        wilayaColumn: wilayaColumn.trim(),
        moughataaColumn: moughataaColumn.trim(),
        schoolColumn: schoolColumn.trim(),
        centreColumn: centreColumn.trim(),
        birthPlaceColumn: birthPlaceColumn.trim(),
        birthDateColumn: birthDateColumn.trim(),
      }),
    });
    const data = await readJsonOrText(response) as UploadResult;
    if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  }

  async function submitUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!secret.trim()) return setResult({ ok: false, error: "أدخل ADMIN_SECRET أولًا." });
    if (!file) return setResult({ ok: false, error: "اختر ملف XLSX من الهاتف." });
    if (!targetTable) return setResult({ ok: false, error: "اكتب اسم جدول Supabase للمسابقة الجديدة." });

    setLoading(true);
    try {
      setPhase("قراءة ملف Excel داخل الهاتف");
      setResult({ ok: true, progress: "جاري قراءة الملف. في الملفات الكبيرة قد يأخذ هذا بعض الوقت." });
      const parsed = await parseXlsxFile(file, sheetName.trim());
      const rows = parsed.rows;
      const columns = parsed.columns;
      setDetectedColumns(columns);
      setPreviewRows(rows.slice(0, 5));
      setSuggestedColumns(columns);

      if (!rows.length) return setResult({ ok: false, error: "لم يتم العثور على صفوف داخل ملف Excel." });
      if (rows.length > MAX_ROWS) return setResult({ ok: false, error: `الملف كبير جدًا. الحد الأقصى ${MAX_ROWS.toLocaleString("ar-MR")} صف.` });

      if (dryRun) {
        setPhase("معاينة جاهزة");
        setResult({
          ok: true,
          dryRun: true,
          createTable: isCustom && createTable,
          speedSetup,
          table: targetTable,
          fileName: file.name,
          sheetName: parsed.sheetName,
          totalRows: rows.length,
          columns,
          previewRows: rows.slice(0, 5),
          message: "تمت قراءة الملف. راجع الأعمدة ثم ألغِ وضع المعاينة للنشر والظهور في الموقع.",
        });
        return;
      }

      const chunks = chunkRows(rows);
      let inserted = 0;
      let tableCreated = false;
      let lastResponse: UploadResult = {};

      for (let index = 0; index < chunks.length; index += 1) {
        const isFirstChunk = index === 0;
        const isLastChunk = index === chunks.length - 1;
        const progressPercent = Math.max(1, Math.round((inserted / rows.length) * 100));
        setPhase(`رفع الدفعة ${index + 1} / ${chunks.length}`);
        setResult({ ok: true, table: targetTable, fileName: file.name, sheetName: parsed.sheetName, totalRows: rows.length, inserted, columns, progressPercent, progress: `تم رفع ${inserted.toLocaleString("ar-MR")} من ${rows.length.toLocaleString("ar-MR")} صف` });

        const response = await fetch("/api/admin/results-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-secret": secret.trim() },
          body: JSON.stringify({
            source: isCustom ? "" : source,
            table: isCustom ? targetTable : "",
            rows: chunks[index],
            columns,
            createTable: isCustom && createTable && isFirstChunk,
            speedSetup: speedSetup && isLastChunk,
            numberColumn: numberColumn.trim(),
            nameColumn: nameColumn.trim(),
            scoreColumn: scoreColumn.trim(),
            wilayaColumn: wilayaColumn.trim(),
            moughataaColumn: moughataaColumn.trim(),
            centreColumn: centreColumn.trim(),
            isLastChunk,
            chunkIndex: index + 1,
            totalChunks: chunks.length,
            fileName: file.name,
            sheetName: parsed.sheetName,
          }),
        });

        const data = await readJsonOrText(response) as UploadResult;
        if (!response.ok || data.ok === false) {
          setResult({ ok: false, table: targetTable, fileName: file.name, sheetName: parsed.sheetName, inserted, columns, error: data.error || `HTTP ${response.status}`, hint: data.hint });
          return;
        }

        inserted += Number(data.inserted || chunks[index].length);
        tableCreated = tableCreated || Boolean(data.tableCreated);
        lastResponse = data;
        if (index % 3 === 0) await yieldToBrowser();
      }

      let published = false;
      let publishError = "";
      if (publishToSite) {
        setPhase("نشر زر المسابقة في الموقع");
        try {
          await publishExam(rows.length);
          published = true;
        } catch (error) {
          publishError = String(error);
        }
      }

      setPhase("اكتمل");
      setResult({
        ok: true,
        dryRun: false,
        createTable: isCustom && createTable,
        tableCreated,
        table: targetTable,
        fileName: file.name,
        sheetName: parsed.sheetName,
        totalRows: rows.length,
        inserted,
        columns,
        speedSetup,
        speedResult: lastResponse.speedResult,
        speedError: lastResponse.speedError,
        hint: lastResponse.hint,
        warning: lastResponse.warning || Boolean(publishError),
        published,
        publishError,
        progressPercent: 100,
        message: published
          ? "تم رفع النتائج وتجهيز السرعة ونشر زرها في الموقع."
          : publishError
            ? "تم رفع النتائج وتجهيز السرعة لكن نشرها في الموقع فشل. تأكد من SQL published_exams ثم أعد المحاولة."
            : "تم نشر النتائج على دفعات وتجهيز السرعة بنجاح.",
      });
    } catch (error) {
      setResult({ ok: false, error: String(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-4 py-5 text-white">
      <section className="mx-auto grid max-w-3xl gap-4">
        <header className="rounded-[28px] border border-white/10 bg-white/10 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-black text-emerald-300">MauriResults Admin</p>
          <h1 className="mt-1 text-2xl font-black">نشر نتائج XLSX من الهاتف</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-slate-300">الواجهة منظمة للسرعة: معاينة أولًا، رفع على دفعات كبيرة، ثم فهارس تلقائية حتى لا يحدث لاغ وقت الضغط.</p>
          <div className="mt-4 grid gap-2 text-xs font-black text-emerald-100 sm:grid-cols-3">
            <span className="rounded-2xl bg-black/20 p-3">دفعة الرفع: {CLIENT_CHUNK_SIZE.toLocaleString("ar-MR")} صف</span>
            <span className="rounded-2xl bg-black/20 p-3">الحد الأقصى: {MAX_ROWS.toLocaleString("ar-MR")} صف</span>
            <span className="rounded-2xl bg-black/20 p-3">الحالة: {phase}</span>
          </div>
        </header>

        <form onSubmit={submitUpload} className="grid gap-4 text-slate-950">
          <StepCard number="1" title="الدخول والملف">
            <Field label="ADMIN_SECRET"><input value={secret} onChange={(event) => saveSecret(event.target.value)} placeholder="أدخل سر الأدمن" type="password" className={inputClass()} /></Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="المسابقة"><select value={source} onChange={(event) => { setSource(event.target.value); if (event.target.value === "custom") setCreateTable(true); }} className={inputClass()}>{SOURCES.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></Field>
              <Field label="اسم الورقة داخل Excel" hint="اتركه فارغًا لاستخدام أول ورقة."><input value={sheetName} onChange={(event) => setSheetName(event.target.value)} placeholder="اختياري" className={inputClass()} /></Field>
            </div>
            {isCustom && <Field label="اسم جدول Supabase للمسابقة الجديدة" hint="مثال: bac_2026_results أو concours_2026_results"><input value={customTable} onChange={(event) => setCustomTable(event.target.value)} placeholder="bac_2026_results" className={`${inputClass()} text-left`} dir="ltr" />{customTable && normalizedCustomTable !== customTable.trim() && <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700" dir="ltr">سيستخدم: {normalizedCustomTable}</span>}</Field>}
            <Field label="ملف النتائج XLSX"><input accept=".xlsx,.xls" onChange={(event) => void handleFileSelection(event.target.files?.[0] || null)} type="file" className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm file:ml-3 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-black file:text-white" /></Field>
            {detectedColumns.length > 0 && <div className="rounded-2xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800">تم اكتشاف {detectedColumns.length} عمودًا: <span dir="ltr">{detectedColumns.join("، ")}</span></div>}
          </StepCard>

          <StepCard number="2" title="طريقة البحث والسرعة">
            <Field label="طريقة البحث" hint={uploadModeNote}>
              <select value={searchMode} onChange={(event) => setSearchMode(event.target.value)} className={inputClass()}>
                <option value="simple">عادي: رقم أو اسم</option>
                <option value="concours">كونكور: ولاية → مقاطعة → مركز → رقم</option>
              </select>
            </Field>
            {isCustom && <label className="flex items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-950"><span>إنشاء الجدول تلقائيًا عند النشر<span className="block text-xs font-bold text-emerald-700">مفيد عند صدور مسابقة جديدة وملف XLSX فقط.</span></span><input checked={createTable} onChange={(event) => setCreateTable(event.target.checked)} type="checkbox" className="h-6 w-6" /></label>}
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black"><span>تجهيز السرعة تلقائيًا<span className="block text-xs font-bold text-slate-500">ينشئ Indexes و Ranked View بعد آخر دفعة.</span></span><input checked={speedSetup} onChange={(event) => setSpeedSetup(event.target.checked)} type="checkbox" className="h-6 w-6" /></label>
            <div className="grid gap-2 sm:grid-cols-3">
              <ColumnField columns={detectedColumns} label="عمود رقم المترشح *" value={numberColumn} onChange={setNumberColumn} placeholder="Num_Bac" />
              <ColumnField columns={detectedColumns} label="عمود الاسم *" value={nameColumn} onChange={setNameColumn} placeholder="NOM_AR" />
              <ColumnField columns={detectedColumns} label="عمود المعدل/المجموع *" value={scoreColumn} onChange={setScoreColumn} placeholder="Moy_Bac" />
              <ColumnField columns={detectedColumns} label="عمود القرار" value={decisionColumn} onChange={setDecisionColumn} placeholder="Decision" />
              <ColumnField columns={detectedColumns} label="عمود الشعبة" value={trackColumn} onChange={setTrackColumn} placeholder="SERIE" />
              <ColumnField columns={detectedColumns} label="عمود الولاية" value={wilayaColumn} onChange={setWilayaColumn} placeholder="Wilaya_AR" />
              {isConcoursMode && <ColumnField columns={detectedColumns} label="عمود المقاطعة" value={moughataaColumn} onChange={setMoughataaColumn} placeholder="Moughataa_AR" />}
              <ColumnField columns={detectedColumns} label="عمود المؤسسة" value={schoolColumn} onChange={setSchoolColumn} placeholder="Etablissement_AR" />
              <ColumnField columns={detectedColumns} label="عمود المركز" value={centreColumn} onChange={setCentreColumn} placeholder="Centre Examen AR" />
              <ColumnField columns={detectedColumns} label="مكان الميلاد" value={birthPlaceColumn} onChange={setBirthPlaceColumn} placeholder="Lieun_AR" />
              <ColumnField columns={detectedColumns} label="تاريخ/سنة الميلاد" value={birthDateColumn} onChange={setBirthDateColumn} placeholder="Date Naiss" />
            </div>
            {detectedColumns.length > 0 && (!numberColumn || !nameColumn || !scoreColumn) && <p className="rounded-2xl bg-red-50 p-3 text-sm font-black text-red-700">يجب تحديد أعمدة رقم المترشح والاسم والمعدل قبل النشر.</p>}
            {previewRows.length > 0 && <div className="max-h-64 overflow-auto rounded-2xl bg-slate-950 p-3 text-xs text-slate-100" dir="ltr"><pre>{JSON.stringify(previewRows, null, 2)}</pre></div>}
          </StepCard>

          <StepCard number="3" title="النشر في الموقع">
            <section className="grid gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-950">
              <label className="flex items-center justify-between gap-3 text-sm font-black"><span>إظهار النتائج في الموقع مباشرة<span className="block text-xs font-bold text-emerald-700">بعد اكتمال الرفع سيظهر زر المسابقة في سنة 2026 أو السنة التي تختارها.</span></span><input checked={publishToSite} onChange={(event) => setPublishToSite(event.target.checked)} type="checkbox" className="h-6 w-6" /></label>
              <div className="grid gap-2 sm:grid-cols-[1fr_.35fr]">
                <Field label="اسم الزر في الموقع"><input value={publicTitle} onChange={(event) => setPublicTitle(event.target.value)} placeholder="نتائج باكالوريا 2026" className={inputClass()} /></Field>
                <Field label="السنة"><input value={publicYear} onChange={(event) => setPublicYear(event.target.value)} placeholder="2026" className={`${inputClass()} text-left`} dir="ltr" /></Field>
              </div>
            </section>
            <label className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-4 text-sm font-black"><span>وضع المعاينة فقط<span className="block text-xs font-bold text-slate-500">أبقِه مفعّلًا أول مرة حتى تتأكد من الأعمدة وعدد الصفوف.</span></span><input checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} type="checkbox" className="h-6 w-6" /></label>
            <div className="rounded-2xl bg-slate-100 p-3 text-xs font-bold text-slate-600">الهدف الحالي: <span dir="ltr" className="font-black text-slate-950">{targetTable || "غير محدد"}</span>{isCustom && createTable && <span className="mt-1 block text-emerald-700">سيتم إنشاء الجدول تلقائيًا.</span>}{speedSetup && <span className="mt-1 block text-emerald-700">سيتم تجهيز فهارس السرعة بعد الرفع.</span>}{publishToSite && <span className="mt-1 block text-emerald-700">سيتم نشر زر المسابقة تلقائيًا.</span>}</div>
            <button disabled={loading || (!dryRun && (!numberColumn || !nameColumn || !scoreColumn))} type="submit" className="rounded-2xl bg-emerald-600 px-5 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/25 disabled:opacity-60">{loading ? "جاري المعالجة..." : dryRun ? "معاينة الملف" : "نشر النتائج الآن"}</button>
          </StepCard>
        </form>

        {result && <section className={`rounded-[28px] border p-4 shadow-2xl ${result.ok ? "border-emerald-300/30 bg-emerald-950/70" : "border-red-300/30 bg-red-950/70"}`}><h2 className="text-lg font-black">{result.ok ? "تمت العملية" : "حدث خطأ"}</h2>{typeof result.progressPercent === "number" && <div className="mt-3 h-3 overflow-hidden rounded-full bg-black/30"><div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${Math.min(100, Math.max(0, result.progressPercent))}%` }} /></div>}{result.progress && <p className="mt-2 rounded-2xl bg-black/20 p-3 text-sm font-bold text-emerald-100">{result.progress}</p>}{result.error && <p className="mt-2 rounded-2xl bg-black/20 p-3 text-sm font-bold text-red-100">{result.error}</p>}{result.speedError && <p className="mt-2 rounded-2xl bg-yellow-400/10 p-3 text-sm font-bold text-yellow-100">تحذير السرعة: {result.speedError}</p>}{result.publishError && <p className="mt-2 rounded-2xl bg-yellow-400/10 p-3 text-sm font-bold text-yellow-100">تحذير النشر في الموقع: {result.publishError}</p>}{result.hint && <p className="mt-2 rounded-2xl bg-yellow-400/10 p-3 text-sm font-bold text-yellow-100">{result.hint}</p>}{result.message && <p className="mt-2 text-sm font-bold text-slate-200">{result.message}</p>}<div className="mt-3 grid gap-2 text-sm font-bold text-slate-200">{result.table && <p>الجدول: <span dir="ltr" className="font-black text-white">{result.table}</span></p>}{result.fileName && <p>الملف: {result.fileName}</p>}{result.sheetName && <p>الورقة: {result.sheetName}</p>}{typeof result.totalRows === "number" && <p>عدد الصفوف: {result.totalRows.toLocaleString("ar-MR")}</p>}{typeof result.inserted === "number" && <p>تم نشر: {result.inserted.toLocaleString("ar-MR")} صف</p>}{result.tableCreated && <p>تم إنشاء الجدول تلقائيًا.</p>}{result.speedSetup && <p>تم تجهيز السرعة أو محاولة تجهيزها.</p>}{result.published && <p>تم إظهار زر المسابقة في الموقع.</p>}{result.columns?.length ? <p>الأعمدة: <span className="text-xs">{result.columns.join("، ")}</span></p> : null}</div>{result.previewRows?.length ? <div className="mt-4 overflow-x-auto rounded-2xl bg-black/20 p-3" dir="ltr"><pre className="text-xs leading-6 text-slate-100">{JSON.stringify(result.previewRows, null, 2)}</pre></div> : null}</section>}
      </section>
    </main>
  );
}
