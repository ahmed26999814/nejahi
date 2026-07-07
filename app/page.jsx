"use client";

import PremiumHomeView from "../components/home/PremiumHomeView";
import AnalyticsPage from "../components/analytics/AnalyticsPage";
import SearchPanel from "../components/search/SearchPanel";
import BottomNav from "../components/layout/BottomNav";
import FloatingActionButton from "../components/ui/FloatingActionButton";
import { CandidateProfileCard, StatusBadge } from "../components/results/ResultDesignKit";
import ResultOfficialSummary from "../components/results/ResultOfficialSummary";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/PremiumHeader";
import { cva } from "class-variance-authority";
import { LazyMotion, MotionConfig, domAnimation, m } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { FaFacebookF, FaTelegram, FaWhatsapp } from "react-icons/fa6";
import * as Select from "@radix-ui/react-select";
import { Toaster, toast } from "sonner";

const PAGE_SIZE = 1000;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BAC_TABLE = "bac_results";
const BAC_SESSION_TABLE = "bac_session2_results";
const CONCOURS_TABLE = "concours_results";
const CONCOURS_VIEW = "concours_results_view";
const CONCOURS_LOCATIONS_VIEW = "concours_locations_view";
const EXCELLENCE_1AS_TABLE = "excellence_1as_results";
const BREVET_TABLE = "brevet_results";
const SITE_CONTENT_TABLE = "site_content";
const TABLE_BY_SOURCE = {
  bac: BAC_TABLE,
  bac_session: BAC_SESSION_TABLE,
  brevet: BREVET_TABLE,
  concours: CONCOURS_VIEW,
  excellence_1as: EXCELLENCE_1AS_TABLE,
};

const ANALYTICS_VIEW_LIMIT = 20;
const ANALYTICS_VIEW_NAMES = {
  bac: { stats: "bac_stats", regionStats: "bac_region_stats", schoolStats: "bac_school_stats", trackStats: "bac_track_stats", topStudents: "bac_top_students" },
  brevet: { stats: "brevet_stats", regionStats: "brevet_region_stats", schoolStats: "brevet_school_stats", topStudents: "brevet_top_students" },
  concours: { stats: "concours_stats", regionStats: "concours_region_stats", moughataaStats: "concours_moughataa_stats", schoolStats: "concours_school_stats", topStudents: "concours_top_students" },
  excellence_1as: { stats: "excellence_1as_stats", regionStats: "excellence_1as_region_stats", topStudents: "excellence_1as_top_students" },
  bac_session: { stats: "bac_session2_stats", regionStats: "bac_session2_region_stats", trackStats: "bac_session2_track_stats", topStudents: "bac_session2_top_students" },
};

const actionButtonClass = cva("action-button", {
  variants: {
    variant: {
      solid: "bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 text-white shadow-[0_16px_35px_rgba(21,128,61,.20)] hover:shadow-[0_20px_45px_rgba(21,128,61,.28)]",
      light: "border border-mauri-border bg-white/85 text-slate-700 hover:border-mauri-green/40 hover:text-mauri-green dark:border-white/10 dark:bg-white/10 dark:text-slate-100",
    },
  },
  defaultVariants: {
    variant: "solid",
  },
});

const EXAM_CARDS = [
  { id: "bac-2025", title: { ar: "نتائج باكالوريا 2025", fr: "Résultats Bac 2025" }, description: { ar: "النتائج الرسمية للباكالوريا.", fr: "Résultats officiels du baccalauréat." }, tone: "green", available: true, source: "bac", icon: <GraduationIcon /> },
  { id: "brevet-2025", title: { ar: "نتائج أبريفه 2025", fr: "Résultats BEPC 2025" }, description: { ar: "نتائج ختم الدروس الإعدادية الرسمية.", fr: "Résultats officiels du BEPC." }, tone: "blue", available: true, source: "brevet", icon: <BookIcon /> },
  { id: "concours-2025", title: { ar: "كونكور 2025", fr: "Concours 2025" }, description: { ar: "بحث خاص بالولاية والمقاطعة والمركز ورقم المترشح.", fr: "Recherche par région, département, centre et numéro." }, tone: "gold", available: true, source: "concours", icon: <SchoolIcon /> },
  { id: "excellence-1as-2025", title: { ar: "الامتياز الأولى إعدادية 2025", fr: "Excellence 1AS 2025" }, description: { ar: "نتائج مسابقة الامتياز الأولى إعدادية.", fr: "Résultats du concours Excellence 1AS." }, tone: "teal", available: true, source: "excellence_1as", icon: <AwardIcon /> },
  { id: "bac-session-2025", title: { ar: "الباكالوريا الدورة التكميلية 2025", fr: "Bac session complémentaire 2025" }, description: { ar: "نتائج الدورة التكميلية الرسمية.", fr: "Résultats officiels de la session complémentaire." }, tone: "amber", available: true, source: "bac_session", icon: <AlertIcon /> },
];

const YEAR_CARDS = [
  { id: "year-2025", title: { ar: "نتائج مسابقات 2025", fr: "Résultats des concours 2025" }, description: { ar: "كل النتائج المتوفرة الآن في مكان واحد.", fr: "Tous les résultats disponibles au même endroit." }, available: true, tone: "green", icon: <GraduationIcon /> },
  { id: "year-2026", title: { ar: "نتائج مسابقات 2026", fr: "Résultats des concours 2026" }, description: { ar: "سيتم فتحها عند توفر النتائج.", fr: "Ouverture prochaine." }, available: false, tone: "rose", icon: <AwardIcon /> },
];

const CONCOURS_WILAYA_ALIASES = {
  "آدرار": ["آدرار"],
  "الترارزة": ["الترارزة", "اتـــرارزه"],
  "الحوض الشرقي": ["الحوض الشرقي"],
  "الحوض الغربي": ["الحوض الغربي", "الحوض الغر��ي", "الحوض ا��غربي"],
  "إنشيري": ["إنشيري", "انـــشـــيـــري"],
  "نواكشوط الجنوبية": ["نواكشوط الجنوبية", "انواكشوط  الجنوبية", "انواكشوط  الجنوبي��", "انواكشوط  ا��جنوبية"],
  "نواكشوط الغربية": ["نواكشوط الغربية", "انواكشوط  الغربية"],
  "نواكشوط الشمالية": ["نواكشوط الشمالية", "انواكشوط الشمالية", "انواك��وط الشمالية", "انوا��شوط الشمالية", "ان��اكشوط الشمالية"],
  "باماكو": ["باماكو"],
  "تكانت": ["تكانت", "تــــكانت"],
  "تيرس زمور": ["تيرس زمور", "تـيــرس زمور"],
  "داخلة نواذيبو": ["داخلة نواذيبو", "داخلت انواديـبـو", "داخلت ��نواديـبـو", "د��خلت انواديـبـو"],
  "كوركول": ["كوركول", "كـــوركل"],
  "كيدي ماغا": ["كيدي ماغا", "كيديماغا", "كيديم��غا", "كيدي��اغا"],
  "لبراكنة": ["لبراكنة", "لــبــراكــنــه"],
  "لعصابة": ["لعصابة", "لعصابـــــه", "��عصابـــــه"],
};

const UI_TEXT = {
  ar: {
    home: "الرئيسية",
    toppers: "الأوائل",
    analytics: "الإحصائيات",
    search: "البحث",
    developer: "تطوير",
    soon: "قريبًا",
    open: "البحث مفتوح",
    heroTitle: "نتائج المسابقات الوطنية في موريتانيا",
    heroDesc: "اختر المسابقة ثم ابحث عن النتيجة الرسمية بسرعة.",
    officialResult: "بطاقة النتيجة الرسمية",
    verification: "رقم التحقق",
    examPageDesc: "صفحة منظمة للبحث وعرض النتائج الخاصة بهذه المسابقة.",
    yearPageTitle: "مسابقات 2025",
    yearPageDesc: "اختر المسابقة التي تريد البحث فيها، وستظهر الإحصائيات والأوائل حسب اختيارك.",
    chooseExam: "اختر المسابقة",
    exam: "المسابقة",
    allTracks: "كل الشعب",
    chooseExamFirst: "اختر مسابقة من نتائج 2025 أولًا لعرض الإحصائيات والأوائل الخاصة بها.",
    ranking: "التصنيف",
    rankingDesc: "ترتيب المترشحين حسب المعدل داخل نفس المجموعة.",
    noData: "لا توجد بيانات كافية.",
    platformSubtitle: "منصة نتائج الوطنية",
    toppersTitle: "الأوائل",
    toppersDesc: "أفضل ثلاثة مترشحين من كل شعبة في عرض سريع ومنظم.",
    analyticsTitle: "إحصائيات النتائج",
    analyticsDesc: "لوحة مختصرة تساعد على فهم النتائج بسرعة.",
    byRegions: "حسب الولايات",
    byTracks: "حسب الشعب",
    bySchools: "حسب المدارس",
    passedOf: "ناجحون",
    from: "من",
    studentCount: "الطلاب",
    passedCount: "الناجحون",
    highestAverage: "أعلى معدل",
    averageLabel: "المتوسط",
    totalScore: "المجموع",
    participants: "المشاركون",
    highestScore: "أعلى مجموع",
    averageScore: "متوسط المجموع",
    searchPlaceholder: "أدخل رقم المترشح أو الاسم الكامل",
    searchButton: "بحث",
    searching: "بحث...",
    resultCard: "بطاقة النتيجة",
    studentName: "اسم الطالب",
    verify: "تحقق",
    topRank: "من الأوائل",
    successFound: "تهانينا، تم العثور على نتيجة ناجحة.",
    share: "مشاركة",
    copyLink: "نسخ الرابط",
    telegram: "تلغرام",
    print: "طباعة",
    searchResults: "نتائج البحث",
    chooseCandidate: "اختر المترشح",
    number: "رقم",
    preparingResult: "جاري تحضير بطاقة النتيجة",
    moments: "لحظات قليلة...",
    openingResult: "جاري فتح بطاقة النتيجة",
    preparingOfficial: "نحضّر لك صفحة النتيجة الرسمية...",
    trackTopThree: "ثلاثة أوائل من كل شعبة",
    noTrackData: "لا توجد بيانات كافية لهذه الشعبة.",
    first: "الأول",
    second: "الثاني",
    third: "الثالث",
    showResult: "عرض النتيجة",
    footerDesc: "منصة النتائج الوطنية.",
    preparedBy: "إعداد وتطوير",
    aboutDeveloper: "عن المطور",
    developerRole: "مطور الموقع",
    developerMessage: "تم تطوير MauriResults لتقديم تجربة سريعة وواضحة لعرض نتائج المسابقات الوطنية في موريتانيا.",
    close: "إغلاق",
    facebook: "فيسبوك",
    whatsapp: "واتساب",
    rights: "جميع الحقوق محفوظة © MauriResults.",
    id: "رقم المترشح",
    track: "الشعبة",
    rank: "الرتبة",
    school: "المدرسة",
    region: "الولاية",
    decision: "القرار",
    center: "المركز",
    birthPlace: "مكان الميلاد",
    birthDate: "تاريخ الميلاد",
    moughataa: "المقاطعة",
    type: "النوع",
    yearBirth: "سنة الميلاد",
    nationalId: "الرقم الوطني",
    arabicMark: "العربية",
    frenchMark: "الفرنسية",
    mathMark: "الرياضيات",
    chooseWilaya: "اختر الولاية",
    chooseMoughataa: "اختر المقاطعة",
    chooseCentre: "اختر مركز الامتحان",
    candidateNumber: "رقم المترشح",
    unavailable: "غير متوفرة",
    concoursFailed: "راسب",
    concoursPassedCompetition: "ناجح في المسابقة",
    concoursPassedCertificate: "ناجح في المسابقة والشهادة",
    successToast: "🎉 مبروك بالنجاح!",
    statusLabels: { admis: "ناجح", sessionnaire: "دورة استدراكية", absent: "غائب", ajourne: "راسب", unknown: "غير محددة" },
    missingEnv: "لم يتم ضبط إعدادات الاتصال في بيئة النشر.",
    statsLoadError: "تعذر تحميل الإحصائيات.",
    enterQuery: "يرجى إدخال رقم المترشح أو الاسم.",
    shortQuery: "أدخل رقما أو اسما من حرفين على الأقل.",
    notFound: "لم يتم العثور على نتيجة بهذا الرقم أو الاسم.",
    sessionNotFound: "لم يتم العثور على مترشح مؤهل للدورة بهذا الرقم أو الاسم.",
    connectionError: "حدث خطأ أثناء الاتصال بالخدمة.",
    copiedShare: "تم نسخ النتيجة للمشاركة.",
    result: "نتيجة",
    examResultTitle: "MauriResults - نتيجة الامتحان",
  },
  fr: {
    home: "Accueil",
    toppers: "Lauréats",
    analytics: "Statistiques",
    search: "Recherche",
    developer: "Dev",
    soon: "Bientôt",
    open: "Recherche ouverte",
    heroTitle: "Résultats des concours nationaux en Mauritanie",
    heroDesc: "Choisissez un concours puis recherchez le résultat officiel.",
    officialResult: "Carte officielle du résultat",
    verification: "Code de vérification",
    examPageDesc: "Une page organisée pour rechercher les résultats de ce concours.",
    yearPageTitle: "Concours 2025",
    yearPageDesc: "Choisissez le concours à consulter. Les statistiques et les lauréats suivront votre choix.",
    chooseExam: "Choisir le concours",
    exam: "Concours",
    allTracks: "Toutes les séries",
    chooseExamFirst: "Choisissez d'abord un concours 2025 pour afficher ses statistiques et ses lauréats.",
    ranking: "Classement",
    rankingDesc: "Classement des candidats par moyenne dans le même groupe.",
    noData: "Données insuffisantes.",
    platformSubtitle: "Plateforme nationale des résultats",
    toppersTitle: "Lauréats",
    toppersDesc: "Les trois meilleurs candidats de chaque série dans une vue claire.",
    analyticsTitle: "Statistiques des résultats",
    analyticsDesc: "Un tableau synthétique pour lire rapidement les résultats.",
    byRegions: "Par région",
    byTracks: "Par série",
    bySchools: "Par établissement",
    passedOf: "Admis",
    from: "sur",
    studentCount: "Candidats",
    passedCount: "Admis",
    highestAverage: "Meilleure moyenne",
    averageLabel: "Moyenne",
    totalScore: "Total",
    participants: "Participants",
    highestScore: "Meilleur total",
    averageScore: "Total moyen",
    searchPlaceholder: "Entrez le numéro ou le nom complet",
    searchButton: "Rechercher",
    searching: "Recherche...",
    resultCard: "Carte du résultat",
    studentName: "Nom du candidat",
    verify: "Vérification",
    topRank: "Parmi les premiers",
    successFound: "Félicitations, un résultat admis a été trouvé.",
    share: "Partager",
    copyLink: "Copier le lien",
    telegram: "Telegram",
    print: "Imprimer",
    searchResults: "Résultats de recherche",
    chooseCandidate: "Choisir le candidat",
    number: "N°",
    preparingResult: "Préparation de la carte du résultat",
    moments: "Quelques instants...",
    openingResult: "Ouverture de la carte du résultat",
    preparingOfficial: "Préparation de la page officielle du résultat...",
    trackTopThree: "Top 3 de chaque série",
    noTrackData: "Données insuffisantes pour cette série.",
    first: "1er",
    second: "2e",
    third: "3e",
    showResult: "Voir le résultat",
    footerDesc: "Plateforme nationale des résultats.",
    preparedBy: "Conception et développement",
    aboutDeveloper: "À propos du développeur",
    developerRole: "Développeur du site",
    developerMessage: "MauriResults a été développé pour offrir une expérience rapide et claire des résultats nationaux en Mauritanie.",
    close: "Fermer",
    facebook: "Facebook",
    whatsapp: "WhatsApp",
    rights: "Tous droits réservés © MauriResults.",
    id: "Numéro du candidat",
    track: "Série",
    rank: "Rang",
    school: "Établissement",
    region: "Région",
    decision: "Décision",
    center: "Centre",
    birthPlace: "Lieu de naissance",
    birthDate: "Date de naissance",
    moughataa: "Département",
    type: "Type",
    yearBirth: "Année de naissance",
    nationalId: "Matricule",
    arabicMark: "Arabe",
    frenchMark: "Français",
    mathMark: "Mathématiques",
    chooseWilaya: "Choisir la région",
    chooseMoughataa: "Choisir le département",
    chooseCentre: "Choisir le centre d'examen",
    candidateNumber: "Numéro du candidat",
    unavailable: "Non disponible",
    concoursFailed: "Ajourné",
    concoursPassedCompetition: "Admis au concours",
    concoursPassedCertificate: "Admis au concours et au certificat",
    successToast: "🎉 Félicitations pour la réussite !",
    statusLabels: { admis: "Admis", sessionnaire: "Session complémentaire", absent: "Absent", ajourne: "Ajourné", unknown: "Non défini" },
    missingEnv: "La configuration de connexion est incomplète en production.",
    statsLoadError: "Impossible de charger les statistiques.",
    enterQuery: "Veuillez saisir le numéro ou le nom.",
    shortQuery: "Saisissez au moins deux caractères.",
    notFound: "Aucun résultat trouvé avec ce numéro ou ce nom.",
    sessionNotFound: "Aucun candidat admissible à la session avec ce numéro ou ce nom.",
    connectionError: "Erreur lors de la connexion à la base de données.",
    copiedShare: "Le résultat a été copié pour le partage.",
    result: "Résultat",
    examResultTitle: "MauriResults - Résultat de l'examen",
  },
};

