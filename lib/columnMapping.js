const ALIASES = {
  number: ["numerocandidat", "numero", "num", "nodos", "dossier", "رقمالمترشح", "رقمالمرشح", "الرقم"],
  name: ["nomar", "nomfr", "nom", "name", "studentname", "اسمالمترشح", "اسمالطالب", "الاسم"],
  score: ["moyennebac", "moyenne", "moy", "average", "score", "total", "mod", "mgex", "المعدل", "المجموع"],
  decision: ["decision", "resultat", "status", "kr", "القرار", "الحاله"],
  track: ["seriear", "seriefr", "serie", "track", "type", "filiere", "ts", "الشعبه", "المسار"],
  wilaya: ["wilayaar", "wilayafr", "wilaya", "region", "wl", "الولايه", "الجهه"],
  moughataa: ["moughataaar", "moughataafr", "moughataa", "departement", "department", "md", "المقاطعه"],
  school: ["etablissementar", "etablissementfr", "etablissement", "ecolear", "ecole", "school", "ms", "المؤسسه", "المدرسه"],
  centre: ["centreexamenar", "centreexamenfr", "centreexamen", "centre", "center", "centrear", "المركز", "مركزالامتحان"],
  birthPlace: ["lieunaissancear", "lieunaissance", "lieun", "lieu", "birthplace", "مكانالميلاد"],
  birthDate: ["datenaissance", "datenaiss", "daten", "birthdate", "anneenaissance", "anneenaiss", "تاريخالميلاد", "سنهالميلاد"],
};

export function normalizeColumnLabel(value) {
  return String(value || "").normalize("NFKD")
    .replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, "").toLowerCase();
}

function findBestColumn(columns, aliases) {
  const normalized = columns.map((column) => ({ column, key: normalizeColumnLabel(column) }));
  return normalized.find(({ key }) => aliases.includes(key))?.column
    || normalized.find(({ key }) => aliases.some((alias) => key.includes(alias) || (key.length > 2 && alias.includes(key))))?.column
    || "";
}

export function detectColumnMappings(columns = []) {
  return Object.fromEntries(Object.entries(ALIASES).map(([field, aliases]) => [field, findBestColumn(columns, aliases)]));
}
