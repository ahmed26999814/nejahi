import chunk01 from "./orientation/orientation-chunk-01";
import chunk02 from "./orientation/orientation-chunk-02";
import chunk03 from "./orientation/orientation-chunk-03";
import chunk04 from "./orientation/orientation-chunk-04";
import chunk05 from "./orientation/orientation-chunk-05";
import chunk06 from "./orientation/orientation-chunk-06";
import chunk07 from "./orientation/orientation-chunk-07";
import chunk08 from "./orientation/orientation-chunk-08";

export const ORIENTATION_SOURCE_URL = "https://etudiants-mesrs.app/affectations-stats";

export const STREAM_ORDER = [
  "العلوم الطبيعية",
  "الرياضيات",
  "الآداب الأصلية",
  "الآداب العصرية",
  "الشعبة التقنية",
  "الهندسة الكهربائية",
  "اللغات",
];

export const STREAM_ALIASES = {
  SN: "العلوم الطبيعية",
  M: "الرياضيات",
  LO: "الآداب الأصلية",
  LM: "الآداب العصرية",
  TM: "الشعبة التقنية",
  TS: "الهندسة الكهربائية",
  LA: "اللغات",
};

const RAW_PROGRAMS = [...chunk01, ...chunk02, ...chunk03, ...chunk04, ...chunk05, ...chunk06, ...chunk07, ...chunk08];

function inferCountry(institution, faculty) {
  const text = `${institution} ${faculty}`;
  if (text.includes("تونس")) return "تونس";
  if (text.includes("المغرب")) return "المغرب";
  if (text.includes("السنغال")) return "السنغال";
  return "موريتانيا";
}

function inferCategory(name, institution, faculty) {
  const text = `${name} ${institution} ${faculty}`.toLowerCase();
  const categories = [
    ["الطب والصحة", ["طب", "الصيدلة", "الأسنان", "الصحة", "التحاليل البيولوجية", "تكنولوجيا الصحة", "الأحياء الجزيئي", "التغذية والصحة"]],
    ["المعلوماتية والذكاء الاصطناعي", ["الذكاء الاصطناعي", "معلومات", "الويب", "شبكات", "الحاسوب", "حاسب", "أنظمة متصلة", "علوم البيانات", "هندسة البيانات", "نظم المعلومات"]],
    ["الهندسة والتكنولوجيا", ["هندسة", "الطاقة", "الطاقات", "الإلكترونيات", "الكهربائية", "الميكانيكية", "المدنية", "الصناعية", "التحلية", "الاستكشاف الجيولوجي", "النفط والغاز", "التقنيات الكهربائية"]],
    ["الاقتصاد والتسيير", ["اقتصاد", "إدارة", "المالية", "محاسبة", "البنوك", "التأمين", "التسويق", "المبيعات", "الموارد البشرية", "التجارة", "اللوجستيات"]],
    ["القانون", ["قانون"]],
    ["اللغات والترجمة", ["الترجمة", "الإنجليزية", "الفرنسية", "الإسبانية", "الصينية", "التركية", "اللغات الوطنية", "اللغة العربية", "الدراسات العربية", "الدراسات الفرنسية", "الدراسات الإنجليزية", "العربية"]],
    ["التعليم والتربية", ["المدرسة العليا للتعليم", "التربية", "التدريب الأساسي", "الفصل التحضيري التطبيقي"]],
    ["العلوم الإسلامية", ["إسلام", "الشريعة", "الفقه", "أصول الدين", "القرآن", "العقيدة", "المحظرة"]],
    ["الزراعة والبيطرة والأغذية", ["الزراعة", "البيطرة", "النبات", "الحيوان", "الأغذية", "الريفية"]],
    ["البحر والصيد", ["البحر", "الصيد", "السواحل", "المينائية", "المصايد"]],
    ["الآداب والعلوم الإنسانية", ["الفلسفة", "علم الاجتماع", "التاريخ", "الجغرافيا", "الهجرة", "الخدمة الاجتماعية", "التنمية المحلية", "الإعلام والاتصال", "البيئة والتنمية المستدامة"]],
    ["العلوم الأساسية", ["الرياضيات", "الفيزياء", "الكيمياء", "علوم الحياة", "علم الأحياء", "علوم الأرض", "الجيولوجيا", "الإحصاء"]],
  ];
  return categories.find(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))?.[0] || "تخصصات أخرى";
}

export const orientationPrograms = RAW_PROGRAMS.map(
  ([id, stream, name, institution, faculty, lastScore, confidence]) => {
    const country = inferCountry(institution, faculty);
    return {
      id,
      stream,
      name,
      institution,
      faculty,
      lastScore,
      confidence,
      category: inferCategory(name, institution, faculty),
      country,
      studyType: country === "موريتانيا" ? "داخل موريتانيا" : "بعثة خارجية",
      admissionMode: "توجيه",
    };
  },
);

export function getOrientationProgram(id) {
  return orientationPrograms.find((program) => program.id === id);
}

export default orientationPrograms;