function parseAverage(value) {
  if (!value) return 0;
  return Number.parseFloat(String(value).replace(",", ".").trim()) || 0;
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function normalizeComparable(value) {
  return cleanText(value).replace(/\s+/g, " ").toLowerCase();
}

function normalizeWilayaLabel(value) {
  const compact = cleanText(value).replace(/ـ/g, "").replace(/\uFFFD/g, "").replace(/\s+/g, " ");
  if (!compact) return "";
  if (compact.includes("آدرار") || compact.includes("ادرار")) return "آدرار";
  if (compact.includes("ترارز")) return "الترارزة";
  if (compact.includes("الحوض الشرقي")) return "الحوض الشرقي";
  if (compact.includes("الحوض الغر") || compact.includes("الغربي")) return "الحوض الغربي";
  if (compact.includes("انشيري") || compact.includes("ان شيري")) return "إنشيري";
  if (compact.includes("جنوبي")) return "نواكشوط الجنوبية";
  if (compact.includes("الغربية")) return "نواكشوط الغربية";
  if (compact.includes("شمال")) return "نواكشوط الشمالية";
  if (compact.includes("باماكو")) return "باماكو";
  if (compact.includes("تكانت")) return "تكانت";
  if (compact.includes("تيرس") || compact.includes("زمور")) return "تيرس زمور";
  if (compact.includes("داخلت") || compact.includes("نواديبو")) return "داخلة نواذيبو";
  if (compact.includes("كوركل")) return "كوركول";
  if (compact.includes("كيديم") || compact.includes("كيدي")) return "كيدي ماغا";
  if (compact.includes("براك")) return "لبراكنة";
  if (compact.includes("عصاب")) return "لعصابة";
  return compact;
}

function normalizeCandidateNumber(value) {
  const text = cleanText(value);
  if (!/^\d+$/.test(text)) return normalizeComparable(text);
  return String(Number(text));
}

function getColumn(row, ...names) {
  const source = row || {};
  const normalizedEntries = Object.entries(source).map(([key, value]) => [cleanText(key).toLowerCase(), value]);
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(source, name)) return source[name];
    const normalizedName = cleanText(name).toLowerCase();
    const match = normalizedEntries.find(([key]) => key === normalizedName);
    if (match) return match[1];
  }
  return "";
}

function getAverage(student) {
  return parseAverage(student.MOD);
}

function formatScore(student, text = UI_TEXT.ar) {
  const score = getAverage(student);
  return student.source === "concours" ? `${score.toFixed(2)} / 200` : score.toFixed(2);
}

function getResultUrl(student) {
  if (typeof window === "undefined") return "https://mauri-results.vercel.app";
  const url = new URL(window.location.href);
  url.hash = `result-${encodeURIComponent(student?.source || "exam")}-${encodeURIComponent(student?.id || "")}`;
  return url.toString();
}

function getResultShareText(student, text = UI_TEXT.ar) {
  const scoreLabel = student.source === "concours" ? text.totalScore : text.averageLabel;
  const trackLine = examHasTrackGroups(student.source) ? `\n${text.track}: ${student.track}` : "";
  return `${text.result} ${student.name}\n${text.id}: ${student.id}${trackLine}\n${scoreLabel}: ${formatScore(student, text)}\n${text.rank}: ${student.rank || text.unavailable}\nMauriResults`;
}

function isMissingSupabaseEnv(error) {
  return error instanceof Error && error.message === "Missing Supabase environment variables.";
}

function isMissingConcoursView(error) {
  const message = String(error?.message || error || "");
  return message.includes("PGRST205") && message.includes(CONCOURS_VIEW);
}

function getOfficialStatus(value) {
  const normalized = cleanText(value).toLowerCase();
  if (normalized.includes("admis") || normalized.includes("ناجح")) return { label: "ناجح", icon: <CheckIcon />, className: "admis" };
  if (normalized.includes("sessionnaire")) return { label: "دورة استدراكية", icon: <AlertIcon />, className: "sessionnaire" };
  if (normalized.includes("absent") || normalized.includes("غائب")) return { label: "غائب", icon: <MinusIcon />, className: "absent" };
  if (normalized.includes("ajourn") || normalized.includes("راسب")) return { label: "راسب", icon: <XIcon />, className: "ajourne" };
  return { label: value ? cleanText(value) : "غير محددة", icon: <InfoIcon />, className: "unknown" };
}

function getStatusDisplay(status, text) {
  return { ...status, label: text?.statusLabels?.[status.className] || status.label };
}

function getConcoursStatus(total, text = UI_TEXT.ar) {
  if (total >= 100) {
    return { label: text.concoursPassedCertificate, icon: <CheckIcon />, className: "admis" };
  }
  if (total >= 85) {
    return { label: text.concoursPassedCompetition, icon: <CheckIcon />, className: "admis" };
  }
  return { label: text.concoursFailed, icon: <XIcon />, className: "ajourne" };
}

function examHasTrackGroups(source) {
  return source === "bac" || source === "bac_session";
}

async function fireSuccessConfetti() {
  if (typeof window === "undefined") return;
  const { default: confetti } = await import("canvas-confetti");
  const duration = 3200;
  const animationEnd = Date.now() + duration;
  const defaults = {
    startVelocity: 26,
    spread: 72,
    ticks: 90,
    zIndex: 80,
    scalar: 0.9,
  };

  if (navigator.vibrate) navigator.vibrate([45, 35, 45]);

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) {
      window.clearInterval(interval);
      return;
    }

    const particleCount = Math.max(14, Math.round(34 * (timeLeft / duration)));
    confetti({ ...defaults, particleCount, origin: { x: 0.18, y: 0.18 } });
    confetti({ ...defaults, particleCount, origin: { x: 0.82, y: 0.18 } });
  }, 360);
}

function getAverageTone(average) {
  if (average >= 10) return "success";
  if (average >= 8) return "near";
  if (average >= 4) return "warning";
  return "danger";
}

function getAverageLevel(average) {
  if (average >= 15) return { label: "ممتاز", percent: 100, className: "excellent" };
  if (average >= 12) return { label: "جيد جدًا", percent: 78, className: "very-good" };
  if (average >= 10) return { label: "جيد", percent: 58, className: "good" };
  return { label: "ضعيف", percent: Math.max(12, Math.min(48, average * 4.8)), className: "weak" };
}

function getAveragePhrase(average) {
  if (average >= 15) return "انت مانك متكايس";
  if (average >= 13) return "انت حامي انجحت";
  if (average >= 10) return "نصر انجحت";
  if (average >= 9) return "انت ادكد ماتكرا انت ناجح";
  if (average >= 8) return "اشتمر (ي) امع راسك لا تمشي فيه";
  if (average >= 6) return "بعدنك انجحت";
  if (average >= 4) return "عادي تجبروا سنة جاي";
  if (average >= 2) return "الا حاول تكرا دور تنجح تعكب";
  return "كالتك العنز";
}

function playSuccessTone() {
  if (typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.36);
    gain.connect(context.destination);

    [523.25, 659.25, 783.99].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, context.currentTime + index * 0.08);
      oscillator.connect(gain);
      oscillator.start(context.currentTime + index * 0.08);
      oscillator.stop(context.currentTime + 0.32 + index * 0.04);
    });

    window.setTimeout(() => context.close().catch(() => {}), 520);
  } catch {
    // Some browsers block Web Audio in strict privacy modes.
  }
}

function escapePostgrestValue(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(")", "\\)");
}

function numberSearchValues(query, width = 5) {
  const value = cleanText(query);
  if (!/^\d+$/.test(value)) return [escapePostgrestValue(value)];
  return [...new Set([
    value,
    value.padStart(width, "0"),
    String(Number(value)),
  ])].map(escapePostgrestValue);
}

function postgrestInFilter(values) {
  const cleanValues = [...new Set(values.map(cleanText).filter(Boolean))].map(escapePostgrestValue);
  return cleanValues.length ? `in.(${cleanValues.join(",")})` : "";
}

function concoursWilayaQueryValues(value, fallbackValues = []) {
  const label = normalizeWilayaLabel(value);
  return [...new Set([
    value,
    label,
    ...(CONCOURS_WILAYA_ALIASES[label] || []),
    ...fallbackValues,
  ].map(cleanText).filter(Boolean))];
}

function concoursNumberSearchValues(query) {
  const value = cleanText(query);
  if (!/^\d+$/.test(value)) return [escapePostgrestValue(value)];
  return [...new Set([
    value,
    value.padStart(5, "0"),
    value.padStart(6, "0"),
    value.padStart(7, "0"),
    String(Number(value)),
  ])].map(escapePostgrestValue);
}

function logSupabaseQuery(table, params, context = "request") {
  const safeParams = Object.fromEntries(
    Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== "")
  );

  console.log("[MauriResults Supabase]", {
    context,
    table,
    params: safeParams,
  });
}

async function supabaseRequest(params, table = BAC_TABLE) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing Supabase environment variables.");
  }

  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  logSupabaseQuery(table, params);

  const response = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function fetchView(viewName, limit = 100) {
  return supabaseRequest(
    {
      select: "*",
      limit,
    },
    viewName
  );
}


async function fetchOptionalView(viewName, limit = 100) {
  if (!viewName) return [];
  try {
    return await fetchView(viewName, limit);
  } catch (error) {
    console.warn(`[MauriResults Optional View Missing] ${viewName}`, error);
    return [];
  }
}

