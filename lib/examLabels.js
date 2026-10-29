export function frenchExamTitle(exam) {
  const title = String(exam.title_fr || "").trim();
  if (title && !/[\u0600-\u06ff]/.test(title)) return title;
  const identity = `${exam.source_key} ${exam.table_name} ${exam.title_ar}`.toLowerCase();
  const year = String(exam.year || "");
  if (/session|تكميل/.test(identity)) return `Baccalauréat · Session complémentaire ${year}`;
  if (/excellence|امتياز|_exe_/.test(identity)) return `Excellence ${/4as/.test(identity) ? "4AS" : "1AS"} ${year}`;
  if (/brevet|bepc|ابريف/.test(identity)) return `BEPC ${year}`;
  if (/concour|كونكور/.test(identity)) return `Concours ${year}`;
  if (/bac|باكالوريا/.test(identity)) return `Baccalauréat ${year}`;
  return title || String(exam.title_ar || exam.table_name || "Concours");
}
