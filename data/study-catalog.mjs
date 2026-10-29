import { classifyStudyFile, normalizeStudyTitle } from "./study-file-type.mjs";

export const BRANCH_LABELS = {
  ar: {
    C: "الرياضيات C",
    D: "العلوم الطبيعية D",
    LM: "الآداب العصرية A / LM",
    LO: "الآداب الأصلية O / LO",
    TMGM: "التقنية TMGM",
    TSGE: "العلوم والتكنولوجيا TSGE",
    LA: "LA",
    common: "مشتركة أو غير محددة",
  },
  fr: {
    C: "Mathématiques C",
    D: "Sciences D",
    LM: "Lettres modernes A / LM",
    LO: "Lettres originelles O / LO",
    TMGM: "Technique TMGM",
    TSGE: "Sciences et technologie TSGE",
    LA: "Série LA",
    common: "Commun / non précisé",
  },
};
export const BRANCH_ORDER = ["C", "D", "LM", "LO", "TMGM", "TSGE", "LA", "common"];

function normalizedTitle(title) {
  return normalizeStudyTitle(title).replace(/[_.–—/-]+/g, " ").replace(/\s+/g, " ").trim();
}
function hasLetterPair(s, code) {
  return new RegExp(`(?:^|\\s)(?:[1-7]\\s*)?${code}(?=\\s|$)`, "i").test(s);
}

/** No branch can be inferred solely from folder membership or a French article "La". */
export function studyFileBranches(file) {
  if (Array.isArray(file.verifiedBranches) && file.verifiedBranches.length) return file.verifiedBranches;
  const title = normalizedTitle(file.title || "");
  const compact = normalizeStudyTitle(file.title || "");
  const found = new Set();

  if (/الاداب العصرية|الآداب العصرية|اداب عصرية|آداب عصرية|lettres modernes|(?:^|\s)(?:7as\s*)?lm(?:\s|$)/.test(title)) found.add("LM");
  if (/الاداب الاصلية|الآداب الأصلية|اداب اصلية|آداب أصلية|lettres originelles|(?:^|\s)(?:7as\s*)?lo(?:\s|$)/.test(title)) found.add("LO");
  if (/الشعب الادبية|الشعب الأدبية|الشعبة الادبية|الشعبة الأدبية/.test(title)) { found.add("LM"); found.add("LO"); }
  if (/tm\s?gm|\btm\b|technique|تقنية|التقنية/.test(title)) found.add("TMGM");
  if (/(?:^|\s)(?:7\s*la|7as\s*la|bac\s+la)(?:\s|$)/.test(title)) found.add("LA");

  // Explicit C/D labels, including Bac_C, 7D, 5CD, 7D&C and 7C et 7D.
  if (/(?:^|\s)(?:bac\s*)?(?:[57]\s*)?c(?=\s|$)/.test(title) ||
      /(?:[57]cd|\b[57]c\s*&\s*[57]?d\b|\bc\s*(?:et|and|&|\+)\s*d\b)/.test(compact)) found.add("C");
  if (/(?:^|\s)(?:bac\s*)?(?:[57]\s*)?d(?=\s|$)/.test(title) ||
      /(?:[57]cd|\b[57]d\s*&\s*[57]?c\b|\bc\s*(?:et|and|&|\+)\s*d\b)/.test(compact)) found.add("D");
  if (/[57]\s*d\s*&\s*[57]?c|\bd\s*(?:et|and|&|\+)\s*c\b/.test(compact)) { found.add("C"); found.add("D"); }
  if (/الشعب العلمية|الشعبة العلمية/.test(title)) { found.add("C"); found.add("D"); }

  // Some names use direct "7AS C" or "BAC-C" but older index branches are
  // only usable when the filename itself makes the series credible.
  if (!found.size && ["C", "D", "LM", "LO", "TMGM"].includes(file.branch)) {
    const b = file.branch.toLowerCase();
    if (hasLetterPair(title, b)) found.add(file.branch);
  }
  if (!found.size) return ["common"];
  return BRANCH_ORDER.filter(branch => found.has(branch));
}

/** A mock exam or classroom test is not an official Bac/BEPC paper. */
export function studyFileCategory(file) {
  if (file.verifiedType) return file.verifiedType;
  const title = normalizedTitle(file.title || "");
  if (/\bbac\s*blan|bacblan|\bbac\s+blanc|امتحان تجريبي/.test(title)) return "exams";
  if (/\bdevoir\b|\bcomposition\b|\bcontrole\b|\bevaluation\b|\btest\b|\bex[1-5]\b|فروض|فرض|اختبار/.test(title)) return "tests";
  if (/\bserie\b|\bseries\b|\bexercice\b|\bexercices\b|\bqcm\b|تمارين|سلسلة|سلاسل|تطبيقات/.test(title)) return "series";
  if (/\blivre\b|\bmanuel\b|\bjoussour\b|كتاب|الكتاب|\bcahier\b|\btome\b|المغني|المغنى/.test(title)) return "books";
  if (/\bmethodologie\b|منهجية|دفتر تحضير|\brevision\b|مراجعة/.test(title) && !/\bannales\b|مواضيع/.test(title)) return "lessons";
  if (/\bbac\b|\bbac[cd]\d|\bbaccalaureat\b|\bbepc\b|\bconcour|\bolympiade|\bannales\b|\bsujets?\b|باكالوريا|باكلوريا|بكالوريا|بكات|ابريفه|بريفه|كونكور|مسابقة|مواضيع|الدورة العادية|الدورة التكميلية/.test(title)) return "exams";
  return classifyStudyFile(file.title);
}

