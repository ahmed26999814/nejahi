import type { Exam, Language, ResultRow } from "../types";

export const TRACK_LABELS: Record<string, { ar: string; fr: string }> = {
  SN: { ar: "العلوم الطبيعية", fr: "Sciences naturelles" },
  M: { ar: "الرياضيات", fr: "Mathématiques" },
  LO: { ar: "الآداب الأصلية", fr: "Lettres originelles" },
  LM: { ar: "الآداب العصرية", fr: "Lettres modernes" },
};

export function isBacExam(exam: Exam): boolean {
  const identity = `${exam.source_key} ${exam.table_name} ${exam.title_ar} ${exam.title_fr}`.toLowerCase();
  return /bac|baccalaur|باكالوريا/.test(identity);
}

export function isNoTrackExam(exam: Exam): boolean {
  const identity = `${exam.source_key} ${exam.table_name} ${exam.title_ar} ${exam.title_fr}`.toLowerCase();
  return /concours|كونكور|bepc|brevet|بريف|أبريفه|ابريفه/.test(identity);
}

function value(row: ResultRow, key?: string | null): unknown {
  if (!key) return undefined;
  return row[key];
}

export function getPrimaryFields(exam: Exam, row: ResultRow) {
  const rank = row.rank ?? row.Rank ?? row.rang ?? row.RANG;
  const trackRaw = isNoTrackExam(exam) ? undefined : value(row, exam.track_column);
  return {
    name: value(row, exam.name_column) ?? row.NOM ?? row.Nom ?? row.name ?? row.NOM_AR ?? row.NOM_FR,
    number: value(row, exam.number_column) ?? row.Numero ?? row.NODOSS ?? row.id,
    score: value(row, exam.score_column) ?? row.MOD ?? row.MOYBAC ?? row.Moyenne_Bepc ?? row.TOTAL ?? row.total_num,
    decision: value(row, exam.decision_column) ?? row.Decision ?? row.decision ?? row.kr ?? row.TYPE,
    track: trackRaw,
    wilaya: value(row, exam.wilaya_column) ?? row.WILAYA ?? row.WILAYA_AR ?? row.Wilaya_AR ?? row.wl,
    moughataa: value(row, exam.moughataa_column) ?? row.MOUGHATAA_AR ?? row.moughataa,
    school: value(row, exam.school_column) ?? row.Ecole ?? row.Etablissement ?? row.ms,
    centre: value(row, exam.centre_column) ?? row.Centre ?? row.centre,
    birthPlace: value(row, exam.birth_place_column) ?? row.LIEU_NAIS ?? row.birthPlace,
    birthDate: value(row, exam.birth_date_column) ?? row.DATE_NAISS ?? row.DATN ?? row.birthDate,
    rank,
  };
}

export function textValue(input: unknown): string {
  if (input === null || input === undefined || input === "") return "—";
  if (typeof input === "number" && Number.isFinite(input)) return Number.isInteger(input) ? String(input) : input.toFixed(2).replace(/\.00$/, "");
  return String(input);
}

export function trackText(track: unknown, language: Language): string {
  const code = String(track || "").trim().toUpperCase();
  if (!code) return "—";
  const label = TRACK_LABELS[code]?.[language];
  return label ? `${code} — ${label}` : code;
}

export function resultIdentity(exam: Exam, row: ResultRow): string {
  const fields = getPrimaryFields(exam, row);
  return `${exam.source_key}:${textValue(fields.number)}:${textValue(fields.name)}`;
}

export function resultShareText(exam: Exam, row: ResultRow, language: Language): string {
  const f = getPrimaryFields(exam, row);
  const title = language === "ar" ? exam.title_ar : exam.title_fr;
  const lines = [
    `MauriResults — ${title}`,
    `${language === "ar" ? "المترشح" : "Candidat"}: ${textValue(f.name)}`,
    `${language === "ar" ? "الرقم" : "Numéro"}: ${textValue(f.number)}`,
    `${language === "ar" ? "المعدل / المجموع" : "Moyenne / total"}: ${textValue(f.score)}`,
    `${language === "ar" ? "القرار" : "Décision"}: ${textValue(f.decision)}`,
  ];
  if (f.track) lines.push(`${language === "ar" ? "الشعبة" : "Série"}: ${trackText(f.track, language)}`);
  if (f.rank) lines.push(`${language === "ar" ? "الترتيب" : "Rang"}: ${textValue(f.rank)}`);
  lines.push("https://mauri-results.vercel.app");
  return lines.join("\n");
}

function escapeHtml(input: unknown): string {
  return textValue(input).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

export function resultPdfHtml(exam: Exam, row: ResultRow, language: Language): string {
  const f = getPrimaryFields(exam, row);
  const rtl = language === "ar";
  const labels = rtl
    ? { title: "كشف نتيجة", name: "المترشح", number: "الرقم", score: "المعدل / المجموع", decision: "القرار", track: "الشعبة", rank: "الترتيب" }
    : { title: "Relevé de résultat", name: "Candidat", number: "Numéro", score: "Moyenne / total", decision: "Décision", track: "Série", rank: "Rang" };
  const rows = [[labels.name, escapeHtml(f.name)], [labels.number, escapeHtml(f.number)], [labels.score, escapeHtml(f.score)], [labels.decision, escapeHtml(f.decision)], ...(f.track ? [[labels.track, escapeHtml(trackText(f.track, language))]] : []), ...(f.rank ? [[labels.rank, escapeHtml(f.rank)]] : [])];
  return `<!doctype html><html dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;background:#f5f7f5;color:#14251b;padding:28px}.card{max-width:650px;margin:auto;background:white;border:1px solid #dce7df;border-radius:24px;padding:28px}.brand{color:#106b41;font-weight:800}.title{font-size:28px;margin:8px 0}.exam{color:#66736b;margin-bottom:22px}.row{display:flex;justify-content:space-between;gap:20px;padding:12px 0;border-bottom:1px solid #e6ece8}.label{color:#66736b;font-weight:700}.value{font-weight:800}.footer{margin-top:24px;color:#6c786f;font-size:12px}</style></head><body><div class="card"><div class="brand">MauriResults</div><h1 class="title">${escapeHtml(labels.title)}</h1><div class="exam">${escapeHtml(rtl ? exam.title_ar : exam.title_fr)}</div>${rows.map(([label,val])=>`<div class="row"><span class="label">${escapeHtml(label)}</span><span class="value">${val}</span></div>`).join("")}<div class="footer">https://mauri-results.vercel.app</div></div></body></html>`;
}
