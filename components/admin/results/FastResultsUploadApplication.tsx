"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { detectColumnMappings } from "../../../lib/columnMapping";

const SOURCES = [
  { value: "bac", label: "الباكالوريا", table: "bac_results" },
  { value: "brevet", label: "أبريفه", table: "brevet_results" },
  { value: "concours", label: "الكونكور", table: "concours_results" },
  { value: "bac_session", label: "الدورة التكميلية", table: "bac_session2_results" },
  { value: "excellence_1as", label: "الامتياز الأولى إعدادية", table: "excellence_1as_results" },
  { value: "custom", label: "مسابقة جديدة", table: "" },
];

const CHUNK_SIZE = 2_000;
const CONCURRENCY = 3;
const MAX_ROWS = 250_000;

type Row = Record<string, unknown>;
type Mapping = {
  number: string;
  name: string;
  score: string;
  decision: string;
  track: string;
  wilaya: string;
  moughataa: string;
  school: string;
  centre: string;
  birthPlace: string;
  birthDate: string;
};

type Status = {
  kind: "idle" | "working" | "success" | "error";
  title: string;
  detail?: string;
  percent?: number;
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

function normalizeRow(row: Row) {
  const output: Row = {};
  for (const [key, value] of Object.entries(row || {})) {
    const cleanKey = String(key || "").replace(/\u0000/g, "").trim();
    if (!cleanKey || cleanKey.startsWith("__EMPTY")) continue;
    output[cleanKey] = cleanCell(value);
  }
  return output;
}

function splitRows(rows: Row[]) {
  const chunks: Row[][] = [];
  for (let index = 0; index < rows.length; index += CHUNK_SIZE) chunks.push(rows.slice(index, index + CHUNK_SIZE));
  return chunks;
}

async function parseFile(file: File) {
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [] as Row[], columns: [] as string[], sheetName: "" };
  const raw = XLSX.utils.sheet_to_json<Row>(workbook.Sheets[sheetName], { defval: null, raw: false });
  const rows = raw.map(normalizeRow).filter((row) => Object.values(row).some((value) => value !== null && value !== ""));
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  return { rows, columns, sheetName };
}

async function readResponse(response: Response) {
  const text = await response.text();
  let data: Record<string, any> = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { error: text }; }
  if (!response.ok || data.ok === false) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

async function runPool<T>(items: T[], worker: (item: T, index: number) => Promise<void>, concurrency = CONCURRENCY) {
  let cursor = 0;
  async function runner() {
    while (cursor < items.length) {
      const index = cursor++;
      await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => runner()));
}

function SelectColumn({ label, columns, value, onChange, required }: { label: string; columns: string[]; value: string; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="grid gap-1 text-xs font-black text-slate-700">
      <span>{label}{required ? " *" : ""}</span>
      <select className="min-h-12 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500" value={value} onChange={(event) => onChange(event.target.value)} dir="ltr">
        <option value="">— غير محدد —</option>
        {columns.map((column) => <option value={column} key={column}>{column}</option>)}
      </select>
    </label>
  );
}

