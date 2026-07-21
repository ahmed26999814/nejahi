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
    ["الكلية أو المعهد", (program) => program.faculty],
    ["الشعبة", (program) => program.stream],
    ["آخر معدل", (program) => program.lastScore.toFixed(2)],
    ["التصنيف", (program) => STATUS_STYLES[getFit(program, average).key].label],
    ["طريقة القبول", (program) => program.admissionMode],
    ["مكان الدراسة", (program) => program.country],
  ];

  return (
    <section className="rounded-[28px] border border-mauri-green/20 bg-white p-4 shadow-premium dark:border-emerald-300/20 dark:bg-[#0b1c13]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">المقارنة</p>
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            {selected.length} من 3 تخصصات
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 dark:border-white/10 dark:text-slate-200" onClick={shareComparison} type="button">
            <Share2 className="h-4 w-4" /> مشاركة
          </button>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-xs font-black text-slate-600 dark:border-white/10 dark:text-slate-200" onClick={() => window.print()} type="button">
            <Download className="h-4 w-4" /> حفظ PDF
          </button>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-rose-200 px-3 text-xs font-black text-rose-600 dark:border-rose-300/20 dark:text-rose-200" onClick={onClear} type="button">
            <X className="h-4 w-4" /> مسح
          </button>
        </div>
      </div>

      {message && <p className="mt-3 text-xs font-bold text-mauri-green">{message}</p>}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-separate border-spacing-0 overflow-hidden text-right text-sm">
          <thead>
            <tr className="text-xs text-slate-500 dark:text-slate-300">
              <th className="border-b border-slate-200 p-3 dark:border-white/10">العنصر</th>
              {selected.map((program) => (
                <th className="border-b border-slate-200 p-3 dark:border-white/10" key={program.id}>
                  <div className="flex items-start justify-between gap-2">
                    <span>{program.name}</span>
                    <button onClick={() => onRemove(program.id)} type="button" aria-label="إزالة من المقارنة">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="font-bold text-slate-700 dark:text-slate-200">
            {rows.map(([label, getValue]) => (
              <tr key={label}>
                <th className="border-b border-slate-100 p-3 text-xs text-slate-500 dark:border-white/5 dark:text-slate-400">
                  {label}
                </th>
                {selected.map((program) => (
                  <td className="border-b border-slate-100 p-3 dark:border-white/5" key={program.id}>
                    {getValue(program)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
