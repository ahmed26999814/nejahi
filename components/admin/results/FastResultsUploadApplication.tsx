"use client";

import { FormEvent, useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { detectColumnMappings } from "../../../lib/columnMapping";

const SOURCES = [
  { value: "bac", label: "الباكالوريا" },
  { value: "brevet", label: "ابريفه" },
  { value: "concours", label: "الكونكور" },
  { value: "bac_session", label: "الدورة التكميلية" },
  { value: "excellence_1as", label: "الامتياز الأولى إعدادية" },
  { value: "custom", label: "مسابقة جديدة" },
];

const CHUNK_SIZE = 1_000;
const MAX_ROWS = 250_000;
const UPLOAD_REQUEST_TIMEOUT = 55_000;
const PREPARE_REQUEST_TIMEOUT = 255_000;
const PUBLISH_REQUEST_TIMEOUT = 310_000;

type Row = Record<string, unknown>;
type Mapping = {
  number: string; name: string; score: string; decision: string; track: string; wilaya: string;
  moughataa: string; school: string; centre: string; birthPlace: string; birthDate: string;
};
type Status = { kind: "idle" | "working" | "success" | "error"; title: string; detail?: string; percent?: number };
type PublishResponse = { published?: boolean; validation?: { rows?: number; numberLookup?: boolean; lookupRows?: number; cacheWarmed?: boolean } };

function normalizeTableName(value: string) {
  const normalized = String(value || "").trim().toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/_+/g, "_").replace(/^_+|_+$/g, "");
  if (!normalized) return "";
  return /^[a-z_]/.test(normalized) ? normalized : `results_${normalized}`;
}

function normalizeRow(row: Row) {
  const output: Row = {};
  for (const [key, value] of Object.entries(row || {})) {
    const cleanKey = String(key || "").replace(/\u0000/g, "").trim();
    if (!cleanKey || cleanKey.startsWith("__EMPTY")) continue;
    if (value == null) output[cleanKey] = null;
    else if (value instanceof Date) output[cleanKey] = value.toISOString().slice(0, 10);
    else output[cleanKey] = String(value).replace(/\u0000/g, "").trim() || null;
  }
  return output;
}

async function parseFile(file: File) {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [] as Row[], columns: [] as string[], sheetName: "" };
  const raw = XLSX.utils.sheet_to_json<Row>(workbook.Sheets[sheetName], { defval: null, raw: false });
  const rows = raw.map(normalizeRow).filter((row) => Object.values(row).some((value) => value !== null && value !== ""));
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return { rows, columns, sheetName };
}

function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/57014|statement timeout|canceling statement/i.test(message)) {
    return "استغرق تجهيز البحث وقتاً أطول من المهلة. البيانات محفوظة ولم تُنشر؛ اضغط متابعة التجهيز والنشر دون إعادة رفع الملف.";
  }
  if (/failed to fetch|networkerror|load failed/i.test(message)) {
    return "انقطع الاتصال مؤقتاً. البيانات المكتملة محفوظة؛ أعد المحاولة دون إغلاق الصفحة.";
  }
  return message.replace(/\s+/g, " ").slice(0, 700);
}

async function requestJson<T extends Record<string, any> = Record<string, any>>(url: string, init: RequestInit, retries = 0, timeoutMs = UPLOAD_REQUEST_TIMEOUT): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal, cache: "no-store" });
      const text = await response.text();
      let data: Record<string, any> = {};
      try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
      if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
      return data as T;
    } catch (error) {
      lastError = error;
      if (attempt >= retries) break;
      await new Promise((resolve) => window.setTimeout(resolve, 1_200 * (attempt + 1)));
    } finally {
      window.clearTimeout(timer);
    }
  }
  if (lastError instanceof DOMException && lastError.name === "AbortError") {
    throw new Error("انتهت مهلة الطلب بأمان ولم يتم إعلان النجاح");
  }
  throw lastError instanceof Error ? lastError : new Error("تعذر الاتصال بالخادم");
}