export default function FastResultsUploadApplication() {
  const [secret, setSecret] = useState("");
  const [source, setSource] = useState("custom");
  const [customTable, setCustomTable] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [sheetName, setSheetName] = useState("");
  const [mapping, setMapping] = useState<Mapping>({ number: "", name: "", score: "", decision: "", track: "", wilaya: "", moughataa: "", school: "", centre: "", birthPlace: "", birthDate: "" });
  const [title, setTitle] = useState("نتائج باكالوريا 2026");
  const [year, setYear] = useState("2026");
  const [searchMode, setSearchMode] = useState("simple");
  const [dryRun, setDryRun] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle", title: "جاهز" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSecret(localStorage.getItem("mauriresults-admin-secret") || "");
  }, []);

  const selectedSource = useMemo(() => SOURCES.find((item) => item.value === source), [source]);
  const targetTable = source === "custom" ? normalizeTableName(customTable) : selectedSource?.table || "";
  const isCustom = source === "custom";
  const canPublish = Boolean(secret.trim() && file && rows.length && targetTable && mapping.number && mapping.name && mapping.score);

  function updateMapping(key: keyof Mapping, value: string) {
    setMapping((current) => ({ ...current, [key]: value }));
  }

  async function chooseFile(nextFile: File | null) {
    setFile(nextFile);
    setRows([]);
    setColumns([]);
    if (!nextFile) return;
    setStatus({ kind: "working", title: "قراءة الملف", detail: "يتم تحليل ملف Excel داخل الهاتف...", percent: 5 });
    try {
      const parsed = await parseFile(nextFile);
      if (!parsed.rows.length) throw new Error("لم يتم العثور على صفوف داخل الملف.");
      if (parsed.rows.length > MAX_ROWS) throw new Error(`الحد الأقصى ${MAX_ROWS.toLocaleString("ar-MR")} صف.`);
      const detected = detectColumnMappings(parsed.columns);
      setRows(parsed.rows);
      setColumns(parsed.columns);
      setSheetName(parsed.sheetName);
      setMapping(detected as Mapping);
      const detectedYear = `${nextFile.name} ${parsed.sheetName}`.match(/20\d{2}/)?.[0];
      if (detectedYear) {
        setYear(detectedYear);
        setTitle((current) => current.replace(/20\d{2}/, detectedYear));
      }
      setStatus({ kind: "success", title: "الملف جاهز", detail: `${parsed.rows.length.toLocaleString("ar-MR")} صف و${parsed.columns.length.toLocaleString("ar-MR")} عمود`, percent: 100 });
    } catch (error) {
      setStatus({ kind: "error", title: "تعذر قراءة الملف", detail: String(error) });
    }
  }

  async function uploadChunk(chunk: Row[], index: number, total: number, createTable: boolean) {
    const response = await fetch("/api/admin/results-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret.trim() },
      body: JSON.stringify({
        source: isCustom ? "" : source,
        table: isCustom ? targetTable : "",
        rows: chunk,
        columns,
        createTable,
        speedSetup: false,
        numberColumn: mapping.number,
        nameColumn: mapping.name,
        scoreColumn: mapping.score,
        wilayaColumn: mapping.wilaya,
        moughataaColumn: mapping.moughataa,
        centreColumn: mapping.centre,
        isLastChunk: false,
        chunkIndex: index + 1,
        totalChunks: total,
        fileName: file?.name,
        sheetName,
      }),
    });
    await readResponse(response);
  }

  async function prepareSpeed() {
    const response = await fetch("/api/admin/results-prepare", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret.trim() },
      body: JSON.stringify({
        tableName: targetTable,
        numberColumn: mapping.number,
        nameColumn: mapping.name,
        scoreColumn: mapping.score,
        wilayaColumn: mapping.wilaya,
        moughataaColumn: mapping.moughataa,
        centreColumn: mapping.centre,
      }),
    });
    await readResponse(response);
  }

  async function publishExam() {
    const response = await fetch("/api/admin/publish-exam", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": secret.trim() },
      body: JSON.stringify({
        tableName: targetTable,
        titleAr: title.trim(),
        titleFr: title.trim(),
        year: year.trim(),
        totalRows: rows.length,
        searchMode,
        numberColumn: mapping.number,
        nameColumn: mapping.name,
        scoreColumn: mapping.score,
        decisionColumn: mapping.decision,
        trackColumn: mapping.track,
        wilayaColumn: mapping.wilaya,
        moughataaColumn: mapping.moughataa,
        schoolColumn: mapping.school,
        centreColumn: mapping.centre,
        birthPlaceColumn: mapping.birthPlace,
        birthDateColumn: mapping.birthDate,
      }),
    });
    await readResponse(response);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!secret.trim()) return setStatus({ kind: "error", title: "أدخل ADMIN_SECRET" });
    if (!file || !rows.length) return setStatus({ kind: "error", title: "اختر ملف Excel أولًا" });
    if (!targetTable) return setStatus({ kind: "error", title: "حدد اسم الجدول" });
    if (!mapping.number || !mapping.name || !mapping.score) return setStatus({ kind: "error", title: "حدد أعمدة الرقم والاسم والمعدل" });

    if (dryRun) {
      setStatus({ kind: "success", title: "المعاينة صحيحة", detail: `${rows.length.toLocaleString("ar-MR")} صف جاهز للنشر. ألغِ وضع المعاينة ثم اضغط نشر.` });
      return;
    }

    setLoading(true);
    try {
      const chunks = splitRows(rows);
      let completed = 0;
      setStatus({ kind: "working", title: "بدء الرفع السريع", detail: `${chunks.length} دفعة، حتى ${CONCURRENCY} دفعات بالتوازي`, percent: 1 });

      let remaining = chunks;
      if (isCustom) {
        await uploadChunk(chunks[0], 0, chunks.length, true);
        completed = 1;
        remaining = chunks.slice(1);
        setStatus({ kind: "working", title: "تم إنشاء الجدول", detail: `تم رفع ${Math.min(rows.length, CHUNK_SIZE).toLocaleString("ar-MR")} صف`, percent: Math.round((completed / chunks.length) * 82) });
      }

      await runPool(remaining, async (chunk, localIndex) => {
        const absoluteIndex = isCustom ? localIndex + 1 : localIndex;
        await uploadChunk(chunk, absoluteIndex, chunks.length, false);
        completed += 1;
        setStatus({
          kind: "working",
          title: "رفع النتائج",
          detail: `تم رفع ${Math.min(completed * CHUNK_SIZE, rows.length).toLocaleString("ar-MR")} من ${rows.length.toLocaleString("ar-MR")} صف`,
          percent: Math.max(2, Math.round((completed / chunks.length) * 82)),
        });
      });

      setStatus({ kind: "working", title: "تجهيز سرعة البحث", detail: "إنشاء الفهارس وترتيب النتائج...", percent: 88 });
      await prepareSpeed();

      setStatus({ kind: "working", title: "إظهار المسابقة في الموقع", detail: "التحقق والنشر النهائي...", percent: 95 });
      await publishExam();

      setStatus({ kind: "success", title: "تم النشر بنجاح", detail: `ظهرت ${title} في الموقع، وتم رفع ${rows.length.toLocaleString("ar-MR")} صف.`, percent: 100 });
      window.dispatchEvent(new Event("mauriresults:exams-updated"));
    } catch (error) {
      setStatus({ kind: "error", title: "توقف الرفع", detail: String(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main dir="rtl" className="min-h-screen bg-slate-950 px-3 py-4 text-white">
      <section className="mx-auto grid max-w-3xl gap-3">
        <header className="rounded-[24px] border border-white/10 bg-white/10 p-4">
          <p className="text-xs font-black text-emerald-300">MauriResults Admin</p>
          <h1 className="mt-1 text-xl font-black">رفع سريع للنتائج</h1>
          <p className="mt-2 text-xs font-bold leading-6 text-slate-300">يرفع حتى 3 دفعات بالتوازي، ثم يجهز سرعة البحث وينشر المسابقة مباشرة.</p>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-black text-emerald-100">
            <span className="rounded-xl bg-black/20 p-2">{CHUNK_SIZE.toLocaleString("ar-MR")} صف/دفعة</span>
            <span className="rounded-xl bg-black/20 p-2">{CONCURRENCY} دفعات معًا</span>
            <span className="rounded-xl bg-black/20 p-2">حتى {MAX_ROWS.toLocaleString("ar-MR")}</span>
          </div>
        </header>

        <form onSubmit={submit} className="grid gap-3 text-slate-950">
          <section className="grid gap-3 rounded-[22px] bg-white p-4">
            <h2 className="text-base font-black">1. الملف والمسابقة</h2>
            <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3" type="password" placeholder="ADMIN_SECRET" value={secret} onChange={(event) => { setSecret(event.target.value); localStorage.setItem("mauriresults-admin-secret", event.target.value); }} />
            <div className="grid gap-2 sm:grid-cols-2">
              <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3" value={source} onChange={(event) => { const next = event.target.value; setSource(next); setSearchMode(next === "concours" ? "concours" : "simple"); }}>
                {SOURCES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
              {isCustom && <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left" dir="ltr" placeholder="bac_2026_results" value={customTable} onChange={(event) => setCustomTable(event.target.value)} />}
            </div>
            <input className="rounded-xl border border-dashed border-emerald-300 bg-emerald-50 p-3 text-sm file:ml-2 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:font-black file:text-white" type="file" accept=".xlsx,.xls" onChange={(event) => void chooseFile(event.target.files?.[0] || null)} />
            {file && <div className="rounded-xl bg-slate-100 p-3 text-xs font-bold text-slate-600"><strong className="text-slate-950">{file.name}</strong><span className="mt-1 block">{rows.length.toLocaleString("ar-MR")} صف · {columns.length.toLocaleString("ar-MR")} عمود · الورقة: {sheetName || "الأولى"}</span></div>}
          </section>

          <section className="grid gap-3 rounded-[22px] bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-black">2. الأعمدة</h2>
              <button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-black" onClick={() => setShowAdvanced((value) => !value)}>{showAdvanced ? "إخفاء التفاصيل" : "أعمدة إضافية"}</button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <SelectColumn required label="رقم المترشح" columns={columns} value={mapping.number} onChange={(value) => updateMapping("number", value)} />
              <SelectColumn required label="الاسم" columns={columns} value={mapping.name} onChange={(value) => updateMapping("name", value)} />
              <SelectColumn required label="المعدل/المجموع" columns={columns} value={mapping.score} onChange={(value) => updateMapping("score", value)} />
              <SelectColumn label="القرار" columns={columns} value={mapping.decision} onChange={(value) => updateMapping("decision", value)} />
              <SelectColumn label="الشعبة" columns={columns} value={mapping.track} onChange={(value) => updateMapping("track", value)} />
              <SelectColumn label="الولاية" columns={columns} value={mapping.wilaya} onChange={(value) => updateMapping("wilaya", value)} />
              {showAdvanced && <>
                <SelectColumn label="المقاطعة" columns={columns} value={mapping.moughataa} onChange={(value) => updateMapping("moughataa", value)} />
                <SelectColumn label="المؤسسة" columns={columns} value={mapping.school} onChange={(value) => updateMapping("school", value)} />
                <SelectColumn label="المركز" columns={columns} value={mapping.centre} onChange={(value) => updateMapping("centre", value)} />
                <SelectColumn label="مكان الميلاد" columns={columns} value={mapping.birthPlace} onChange={(value) => updateMapping("birthPlace", value)} />
                <SelectColumn label="تاريخ الميلاد" columns={columns} value={mapping.birthDate} onChange={(value) => updateMapping("birthDate", value)} />
              </>}
            </div>
          </section>

          <section className="grid gap-3 rounded-[22px] bg-white p-4">
            <h2 className="text-base font-black">3. النشر</h2>
            <div className="grid gap-2 sm:grid-cols-[1fr_.35fr]">
              <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3" placeholder="اسم المسابقة في الموقع" value={title} onChange={(event) => setTitle(event.target.value)} />
              <input className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 text-left" dir="ltr" placeholder="2026" value={year} onChange={(event) => setYear(event.target.value)} />
            </div>
            <select className="min-h-12 rounded-xl border border-slate-200 bg-slate-50 px-3" value={searchMode} onChange={(event) => setSearchMode(event.target.value)}>
              <option value="simple">بحث عادي: رقم أو اسم</option>
              <option value="concours">كونكور: ولاية ← مقاطعة ← مركز ← رقم</option>
            </select>
            <label className="flex items-center justify-between gap-3 rounded-xl bg-amber-50 p-3 text-sm font-black text-amber-950"><span>وضع المعاينة أولًا<span className="block text-xs font-bold text-amber-700">ألغِه بعد التأكد من الأعمدة.</span></span><input className="h-6 w-6" type="checkbox" checked={dryRun} onChange={(event) => setDryRun(event.target.checked)} /></label>
            <div className={`rounded-xl p-3 text-sm font-bold ${status.kind === "error" ? "bg-red-50 text-red-800" : status.kind === "success" ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>
              <strong className="block">{status.title}</strong>
              {status.detail && <span className="mt-1 block text-xs leading-5">{status.detail}</span>}
              {typeof status.percent === "number" && <div className="mt-2 h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${status.percent}%` }} /></div>}
            </div>
            <button disabled={loading || (!dryRun && !canPublish)} className="min-h-14 rounded-xl bg-emerald-600 px-5 text-base font-black text-white shadow-lg shadow-emerald-600/20 disabled:opacity-50" type="submit">{loading ? "جاري الرفع السريع..." : dryRun ? "معاينة الملف" : "رفع ونشر الآن"}</button>
          </section>
        </form>
      </section>
    </main>
  );
}
