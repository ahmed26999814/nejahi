import { NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-static";
export const revalidate = 3600;

type ResourceRow = {
  grade: string;
  subjectAr: string;
  typeAr: string;
  url: string;
};

const STAGES = [
  {
    id: "primary",
    titleAr: "الابتدائية",
    titleFr: "Primaire",
    descriptionAr: "من السنة الأولى إلى السادسة",
    descriptionFr: "De la 1re à la 6e année",
    grades: ["1AF", "2AF", "3AF", "4AF", "5AF", "6AF"],
  },
  {
    id: "middle",
    titleAr: "الإعدادية",
    titleFr: "Collège",
    descriptionAr: "من السنة الأولى إلى الرابعة",
    descriptionFr: "De la 1re à la 4e année",
    grades: ["1AS", "2AS", "3AS", "4AS"],
  },
  {
    id: "secondary",
    titleAr: "الثانوية",
    titleFr: "Lycée",
    descriptionAr: "من السنة الخامسة إلى الباك",
    descriptionFr: "De la 5e année au BAC",
    grades: ["5AS", "6AS", "7AS"],
  },
] as const;

const GRADE_LABELS: Record<string, { ar: string; fr: string }> = {
  "1AF": { ar: "السنة الأولى ابتدائية", fr: "1re année primaire" },
  "2AF": { ar: "السنة الثانية ابتدائية", fr: "2e année primaire" },
  "3AF": { ar: "السنة الثالثة ابتدائية", fr: "3e année primaire" },
  "4AF": { ar: "السنة الرابعة ابتدائية", fr: "4e année primaire" },
  "5AF": { ar: "السنة الخامسة ابتدائية", fr: "5e année primaire" },
  "6AF": { ar: "السنة السادسة ابتدائية", fr: "6e année primaire" },
  "1AS": { ar: "السنة الأولى إعدادية", fr: "1re année collège" },
  "2AS": { ar: "السنة الثانية إعدادية", fr: "2e année collège" },
  "3AS": { ar: "السنة الثالثة إعدادية", fr: "3e année collège" },
  "4AS": { ar: "السنة الرابعة إعدادية", fr: "4e année collège" },
  "5AS": { ar: "السنة الخامسة ثانوية", fr: "5e année lycée" },
  "6AS": { ar: "السنة السادسة ثانوية", fr: "6e année lycée" },
  "7AS": { ar: "السنة السابعة (الباك)", fr: "7e année (BAC)" },
};

const SUBJECT_FR: Record<string, string> = {
  "التربية الإسلامية": "Éducation islamique",
  "اللغة العربية": "Arabe",
  "التربية المدنية": "Éducation civique",
  الرياضيات: "Mathématiques",
  "العلوم الطبيعية": "Sciences naturelles",
  الجغرافيا: "Géographie",
  التاريخ: "Histoire",
  الفرنسية: "Français",
  الإنجليزية: "Anglais",
  الفيزياء: "Physique",
  الكيمياء: "Chimie",
  الفلسفة: "Philosophie",
};

const TYPE_FR: Record<string, string> = {
  "كتاب التلميذ": "Manuel de l’élève",
  "دفتر التمارين": "Cahier d’exercices",
  "كتاب القراءة": "Livre de lecture",
  "دفتر الكتابة": "Cahier d’écriture",
  "الشعبة العلمية (C وD)": "Séries scientifiques (C et D)",
  "الشعبة الأدبية (LM)": "Série lettres modernes (LM)",
  "شعبة العلوم (D)": "Série sciences (D)",
  "شعبة الرياضيات (C)": "Série mathématiques (C)",
  "النسخة العامة": "Version générale",
  "الفقه والأصول": "Jurisprudence et fondements",
  "القرآن والحديث": "Coran et Hadith",
  "الشعبة العامة": "Version générale",
  "الآداب الأصلية (A)": "Lettres originelles (A)",
  "الآداب العصرية (LM)": "Lettres modernes (LM)",
};

const resources: ResourceRow[] = [];
const add = (grade: string, subjectAr: string, typeAr: string, url: string) => {
  resources.push({ grade, subjectAr, typeAr, url });
};

[
  ["1AF", "التربية الإسلامية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IMR-1AF-M.pdf"],
  ["1AF", "اللغة العربية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/Manuel_Arabe_1AP.pdf"],
  ["1AF", "اللغة العربية", "دفتر التمارين", "https://docs.bsimr.com/pdfs/fondamentals/Cahier_Arabe_1AP.pdf"],
  ["1AF", "التربية المدنية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IC1AF-M.pdf"],
  ["1AF", "الرياضيات", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/Math_1AP_Manuel_eleve.pdf"],
  ["1AF", "الرياضيات", "دفتر التمارين", "https://docs.bsimr.com/pdfs/fondamentals/Math_1AP_Cahier_exercice.pdf"],
  ["2AF", "التربية الإسلامية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IMR-2AF-M.pdf"],
  ["2AF", "اللغة العربية", "كتاب القراءة", "https://docs.bsimr.com/pdfs/student/MART05_Arabe%202AP.pdf"],
  ["2AF", "اللغة العربية", "دفتر الكتابة", "https://docs.bsimr.com/pdfs/student/MART06_Arabe_2AP.pdf"],
  ["2AF", "التربية المدنية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/ic-2AF-M.pdf"],
  ["2AF", "الرياضيات", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/MATHE-2AF.pdf"],
  ["2AF", "الرياضيات", "دفتر التمارين", "https://docs.bsimr.com/pdfs/fondamentals/MATHE-2AF-Exercices.pdf"],
  ["2AF", "الفرنسية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/FR_2AP_M_ELEVE.pdf"],
  ["3AF", "التربية الإسلامية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IMR-3AF-M.pdf"],
  ["3AF", "اللغة العربية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/AR-3AF-M.pdf"],
  ["3AF", "التربية المدنية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/IC-3AF-M.pdf"],
  ["3AF", "الرياضيات", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/MA-3AF-M.pdf"],
  ["3AF", "العلوم الطبيعية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/SN-3AF-M.pdf"],
  ["3AF", "الجغرافيا", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/fondamentals/GEO-3AF-M.pdf"],
  ["3AF", "الفرنسية", "كتاب التلميذ", "https://docs.bsimr.com/pdfs/student/MART08%20livre%20de%20lecture%20Franc%CC%A7ais%203AP%20Livre_Inside.pdf"],
  ["3AF", "الفرنسية", "دفتر الكتابة", "https://docs.bsimr.com/pdfs/student/MART07_Article%2007%20Cahier%20Franc%CC%A7ais%203AP_Inside.pdf"],
].forEach((row) => add(...(row as [string, string, string, string])));

for (const grade of ["4AF", "5AF", "6AF"]) {
  const subjects: [string, string][] = [
    ["التربية الإسلامية", "IMR"],
    ["اللغة العربية", "AR"],
    ["التربية المدنية", "IC"],
    ["الرياضيات", "MA"],
    ["العلوم الطبيعية", "SN"],
    ...(grade === "4AF" ? [] : [["التاريخ", "HIST"]] as [string, string][]),
    ["الجغرافيا", "GEO"],
    ["الفرنسية", "FR"],
  ];
  for (const [subject, code] of subjects) {
    add(grade, subject, "كتاب التلميذ", `https://docs.bsimr.com/pdfs/fondamentals/${code}-${grade}-M.pdf`);
  }
}

const middleSubjects: [string, string, boolean][] = [
  ["التربية الإسلامية", "IMR", true],
  ["اللغة العربية", "AR", true],
  ["التربية المدنية", "IC", true],
  ["الرياضيات", "MA", true],
  ["العلوم الطبيعية", "SN", true],
  ["الجغرافيا", "GEO", true],
  ["التاريخ", "HIS", false],
  ["الفرنسية", "FR", true],
  ["الإنجليزية", "ANG", true],
];
for (const grade of ["1AS", "2AS", "3AS", "4AS"]) {
  const subjects = grade === "3AS" || grade === "4AS"
    ? [...middleSubjects, ["الفيزياء", "PHY", true] as [string, string, boolean]]
    : middleSubjects;
  for (const [subject, code, withManualSuffix] of subjects) {
    add(
      grade,
      subject,
      "كتاب التلميذ",
      `https://docs.bsimr.com/pdfs/secondaire1s/${code}-${grade}${withManualSuffix ? "-M" : ""}.pdf`,
    );
  }
}

[
  ["5AS", "التربية الإسلامية", "كتاب التلميذ", "IMR-5AS-M.pdf"],
  ["5AS", "اللغة العربية", "الشعبة العلمية (C وD)", "AR-5AS-CD.pdf"],
  ["5AS", "اللغة العربية", "الشعبة الأدبية (LM)", "AR-5AS-LM.pdf"],
  ["5AS", "التربية المدنية", "كتاب التلميذ", "IC-5AS-M.pdf"],
  ["5AS", "الرياضيات", "كتاب التلميذ", "MA-5AS-M.pdf"],
  ["5AS", "الفيزياء", "الشعبة العلمية (C وD)", "PHY-5AS-M.pdf"],
  ["5AS", "الكيمياء", "كتاب التلميذ", "CHI-5AS-M.pdf"],
  ["5AS", "العلوم الطبيعية", "شعبة العلوم (D)", "SN-5AS-D.pdf"],
  ["5AS", "التاريخ", "كتاب التلميذ", "HIS-5AS-M.pdf"],
  ["5AS", "الجغرافيا", "الشعبة الأدبية (LM)", "GEO-5AS-LM.pdf"],
  ["5AS", "الفلسفة", "كتاب التلميذ", "PHI-5AS-M.pdf"],
  ["5AS", "الفلسفة", "الشعبة العلمية (C وD)", "PHI-5AS-CD.pdf"],
  ["5AS", "الفرنسية", "الشعبة العلمية (C وD)", "FR-5AS-CD.pdf"],
  ["5AS", "الفرنسية", "الشعبة الأدبية (LM)", "FR-5AS-LM.pdf"],
  ["5AS", "الإنجليزية", "كتاب التلميذ", "ANG-5AS-M.pdf"],
  ["6AS", "التربية الإسلامية", "كتاب التلميذ", "IMR-6AS-M.pdf"],
  ["6AS", "اللغة العربية", "الشعبة العلمية (C وD)", "AR-6AS-M.pdf"],
  ["6AS", "اللغة العربية", "الشعبة الأدبية (LM)", "AR-6AS-LM.pdf"],
  ["6AS", "التربية المدنية", "كتاب التلميذ", "IC-6AS-M.pdf"],
  ["6AS", "الرياضيات", "كتاب التلميذ", "MA-6AS-M.pdf"],
  ["6AS", "الفيزياء", "كتاب التلميذ", "PHY-6AS-M.pdf"],
  ["6AS", "الكيمياء", "كتاب التلميذ", "CHI-6AS-M.pdf"],
  ["6AS", "العلوم الطبيعية", "شعبة العلوم (D)", "SN-6AS-D.pdf"],
  ["6AS", "العلوم الطبيعية", "النسخة العامة", "SN-6AS-M.pdf"],
  ["6AS", "التاريخ", "كتاب التلميذ", "HIS-6AS-M.pdf"],
  ["6AS", "الجغرافيا", "الشعبة العلمية (C وD)", "GEO-6AS-CD.pdf"],
  ["6AS", "الفلسفة", "النسخة العامة", "PHI-6AS-M.pdf"],
  ["6AS", "الفلسفة", "شعبة العلوم (D)", "Philo%206AS%20D%20.pdf"],
  ["6AS", "الفرنسية", "الشعبة العلمية (C وD)", "FR-6AS-CD.pdf"],
  ["6AS", "الفرنسية", "الشعبة الأدبية (LM)", "FR-6AS-LM.pdf"],
  ["6AS", "الإنجليزية", "كتاب التلميذ", "ANG-6AS-M.pdf"],
  ["7AS", "التربية الإسلامية", "الفقه والأصول", "L.G-7AS-M.pdf"],
  ["7AS", "التربية الإسلامية", "القرآن والحديث", "Coran%20%26%20Hadith-7AS-LM.pdf"],
  ["7AS", "التربية الإسلامية", "الشعبة العامة", "https://bsimr.s3.us-east-2.amazonaws.com/pdfs/secondaire2s/IMR-7AS-M.pdf"],
  ["7AS", "اللغة العربية", "الشعبة العلمية (C وD)", "AR-7AS-CD.pdf"],
  ["7AS", "اللغة العربية", "الشعبة الأدبية (LM)", "AR-7AS-LM.pdf"],
  ["7AS", "الرياضيات", "شعبة الرياضيات (C)", "MA-7AS-C.pdf"],
  ["7AS", "الرياضيات", "شعبة العلوم (D)", "MA-7AS-D.pdf"],
  ["7AS", "الفيزياء", "شعبة الرياضيات (C)", "PHY-7AS-C.pdf"],
  ["7AS", "الفيزياء", "شعبة العلوم (D)", "PHY-7AS-D.pdf"],
  ["7AS", "الكيمياء", "كتاب التلميذ", "CHI-7AS-M.pdf"],
  ["7AS", "العلوم الطبيعية", "شعبة الرياضيات (C)", "SN-7AS-C.pdf"],
  ["7AS", "العلوم الطبيعية", "شعبة العلوم (D)", "SN-7AS-D.pdf"],
  ["7AS", "التاريخ", "الآداب الأصلية (A)", "HIS-7AS-A.pdf"],
  ["7AS", "الجغرافيا", "الشعبة الأدبية (LM)", "GEO-7AS-LM.pdf"],
  ["7AS", "الفلسفة", "الآداب الأصلية (A)", "PHI-7AS-A.pdf"],
  ["7AS", "الفلسفة", "الآداب العصرية (LM)", "PHI-7AS-M.pdf"],
  ["7AS", "الفرنسية", "الشعبة العلمية (C وD)", "FR-7AS-M.pdf"],
  ["7AS", "الفرنسية", "الشعبة الأدبية (LM)", "FR-7AS-LM.pdf"],
  ["7AS", "الإنجليزية", "كتاب التلميذ", "ANG-7AS-M.pdf"],
].forEach(([grade, subject, type, file]) => {
  const url = file.startsWith("https://")
    ? file
    : `https://docs.bsimr.com/pdfs/secondaire2s/${file}`;
  add(grade, subject, type, url);
});

function stageForGrade(grade: string) {
  return STAGES.find((stage) => stage.grades.includes(grade as never))?.id ?? "secondary";
}

function resourceId(row: ResourceRow, index: number) {
  return `${row.grade}-${index + 1}`;
}

export async function GET() {
  const payload = resources.map((row, index) => {
    const name = `${row.subjectAr} - ${row.typeAr} - ${row.grade}.pdf`;
    return {
      id: resourceId(row, index),
      stage: stageForGrade(row.grade),
      grade: row.grade,
      gradeAr: GRADE_LABELS[row.grade]?.ar ?? row.grade,
      gradeFr: GRADE_LABELS[row.grade]?.fr ?? row.grade,
      subjectAr: row.subjectAr,
      subjectFr: SUBJECT_FR[row.subjectAr] ?? row.subjectAr,
      typeAr: row.typeAr,
      typeFr: TYPE_FR[row.typeAr] ?? row.typeAr,
      sourceUrl: row.url,
      downloadUrl: `/api/books/download?url=${encodeURIComponent(row.url)}&name=${encodeURIComponent(name)}`,
    };
  });

  return NextResponse.json(
    {
      ok: true,
      version: "2026-07-17.1",
      stages: STAGES,
      grades: GRADE_LABELS,
      resources: payload,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