function SelectColumn({ label, columns, value, onChange, required }: { label: string; columns: string[]; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <label className="grid gap-1 text-xs font-black text-slate-700"><span>{label}{required ? " *" : ""}</span><select className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)} dir="ltr"><option value="">— غير محدد —</option>{columns.map((column) => <option value={column} key={column}>{column}</option>)}</select></label>;
}

export default function FastResultsUploadApplication() {
  const [secret, setSecret] = useState("");
  const [source, setSource] = useState("bac");
  const [customTable, setCustomTable] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState("");
  const [mapping, setMapping] = useState<Mapping>({ number: "", name: "", score: "", decision: "", track: "", wilaya: "", moughataa: "", school: "", centre: "", birthPlace: "", birthDate: "" });
  const [title, setTitle] = useState("باكالوريا 2026");
  const [year, setYear] = useState("2026");
  const [searchMode, setSearchMode] = useState("simple");
  const [dryRun, setDryRun] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", title: "جاهز" });
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [uploadedTable, setUploadedTable] = useState("");

  useEffect(() => { setSecret(sessionStorage.getItem("mauriresults-admin-secret") || localStorage.getItem("mauriresults-admin-secret") || ""); }, []);
  const isCustom = source === "custom";
  const normalizedYear = /^20\d{2}$/.test(year.trim()) ? year.trim() : "";
  const rawCustomKey = normalizeTableName(customTable).replace(/^results_/, "");
  const duplicateYearSuffix = normalizedYear ? `_${normalizedYear}` : "";
  const customKey = duplicateYearSuffix && rawCustomKey.endsWith(duplicateYearSuffix)
    ? rawCustomKey.slice(0, -duplicateYearSuffix.length)
    : rawCustomKey;
  const sourceKey = isCustom ? customKey : source;
  const targetTable = sourceKey && normalizedYear ? normalizeTableName(`results_${sourceKey}_${normalizedYear}`) : "";
  const canPublish = Boolean(!completed && secret.trim() && file && rows.length && targetTable && mapping.number && mapping.name && mapping.score);
  const canResume = Boolean(uploadedTable && uploadedTable === targetTable);
  const updateMapping = (key: keyof Mapping, value: string) => {
    setMapping((current) => ({ ...current, [key]: value }));
    setCompleted(false);
  };

  async function chooseFile(nextFile: File | null) {
    setFile(nextFile); setRows([]); setColumns([]); setCompleted(false); setUploadedTable("");
    if (!nextFile) return;
    setStatus({ kind: "working", title: "قراءة الملف", detail: "يتم تحليل ملف Excel داخل الجهاز...", percent: 5 });
    try {
      const parsed = await parseFile(nextFile);
      if (!parsed.rows.length) throw new Error("لم يتم العثور على صفوف داخل الملف");
      if (parsed.rows.length > MAX_ROWS) throw new Error(`الحد الأقصى ${MAX_ROWS.toLocaleString("ar-MR")} صف`);
      setRows(parsed.rows); setColumns(parsed.columns); setSheetName(parsed.sheetName);
      setMapping(detectColumnMappings(parsed.columns) as Mapping);
      const detectedYear = `${nextFile.name} ${parsed.sheetName}`.match(/20\d{2}/)?.[0];
      if (detectedYear) { setYear(detectedYear); setTitle((current) => current.replace(/20\d{2}/, detectedYear)); }
      setStatus({ kind: "success", title: "الملف جاهز", detail: `${parsed.rows.length.toLocaleString("ar-MR")} صف و${parsed.columns.length.toLocaleString("ar-MR")} عمود. سيتم رفعه في جدول مستقل ولن يمس أي نتائج سابقة.`, percent: 100 });
    } catch (error) { setStatus({ kind: "error", title: "تعذر قراءة الملف", detail: friendlyError(error) }); }
  }

  async function uploadChunk(chunk: Row[], index: number, total: number, createTable: boolean) {
    await requestJson("/api/admin/results-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret.trim() },
      body: JSON.stringify({ source: "", table: targetTable, rows: chunk, columns, createTable, speedSetup: false, numberColumn: mapping.number, nameColumn: mapping.name, scoreColumn: mapping.score, wilayaColumn: mapping.wilaya, moughataaColumn: mapping.moughataa, centreColumn: mapping.centre, isLastChunk: false, chunkIndex: index + 1, totalChunks: total, fileName: file?.name, sheetName }),
    }, 0, UPLOAD_REQUEST_TIMEOUT);
  }

  async function prepareSpeed() {
    await requestJson("/api/admin/results-prepare", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret.trim() }, body: JSON.stringify({ tableName: targetTable, numberColumn: mapping.number, nameColumn: mapping.name, scoreColumn: mapping.score, wilayaColumn: mapping.wilaya, moughataaColumn: mapping.moughataa, centreColumn: mapping.centre }) }, 0, PREPARE_REQUEST_TIMEOUT);
  }

  async function publishExam() {
    const result = await requestJson<PublishResponse>("/api/admin/publish-exam", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-secret": secret.trim() }, body: JSON.stringify({ tableName: targetTable, sourceKey: `${source}_${year}`, titleAr: title.trim(), titleFr: title.trim(), year: year.trim(), totalRows: rows.length, searchMode, numberColumn: mapping.number, nameColumn: mapping.name, scoreColumn: mapping.score, decisionColumn: mapping.decision, trackColumn: mapping.track, wilayaColumn: mapping.wilaya, moughataaColumn: mapping.moughataa, schoolColumn: mapping.school, centreColumn: mapping.centre, birthPlaceColumn: mapping.birthPlace, birthDateColumn: mapping.birthDate }) }, 0, PUBLISH_REQUEST_TIMEOUT);
    const validation = result.validation;
    if (result.published !== true || Number(validation?.rows) !== rows.length || validation?.numberLookup !== true || Number(validation?.lookupRows || 0) <= 0 || validation?.cacheWarmed !== true) {
      throw new Error("رفض النظام إعلان النجاح لأن التحقق النهائي من الصفوف أو البحث السريع لم يكتمل");
    }
    return result;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!normalizedYear) return setStatus({ kind: "error", title: "السنة غير صحيحة", detail: "اكتب السنة بأربعة أرقام مثل 2026." });
    if (!canPublish) return setStatus({ kind: "error", title: "أكمل الملف والجدول والأعمدة المطلوبة" });
    if (dryRun) return setStatus({ kind: "success", title: "المعاينة صحيحة", detail: `${rows.length.toLocaleString("ar-MR")} صف جاهز. ألغِ وضع المعاينة ثم اضغط نشر.` });

    setLoading(true);
    let dataUploaded = canResume;
    try {
      if (!canResume) {
        const chunks: Row[][] = [];
        for (let index = 0; index < rows.length; index += CHUNK_SIZE) chunks.push(rows.slice(index, index + CHUNK_SIZE));
        setStatus({ kind: "working", title: "إنشاء جدول رفع مستقل", detail: `لن يتم تعديل أي نتائج قديمة. سيتم رفع ${chunks.length.toLocaleString("ar-MR")} دفعة آمنة بالتتابع.`, percent: 1 });

        await uploadChunk(chunks[0], 0, chunks.length, true);
        const firstCompleted = Math.min(CHUNK_SIZE, rows.length);
        setStatus({ kind: "working", title: "رفع النتائج", detail: `تم رفع ${firstCompleted.toLocaleString("ar-MR")} من ${rows.length.toLocaleString("ar-MR")} صف. لا تغلق الصفحة.`, percent: Math.max(2, Math.round((1 / chunks.length) * 84)) });

        for (let index = 1; index < chunks.length; index += 1) {
          await uploadChunk(chunks[index], index, chunks.length, false);
          const completedRows = Math.min((index + 1) * CHUNK_SIZE, rows.length);
          setStatus({ kind: "working", title: "رفع النتائج", detail: `تم رفع ${completedRows.toLocaleString("ar-MR")} من ${rows.length.toLocaleString("ar-MR")} صف. لا تغلق الصفحة.`, percent: Math.max(2, Math.round(((index + 1) / chunks.length) * 84)) });
        }
        dataUploaded = true;
        setUploadedTable(targetTable);
      } else {
        setStatus({ kind: "working", title: "متابعة التجهيز", detail: "الملف مرفوع بالكامل؛ لن تتم إعادة رفع الصفوف.", percent: 86 });
      }

      setStatus({ kind: "working", title: "تجهيز البحث السريع", detail: "إنشاء الفهارس والترتيب. لن يتم النشر إذا لم تنجح هذه الخطوة.", percent: 89 });
      await prepareSpeed();
      setStatus({ kind: "working", title: "التحقق والنشر", detail: "التحقق من عدد الصفوف والبحث والإحصائيات وتسخين الذاكرة المؤقتة...", percent: 95 });
      const result = await publishExam();
      const validation = result.validation!;
      setCompleted(true);
      setUploadedTable("");
      setStatus({ kind: "success", title: "تم النشر والتحقق بنجاح", detail: `تم التحقق من ${Number(validation.rows).toLocaleString("ar-MR")} صف وتجهيز ${Number(validation.lookupRows).toLocaleString("ar-MR")} سجل للبحث السريع، والذاكرة المؤقتة جاهزة للضغط.`, percent: 100 });
      window.dispatchEvent(new Event("mauriresults:exams-updated"));
    } catch (error) {
      const message = friendlyError(error);
      setStatus({ kind: "error", title: dataUploaded ? "البيانات مرفوعة ولم تُنشر" : "توقف الرفع بأمان", detail: dataUploaded ? `${message} لم تظهر النتائج للزوار ولم تتأثر أي نتائج سابقة.` : `${message} لم يتم إعلان النجاح ولم تتأثر أي نتائج سابقة.` });
    } finally { setLoading(false); }
  }

  return <main dir="rtl" className="min-h-screen bg-slate-950 px-3 py-4 text-white"><section className="mx-auto grid max-w-3xl gap-3">
    <header className="rounded-[24px] border border-white/10 bg-white/10 p-4"><p className="text-xs font-black text-emerald-300">MauriResults Admin</p><h1 className="mt-1 text-xl font-black">رفع النتائج الآمن والسريع</h1><p className="mt-2 text-xs font-bold leading-6 text-slate-300">كل ملف يُرفع في جدول مستقل، ولا تُلمس النتائج السابقة ولا يتم النشر قبل نجاح البحث والتحقق النهائي.</p></header>
    <form onSubmit={submit} className="grid gap-3 text-slate-950">
      <section className="grid gap-3 rounded-[22px] bg-white p-4"><h2 className="font-black">1. الملف والمسابقة</h2><input className="min-h-12 rounded-xl border bg-slate-50 px-3" type="password" placeholder="ADMIN_SECRET" value={secret} onChange={(event) => { setSecret(event.target.value); sessionStorage.setItem("mauriresults-admin-secret", event.target.value); localStorage.setItem("mauriresults-admin-secret", event.target.value); }} /><select className="min-h-12 rounded-xl border bg-slate-50 px-3" value={source} onChange={(event) => { const next = event.target.value; setSource(next); setCompleted(false); setUploadedTable(""); setSearchMode(next === "concours" ? "concours" : "simple"); }}>{SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>{isCustom && <input className="min-h-12 rounded-xl border bg-slate-50 px-3" dir="ltr" placeholder="exam_name" value={customTable} onChange={(event) => { setCustomTable(event.target.value); setCompleted(false); setUploadedTable(""); }} />}<input className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-3 text-sm" type="file" accept=".xlsx,.xls" onChange={(event) => void chooseFile(event.target.files?.[0] || null)} />{file && <div className="rounded-xl bg-slate-100 p-3 text-xs font-bold"><strong>{file.name}</strong><span className="mt-1 block">{rows.length.toLocaleString("ar-MR")} صف · {columns.length.toLocaleString("ar-MR")} عمود</span><span className="mt-1 block text-emerald-700">جدول الرفع الآمن: {targetTable || "حدد السنة"}</span></div>}</section>
      <section className="grid gap-3 rounded-[22px] bg-white p-4"><div className="flex justify-between"><h2 className="font-black">2. الأعمدة</h2><button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black" onClick={() => setShowAdvanced((value) => !value)}>{showAdvanced ? "إخفاء" : "أعمدة إضافية"}</button></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><SelectColumn required label="رقم المترشح" columns={columns} value={mapping.number} onChange={(value) => updateMapping("number", value)} /><SelectColumn required label="الاسم" columns={columns} value={mapping.name} onChange={(value) => updateMapping("name", value)} /><SelectColumn required label="المعدل/المجموع" columns={columns} value={mapping.score} onChange={(value) => updateMapping("score", value)} /><SelectColumn label="القرار" columns={columns} value={mapping.decision} onChange={(value) => updateMapping("decision", value)} /><SelectColumn label="الشعبة" columns={columns} value={mapping.track} onChange={(value) => updateMapping("track", value)} /><SelectColumn label="الولاية" columns={columns} value={mapping.wilaya} onChange={(value) => updateMapping("wilaya", value)} />{showAdvanced && <><SelectColumn label="المقاطعة" columns={columns} value={mapping.moughataa} onChange={(value) => updateMapping("moughataa", value)} /><SelectColumn label="المؤسسة" columns={columns} value={mapping.school} onChange={(value) => updateMapping("school", value)} /><SelectColumn label="المركز" columns={columns} value={mapping.centre} onChange={(value) => updateMapping("centre", value)} /><SelectColumn label="مكان الميلاد" columns={columns} value={mapping.birthPlace} onChange={(value) => updateMapping("birthPlace", value)} /><SelectColumn label="تاريخ الميلاد" columns={columns} value={mapping.birthDate} onChange={(value) => updateMapping("birthDate", value)} /></>}</div></section>
      <section className="grid gap-3 rounded-[22px] bg-white p-4"><h2 className="font-black">3. النشر</h2><input className="min-h-12 rounded-xl border bg-slate-50 px-3" value={title} onChange={(event) => { setTitle(event.target.value); setCompleted(false); }} /><input className="min-h-12 rounded-xl border bg-slate-50 px-3" dir="ltr" value={year} onChange={(event) => { setYear(event.target.value); setCompleted(false); setUploadedTable(""); }} /><select className="min-h-12 rounded-xl border bg-slate-50 px-3" value={searchMode} onChange={(event) => setSearchMode(event.target.value)}><option value="simple">بحث سريع برقم المترشح</option><option value="concours">كونكور: ولاية ← مقاطعة ← مركز ← رقم</option></select><label className="flex items-center gap-3 rounded-xl bg-amber-50 p-3 text-sm font-black"><input type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} />فحص الملف قبل الرفع</label><div className={`rounded-xl p-3 ${status.kind === "error" ? "bg-red-50" : status.kind === "success" ? "bg-emerald-50" : "bg-slate-100"}`}><strong>{status.title}</strong>{status.detail && <p className="mt-1 text-xs leading-5">{status.detail}</p>}{typeof status.percent === "number" && <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-600 transition-[width] duration-300" style={{ width: `${Math.min(100, Math.max(0, status.percent))}%` }} /></div>}</div><button disabled={!canPublish || loading} className="min-h-14 rounded-xl bg-emerald-600 text-lg font-black text-white disabled:opacity-50">{loading ? "جاري الرفع والتحقق..." : completed ? "تم النشر بنجاح" : dryRun ? "فحص الملف" : canResume ? "متابعة التجهيز والنشر" : "رفع ونشر النتائج"}</button></section>
    </form>
  </section></main>;
}