export function studyFileSubject(file) {
  if (file.verifiedSubject) return file.verifiedSubject;
  const title = normalizedTitle(file.title || "");
  if (/\bmath(?:s|ematiques?)?\b|\bma\b|رياضيات|الرياضيات|حساب/.test(title)) return "الرياضيات";
  if (/\bp\s*c\b|\bpc\b|physique.*chimie|فيزياء.*كيمياء/.test(title)) return "الفيزياء والكيمياء";
  if (/physique|فيزياء|الفيزياء/.test(title)) return "الفيزياء";
  if (/chimie|الكيمياء/.test(title)) return "الكيمياء";
  if (/\bsvt\b|\bgenetique\b|\bsciences naturelles\b|علوم طبيعية|العلوم الطبيعية/.test(title)) return "العلوم الطبيعية";
  if (/arab|العربية|اللغة العربية/.test(title)) return "اللغة العربية";
  if (/francais|français|français|الفرنسية/.test(title)) return "الفرنسية";
  if (/anglais|english|الانجليزية|الإنجليزية/.test(title)) return "الإنجليزية";
  if (/histoire|geograph|تاريخ|جغرافيا/.test(title)) return "التاريخ والجغرافيا";
  if (/قران|قرآن|الحديث|التشريع|التعليق|الاسلام|الإسلام/.test(title)) return "التربية الإسلامية";
  if (/الفلسفة|الفكر|philosophie/.test(title)) return "الفلسفة والفكر";
  // In Mauritanian Bac filenames SN often means "session normale", not
  // sciences naturelles. Do not present an invented subject in that case.
  if (/\bbac\b|\bsujet\b|\bsujets\b/.test(title) &&
      file.subject === "العلوم الطبيعية" &&
      /\bsn\b/.test(title) &&
      !/sciences|naturelles|svt|genetique|العلم|العلوم/.test(title)) return "مواد متنوعة";
  return file.subject || "مواد متنوعة";
}

export function studyFileCompetition(file) {
  if (file.verifiedCompetition) return file.verifiedCompetition;
  const t = normalizedTitle(file.title || "");
  if (/\bolympiade|olympiad|\brallye\b/.test(t)) return "الأولمبياد";
  if (/\bconcour|كونكور|السادسة ابتدائي/.test(t) || file.level === "6AF") return "كونكور";
  if (/\bbepc\b|ابريفه|بريفه/.test(t) || file.level === "4AS") return "ابريفه";
  if (file.level === "7AS") return "باكالوريا";
  return null;
}
export function examYearGroup(file) {
  if (file.yearKind === "single" && file.year >= 1990 && file.year <= 2028) return String(file.year);
  if (file.yearKind === "academic" && file.yearLabel) return `school:${file.yearLabel}`;
  if (file.yearKind === "range") return "archives";
  return "undated";
}
export function decorateStudyFile(file) {
  return {
    ...file,
    displayTitle: file.verifiedTitle || file.title,
    category: studyFileCategory(file),
    branches: studyFileBranches(file),
    subject: studyFileSubject(file),
    competition: studyFileCompetition(file),
  };
}

/** Human-readable kind from the filename, and verified content where supplied. */
export function studyDocumentKind(file) {
  if (file.verifiedDocumentType) return file.verifiedDocumentType;
  const t = normalizedTitle(file.title || "");
  if (/bac\s*blan|bacblan|blanc|تجريبي/.test(t)) return "تجريبي";
  if (/corrig|correction|corrige|\bsolution\b|حلول|تصحيح|الإجابة|الاجابة|مع الحل|reponses/.test(t)) {
    return /sujets?|مواضيع|موضوع|\bbac\b/.test(t) ? "موضوع وحل" : "تصحيح";
  }
  if (/\bannales\b|مواضيع|sujets?\b|\bbac\b/.test(t) && file.yearKind === "range") return "مواضيع سنوات متعددة";
  if (/\bolympiade|اولمبياد|الأولمبياد/.test(t)) return "أولمبياد";
  return "موضوع";
}

export function examBrowseGroup(file) {
  const year = examYearGroup(file);
  if (year !== "archives" && year !== "undated") return year;
  const kind = studyDocumentKind(file);
  const isSolution = kind === "تصحيح" || kind === "موضوع وحل";
  const suffix = kind === "تجريبي" ? "mock" : isSolution ? "solved" : "papers";
  return `${year}:${suffix}`;
}

export function examBrowseLabel(group) {
  const labels = {
    "archives:papers": "مواضيع لعدة سنوات",
    "archives:solved": "مواضيع وتصحيحات لعدة سنوات",
    "archives:mock": "امتحانات تجريبية لعدة سنوات",
    "undated:papers": "مواضيع غير مؤرخة",
    "undated:solved": "تصحيحات ومواضيع محلولة",
    "undated:mock": "امتحانات تجريبية",
  };
  if (labels[group]) return labels[group];
  return group.startsWith("school:") ? `السنة الدراسية ${group.slice(7)}` : group;
}