function numberValue(value) {
  const normalized = String(value ?? "").replace(",", ".").trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeStatsRow(row, { labelKey, isConcours = false } = {}) {
  const total = numberValue(row.total_students ?? row.total);
  const passed = isConcours ? 0 : numberValue(row.passed);
  const highest = numberValue(row.highest_score ?? row.highest);
  const average = numberValue(row.average_score ?? row.average);
  return {
    label: cleanText(row[labelKey] ?? row.label ?? "غير محدد") || "غير محدد",
    total,
    passed,
    highest,
    average,
    isConcours,
    passRate: total ? (passed / total) * 100 : 0,
  };
}

function normalizeStatsRows(rows, options = {}) {
  const isConcours = !!options.isConcours;
  return (rows || [])
    .map((row) => normalizeStatsRow(row, options))
    .filter((row) => row.label && row.total > 0)
    .sort((a, b) => {
      if (isConcours) return b.total - a.total || b.average - a.average;
      return b.passed - a.passed || b.total - a.total || b.average - a.average;
    })
    .slice(0, ANALYTICS_VIEW_LIMIT);
}

function normalizeViewStats(row, source) {
  const isConcours = source === "concours";
  return {
    total: numberValue(row?.total_students ?? row?.total),
    passed: isConcours ? 0 : numberValue(row?.passed),
    failed: isConcours ? 0 : numberValue(row?.failed),
    highest: numberValue(row?.highest_score ?? row?.highest),
    average: numberValue(row?.average_score ?? row?.average),
    isConcours,
  };
}

function normalizeTopStudent(row, source, index = 0) {
  const id = String(row.numero ?? row.id ?? row.NODOSS ?? row.Numero ?? "").trim();
  const score = numberValue(row.average_score ?? row.total_score ?? row.MOD ?? row.Mgex ?? row["Moy Bac_Session"] ?? row.Moyenne_Bepc);
  const student = {
    id,
    name: cleanText(row.name ?? row.NOM ?? row.NOM_AR ?? row.Nom ?? "اسم غير متوفر"),
    track: cleanText(row.track ?? row.serie ?? row.SERIE ?? row.TYPE ?? (source === "concours" ? "كونكور" : "غير محددة")),
    MOD: score,
    kr: cleanText(row.decision ?? row.Decision ?? ""),
    wl: cleanText(row.wilaya ?? row.WILAYA ?? row.Wilaya_AR ?? row.WL ?? ""),
    moughataa: cleanText(row.moughataa ?? row.MOUGHATAA_AR ?? row.MD ?? ""),
    ms: cleanText(row.school ?? row.Ecole ?? row.Ecole_AR ?? row.Etablissement_AR ?? row.MS ?? ""),
    centre: cleanText(row.center ?? row.Centre ?? row.CENTRE_AR ?? row["Centre Examen_AR"] ?? ""),
    totalScore: source === "concours" ? score : undefined,
    source,
    rank: index + 1,
    originalIndex: index,
  };
  return student.id ? student : null;
}

function groupTopStudentsByTrackFromViews(students, { showTrackGroups = true, selectedTrack = "", allowTrackFilter = false, text = UI_TEXT.ar } = {}) {
  const pool = selectedTrack && allowTrackFilter
    ? students.filter((student) => student.track === selectedTrack)
    : students;

  if (!showTrackGroups) {
    const top = [...pool].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex).slice(0, 3);
    return top.length ? [{ track: text.toppers, students: top }] : [];
  }

  return [...new Set(pool.map((student) => cleanText(student.track)).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, "ar"))
    .map((track) => ({
      track,
      students: pool
        .filter((student) => student.track === track)
        .sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex)
        .slice(0, 3),
    }))
    .filter((group) => group.students.length > 0);
}

function analyticsModeOptions(source, text = UI_TEXT.ar) {
  const moughataas = text.moughataas || "حسب المقاطعات";
  if (source === "bac") return [{ id: "region", label: text.byRegions }, { id: "track", label: text.byTracks }];
  if (source === "brevet") return [{ id: "region", label: text.byRegions }, { id: "school", label: text.bySchools }];
  if (source === "concours") return [{ id: "region", label: text.byRegions }, { id: "moughataa", label: moughataas }];
  if (source === "excellence_1as") return [{ id: "region", label: text.byRegions }];
  if (source === "bac_session") return [{ id: "region", label: text.byRegions }, { id: "track", label: text.byTracks }];
  return [];
}

async function fetchAnalyticsViewSet(source) {
  const views = ANALYTICS_VIEW_NAMES[source];
  if (!views) return null;

  const [statsRows, regionRows, schoolRows, trackRows, moughataaRows, topRows] = await Promise.all([
    fetchOptionalView(views.stats, 1),
    fetchOptionalView(views.regionStats, 100),
    fetchOptionalView(views.schoolStats, 100),
    fetchOptionalView(views.trackStats, 100),
    fetchOptionalView(views.moughataaStats, 100),
    fetchOptionalView(views.topStudents, 100),
  ]);

  const isConcours = source === "concours";
  const topStudents = topRows.map((row, index) => normalizeTopStudent(row, source, index)).filter(Boolean);

  return {
    stats: normalizeViewStats(statsRows?.[0], source),
    regionStats: normalizeStatsRows(regionRows, { labelKey: "wilaya", isConcours }),
    schoolStats: normalizeStatsRows(schoolRows, { labelKey: "school", isConcours }),
    trackStats: normalizeStatsRows(trackRows, { labelKey: "track", isConcours }),
    moughataaStats: normalizeStatsRows(moughataaRows, { labelKey: "moughataa", isConcours }),
    topStudents,
  };
}

async function fetchSiteContent() {
  try {
    const rows = await supabaseRequest({
      select: "content_key,title,value,type,storage_path,updated_at",
      limit: 1000,
    }, SITE_CONTENT_TABLE);
    return rows.reduce((assets, row) => ({
      ...assets,
      [row.content_key]: row,
    }), {});
  } catch (error) {
    console.warn("[MauriResults Site Content]", error);
    return {};
  }
}

function contentValue(content, key, fallback = "") {
  const value = content?.[key]?.value;
  return value == null || value === "" ? fallback : value;
}

function imageAsset(content, key) {
  const value = contentValue(content, key);
  return value ? { value, image_url: value, is_active: true } : null;
}

function prepareStudents(rows) {
  const normalized = rows
    .map((row, index) => {
      const track = cleanText(getColumn(row, "TS", "ts", "Serie", "serie") || "غير محددة");
      return {
        id: String(getColumn(row, "Numero", "numero", "NUMERO", "N", "id") ?? "").trim(),
        name: cleanText(getColumn(row, "NOM", "nom", "Nom", "name") || "اسم غير متوفر"),
        ts: track,
        track,
        MOD: getColumn(row, "MOD", "mod", "Moyenne", "moyenne"),
        kr: cleanText(getColumn(row, "KR", "kr", "Decision", "decision") || ""),
        wl: cleanText(getColumn(row, "WL", "wl", "Wilaya", "wilaya") || ""),
        moughataa: cleanText(getColumn(row, "MD", "md", "Moughataa", "moughataa") || ""),
        ms: cleanText(getColumn(row, "MS", "ms") || ""),
        sessionType: "الدورة الرئيسية 2025",
        source: "bac",
        originalIndex: index,
      };
    })
    .filter((student) => student.id);

  const sorted = [...normalized].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  sorted.forEach((student, index) => {
    student.rank = index + 1;
  });

  return [...new Map(sorted.map((student) => [student.id, student])).values()];
}

function prepareBacSessionStudents(rows) {
  const normalized = rows
    .map((row, index) => ({
      id: String(getColumn(row, "NODOSS") ?? "").trim(),
      name: cleanText(getColumn(row, "NOM_AR", "NOM_FR") || "اسم غير متوفر"),
      nameFr: cleanText(getColumn(row, "NOM_FR") || ""),
      nameAr: cleanText(getColumn(row, "NOM_AR") || ""),
      track: cleanText(getColumn(row, "SERIE") || "غير محددة"),
      MOD: getColumn(row, "Moy Bac_Session"),
      kr: cleanText(getColumn(row, "Decision") || ""),
      wl: cleanText(getColumn(row, "Wilaya_AR", "Wilaya_FR") || ""),
      ms: cleanText(getColumn(row, "Etablissement_AR", "Etablissement_FR") || ""),
      centre: cleanText(getColumn(row, "Centre Examen_AR", "Centre Examen_FR") || ""),
      birthPlace: cleanText(getColumn(row, "LIEUNN_AR", "LIEUN_FR") || ""),
      birthDate: cleanText(getColumn(row, "DATN") || ""),
      source: "bac_session",
      originalIndex: index,
    }))
    .filter((student) => student.id);

  const sorted = [...normalized].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  sorted.forEach((student, index) => {
    student.rank = index + 1;
  });

  return [...new Map(sorted.map((student) => [student.id, student])).values()];
}

function prepareConcoursStudents(rows) {
  const normalized = rows
    .map((row, index) => {
      const total = getColumn(row, "TOTAL");
      const totalNum = getColumn(row, "total_num");
      const rawWilaya = cleanText(getColumn(row, "WILAYA_AR") || "");
      return {
        id: String(getColumn(row, "Numéro_C1AS", "Numero_C1AS") ?? "").trim(),
        internalId: cleanText(getColumn(row, "NODOSS", "Noreg") || ""),
        noreg: cleanText(getColumn(row, "Noreg") || ""),
        name: cleanText(getColumn(row, "NOM_AR") || "اسم غير متوفر"),
        track: cleanText(getColumn(row, "TYPE") || "كونكور"),
        MOD: total,
        totalScore: totalNum !== "" ? parseAverage(totalNum) : parseAverage(total),
        kr: "",
        wl: normalizeWilayaLabel(rawWilaya),
        rawWilaya,
        moughataa: cleanText(getColumn(row, "MOUGHATAA_AR") || ""),
        ms: cleanText(getColumn(row, "Ecole_AR") || ""),
        centre: cleanText(getColumn(row, "Centre Examen_AR") || ""),
        birthPlace: cleanText(getColumn(row, "LIEU NAISS_AR") || ""),
        birthDate: cleanText(getColumn(row, "ANNEE_NAISS") || ""),
        type: cleanText(getColumn(row, "TYPE") || ""),
        source: "concours",
        originalIndex: index,
      };
    })
    .filter((student) => student.id);

  const sorted = [...normalized].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  sorted.forEach((student, index) => {
    student.rank = index + 1;
  });

  return [...new Map(sorted.map((student) => [student.id, student])).values()];
}

function logConcoursRows(context, rawRows, students) {
  const totals = students.map((student) => getAverage(student)).filter((value) => Number.isFinite(value));
  console.log("[MauriResults Concours]", {
    context,
    rawCount: rawRows.length,
    preparedCount: students.length,
    highestTotal: totals.length ? Math.max(...totals) : null,
    lowestTotal: totals.length ? Math.min(...totals) : null,
  });
}

function prepareExcellenceStudents(rows) {
  const normalized = rows
    .map((row, index) => ({
      id: String(getColumn(row, "Num_Excellence_1AS") ?? "").trim(),
      name: cleanText(getColumn(row, "Nom") || "اسم غير متوفر"),
      track: cleanText(getColumn(row, "SERIE") || "1AS"),
      MOD: getColumn(row, "Mgex"),
      kr: cleanText(getColumn(row, "Decision") || ""),
      wl: cleanText(getColumn(row, "Wilaya_AR") || ""),
      ms: "",
      centre: cleanText(getColumn(row, "CENTRE_AR") || ""),
      birthPlace: cleanText(getColumn(row, "Lieu") || ""),
      birthDate: cleanText(getColumn(row, "DATEN") || ""),
      matricule: cleanText(getColumn(row, "Matricule") || ""),
      arabicMark: cleanText(getColumn(row, "ARABE") || ""),
      frenchMark: cleanText(getColumn(row, "FRANCAIS") || ""),
      mathMark: cleanText(getColumn(row, "CALCUL") || ""),
      source: "excellence_1as",
      originalIndex: index,
    }))
    .filter((student) => student.id);

  const sorted = [...normalized].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  sorted.forEach((student, index) => {
    student.rank = index + 1;
  });

  return [...new Map(sorted.map((student) => [student.id, student])).values()];
}

function prepareBrevetStudents(rows) {
  const normalized = rows
    .map((row, index) => ({
      id: String(getColumn(row, "Num_Bepc", "num_bepc", "NUM_BEPC", "numero", "Numero") ?? "").trim(),
      name: cleanText(getColumn(row, "NOM", "nom", "Nom", "name") || "اسم غير متوفر"),
      ts: "BEPC",
      track: "BEPC",
      MOD: getColumn(row, "Moyenne_Bepc", "moyenne_bepc", "MOYENNE_BEPC"),
      kr: cleanText(getColumn(row, "Decision", "decision", "DECISION") || ""),
      wl: cleanText(getColumn(row, "WILAYA", "wilaya", "WL") || ""),
      ms: cleanText(getColumn(row, "Ecole", "ecole", "ECOLE", "MS") || ""),
      centre: cleanText(getColumn(row, "Centre", "centre", "CENTRE") || ""),
      birthPlace: cleanText(getColumn(row, "LIEU_NAIS", "lieu_nais") || ""),
      birthDate: cleanText(getColumn(row, "DATE_NAISS", "date_naiss") || ""),
      source: "brevet",
      originalIndex: index,
    }))
    .filter((student) => student.id);

  const sorted = [...normalized].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  sorted.forEach((student, index) => {
    student.rank = index + 1;
  });

  return [...new Map(sorted.map((student) => [student.id, student])).values()];
}

