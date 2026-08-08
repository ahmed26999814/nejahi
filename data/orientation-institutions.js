export const ORIENTATION_DIRECTORY_SOURCES = [
  { label: "مسار", url: "https://mesar.org/ar" },
  { label: "وزارة التعليم العالي", url: "https://www.mesrs.gov.mr/ar/المؤسسات" },
  { label: "إحصائيات التوجيه", url: "https://etudiants-mesrs.app/affectations-stats" },
];

const DEFAULT_META = {
  city: "موريتانيا",
  parent: "",
  website: "",
  logo: "",
  description: "",
  officialPrograms: [],
};

const INSTITUTION_META = {
  "جامعة نواكشوط": {
    city: "نواكشوط",
    website: "https://www.univ-nkc.mr/",
    logo: "https://www.univ-nkc.mr/assets/images/logo.png",
    description: "الجامعة العمومية الأكبر في نواكشوط، وتضم كليات ومعاهد تغطي العلوم والتقنيات والطب والآداب والقانون والاقتصاد والتسيير.",
  },
  "جامعة نواذيبو": {
    city: "نواذيبو",
    website: "https://univ-ndb.mr/ar",
    logo: "https://univ-ndb.mr/logo.svg",
    description: "جامعة عمومية متخصصة تضم ثلاث كليات ومعهداً، وتركز على العلوم والتكنولوجيا والقانون والاقتصاد والعلوم الإنسانية والتكنولوجيا الحيوية.",
    officialPrograms: [
      "الذكاء الاصطناعي وتطبيقاته",
      "تطوير نظم المعلومات",
      "هندسة الطاقة والطاقات المتجددة",
      "هندسة عمليات تحلية المياه",
      "الجيولوجيا والمناجم",
      "الإحصاء وعلم البيانات",
      "قانون المناجم والموارد الهيدروكربونية",
      "قانون الأنشطة البحرية والمينائية",
      "تدبير المخاطر البيئية والاقتصاد الأخضر",
      "تسيير الأنشطة البحرية والمينائية",
      "سوسيولوجيا الهجرات وحركات السكان",
      "علوم الصيد البحري والتكنولوجيا الحيوية الزرقاء",
    ],
  },
  "مجمع بوليتكنيك": {
    city: "نواكشوط",
    website: "https://www.esp.mr/",
    logo: "https://www.esp.mr/assets/images/logo.png",
    description: "قطب للتكوين الهندسي والتقني، ويضم مسارات تحضيرية وهندسية في الطاقة والهندسة المدنية والميكانيكية والإحصاء وغيرها.",
  },
  "المعهد العالي للرقمنة": {
    city: "نواكشوط",
    website: "https://supnum.mr/",
    logo: "https://www.itaun.org/wp-content/uploads/2024/11/logo-supnum2.png",
    description: "معهد عمومي متخصص في المهن الرقمية، بتكوينات مهنية تعتمد على المشاريع والتطبيق والتدريب في المؤسسات.",
    officialPrograms: [
      "هندسة الأنظمة الذكية",
      "هندسة البيانات والإحصاء",
      "تطوير نظم المعلومات",
      "الشبكات والأنظمة والأمن",
      "الاتصال الرقمي والملتيميديا",
      "ماستر الأمن السيبراني",
      "ماستر الذكاء الاصطناعي",
    ],
  },
  "المعهد العالي للمحاسبة وإدارة المؤسسات": {
    city: "نواكشوط",
    website: "",
    description: "مؤسسة عمومية متخصصة في المحاسبة والتسيير والمالية والبنوك والتأمين والموارد البشرية ونظم المعلومات الإدارية.",
  },
  "المدرسة العليا للتعليم": {
    city: "نواكشوط",
    description: "مؤسسة عمومية للتكوين في مهن التعليم، وتضم مسارات علمية وأدبية ولغوية وتربوية.",
  },
  "المعهد العالي للتعليم التكنولوجي بروصو": {
    city: "روصو",
    description: "معهد عمومي للتكوين والبحث والإرشاد في المجالات الزراعية والرعوية والغذائية، إلى جانب مسارات تقنية وهندسية تطبيقية.",
  },
  "المعهد العالي للهندسة الصناعية": {
    city: "نواكشوط",
    description: "مؤسسة تعليم عالٍ متخصصة في التكوين والبحث والابتكار في مجالات الهندسة والصناعة.",
  },
  "المدرسة الوطنية العليا لعلوم الصحة": {
    city: "نواكشوط",
    description: "مؤسسة متخصصة في تكوين الكفاءات في علوم ومهن الصحة.",
  },
  "المعهد العالي المهني للغات والترجمة والترجمة الفورية": {
    city: "نواذيبو",
    description: "معهد مهني متخصص في اللغات والترجمة والترجمة الفورية بمسارات متعددة بين العربية والفرنسية والإنجليزية.",
  },
  "المعهد العالي للدراسات والبحوث الإسلامية": {
    city: "نواكشوط",
    description: "مؤسسة تعليم عالٍ متخصصة في الدراسات والبحوث الإسلامية.",
  },
  "المعهد العالي للإنجليزية": {
    city: "نواكشوط",
    description: "مؤسسة متخصصة في تكوين اللغة الإنجليزية والمهارات المرتبطة بها.",
  },
  "المعهد العالي للشباب والرياضة": {
    city: "نواكشوط",
    description: "مؤسسة متخصصة في علوم وتقنيات الأنشطة البدنية والرياضية والسوسيوتربوية.",
  },
  "المعهد العالي لعلوم البحار": {
    city: "نواذيبو",
    description: "مؤسسة متخصصة في علوم البحر والصيد والبيئة الساحلية واللوجستيات والإدارة المينائية.",
  },
  "مدرسة نواكشوط للأعمال": {
    city: "نواكشوط",
    description: "مؤسسة متخصصة في إدارة الأعمال والتكوينات المرتبطة بالتسيير وريادة الأعمال.",
  },
  "كلية الشريعة": {
    city: "لعيون",
    parent: "جامعة العلوم الإسلامية بلعيون",
    description: "كلية متخصصة في الشريعة والفقه والأصول والقانون والاقتصاد الإسلامي.",
  },
  "كلية أصول الدين": {
    city: "لعيون",
    parent: "جامعة العلوم الإسلامية بلعيون",
    description: "كلية متخصصة في أصول الدين والقرآن والسنة والعقيدة والفكر الإسلامي والسياسة الشرعية.",
  },
  "كلية اللغة العربية والعلوم الإنسانية": {
    city: "لعيون",
    parent: "جامعة العلوم الإسلامية بلعيون",
    description: "كلية تجمع اللغة العربية والعلوم الإنسانية والإعلام والتاريخ والتربية.",
  },
  "المحظرة الكبرى الشنقيطية": {
    city: "أكجوجت",
    description: "مؤسسة للتعليم العالي تجمع التكوين المحظري والدراسات الإسلامية واللغة العربية.",
  },
};

