"use client";

import { Download, Share2, X } from "lucide-react";
import { useState } from "react";
import { orientationPrograms } from "../../data/orientation-programs";
import { getFit, STATUS_STYLES } from "./orientation-utils";

export default function OrientationComparePanel({ average, compareIds, onClear, onRemove }) {
  const selected = compareIds
    .map((id) => orientationPrograms.find((program) => program.id === id))
    .filter(Boolean);
  const [message, setMessage] = useState("");

  if (!selected.length) return null;

  async function shareComparison() {
    const lines = selected.map(
      (program, index) =>
        `${index + 1}. ${program.name} — ${program.institution} — آخر معدل ${program.lastScore.toFixed(2)}`,
    );
    const text = `مقارنة تخصصات MauriResults\n${lines.join("\n")}\nالمعدلات مرجعية وليست ضماناً للقبول.`;
    try {
      if (navigator.share) await navigator.share({ title: "مقارنة تخصصات", text });
      else await navigator.clipboard.writeText(text);
      setMessage("تم تجهيز المقارنة للمشاركة.");
    } catch {
      setMessage("");
    }
  }

  const rows = [
    ["المؤسسة", (program) => program.institution],
    ["الكلية", (program) => program.faculty],
    ["آخر معدل", (program) => program.lastScore.toFixed(2)],
    ["الفرصة", (program) => STATUS_STYLES[getFit(program, average).key].label],
    ["مكان الدراسة", (program) => program.country],
  ];

  return (
    <section className="w-full min-w-0 overflow-hidden rounded-[24px] border border-mauri-green/20 bg-white p-4 shadow-soft dark:border-emerald-300/20 dark:bg-[#0b1c13]">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">مقارنة التخصصات</h2>
          <p className="mt-0.5 text-sm font-bold text-slate-500 dark:text-slate-300">{selected.length} من 3</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-600 dark:border-white/10 dark:text-slate-200" onClick={shareComparison} type="button">
            <Share2 className="h-4 w-4" /> مشاركة
          </button>
          <button className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-600 dark:border-white/10 dark:text-slate-200" onClick={() => window.print()} type="button">
            <Download className="h-4 w-4" /> PDF
          </button>
          <button className="grid h-9 w-9 place-items-center rounded-xl border border-rose-200 text-rose-600 dark:border-rose-300/20 dark:text-rose-200" onClick={onClear} type="button" aria-label="مسح المقارنة">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {message && <p className="mt-3 text-sm font-bold text-mauri-green">{message}</p>}

      <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-3">
        {selected.map((program) => (
          <article className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-white/5" key={program.id}>
            <div className="flex min-w-0 items-start justify-between gap-2">
              <h3 className="min-w-0 text-base font-black leading-6 text-slate-950 dark:text-white">{program.name}</h3>
              <button className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-slate-500 dark:bg-white/10 dark:text-slate-200" onClick={() => onRemove(program.id)} type="button" aria-label="إزالة من المقارنة">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-3 grid gap-2">
              {rows.map(([label, getValue]) => (
                <div className="grid min-w-0 grid-cols-[88px_1fr] gap-2 text-sm" key={label}>
                  <dt className="font-bold text-slate-400">{label}</dt>
                  <dd className="min-w-0 font-black text-slate-700 dark:text-slate-200">{getValue(program)}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
