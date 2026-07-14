import type { Language } from "../types";

const dictionary = {
  ar: {
    appName: "MauriResults", home: "الرئيسية", saved: "المحفوظات", stats: "الإحصائيات", settings: "الإعدادات",
    officialResults: "النتائج الوطنية", chooseExam: "اختر المسابقة للبحث", refresh: "تحديث",
    offline: "أنت غير متصل. يتم عرض آخر بيانات محفوظة.", noExams: "لا توجد مسابقات متاحة حاليًا.",
    searchTitle: "البحث عن النتيجة", searchPlaceholder: "اكتب رقم المترشح أو الاسم", search: "بحث",
    typeQuery: "أدخل الاسم أو رقم المترشح.", noResults: "لم يتم العثور على نتيجة مطابقة.", resultsFound: "نتيجة مطابقة",
    save: "حفظ النتيجة", savedDone: "تم حفظ النتيجة على الهاتف.", remove: "حذف", share: "مشاركة", pdf: "تصدير PDF",
    details: "تفاصيل النتيجة", candidate: "المترشح", number: "الرقم", score: "المعدل / المجموع", decision: "القرار",
    track: "الشعبة", wilaya: "الولاية", moughataa: "المقاطعة", school: "المؤسسة", centre: "المركز",
    birthPlace: "مكان الميلاد", birthDate: "تاريخ الميلاد", rank: "الترتيب", history: "سجل البحث",
    clearHistory: "مسح السجل", emptySaved: "لا توجد نتائج محفوظة بعد.", emptyHistory: "لا يوجد سجل بحث بعد.",
    analytics: "إحصائيات المسابقة", total: "المترشحون", passed: "الناجحون", failed: "غير الناجحين",
    average: "المعدل العام", highest: "أعلى معدل", passRate: "نسبة النجاح", topStudents: "الأوائل", regions: "الولايات",
    tracks: "الشعب", pickExamForStats: "اختر مسابقة لعرض الإحصائيات", language: "اللغة", appearance: "المظهر",
    system: "حسب النظام", light: "فاتح", dark: "داكن", notifications: "إشعارات النتائج الجديدة",
    notificationsHint: "يتم تنبيهك محليًا عند اكتشاف مسابقة جديدة أثناء تحديث التطبيق.", about: "حول التطبيق",
    aboutText: "تطبيق أصلي مستقل للبحث في نتائج MauriResults، مع الحفظ دون اتصال والمشاركة وملفات PDF.",
    version: "الإصدار 2.0.0", newExamTitle: "نتائج جديدة متاحة", newExamBody: "تم نشر مسابقة جديدة في MauriResults.",
    error: "حدث خطأ. حاول مرة أخرى.", loading: "جاري التحميل...", cached: "محفوظ دون اتصال", live: "متصل مباشرة",
    back: "رجوع", cancel: "إلغاء", close: "إغلاق", yes: "نعم", permissionNeeded: "يلزم السماح بالإشعارات من إعدادات الهاتف.",
    selectedExam: "المسابقة المختارة", allFields: "بيانات إضافية", favoriteCandidate: "نتيجة محفوظة",
    downloadedPdf: "تم إنشاء ملف PDF.", nativeApp: "تطبيق Android أصلي", updated: "آخر تحديث",
  },
  fr: {
    appName: "MauriResults", home: "Accueil", saved: "Enregistrés", stats: "Statistiques", settings: "Réglages",
    officialResults: "Résultats nationaux", chooseExam: "Choisissez un examen", refresh: "Actualiser",
    offline: "Vous êtes hors ligne. Les dernières données enregistrées sont affichées.", noExams: "Aucun examen disponible.",
    searchTitle: "Rechercher un résultat", searchPlaceholder: "Numéro du candidat ou nom", search: "Rechercher",
    typeQuery: "Saisissez un nom ou un numéro.", noResults: "Aucun résultat correspondant.", resultsFound: "résultat(s)",
    save: "Enregistrer", savedDone: "Résultat enregistré sur le téléphone.", remove: "Supprimer", share: "Partager", pdf: "Exporter PDF",
    details: "Détails du résultat", candidate: "Candidat", number: "Numéro", score: "Moyenne / total", decision: "Décision",
    track: "Série", wilaya: "Wilaya", moughataa: "Moughataa", school: "Établissement", centre: "Centre",
    birthPlace: "Lieu de naissance", birthDate: "Date de naissance", rank: "Rang", history: "Historique",
    clearHistory: "Effacer", emptySaved: "Aucun résultat enregistré.", emptyHistory: "Aucune recherche récente.",
    analytics: "Statistiques de l’examen", total: "Candidats", passed: "Admis", failed: "Non admis",
    average: "Moyenne générale", highest: "Meilleure moyenne", passRate: "Taux de réussite", topStudents: "Meilleurs candidats",
    regions: "Wilayas", tracks: "Séries", pickExamForStats: "Choisissez un examen pour afficher les statistiques",
    language: "Langue", appearance: "Apparence", system: "Système", light: "Clair", dark: "Sombre",
    notifications: "Notifications des nouveaux résultats",
    notificationsHint: "Une notification locale apparaît lorsqu’un nouvel examen est détecté pendant l’actualisation.",
    about: "À propos", aboutText: "Application native indépendante pour rechercher les résultats, les enregistrer hors ligne, les partager et créer un PDF.",
    version: "Version 2.0.0", newExamTitle: "Nouveaux résultats disponibles", newExamBody: "Un nouvel examen a été publié sur MauriResults.",
    error: "Une erreur est survenue. Réessayez.", loading: "Chargement...", cached: "Disponible hors ligne", live: "Connexion directe",
    back: "Retour", cancel: "Annuler", close: "Fermer", yes: "Oui",
    permissionNeeded: "Autorisez les notifications dans les réglages du téléphone.", selectedExam: "Examen sélectionné",
    allFields: "Données supplémentaires", favoriteCandidate: "Résultat enregistré", downloadedPdf: "Fichier PDF créé.",
    nativeApp: "Application Android native", updated: "Dernière mise à jour",
  }
} as const;

export type TranslationKey = keyof typeof dictionary.ar;
export function t(language: Language, key: TranslationKey): string {
  return dictionary[language][key];
}