async function fetchAllResults() {
  const rows = [];
  let from = 0;

  while (true) {
    const batch = await supabaseRequest({
      select: "Numero,NOM,TS,MOD,KR,WL,MS,MD",
      limit: PAGE_SIZE,
      offset: from,
    }, BAC_TABLE);
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return prepareStudents(rows);
}

async function fetchBrevetResults() {
  const rows = [];
  let from = 0;

  while (true) {
    const batch = await supabaseRequest({
      select: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS",
      limit: PAGE_SIZE,
      offset: from,
    }, BREVET_TABLE);
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return prepareBrevetStudents(rows);
}

async function fetchBacSessionResults() {
  const rows = [];
  let from = 0;

  while (true) {
    const batch = await supabaseRequest({ select: "*", limit: PAGE_SIZE, offset: from }, BAC_SESSION_TABLE);
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return prepareBacSessionStudents(rows);
}

async function fetchConcoursResults() {
  const rows = await supabaseRequest({
    select: "*",
    order: "total_num.desc.nullslast",
    limit: 300,
  }, CONCOURS_VIEW);
  const students = prepareConcoursStudents(rows);
  logConcoursRows("top-global", rows, students);
  return students;
}

async function fetchConcoursLocations() {
  const rows = [];
  let from = 0;
  while (true) {
    const batch = await supabaseRequest({
      select: "*",
      limit: PAGE_SIZE,
      offset: from,
    }, CONCOURS_LOCATIONS_VIEW);
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  console.log("[MauriResults Concours Locations]", {
    rawCount: rows.length,
    wilayas: uniqueSorted(rows.map((row) => getColumn(row, "WILAYA_AR"))).length,
  });
  return rows;
}

async function fetchConcoursFilteredResults(field, value) {
  const columnByField = {
    wl: "WILAYA_AR",
    moughataa: "MOUGHATAA_AR",
    centre: "Centre Examen_AR",
    ms: "Ecole_AR",
    track: "TYPE",
  };
  const column = columnByField[field];
  if (!column || !value) return [];
  const filterValue = field === "wl"
    ? postgrestInFilter(concoursWilayaQueryValues(value))
    : `eq.${escapePostgrestValue(value)}`;

  const rows = [];
  let from = 0;
  let useView = true;
  while (true) {
    try {
      const batch = await supabaseRequest({
        select: "*",
        [column]: filterValue,
        order: useView ? "total_num.desc.nullslast" : "",
        limit: PAGE_SIZE,
        offset: from,
      }, useView ? CONCOURS_VIEW : CONCOURS_TABLE);
      rows.push(...batch);
      if (batch.length < PAGE_SIZE) break;
      from += PAGE_SIZE;
    } catch (error) {
      if (!useView || !isMissingConcoursView(error)) throw error;
      useView = false;
      rows.length = 0;
      from = 0;
    }
  }

  const students = prepareConcoursStudents(rows);
  logConcoursRows(`filtered:${field}`, rows, students);
  return students;
}

async function searchConcoursByLocation({ wilaya, wilayaValues = [], moughataa, centre, number }) {
  const numbers = concoursNumberSearchValues(number);
  const params = {
    select: "*",
    WILAYA_AR: postgrestInFilter(concoursWilayaQueryValues(wilaya, wilayaValues)),
    MOUGHATAA_AR: `eq.${escapePostgrestValue(moughataa)}`,
    "Centre Examen_AR": `eq.${escapePostgrestValue(centre)}`,
    or: `(${numbers.map((item) => `NODOSS.eq.${item}`).join(",")},${numbers.map((item) => `Numéro_C1AS.eq.${item}`).join(",")})`,
    limit: 20,
  };
  let rows;
  try {
    rows = await supabaseRequest({ ...params, order: "total_num.desc.nullslast" }, CONCOURS_VIEW);
  } catch (error) {
    if (!isMissingConcoursView(error)) throw error;
    rows = await supabaseRequest(params, CONCOURS_TABLE);
  }
  const students = prepareConcoursStudents(rows);
  logConcoursRows("location-search", rows, students);
  return students;
}

async function fetchExcellenceResults() {
  const rows = [];
  let from = 0;

  while (true) {
    const batch = await supabaseRequest({ select: "*", limit: PAGE_SIZE, offset: from }, EXCELLENCE_1AS_TABLE);
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return prepareExcellenceStudents(rows);
}

async function searchResults(query, exam) {
  if (!exam?.source || !TABLE_BY_SOURCE[exam.source]) {
    throw new Error("Missing selected exam.");
  }

  const value = escapePostgrestValue(query);
  const isNumeroSearch = /^[0-9A-Za-z-]+$/.test(query);
  console.log("[MauriResults Search]", {
    examId: exam.id,
    source: exam.source,
    table: TABLE_BY_SOURCE[exam.source],
    query: cleanText(query),
  });

  if (exam?.source === "brevet") {
    const numbers = numberSearchValues(query, 5);
    const rows = await supabaseRequest({
      select: "Num_Bepc,NOM,Moyenne_Bepc,Decision,Ecole,Centre,WILAYA,LIEU_NAIS,DATE_NAISS",
      or: isNumeroSearch ? `(${numbers.map((number) => `Num_Bepc.eq.${number}`).join(",")},NOM.ilike.*${value}*)` : "",
      NOM: isNumeroSearch ? "" : `ilike.*${value}*`,
      limit: 20,
    }, BREVET_TABLE);
    return prepareBrevetStudents(rows);
  }

  if (exam?.source === "concours") {
    const numbers = concoursNumberSearchValues(query);
    const params = {
      select: "*",
      or: isNumeroSearch ? `(${numbers.map((number) => `NODOSS.eq.${number}`).join(",")},${numbers.map((number) => `Numéro_C1AS.eq.${number}`).join(",")})` : `(NOM_AR.ilike.*${value}*)`,
      limit: 20,
    };
    let rows;
    try {
      rows = await supabaseRequest({ ...params, order: "total_num.desc.nullslast" }, CONCOURS_VIEW);
    } catch (error) {
      if (!isMissingConcoursView(error)) throw error;
      rows = await supabaseRequest(params, CONCOURS_TABLE);
    }
    const students = prepareConcoursStudents(rows);
    logConcoursRows("search", rows, students);
    return students;
  }

  if (exam?.source === "bac_session") {
    const numbers = numberSearchValues(query, 5);
    const rows = await supabaseRequest({
      select: "*",
      or: isNumeroSearch ? `(${numbers.map((number) => `NODOSS.eq.${number}`).join(",")},NOM_AR.ilike.*${value}*,NOM_FR.ilike.*${value}*)` : `(NOM_AR.ilike.*${value}*,NOM_FR.ilike.*${value}*)`,
      limit: 20,
    }, BAC_SESSION_TABLE);
    return prepareBacSessionStudents(rows);
  }

  if (exam?.source === "excellence_1as") {
    const numbers = numberSearchValues(query, 5);
    const rows = await supabaseRequest({
      select: "*",
      or: isNumeroSearch ? `(${numbers.map((number) => `Num_Excellence_1AS.eq.${number}`).join(",")},Nom.ilike.*${value}*)` : `(Nom.ilike.*${value}*)`,
      limit: 20,
    }, EXCELLENCE_1AS_TABLE);
    return prepareExcellenceStudents(rows);
  }

  const numbers = numberSearchValues(query, 5);
  const rows = await supabaseRequest({
    select: "Numero,NOM,TS,MOD,KR,WL,MS,MD",
    or: isNumeroSearch ? `(${numbers.map((number) => `Numero.eq.${number}`).join(",")},NOM.ilike.*${value}*)` : "",
    NOM: isNumeroSearch ? "" : `ilike.*${value}*`,
    limit: 20,
  }, BAC_TABLE);
  return prepareStudents(rows);
}

function calculateStats(students) {
  const total = students.length;
  const averages = students.map((student) => parseAverage(student.MOD));
  const isConcours = students.some((student) => student.source === "concours");
  const passed = isConcours ? 0 : students.filter((student) => getOfficialStatus(student.kr).className === "admis").length;
  const failed = isConcours ? 0 : students.filter((student) => getOfficialStatus(student.kr).className === "ajourne").length;
  const highest = total ? Math.max(...averages) : 0;
  const average = total ? averages.reduce((sum, value) => sum + value, 0) / total : 0;
  return { total, passed, failed, highest, average, isConcours };
}

function summarizeStudents(students, field) {
  const groups = new Map();
  const isConcours = students.some((student) => student.source === "concours");

  students.forEach((student) => {
    const key = cleanText(student[field]) || "غير محدد";
    const current = groups.get(key) || { label: key, total: 0, passed: 0, sum: 0, highest: 0 };
    const average = getAverage(student);
    current.total += 1;
    current.sum += average;
    current.highest = Math.max(current.highest, average);
    if (!isConcours && getOfficialStatus(student.kr).className === "admis") current.passed += 1;
    groups.set(key, current);
  });

  return [...groups.values()]
    .map((group) => ({
      ...group,
      average: group.total ? group.sum / group.total : 0,
      isConcours,
      passRate: group.total ? (group.passed / group.total) * 100 : 0,
    }))
    .sort((a, b) => isConcours ? (b.total - a.total || b.average - a.average) : (b.passed - a.passed || b.total - a.total || b.average - a.average))
    .slice(0, ANALYTICS_VIEW_LIMIT);
}

function groupStudentsByTrack(students) {
  const groups = new Map();
  students.forEach((student) => {
    const track = cleanText(student.track) || "غير محدد";
    if (!groups.has(track)) groups.set(track, []);
    groups.get(track).push(student);
  });

  return [...groups.entries()]
    .map(([track, groupStudents]) => ({
      track,
      students: [...groupStudents].sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex),
    }))
    .sort((a, b) => a.track.localeCompare(b.track, "ar"));
}

export default function HomePage() {
  const [students, setStudents] = useState([]);
  const [brevetStudents, setBrevetStudents] = useState([]);
  const [bacSessionStudents, setBacSessionStudents] = useState([]);
  const [concoursStudents, setConcoursStudents] = useState([]);
  const [excellenceStudents, setExcellenceStudents] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultLoading, setResultLoading] = useState(false);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [examLoading, setExamLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [resultPageOpen, setResultPageOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [theme, setThemeState] = useState("light");
  const [activeView, setActiveView] = useState("home");
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedTopperTrack, setSelectedTopperTrack] = useState("");
  const [analyticsMode, setAnalyticsMode] = useState("");
  const [siteContent, setSiteContent] = useState({});
  const [lang, setLang] = useState("ar");
  const [rankingTarget, setRankingTarget] = useState(null);
  const [analyticsViews, setAnalyticsViews] = useState({});
  const [analyticsLoadingSources, setAnalyticsLoadingSources] = useState({});

  const selectedExam = useMemo(() => EXAM_CARDS.find((exam) => exam.id === selectedExamId), [selectedExamId]);

  useEffect(() => {
    const saved = localStorage.getItem("mauriresults-theme");
    const savedLang = localStorage.getItem("mauriresults-lang");
    setTheme(saved || "light");
    setLang(savedLang || "ar");
    window.history.replaceState({ view: "home" }, "", window.location.pathname);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetchSiteContent().then((content) => {
      if (!ignore) setSiteContent(content);
    });
    return () => {
      ignore = true;
    };
  }, []);


  async function loadAnalyticsSource(source) {
    if (!source || analyticsViews[source] || analyticsLoadingSources[source]) return;

    setAnalyticsLoadingSources((current) => ({ ...current, [source]: true }));
    try {
      const data = await fetchAnalyticsViewSet(source);
      if (!data) return;
      setAnalyticsViews((current) => current[source] ? current : { ...current, [source]: data });
    } catch (error) {
      console.error(`[MauriResults Analytics Source Error] ${source}`, error);
    } finally {
      setAnalyticsLoadingSources((current) => ({ ...current, [source]: false }));
    }
  }

  useEffect(() => {
    loadAnalyticsSource("bac");
  }, []);

  useEffect(() => {
    if (selectedExam?.source) loadAnalyticsSource(selectedExam.source);
  }, [selectedExam?.source]);

  useEffect(() => {
    const favicon = contentValue(siteContent, "favicon");
    if (!favicon) return;
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = favicon;
  }, [siteContent]);

  useEffect(() => {
    function handlePopState(event) {
      const view = event.state?.view || "home";
      setActiveView(view);
      if (view !== "result") {
        setResultPageOpen(false);
        setSelectedStudent(null);
      }
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  function setTheme(nextTheme) {
    setThemeState(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    localStorage.setItem("mauriresults-theme", nextTheme);
  }

  function toggleLang() {
    const nextLang = lang === "ar" ? "fr" : "ar";
    setLang(nextLang);
    localStorage.setItem("mauriresults-lang", nextLang);
  }

  const activeStudents = selectedExam?.source === "brevet"
    ? brevetStudents
    : selectedExam?.source === "bac_session"
      ? bacSessionStudents
      : selectedExam?.source === "concours"
        ? concoursStudents
        : selectedExam?.source === "excellence_1as"
          ? excellenceStudents
          : students;
  const text = UI_TEXT[lang];
  const homeStats = useMemo(() => analyticsViews.bac?.stats || calculateStats(students), [analyticsViews.bac?.stats, students]);
  const rankingStudents = useMemo(() => {
    if (!rankingTarget) return [];
    const target = normalizeComparable(rankingTarget.value);
    return activeStudents
      .filter((student) => normalizeComparable(student[rankingTarget.field]) === target)
      .sort((a, b) => getAverage(b) - getAverage(a) || a.originalIndex - b.originalIndex);
  }, [activeStudents, rankingTarget]);
  const searchPool = useMemo(() => {
    return activeStudents;
  }, [activeStudents]);
  const showTrackGroups = examHasTrackGroups(selectedExam?.source);
  const showTopperTrackSelector = selectedExam?.source === "bac";
  const topperTrackOptions = useMemo(() => {
    if (!showTopperTrackSelector) return [];
    return [...new Set(searchPool.map((student) => cleanText(student.track)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
  }, [searchPool, showTopperTrackSelector]);
  const viewsReady = Object.keys(analyticsViews).length > 0;
  const selectedSourceViewsReady = selectedExam?.source ? !!analyticsViews[selectedExam.source] : viewsReady;
  const selectedSourceLoading = selectedExam?.source ? !!analyticsLoadingSources[selectedExam.source] && !selectedSourceViewsReady : !viewsReady;
  const viewStats = analyticsViews[selectedExam?.source] || {};
  const analyticsOptions = useMemo(() => analyticsModeOptions(selectedExam?.source, text), [selectedExam?.source, text]);
  const activeAnalyticsMode = analyticsOptions.some((option) => option.id === analyticsMode) ? analyticsMode : analyticsOptions[0]?.id || "";
  const activeStats = useMemo(() => viewStats.stats || calculateStats(searchPool), [viewStats, searchPool]);
  const activeRegionStats = useMemo(() => viewStats.regionStats || summarizeStudents(searchPool, "wl"), [viewStats, searchPool]);
  const activeTrackStats = useMemo(() => {
    if (viewStats.trackStats?.length) return viewStats.trackStats;
    return showTrackGroups ? summarizeStudents(searchPool, "track") : [];
  }, [viewStats, searchPool, showTrackGroups]);
  const activeSchoolStats = useMemo(() => viewStats.schoolStats || summarizeStudents(searchPool, "ms"), [viewStats, searchPool]);
  const activeMoughataaStats = useMemo(() => viewStats.moughataaStats || summarizeStudents(searchPool, "moughataa"), [viewStats, searchPool]);
  const selectedAnalyticsRows = activeAnalyticsMode === "track"
    ? activeTrackStats
    : activeAnalyticsMode === "school"
      ? activeSchoolStats
      : activeAnalyticsMode === "moughataa"
        ? activeMoughataaStats
        : activeRegionStats;
  const selectedAnalyticsTitle = analyticsOptions.find((option) => option.id === activeAnalyticsMode)?.label || text.byRegions;
  const selectedAnalyticsIcon = activeAnalyticsMode === "track"
    ? <BookIcon />
    : activeAnalyticsMode === "school"
      ? <SchoolIcon />
      : <MapIcon />;
  const suggestions = useMemo(() => {
    const value = cleanText(query).toLowerCase();
    if (!selectedExam?.available || selectedExam.source === "concours" || value.length < 2 || resultPageOpen || matches.length) return [];
    return searchPool
      .filter((student) => cleanText(student.id).toLowerCase().includes(value) || cleanText(student.name).toLowerCase().includes(value))
      .slice(0, 5);
  }, [matches.length, query, resultPageOpen, searchPool, selectedExam]);
  const topperGroups = useMemo(() => {
    const topStudents = viewStats.topStudents?.length ? viewStats.topStudents : searchPool;
    return groupTopStudentsByTrackFromViews(topStudents, {
      showTrackGroups,
      selectedTrack: selectedTopperTrack,
      allowTrackFilter: showTopperTrackSelector,
      text,
    });
  }, [viewStats, searchPool, selectedTopperTrack, showTopperTrackSelector, showTrackGroups, text]);

  function showStudent(student) {
    const known = activeStudents.find((item) => item.id === student.id);
    setMatches([]);
    setSelectedStudent(null);
    setResultPageOpen(false);
    setResultLoading(true);
    window.setTimeout(() => {
      setSelectedStudent(known || student);
      setResultLoading(false);
      setResultPageOpen(true);
      setActiveView("result");
      window.history.pushState({ view: "result" }, "", "#result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 520);
  }

  async function handleSubmit(event) {
    event?.preventDefault();
    setError("");
    setMessage("");
    setMatches([]);
    setSelectedStudent(null);
    setResultPageOpen(false);
    setResultLoading(false);

    if (!selectedExam?.source) {
      setActiveView("year");
      setError(text.chooseExamFirst);
      window.history.pushState({ view: "year" }, "", "#year-2025");
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
      return;
    }

    const value = query.trim();
    if (!value) {
      setError(text.enterQuery);
      return;
    }
    if (value.length < 2) {
      setError(text.shortQuery);
      return;
    }

    setLoading(true);
    try {
      const rows = await searchResults(value, selectedExam);
      const found = rows.map((student) => {
        const known = searchPool.find((item) => item.id === student.id);
        return known ? { ...student, rank: known.rank } : student;
      }).filter((student) => selectedExam?.filter === "sessionnaire" ? getOfficialStatus(student.kr).className === "sessionnaire" : true);

      if (!found.length) {
        setError(selectedExam?.filter === "sessionnaire" ? text.sessionNotFound : text.notFound);
        return;
      }

      if (found.length === 1) showStudent(found[0]);
      else setMatches(found);
    } catch (error) {
      console.error("[MauriResults Search Error]", error);
      setError(isMissingSupabaseEnv(error) ? text.missingEnv : text.connectionError);
    } finally {
      setLoading(false);
    }
  }

  function shareResult(student) {
    const shareText = getResultShareText(student, text);
    if (navigator.share) {
      navigator.share({ title: text.examResultTitle, text: shareText, url: getResultUrl(student) }).catch(() => {});
      return;
    }
    navigator.clipboard?.writeText(shareText);
    setMessage(text.copiedShare);
  }

  function selectStudent(student) {
    showStudent(student);
  }

  function isExamDataLoaded(exam) {
    if (!exam) return false;
    if (exam.source === "bac") return students.length > 0;
    if (exam.source === "brevet") return brevetStudents.length > 0;
    if (exam.source === "bac_session") return bacSessionStudents.length > 0;
    if (exam.source === "concours") return concoursStudents.length > 0;
    if (exam.source === "excellence_1as") return excellenceStudents.length > 0;
    return false;
  }

  async function loadExamData(exam) {
    if (!exam) return [];
    console.log("[MauriResults Load Exam Data]", {
      examId: exam.id,
      source: exam.source,
      table: TABLE_BY_SOURCE[exam.source],
      alreadyLoaded: isExamDataLoaded(exam),
    });
    if (isExamDataLoaded(exam)) {
      if (exam.source === "bac") return students;
      if (exam.source === "brevet") return brevetStudents;
      if (exam.source === "bac_session") return bacSessionStudents;
      if (exam.source === "concours") return concoursStudents;
      if (exam.source === "excellence_1as") return excellenceStudents;
      return [];
    }
    const loaders = {
      bac: { load: fetchAllResults, set: setStudents },
      brevet: { load: fetchBrevetResults, set: setBrevetStudents },
      bac_session: { load: fetchBacSessionResults, set: setBacSessionStudents },
      concours: { load: fetchConcoursResults, set: setConcoursStudents },
      excellence_1as: { load: fetchExcellenceResults, set: setExcellenceStudents },
    };
    const loader = loaders[exam.source];
    if (!loader) return [];
    setExamLoading(true);
    try {
      const rows = await loader.load();
      loader.set(rows);
      return rows;
    } catch (error) {
      setError(isMissingSupabaseEnv(error) ? text.missingEnv : text.connectionError);
      return [];
    } finally {
      setExamLoading(false);
    }
  }

  async function openView(view) {
    if (view === "exam" && !selectedExamId) {
      setActiveView("year");
      window.history.pushState({ view: "year" }, "", "#year-2025");
      window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
      return;
    }
    setActiveView(view);
    if (view !== "result") setResultPageOpen(false);
    window.history.pushState({ view }, "", view === "home" ? window.location.pathname : `#${view}`);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
    if (view === "exam" && selectedExam) {
      await loadExamData(selectedExam);
    }
  }

  function openYear(year) {
    if (!year.available) return;
    setActiveView("year");
    setMatches([]);
    setError("");
    setMessage("");
    window.history.pushState({ view: "year" }, "", "#year-2025");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  async function openExam(exam) {
    console.log("[MauriResults Select Exam]", {
      examId: exam.id,
      source: exam.source,
      table: TABLE_BY_SOURCE[exam.source],
    });
    setSelectedExamId(exam.id);
    setSelectedTopperTrack("");
    setMatches([]);
    setSelectedStudent(null);
    setResultPageOpen(false);
    setError("");
    setMessage("");
    setActiveView("exam");
    loadAnalyticsSource(exam.source);
    window.history.pushState({ view: "exam" }, "", `#${exam.id}`);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);

  }

  async function selectExamForSection(examId) {
    const exam = EXAM_CARDS.find((item) => item.id === examId);
    if (!exam?.available) return;
    setSelectedExamId(exam.id);
    setSelectedTopperTrack("");
    setMatches([]);
    setSelectedStudent(null);
    setResultPageOpen(false);
    setError("");
    setMessage("");
    setAnalyticsMode("");
    loadAnalyticsSource(exam.source);
  }

  async function openRanking(field, value, label) {
    if (!value || value === "غير متوفرة") return;
    if (selectedExam?.source === "concours") {
      setExamLoading(true);
      try {
        const rows = await fetchConcoursFilteredResults(field, value);
        setConcoursStudents(rows);
      } catch (error) {
        setError(isMissingSupabaseEnv(error) ? text.missingEnv : text.connectionError);
      } finally {
        setExamLoading(false);
      }
    } else {
      await loadExamData(selectedExam);
    }
    setRankingTarget({ field, value, label });
    setActiveView("ranking");
    window.history.pushState({ view: "ranking" }, "", "#ranking");
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
    <m.main className="app-background min-h-screen pb-20 text-mauri-ink dark:text-white md:pb-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.32, ease: "easeOut" }}>
      <Header activeView={activeView} content={siteContent} lang={lang} onNavigate={openView} onToggleLang={toggleLang} text={text} theme={theme} setTheme={setTheme} />

      {activeView === "home" && (
        <HomeView
          dashboardLoading={dashboardLoading}
          error={error}
          handleSubmit={handleSubmit}
          loading={loading}
          matches={matches}
          message={message}
          lang={lang}
          content={siteContent}
          homepageBanner={imageAsset(siteContent, "home_banner_image")}
          onSelectYear={openYear}
          onSelectExam={openExam}
          onPickSuggestion={(student) => { setQuery(student.id); showStudent(student); }}
          onSelect={selectStudent}
          query={query}
          selectedExam={selectedExam}
          selectedExamId={selectedExamId}
          setQuery={setQuery}
          stats={homeStats}
          suggestions={suggestions}
          text={text}
        />
      )}

      {activeView === "year" && <YearPage lang={lang} onSelectExam={openExam} selectedExamId={selectedExamId} text={text} />}
      {activeView === "exam" && selectedExam && <ExamPage error={error} exam={selectedExam} handleSubmit={handleSubmit} lang={lang} loading={loading || examLoading} matches={matches} message={message} onPickSuggestion={(student) => { setQuery(student.id); showStudent(student); }} onSelect={selectStudent} query={query} searchPool={searchPool} setQuery={setQuery} suggestions={suggestions} text={text} />}
      {activeView === "toppers" && <ToppersPage groups={topperGroups} lang={lang} loading={selectedSourceLoading} onSelect={selectStudent} onSelectExam={selectExamForSection} onSelectTrack={setSelectedTopperTrack} selectedExam={selectedExam} selectedExamId={selectedExamId} selectedTrack={selectedTopperTrack} showTrackGroups={showTrackGroups} showTrackSelector={showTopperTrackSelector} text={text} trackOptions={topperTrackOptions} />}
      {activeView === "analytics" && <AnalyticsPage analyticsMode={activeAnalyticsMode} analyticsOptions={analyticsOptions} components={{ PageHero, ExamSelector, StatsStrip, AnalyticsModeSelector, StatsTable, EmptyChoice, ChartIcon }} lang={lang} loading={selectedSourceLoading} onSelectAnalyticsMode={setAnalyticsMode} onSelectExam={selectExamForSection} rows={selectedAnalyticsRows} selectedExam={selectedExam} selectedExamId={selectedExamId} stats={activeStats} tableIcon={selectedAnalyticsIcon} tableTitle={selectedAnalyticsTitle} text={text} />}
      {activeView === "ranking" && rankingTarget && <RankingPage lang={lang} onSelect={selectStudent} rankingTarget={rankingTarget} students={rankingStudents} text={text} />}
      {activeView === "result" && selectedStudent && <ResultExperience content={siteContent} lang={lang} onOpenRanking={openRanking} resultBanner={imageAsset(siteContent, "result_card_image")} student={selectedStudent} onClose={() => openView("home")} onShare={shareResult} text={text} />}

      {activeView === "home" && <Footer content={siteContent} onNavigate={openView} text={text} />}
      <FloatingActionButton onNavigate={openView} text={text} />
      <BottomNav activeView={activeView} onNavigate={openView} text={text} />
      <Toaster richColors position="top-center" dir="rtl" toastOptions={{ duration: 4200 }} />
      {resultLoading && <ResultLoadingOverlay text={text} />}
    </m.main>
      </MotionConfig>
    </LazyMotion>
  );
}

function HomeView({ homepageBanner, lang, onSelectYear, stats, text }) {
  return (
    <PremiumHomeView
      homepageBanner={homepageBanner}
      lang={lang}
      onSelectYear={onSelectYear}
      stats={stats}
      text={text}
      yearCards={YEAR_CARDS}
    />
  );
}

function YearCards({ lang, onSelectYear, text }) {
  return (
    <section className="grid grid-cols-2 gap-3 md:gap-4">
      {YEAR_CARDS.map((year) => (
        <button
          className={`exam-card exam-card-${year.tone} ${year.available ? "" : "is-locked"}`}
          disabled={!year.available}
          key={year.id}
          onClick={() => onSelectYear(year)}
          type="button"
        >
          <span className="exam-card-icon">{year.icon}</span>
          <span className="min-w-0 text-start">
            <strong className="block text-base font-black text-slate-950 dark:text-white">{year.title[lang]}</strong>
            <small className="mt-1 block text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">{year.description[lang]}</small>
          </span>
          {!year.available && <span className="soon-badge">{text.soon}</span>}
        </button>
      ))}
    </section>
  );
}

function SiteBanner({ asset }) {
  if (!asset?.is_active || !asset?.image_url) return null;

  return (
    <m.figure
      className="site-banner"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
    >
      <img
        src={asset.image_url}
        alt=""
        loading="lazy"
        onError={(event) => {
          event.currentTarget.closest(".site-banner")?.remove();
        }}
      />
    </m.figure>
  );
}

function YearPage({ lang, onSelectExam, selectedExamId, text }) {
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.chooseExam} title={text.yearPageTitle} description={text.yearPageDesc} icon={<GraduationIcon />} />
      <CompetitionCards lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />
    </section>
  );
}

function CompetitionCards({ lang, onSelectExam, selectedExamId, text }) {
  return (
    <section className="grid grid-cols-2 gap-3">
      {EXAM_CARDS.map((exam) => (
        <button
          className={`exam-card exam-card-${exam.tone} ${selectedExamId === exam.id ? "is-selected" : ""} ${exam.available ? "" : "is-locked"}`}
          key={exam.id}
          onClick={() => exam.available && onSelectExam(exam)}
          type="button"
          disabled={!exam.available}
        >
          <span className="exam-card-icon">{exam.icon}</span>
          <span className="min-w-0 text-start">
            <strong className="block text-base font-black text-slate-950 dark:text-white">{exam.title[lang]}</strong>
            <small className="mt-1 block text-xs font-bold leading-5 text-slate-500 dark:text-slate-400">{exam.description[lang]}</small>
          </span>
          {!exam.available && <span className="soon-badge">{text.soon}</span>}
        </button>
      ))}
    </section>
  );
}

function ExamPage({ error, exam, handleSubmit, lang, loading, matches, message, onPickSuggestion, onSelect, query, searchPool, setQuery, suggestions, text }) {
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.search} title={exam.title[lang]} description={text.examPageDesc} icon={exam.icon} />
      <section className="scroll-mt-20" id="resultArea">
        {exam.source === "concours" ? (
          <ConcoursSearchPanel onSelect={onSelect} text={text} />
        ) : (
          <SearchPanel error={error} examTitle={exam.title[lang]} handleSubmit={handleSubmit} loading={loading} message={message} onPickSuggestion={onPickSuggestion} query={query} setQuery={setQuery} suggestions={suggestions} text={text} />
        )}
        {loading && <ResultLoadingCard text={text} />}
        {exam.source !== "concours" && !loading && matches.length > 0 && <MatchesList matches={matches} onSelect={onSelect} text={text} />}
      </section>
    </section>
  );
}

function RankingPage({ onSelect, rankingTarget, students, text }) {
  const trackGroups = useMemo(() => groupStudentsByTrack(students), [students]);

  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.ranking} title={rankingTarget.value} description={text.rankingDesc} icon={rankingTarget.field === "ms" ? <SchoolIcon /> : <MapIcon />} />
      <TrackGroupsPreview groups={trackGroups} onSelect={onSelect} text={text} />
    </section>
  );
}

function uniqueSorted(values) {
  return [...new Set(values.map(cleanText).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ar"));
}

function ConcoursSearchPanel({ onSelect, text }) {
  const [wilaya, setWilaya] = useState("");
  const [moughataa, setMoughataa] = useState("");
  const [centre, setCentre] = useState("");
  const [number, setNumber] = useState("");
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [localError, setLocalError] = useState("");

   useEffect(() => {
    let ignore = false;
    setLoading(true);
     fetchConcoursLocations()
      .then((rows) => {
        if (!ignore) setLocations(rows);
      })
      .catch((error) => {
        console.error("[MauriResults Concours Locations Error]", error);
        if (!ignore) setLocalError(text.connectionError);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
     });
     return () => {
      ignore = true;
    };
  }, [text.connectionError]);

  const wilayas = useMemo(() => uniqueSorted(locations.map((row) => normalizeWilayaLabel(getColumn(row, "WILAYA_AR")))), [locations]);
  const wilayaRawValues = useMemo(() => uniqueSorted(locations
    .filter((row) => normalizeComparable(normalizeWilayaLabel(getColumn(row, "WILAYA_AR"))) === normalizeComparable(wilaya))
    .map((row) => getColumn(row, "WILAYA_AR"))), [locations, wilaya]);
  const moughataas = useMemo(() => uniqueSorted(locations
    .filter((row) => normalizeComparable(normalizeWilayaLabel(getColumn(row, "WILAYA_AR"))) === normalizeComparable(wilaya))
    .map((row) => getColumn(row, "MOUGHATAA_AR"))), [locations, wilaya]);
  const centres = useMemo(() => uniqueSorted(locations
    .filter((row) => normalizeComparable(normalizeWilayaLabel(getColumn(row, "WILAYA_AR"))) === normalizeComparable(wilaya) && normalizeComparable(getColumn(row, "MOUGHATAA_AR")) === normalizeComparable(moughataa))
    .map((row) => getColumn(row, "Centre Examen_AR"))), [locations, moughataa, wilaya]);

  async function submit(event) {
    event.preventDefault();
    setLocalError("");
    if (!wilaya || !moughataa || !centre || !number.trim()) {
      setLocalError(text.enterQuery);
      return;
    }

    setSearching(true);
    try {
      const results = await searchConcoursByLocation({ wilaya, wilayaValues: wilayaRawValues, moughataa, centre, number });
      if (!results.length) {
        setLocalError(text.notFound);
        return;
      }
      onSelect(results[0]);
    } catch (error) {
      console.error("[MauriResults Concours Search Error]", error);
      setLocalError(text.connectionError);
    } finally {
      setSearching(false);
    }
  }

  const busy = loading || searching;

  return (
    <form className="search-card animate-slide-up" onSubmit={submit}>
      <SelectField disabled={busy} label={text.chooseWilaya} onChange={(value) => { setWilaya(value); setMoughataa(""); setCentre(""); }} options={wilayas} value={wilaya} />
      <SelectField disabled={busy || !wilaya} label={text.chooseMoughataa} onChange={(value) => { setMoughataa(value); setCentre(""); }} options={moughataas} value={moughataa} />
      <SelectField disabled={busy || !moughataa} label={text.chooseCentre} onChange={setCentre} options={centres} value={centre} />
      <label className="grid gap-1">
        <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-400">{text.candidateNumber}</span>
        <input className="search-input pr-4" disabled={busy || !centre} onChange={(event) => setNumber(event.target.value)} placeholder={text.candidateNumber} value={number} />
      </label>
      <button className="tap-button h-12 rounded-[16px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(21,128,61,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(21,128,61,.28)] active:scale-[.98] disabled:cursor-wait disabled:opacity-70" disabled={busy} type="submit">
        {busy ? text.searching : text.searchButton}
      </button>
      {localError && <p className="col-span-full text-center text-xs font-black text-red-600 dark:text-red-300 md:text-start">{localError}</p>}
    </form>
  );
}

function SelectField({ disabled, label, onChange, options, value }) {
  return (
    <label className="grid gap-1">
      <span className="px-1 text-[11px] font-black text-slate-500 dark:text-slate-400">{label}</span>
      <Select.Root disabled={disabled} onValueChange={onChange} value={value || undefined}>
        <Select.Trigger className="search-input flex items-center justify-between pr-4 text-start" aria-label={label}>
          <Select.Value placeholder={label} />
          <Select.Icon className="text-mauri-green">
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content" position="popper" sideOffset={6}>
            <Select.Viewport className="p-1">
              {options.map((option) => (
                <Select.Item className="select-item" value={option} key={option}>
                  <Select.ItemText>{option}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </label>
  );
}

function TrackGroupsPreview({ groups, onSelect, text }) {
  return (
    <section className="grid gap-3">
      {groups.length ? groups.map((group) => (
        <section className="analytics-panel animate-slide-up" key={group.track}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-black text-slate-950 dark:text-white">{group.track}</h2>
            <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">{group.students.length.toLocaleString("ar-MR")}</span>
          </div>
          <div className="grid gap-2">
            {group.students.slice(0, 12).map((student, index) => (
              <button className="ranking-row" key={student.id} onClick={() => onSelect(student)} type="button">
                <span className="grid h-9 w-9 place-items-center rounded-[14px] bg-mauri-green/10 text-sm font-black text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">#{index + 1}</span>
                <span className="min-w-0 text-start">
                  <strong className="line-clamp-1 block text-sm font-black text-slate-950 dark:text-white">{student.name}</strong>
                  <small className="line-clamp-1 text-xs font-bold text-slate-500 dark:text-slate-400">{student.id} - {student.ms || text.unavailable}</small>
                </span>
                <strong className="text-lg font-black text-mauri-green dark:text-mauri-gold">{formatScore(student, text)}</strong>
              </button>
            ))}
          </div>
        </section>
      )) : <p className="rounded-[18px] border border-mauri-border bg-white p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-400">{text.noData}</p>}
    </section>
  );
}

function ExamSelector({ lang, onSelectExam, selectedExamId, text }) {
  return (
    <section className="section-toolbar animate-slide-up">
      <Select.Root onValueChange={onSelectExam} value={selectedExamId || undefined}>
        <Select.Trigger className="exam-selector-trigger" aria-label={text.chooseExam}>
          <span className="flex items-center gap-2">
            <GraduationIcon />
            <Select.Value placeholder={text.chooseExam} />
          </span>
          <Select.Icon className="text-mauri-green">
            <ChevronDownIcon />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="select-content" position="popper" sideOffset={6}>
            <Select.Viewport className="p-1">
              {EXAM_CARDS.filter((exam) => exam.available).map((exam) => (
                <Select.Item className="select-item" value={exam.id} key={exam.id}>
                  <Select.ItemText>{exam.title[lang]}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </section>
  );
}

function TrackSelector({ onSelectTrack, selectedTrack, text, trackOptions }) {
  if (!trackOptions.length) return null;

  return (
    <section className="stream-filter-row animate-slide-up">
      <button className={`stream-filter-chip ${!selectedTrack ? "is-active" : ""}`} onClick={() => onSelectTrack("")} type="button">
        {text.allTracks || "كل الشعب"}
      </button>
      {trackOptions.map((track) => (
        <button className={`stream-filter-chip ${selectedTrack === track ? "is-active" : ""}`} onClick={() => onSelectTrack(track)} type="button" key={track}>
          {track}
        </button>
      ))}
    </section>
  );
}

function ToppersPage({ groups, lang, loading, onSelect, onSelectExam, onSelectTrack, selectedExam, selectedExamId, selectedTrack, showTrackGroups, showTrackSelector, text, trackOptions }) {
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.toppers} title={text.toppersTitle} icon={<AwardIcon />} />
      <ExamSelector lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />
      {showTrackSelector && <TrackSelector onSelectTrack={onSelectTrack} selectedTrack={selectedTrack} text={text} trackOptions={trackOptions} />}
      {selectedExam ? <ToppersSection loading={loading} onSelect={onSelect} groups={groups} showTrackGroups={showTrackGroups} text={text} /> : null}
    </section>
  );
}

function LegacyAnalyticsPage({ analyticsMode, analyticsOptions, lang, loading, onSelectAnalyticsMode, onSelectExam, rows, selectedExam, selectedExamId, stats, tableIcon, tableTitle, text }) {
  return (
    <section className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
      <PageHero eyebrow={text.analytics} title={text.analyticsTitle} icon={<ChartIcon />} />
      <ExamSelector lang={lang} onSelectExam={onSelectExam} selectedExamId={selectedExamId} text={text} />
      {selectedExam ? (
        <>
          <StatsStrip loading={loading} stats={stats} text={text} />
          <AnalyticsModeSelector modes={analyticsOptions} selectedMode={analyticsMode} onSelect={onSelectAnalyticsMode} />
          <StatsTable icon={tableIcon} isConcours={stats.isConcours} loading={loading} rows={rows} text={text} title={tableTitle} />
        </>
      ) : null}
    </section>
  );
}

function AnalyticsModeSelector({ modes, selectedMode, onSelect }) {
  if (!modes?.length) return null;
  return (
    <section className="stream-filter-row animate-slide-up">
      {modes.map((mode) => (
        <button className={`stream-filter-chip ${selectedMode === mode.id ? "is-active" : ""}`} onClick={() => onSelect(mode.id)} type="button" key={mode.id}>
          {mode.label}
        </button>
      ))}
    </section>
  );
}

function EmptyChoice({ text }) {
  return (
    <section className="empty-state animate-slide-up">
      <div className="empty-illustration">
        <img src="/images/empty-state.png" alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        <SearchIcon />
      </div>
      <div>
        <h2>{text.chooseExam}</h2>
        <p>{text.chooseExamFirst}</p>
      </div>
    </section>
  );
}

function PageHero({ description, eyebrow, icon, title }) {
  return (
    <section className="page-hero animate-slide-up">
      <span className="grid h-12 w-12 place-items-center rounded-[18px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
      <div>
        <p className="text-xs font-black text-mauri-green dark:text-mauri-gold">{eyebrow}</p>
        <h1 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white md:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">{description}</p>}
      </div>
    </section>
  );
}

function StatsTable({ icon, isConcours, loading, rows, text, title }) {
  return (
    <section className="analytics-panel animate-slide-up">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-[14px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
        <h2 className="text-base font-black text-slate-950 dark:text-white">{title}</h2>
      </div>
      <div className="grid gap-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => <span className="skeleton h-12 rounded-[16px]" key={index} />)
        ) : rows.length ? (
          rows.map((row) => <StatsRow isConcours={isConcours} row={row} text={text} key={row.label} />)
        ) : (
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{text.noData}</p>
        )}
      </div>
    </section>
  );
}

function StatsRow({ isConcours, row, text }) {
  return (
    <article className="analytics-row">
      <div className="min-w-0">
        <strong className="line-clamp-1 block text-sm font-black text-slate-950 dark:text-white">{row.label}</strong>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {isConcours ? `${text.participants} ${row.total.toLocaleString("ar-MR")} - ${text.highestScore} ${row.highest.toFixed(2)}` : `${text.passedOf} ${row.passed.toLocaleString("ar-MR")} ${text.from} ${row.total.toLocaleString("ar-MR")}`}
        </span>
      </div>
      <div className="text-left">
        <strong className="block text-sm font-black text-mauri-green dark:text-mauri-gold">{row.average.toFixed(2)}</strong>
        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">{isConcours ? text.averageScore : `${(row.passRate || 0).toFixed(1)}%`}</span>
      </div>
    </article>
  );
}

function LegacyHeader({ activeView, content, lang, onNavigate, onToggleLang, text, theme, setTheme }) {
  const navItems = [
    { label: text.home, view: "home" },
    { label: text.toppers, view: "toppers" },
    { label: text.analytics, view: "analytics" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-mauri-border/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
      <nav className="app-shell flex h-14 items-center justify-between gap-3">
        <button className="flex min-w-0 items-center gap-2.5 text-start" onClick={() => onNavigate("home")} type="button">
          <LogoMark className="h-9 w-9 rounded-[14px]" src={contentValue(content, "logo", "/logo.png")} />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-black tracking-tight">MauriResults</strong>
            <small className="block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">{text.platformSubtitle}</small>
          </span>
        </button>
        <div className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <button className={`nav-link ${activeView === item.view ? "bg-mauri-green/10 text-mauri-green" : ""}`} onClick={() => onNavigate(item.view)} type="button" key={item.view}>
              {item.label}
            </button>
          ))}
        </div>
        <button className="icon-button h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} type="button" aria-label="تبديل الوضع الليلي">
          {theme === "dark" ? <MoonIcon /> : <SunIcon />}
        </button>
        <button className="lang-button" onClick={onToggleLang} type="button" aria-label="Changer la langue">
          {lang === "ar" ? "FR" : "AR"}
        </button>
      </nav>
    </header>
  );
}

function Hero({ content, text }) {
  const heroBackground = contentValue(content, "hero_background");
  const logo = contentValue(content, "logo", "/logo.png");

  return (
    <section className="compact-hero hero-logo-panel animate-slide-up">
      {heroBackground && <img className="hero-background-image" src={heroBackground} alt="" loading="lazy" />}
      <div className="hero-logo-glow">
        <LogoMark className="h-28 w-28 rounded-[30px] md:h-36 md:w-36" src={logo} />
      </div>
      <div className="grid gap-2 text-center">
        <p className="mx-auto w-fit rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1 text-xs font-black text-mauri-green dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">{text.platformSubtitle}</p>
        <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-950 dark:text-white sm:text-5xl">{text.heroTitle}</h1>
        <p className="mx-auto max-w-xl text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">{text.heroDesc}</p>
      </div>
    </section>
  );
}

function LegacySearchPanel({ error, examTitle, handleSubmit, loading, message, onPickSuggestion, query, setQuery, suggestions, text }) {
  const [focused, setFocused] = useState(false);
  const visibleSuggestions = focused && suggestions.length > 0;

  function pickSuggestion(student) {
    setFocused(false);
    onPickSuggestion(student);
  }

  return (
    <form onSubmit={(event) => { setFocused(false); handleSubmit(event); }} className="search-card animate-slide-up">
      <div className="col-span-full flex items-center justify-between gap-2 px-1">
        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">{examTitle}</span>
        <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green dark:text-emerald-300">{text?.open || "البحث مفتوح"}</span>
      </div>
      <div className="relative min-w-0 flex-1">
        <label className="relative block">
          <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-mauri-green dark:text-mauri-gold" aria-hidden="true">
            <SearchIcon />
          </span>
          <input
            className="search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onBlur={() => window.setTimeout(() => setFocused(false), 140)}
            onFocus={() => setFocused(true)}
            placeholder={text?.searchPlaceholder || "أدخل رقم المترشح أو الاسم الكامل"}
          />
        </label>
        {visibleSuggestions && (
          <div className="suggestions-panel">
            {suggestions.map((student) => (
              <button className="suggestion-item" key={student.id} onMouseDown={(event) => event.preventDefault()} onClick={() => pickSuggestion(student)} type="button">
                <span className="min-w-0 text-start">
                  <strong className="line-clamp-1 block">{student.name}</strong>
                  <small className="line-clamp-1 text-slate-500 dark:text-slate-400">{student.id}{examHasTrackGroups(student.source) ? ` - ${student.track}` : ""}</small>
                </span>
                <span className="rounded-full bg-mauri-green/10 px-2 py-1 text-xs font-black text-mauri-green">{parseAverage(student.MOD).toFixed(2)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button className="tap-button h-12 rounded-[16px] bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 px-5 text-sm font-black text-white shadow-[0_16px_35px_rgba(21,128,61,.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(21,128,61,.28)] active:scale-[.98] disabled:cursor-wait disabled:opacity-70" type="submit" disabled={loading}>
        {loading ? (text?.searching || "بحث...") : (text?.searchButton || "بحث")}
      </button>
      {(error || message) && (
        <p className={`col-span-full text-center text-xs font-black md:text-start ${error ? "text-red-600 dark:text-red-300" : "text-mauri-green dark:text-mauri-gold"}`}>{error || message}</p>
      )}
    </form>
  );
}

function StatsStrip({ loading, stats, text = UI_TEXT.ar }) {
  const cards = stats.isConcours
    ? [
      { label: text.participants, value: stats.total, icon: <GraduationIcon /> },
      { label: text.highestScore, value: stats.highest, decimals: 2, icon: <TrendingIcon /> },
      { label: text.averageScore, value: stats.average, decimals: 2, icon: <ChartIcon /> },
    ]
    : [
      { label: text.studentCount, value: stats.total, icon: <GraduationIcon /> },
      { label: text.passedCount, value: stats.passed, icon: <CheckCircleIcon /> },
      { label: text.highestAverage, value: stats.highest, decimals: 2, icon: <TrendingIcon /> },
      { label: text.averageLabel, value: stats.average, decimals: 2, icon: <ChartIcon /> },
    ];

  return (
    <section className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-4 md:overflow-visible">
      {cards.map((card) => (
        <article className="stat-chip snap-start" key={card.label}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[12px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{card.icon}</span>
          <div className="min-w-0">
            {loading ? <span className="skeleton block h-5 w-14" /> : <CountUp decimals={card.decimals || 0} value={card.value} />}
            <span className="block text-[11px] font-black text-slate-500 dark:text-slate-400">{card.label}</span>
          </div>
        </article>
      ))}
    </section>
  );
}

function CountUp({ decimals = 0, value }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 900;
    let frame;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <strong className="block text-base font-black text-slate-950 dark:text-white">{decimals ? display.toFixed(decimals) : Math.round(display).toLocaleString("ar-MR")}</strong>;
}

function ResultCard({ onOpenRanking, resultBanner, student, onShare, text = UI_TEXT.ar, verificationCode }) {
  const average = parseAverage(student.MOD);
  const isConcours = student.source === "concours";
  const status = isConcours ? getConcoursStatus(average, text) : getStatusDisplay(getOfficialStatus(student.kr), text);
  const isPassed = status.className === "admis";
  const isFailed = status.className === "ajourne";
  const tone = isFailed ? "calm" : getAverageTone(average);
  const resultUrl = getResultUrl(student);
  const encodedUrl = encodeURIComponent(resultUrl);
  const encodedText = encodeURIComponent(getResultShareText(student, text));
  const details = student.source === "brevet"
    ? [
      [text.id, student.id, <HashIcon key="hash" />],
      [text.exam || "المسابقة", "أبريفه 2025", <BookIcon key="exam" />],
      [text.school, student.ms || text.unavailable, <SchoolIcon key="school" />, () => onOpenRanking?.("ms", student.ms, text.school)],
      [text.center, student.centre || text.unavailable, <MapIcon key="center" />],
      [text.region, student.wl || text.unavailable, <MapIcon key="map" />, () => onOpenRanking?.("wl", student.wl, text.region)],
      [text.birthPlace, student.birthPlace || text.unavailable, <UserIcon key="birth-place" />],
      [text.birthDate, student.birthDate || text.unavailable, <BookIcon key="birth-date" />],
    ]
    : student.source === "bac_session"
      ? [
        [text.id, student.id, <HashIcon key="hash" />],
        [text.exam || "المسابقة", student.sessionType || "البكالوريا الدورة التكميلية 2025", <BookIcon key="exam" />],
        [text.track, student.track, <BookIcon key="track" />],
        [text.school, student.ms || text.unavailable, <SchoolIcon key="school" />, () => onOpenRanking?.("ms", student.ms, text.school)],
        [text.center, student.centre || text.unavailable, <MapIcon key="center" />],
        [text.region, student.wl || text.unavailable, <MapIcon key="map" />, () => onOpenRanking?.("wl", student.wl, text.region)],
        [text.birthPlace, student.birthPlace || text.unavailable, <UserIcon key="birth-place" />],
        [text.birthDate, student.birthDate || text.unavailable, <BookIcon key="birth-date" />],
      ]
      : student.source === "concours"
        ? [
          [text.id, student.id, <HashIcon key="hash" />],
          [text.exam || "المسابقة", "كونكور 2025", <BookIcon key="exam" />],
          [text.school, student.ms || text.unavailable, <SchoolIcon key="school" />, () => onOpenRanking?.("ms", student.ms, text.school)],
          [text.center, student.centre || text.unavailable, <MapIcon key="center" />, () => onOpenRanking?.("centre", student.centre, text.center)],
          [text.region, student.wl || text.unavailable, <MapIcon key="map" />, () => onOpenRanking?.("wl", student.wl, text.region)],
          [text.moughataa, student.moughataa || text.unavailable, <MapIcon key="moughataa" />, () => onOpenRanking?.("moughataa", student.moughataa, text.moughataa)],
          ["NODOSS", student.internalId || text.unavailable, <HashIcon key="nodoss" />],
          [text.birthPlace, student.birthPlace || text.unavailable, <UserIcon key="birth-place" />],
          [text.yearBirth, student.birthDate || text.unavailable, <BookIcon key="birth-year" />],
        ]
        : student.source === "excellence_1as"
          ? [
            [text.id, student.id, <HashIcon key="hash" />],
            [text.exam || "المسابقة", "الامتياز الأولى إعدادية 2025", <BookIcon key="exam" />],
            [text.nationalId, student.matricule || text.unavailable, <HashIcon key="matricule" />],
            [text.center, student.centre || text.unavailable, <MapIcon key="center" />],
            [text.region, student.wl || text.unavailable, <MapIcon key="map" />, () => onOpenRanking?.("wl", student.wl, text.region)],
            [text.birthPlace, student.birthPlace || text.unavailable, <UserIcon key="birth-place" />],
            [text.birthDate, student.birthDate || text.unavailable, <BookIcon key="birth-date" />],
            [text.arabicMark, student.arabicMark || text.unavailable, <BookIcon key="arabic" />],
            [text.frenchMark, student.frenchMark || text.unavailable, <BookIcon key="french" />],
            [text.mathMark, student.mathMark || text.unavailable, <ChartIcon key="math" />],
          ]
    : [
      [text.id, student.id, <HashIcon key="hash" />],
      [text.exam || "المسابقة", student.sessionType || "البكالوريا 2025", <BookIcon key="exam" />],
      [text.track, student.track, <BookIcon key="book" />],
      [text.rank, student.rank ? `#${student.rank}` : text.unavailable, <AwardIcon key="award" />],
      [text.school, student.ms || text.unavailable, <SchoolIcon key="school" />, () => onOpenRanking?.("ms", student.ms, text.school)],
      [text.region, student.wl || text.unavailable, <MapIcon key="map" />, () => onOpenRanking?.("wl", student.wl, text.region)],
      [text.moughataa, student.moughataa || text.unavailable, <MapIcon key="moughataa" />],
    ];

  useEffect(() => {
    if (!isPassed) return undefined;
    playSuccessTone();
    fireSuccessConfetti();
    toast.success(text.successToast, { icon: "🎉" });
    return undefined;
  }, [isPassed, student.id]);

  return (
    <article className={`result-modal result-${tone} animate-slide-up`}>
      <div className="result-modal-header">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">{text.resultCard}</p>
          <div className="student-name-panel">
            <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">{text.studentName}</span>
            <h2 className="mt-1 text-balance text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-3xl">{student.name}</h2>
            <strong className="mt-3 inline-flex rounded-[18px] bg-mauri-green/10 px-4 py-2 text-3xl font-black text-mauri-green dark:bg-mauri-gold/10 dark:text-mauri-gold">
              {isConcours ? `${average.toFixed(2)} / 200` : average.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {details.map(([label, value, icon, onClick]) => (
          <InfoTile icon={icon} label={label} onClick={onClick} value={value} key={label} />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <ActionButton icon={<ShareIcon />} label={text.share} onClick={() => onShare(student)} />
        <ActionButton icon={<DownloadIcon />} label="PDF" onClick={() => window.print()} variant="light" />
        <ActionButton icon={<PrinterIcon />} label={text.print} onClick={() => window.print()} variant="light" />
      </div>
      <SiteBanner asset={resultBanner} />
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ActionButton icon={<HashIcon />} label={text.copyLink} onClick={() => { navigator.clipboard?.writeText(resultUrl); toast.success(text.copiedShare); }} variant="light" />
        <ActionButton icon={<FaWhatsapp />} label={text.whatsapp} onClick={() => window.open(`https://wa.me/?text=${encodedText}%0A${encodedUrl}`, "_blank", "noopener,noreferrer")} variant="light" />
        <ActionButton icon={<FaFacebookF />} label={text.facebook} onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, "_blank", "noopener,noreferrer")} variant="light" />
        <ActionButton icon={<FaTelegram />} label={text.telegram} onClick={() => window.open(`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`, "_blank", "noopener,noreferrer")} variant="light" />
      </div>
    </article>
  );
}

function ResultExperience({ content, onOpenRanking, onShare, resultBanner, student, text }) {
  const verificationCode = `MR-${student.id}-${String(student.rank || Math.round(getAverage(student) * 100)).padStart(4, "0")}`;
  const isConcours = student.source === "concours";
  const status = isConcours ? getConcoursStatus(getAverage(student), text) : getStatusDisplay(getOfficialStatus(student.kr), text);

  return (
    <section className="app-shell result-official-page py-4 md:py-8" aria-label={text?.officialResult || "بطاقة النتيجة الرسمية"}>
      <div className="result-page-shell">
        <header className="official-result-header">
          <div className="flex min-w-0 items-center gap-3">
            <LogoMark className="h-12 w-12 rounded-[18px]" src={contentValue(content, "logo", "/logo.png")} />
            <div className="min-w-0">
              <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">MauriResults</p>
              <h1 className="line-clamp-1 text-xl font-black text-slate-950 dark:text-white md:text-3xl">{text?.officialResult || "بطاقة النتيجة الرسمية"}</h1>
              <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{text?.verification || "رقم التحقق"}: {verificationCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={status.className} label={status.label} />
          </div>
        </header>
        <ResultOfficialSummary
          average={getAverage(student).toFixed(2)}
          code={verificationCode}
          exam={student.sessionType || (isConcours ? "كونكور 2025" : student.source === "brevet" ? "أبريفه 2025" : student.source === "excellence_1as" ? "الامتياز الأولى إعدادية 2025" : "البكالوريا 2025")}
          maxScore={isConcours ? 200 : undefined}
          name={student.name}
          number={student.id}
          status={status.className}
          statusLabel={status.label}
          text={text}
        />
        <ResultCard onOpenRanking={onOpenRanking} resultBanner={resultBanner} student={student} onShare={onShare} text={text} verificationCode={verificationCode} />
      </div>
    </section>
  );
}

function InfoTile({ icon, label, onClick, value }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component className={`info-tile ${onClick ? "info-tile-clickable" : ""}`} onClick={onClick} type={onClick ? "button" : undefined}>
      <span className="grid h-8 w-8 place-items-center rounded-[12px] bg-mauri-green/10 text-mauri-green dark:bg-emerald-300/10 dark:text-emerald-300">{icon}</span>
      <div className="min-w-0">
        <span className="text-[11px] font-black text-slate-500 dark:text-slate-400">{label}</span>
        <strong className="block overflow-wrap-anywhere text-sm font-black text-slate-950 dark:text-white">{value}</strong>
      </div>
    </Component>
  );
}

function MatchesList({ matches, onSelect, text = UI_TEXT.ar }) {
  return (
    <section className="result-card animate-slide-up">
      <SectionTitle eyebrow={text.searchResults} title={text.chooseCandidate} />
      <div className="mt-3 grid gap-2">
        {matches.map((student) => (
          <button className="match-row" key={student.id} onClick={() => onSelect(student)} type="button">
            <span className="min-w-0 text-start">
              <strong className="line-clamp-1 block font-black text-slate-950 dark:text-white">{student.name}</strong>
              <span className="mt-1 block text-xs font-bold text-slate-500 dark:text-slate-400">{text.number} {student.id}{examHasTrackGroups(student.source) ? ` - ${student.track}` : ""}</span>
            </span>
            <span className="rounded-full bg-mauri-green/10 px-3 py-1 text-sm font-black text-mauri-green">{formatScore(student, text)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultLoadingCard({ text = UI_TEXT.ar }) {
  return (
    <div className="result-modal animate-zoom-in">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-[16px] bg-mauri-green/10 text-mauri-green">
          <SearchIcon />
        </span>
        <div>
          <strong className="block text-sm font-black text-slate-950 dark:text-white">{text.preparingResult}</strong>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{text.moments}</span>
        </div>
      </div>
      <div className="flex justify-between gap-4">
        <div className="grid flex-1 gap-2">
          <span className="skeleton h-3 w-20" />
          <span className="skeleton h-5 w-3/4" />
          <span className="skeleton h-3 w-32" />
        </div>
        <span className="skeleton h-16 w-20 rounded-[18px]" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <span className="skeleton h-11" />
        <span className="skeleton h-11" />
        <span className="skeleton h-11" />
        <span className="skeleton h-11" />
      </div>
    </div>
  );
}

function ResultLoadingOverlay({ text = UI_TEXT.ar }) {
  return (
    <section className="result-page" aria-label={text.openingResult}>
      <div className="result-page-backdrop" />
      <div className="result-loading-panel animate-zoom-in">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-[20px] bg-mauri-green/10 text-mauri-green">
          <SearchIcon />
        </span>
        <h2 className="mt-3 text-xl font-black text-slate-950 dark:text-white">{text.openingResult}</h2>
        <p className="mt-1 text-sm font-bold text-slate-500 dark:text-slate-400">{text.preparingOfficial}</p>
        <div className="mt-5 grid gap-2">
          <span className="skeleton h-4 w-full" />
          <span className="skeleton h-4 w-3/4" />
          <span className="skeleton h-12 w-full rounded-[18px]" />
        </div>
      </div>
    </section>
  );
}

function Confetti() {
  return (
    <div className="confetti-layer" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} style={{ "--i": index }} />
      ))}
    </div>
  );
}

function ToppersSection({ groups, loading, onSelect, showTrackGroups = true, text = UI_TEXT.ar }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-3">
        <SectionTitle eyebrow={text.toppers} title={showTrackGroups ? text.trackTopThree : text.toppers} />
      </div>
      <div className="grid gap-2">
        {loading ? (
          <>
            <TopperSkeleton />
            <TopperSkeleton />
            <TopperSkeleton />
          </>
        ) : groups.length ? (
          groups.map((group) => (
            <section className="track-group" key={group.track}>
              {showTrackGroups && <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">{group.track}</h3>
                <span className="rounded-full bg-mauri-green/10 px-2.5 py-1 text-[11px] font-black text-mauri-green">Top 3</span>
              </div>}
              <div className="grid gap-2">
                {group.students.map((student, index) => <TopperCard student={student} index={index} onSelect={onSelect} showTrack={showTrackGroups} text={text} key={student.id} />)}
              </div>
            </section>
          ))
        ) : (
          <p className="rounded-[18px] border border-mauri-border bg-white p-4 text-sm font-bold text-slate-500 dark:border-white/10 dark:bg-white/10 dark:text-slate-400">{text.noTrackData}</p>
        )}
      </div>
    </section>
  );
}

function TopperCard({ student, index, onSelect, showTrack = true, text = UI_TEXT.ar }) {
  const medals = [
    { name: text.first, className: "bg-[#fff7d6] text-[#8a6500]", icon: <GoldMedalIcon /> },
    { name: text.second, className: "bg-slate-100 text-slate-600", icon: <SilverMedalIcon /> },
    { name: text.third, className: "bg-[#fff0e5] text-[#9a4f18]", icon: <BronzeMedalIcon /> },
  ];
  const medal = medals[index] || medals[0];

  return (
    <article className="topper-compact">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] ${medal.className}`}>{medal.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <strong className="line-clamp-1 text-sm font-black text-slate-950 dark:text-white">{student.name}</strong>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-500 dark:bg-white/10 dark:text-slate-300">{medal.name}</span>
        </div>
        {showTrack && <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500 dark:text-slate-400">{student.track}</p>}
      </div>
      <div className="text-center">
        <strong className="block text-lg font-black text-mauri-green">{formatScore(student, text)}</strong>
        <button className="text-[11px] font-black text-slate-500 underline-offset-4 hover:text-mauri-green hover:underline" onClick={() => onSelect(student)} type="button">{text.showResult}</button>
      </div>
    </article>
  );
}

function TopperSkeleton() {
  return (
    <div className="topper-compact">
      <span className="skeleton h-10 w-10 rounded-[14px]" />
      <div className="grid flex-1 gap-2">
        <span className="skeleton h-4 w-2/3" />
        <span className="skeleton h-3 w-1/2" />
      </div>
      <span className="skeleton h-8 w-12" />
    </div>
  );
}

function LegacyFooter({ content = {}, text = UI_TEXT.ar }) {
  const [developerOpen, setDeveloperOpen] = useState(false);
  const footerBanner = contentValue(content, "footer_banner");

  return (
    <footer id="developer" className="app-shell py-6 md:py-10">
      <section className="premium-footer">
        {footerBanner && <img className="footer-banner-image" src={footerBanner} alt="" loading="lazy" />}
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <LogoMark className="h-12 w-12 rounded-[18px]" src={contentValue(content, "logo", "/logo.png")} />
            <div className="min-w-0">
              <strong className="block text-lg font-black text-slate-950 dark:text-white">MauriResults</strong>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-300">منصة نتائج وطنية</span>
            </div>
          </div>
          <button className="developer-button" onClick={() => setDeveloperOpen((value) => !value)} type="button">
            <CodeIcon />
            {text.aboutDeveloper || text.preparedBy}
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-2 border-t border-mauri-border/70 pt-4 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>{text.rights}</span>
          <span>© {new Date().getFullYear()} MauriResults</span>
        </div>
      </section>
      {developerOpen && (
        <DeveloperModal content={content} onClose={() => setDeveloperOpen(false)} text={text} />
      )}
    </footer>
  );
}

function DeveloperModal({ content = {}, onClose, text }) {
  const avatar = contentValue(content, "developer_avatar");
  const background = contentValue(content, "developer_background");
  const name = contentValue(content, "developer_name", "Ahmed abdellahi mady");
  const role = contentValue(content, "developer_job_title", text.developerRole);
  const description = contentValue(content, "developer_description", text.developerMessage);
  const supportMessage = contentValue(content, "developer_support_message");
  const whatsapp = contentValue(content, "developer_whatsapp", "https://wa.me/22244881891");
  const facebook = contentValue(content, "developer_facebook", "https://www.facebook.com/ahmed.abde.mady");
  const telegram = contentValue(content, "developer_telegram");
  const website = contentValue(content, "developer_website");
  const email = contentValue(content, "developer_email");

  return (
    <div className="developer-modal-backdrop" role="dialog" aria-modal="true" aria-label={text.preparedBy}>
      <m.article className="developer-modal" initial={{ opacity: 0, scale: 0.94, y: 18 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 0.24, ease: "easeOut" }}>
        {background && <img className="developer-modal-bg" src={background} alt="" loading="lazy" />}
        <button className="developer-close" onClick={onClose} type="button" aria-label={text.close}>
          <XIcon />
        </button>
        <div className="developer-avatar">
          {avatar ? <img src={avatar} alt={name} loading="lazy" /> : <UserIcon />}
        </div>
        <p className="text-[11px] font-black text-mauri-gold">{text.preparedBy}</p>
        <h3 className="mt-1 text-2xl font-black text-white">{name}</h3>
        <p className="mt-1 text-sm font-black text-emerald-100">{role}</p>
        <p className="mt-4 text-sm font-bold leading-7 text-white/80">{description}</p>
        {supportMessage && <p className="mt-3 rounded-[18px] border border-white/15 bg-white/10 p-3 text-sm font-bold leading-7 text-white/85">{supportMessage}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2">
          {whatsapp && <a className="developer-modal-link" href={whatsapp} target="_blank" rel="noopener"><FaWhatsapp />{text.whatsapp}</a>}
          {facebook && <a className="developer-modal-link" href={facebook} target="_blank" rel="noopener"><FaFacebookF />{text.facebook}</a>}
          {telegram && <a className="developer-modal-link" href={telegram} target="_blank" rel="noopener"><FaTelegram />{text.telegram}</a>}
          {website && <a className="developer-modal-link" href={website} target="_blank" rel="noopener"><HomeIcon />Website</a>}
          {email && <a className="developer-modal-link" href={`mailto:${email}`}><MessageIcon />Email</a>}
        </div>
      </m.article>
    </div>
  );
}

function LegacyBottomNav({ activeView, onNavigate, text }) {
  const items = [
    { label: text.home, view: "home", icon: <HomeIcon /> },
    { label: text.search, view: "exam", icon: <SearchIcon /> },
    { label: text.toppers, view: "toppers", icon: <AwardIcon /> },
    { label: text.analytics, view: "analytics", icon: <ChartIcon /> },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(.55rem,env(safe-area-inset-bottom))] pt-2 md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-[24px] border border-white/70 bg-white/[.92] p-1.5 shadow-[0_-14px_40px_rgba(15,23,42,.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#07130d]/[.92]">
        {items.map((item) => (
          <button className={`grid justify-items-center gap-1 rounded-[18px] px-2 py-1.5 text-[11px] font-black transition hover:-translate-y-0.5 active:scale-95 ${activeView === item.view && !item.section ? "bg-mauri-green text-white shadow-soft" : "text-slate-500 hover:bg-mauri-green/10 hover:text-mauri-green dark:text-slate-300"}`} onClick={() => { onNavigate(item.view); if (item.section) window.setTimeout(() => document.getElementById(item.section)?.scrollIntoView({ behavior: "smooth", block: "start" }), 120); }} type="button" key={item.label}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function SectionTitle({ eyebrow, title }) {
  return (
    <div>
      <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">{eyebrow}</p>
      <h2 className="text-lg font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
    </div>
  );
}

function ActionButton({ icon, label, onClick, variant = "solid" }) {
  return (
    <button className={actionButtonClass({ variant })} onClick={onClick} type="button">
      {icon}
      {label}
    </button>
  );
}

function LogoMark({ className = "h-10 w-10", src = "/logo.png" }) {
  return (
    <span className={`${className} grid shrink-0 place-items-center overflow-hidden border border-mauri-green/10 bg-white shadow-soft dark:border-white/10`}>
      <img className="h-full w-full object-contain p-1" src={src} alt="MauriResults" loading="eager" onError={(event) => { event.currentTarget.src = "/logo.png"; }} />
    </span>
  );
}

function SearchIcon() { return <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" /></svg>; }
function SunIcon() { return <svg viewBox="0 0 24 24"><path d="M12 4V2M12 22v-2M4.9 4.9 3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1l-1.4 1.4M20.5 3.5l-1.4 1.4" /><circle cx="12" cy="12" r="4" /></svg>; }
function MoonIcon() { return <svg viewBox="0 0 24 24"><path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 7 7 0 1 0 20 15.5Z" /></svg>; }
function GraduationIcon() { return <svg viewBox="0 0 24 24"><path d="m3 10 9-5 9 5-9 5-9-5Z" /><path d="M7 12v5c3 2 7 2 10 0v-5" /><path d="M21 10v6" /></svg>; }
function CheckCircleIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></svg>; }
function CheckIcon() { return <svg viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5" /></svg>; }
function XIcon() { return <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12" /></svg>; }
function MinusIcon() { return <svg viewBox="0 0 24 24"><path d="M5 12h14" /></svg>; }
function AlertIcon() { return <svg viewBox="0 0 24 24"><path d="M12 8v5" /><path d="M12 17h.01" /><path d="M10.3 3.9 2.7 17a2 2 0 0 0 1.7 3h15.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></svg>; }
function InfoIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><path d="M12 8h.01" /></svg>; }
function UserIcon() { return <svg viewBox="0 0 24 24"><path d="M20 21a8 8 0 0 0-16 0" /><circle cx="12" cy="8" r="4" /></svg>; }
function HashIcon() { return <svg viewBox="0 0 24 24"><path d="M5 9h14M4 15h14M10 3 8 21M16 3l-2 18" /></svg>; }
function AwardIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="6" /><path d="M8.2 13 7 22l5-3 5 3-1.2-9" /></svg>; }
function ChartIcon() { return <svg viewBox="0 0 24 24"><path d="M4 19V5M8 17v-6M13 17V7M18 17v-9M3 19h18" /></svg>; }
function TrendingIcon() { return <svg viewBox="0 0 24 24"><path d="m4 16 6-6 4 4 6-8" /><path d="M14 6h6v6" /></svg>; }
function BookIcon() { return <svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5Z" /></svg>; }
function SchoolIcon() { return <svg viewBox="0 0 24 24"><path d="m3 10 9-5 9 5-9 5-9-5Z" /><path d="M7 12v5c3 2 7 2 10 0v-5" /><path d="M21 10v6" /></svg>; }
function MapIcon() { return <svg viewBox="0 0 24 24"><path d="M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Z" /><path d="M9 3v15M15 6v15" /></svg>; }
function FacebookIcon() { return <svg viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" /></svg>; }
function WhatsAppIcon() { return <svg viewBox="0 0 24 24"><path d="M3 21l1.5-4.4A8.5 8.5 0 1 1 7.4 19L3 21Z" /><path d="M9 9.5c.2 3 2.5 5.1 5.4 5.6l1.1-1.1c.3-.3.3-.8-.1-1l-1.5-.8c-.3-.2-.7-.1-.9.2l-.4.5c-.9-.4-1.6-1.1-2.1-2l.5-.4c.3-.2.4-.6.2-.9l-.8-1.5c-.2-.4-.7-.4-1-.1L9 9.5Z" /></svg>; }
function MessageIcon() { return <svg viewBox="0 0 24 24"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" /></svg>; }
function DownloadIcon() { return <svg viewBox="0 0 24 24"><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></svg>; }
function PrinterIcon() { return <svg viewBox="0 0 24 24"><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6Z" /></svg>; }
function ShareIcon() { return <svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 10.5 6.8-4" /><path d="m8.6 13.5 6.8 4" /></svg>; }
function CodeIcon() { return <svg viewBox="0 0 24 24"><path d="m8 9-4 3 4 3" /><path d="m16 9 4 3-4 3" /><path d="m14 4-4 16" /></svg>; }
function HomeIcon() { return <svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></svg>; }
function ChevronDownIcon() { return <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>; }
function GoldMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M12 11v4" /><path d="M10 13h4" /></svg>; }
function SilverMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M10 12a2 2 0 0 1 4 0c0 2-4 2-4 4h4" /></svg>; }
function BronzeMedalIcon() { return <svg viewBox="0 0 24 24"><circle cx="12" cy="13" r="5" /><path d="m8 2 4 6 4-6" /><path d="M10 11h4l-2 2a2 2 0 1 1-2 2" /></svg>; }