function cleanFaculty(program) {
  const faculty = String(program.faculty || "").trim();
  return !faculty || faculty === "غير متوفر حالياً" ? "التخصصات المتاحة" : faculty;
}

function scoreRange(values) {
  if (!values.length) return null;
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export function getInstitutionMeta(name) {
  return { ...DEFAULT_META, ...(INSTITUTION_META[name] || {}) };
}

export function buildOrientationInstitutions(programs) {
  const institutions = new Map();

  programs
    .filter((program) => program.country === "موريتانيا")
    .forEach((program) => {
      if (!institutions.has(program.institution)) {
        institutions.set(program.institution, {
          name: program.institution,
          scores: [],
          streams: new Set(),
          specialties: new Map(),
          faculties: new Map(),
        });
      }

      const institution = institutions.get(program.institution);
      const facultyName = cleanFaculty(program);

      institution.scores.push(Number(program.lastScore));
      institution.streams.add(program.stream);

      const existingSpecialty = institution.specialties.get(program.name);
      if (!existingSpecialty || Number(program.lastScore) > Number(existingSpecialty.lastScore)) {
        institution.specialties.set(program.name, {
          name: program.name,
          id: program.id,
          lastScore: Number(program.lastScore),
        });
      }

      if (!institution.faculties.has(facultyName)) {
        institution.faculties.set(facultyName, new Map());
      }
      const facultySpecialties = institution.faculties.get(facultyName);
      const facultyExisting = facultySpecialties.get(program.name);
      if (!facultyExisting || Number(program.lastScore) > Number(facultyExisting.lastScore)) {
        facultySpecialties.set(program.name, {
          name: program.name,
          id: program.id,
          lastScore: Number(program.lastScore),
          stream: program.stream,
        });
      }
    });

  return [...institutions.values()]
    .map((institution) => {
      const meta = getInstitutionMeta(institution.name);
      const faculties = [...institution.faculties.entries()]
        .map(([name, specialties]) => ({
          name,
          specialties: [...specialties.values()].sort((a, b) => a.name.localeCompare(b.name, "ar")),
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "ar"));

      return {
        name: institution.name,
        ...meta,
        faculties,
        specialties: [...institution.specialties.values()].sort((a, b) => a.name.localeCompare(b.name, "ar")),
        specialtyCount: institution.specialties.size,
        facultyCount: faculties.filter((faculty) => faculty.name !== "التخصصات المتاحة").length,
        streams: [...institution.streams],
        scoreRange: scoreRange(institution.scores),
      };
    })
    .sort((a, b) => b.specialtyCount - a.specialtyCount || a.name.localeCompare(b.name, "ar"));
}
