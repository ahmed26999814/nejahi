export type Lesson = {
  id: string;
  icon: string;
  categoryAr: string;
  categoryFr: string;
  titleAr: string;
  titleFr: string;
  summaryAr: string;
  summaryFr: string;
  duration: number;
  stepsAr: string[];
  stepsFr: string[];
  tipsAr: string[];
  tipsFr: string[];
  keywords: string[];
};

export const LESSONS: Lesson[] = [
  {
    id: "math-functions", icon: "ƒ", categoryAr: "الرياضيات", categoryFr: "Mathématiques",
    titleAr: "دراسة دالة خطوة بخطوة", titleFr: "Étudier une fonction étape par étape",
    summaryAr: "خطة عملية للمجال والنهايات والاشتقاق وجدول التغيرات والرسم.",
    summaryFr: "Une méthode claire: domaine, limites, dérivée, variations et graphe.", duration: 12,
    stepsAr: ["حدد مجال التعريف قبل أي حساب.", "احسب النهايات عند حدود المجال وعند ما لا نهاية.", "اشتق الدالة وحدد إشارة المشتقة.", "أنشئ جدول التغيرات واستخرج القيم القصوى.", "ابحث عن التقاطعات والمقاربـات قبل الرسم."],
    stepsFr: ["Déterminer le domaine avant tout calcul.", "Calculer les limites aux bornes et à l’infini.", "Dériver puis étudier le signe.", "Construire le tableau de variations.", "Chercher intersections et asymptotes avant le tracé."],
    tipsAr: ["اكتب نتيجة كل مرحلة بجملة واضحة.", "راجع توافق الرسم مع جدول التغيرات."],
    tipsFr: ["Conclure chaque étape par une phrase.", "Vérifier que le graphe respecte les variations."],
    keywords: ["دالة", "اشتقاق", "نهايات", "fonction", "dérivée"]
  },
  {
    id: "math-probability", icon: "P", categoryAr: "الرياضيات", categoryFr: "Mathématiques",
    titleAr: "أساسيات الاحتمالات", titleFr: "Les bases des probabilités",
    summaryAr: "الحدث والاحتمال الشرطي والاستقلال وشجرة الاحتمالات.",
    summaryFr: "Événements, conditionnement, indépendance et arbres pondérés.", duration: 10,
    stepsAr: ["عرّف الأحداث بالرموز قبل التعويض.", "استعمل شجرة عندما تكون التجربة على مراحل.", "مجموع فروع العقدة يساوي 1.", "استعمل P(A|B)=P(A∩B)/P(B).", "اختبر الاستقلال بمقارنة P(A∩B) مع P(A)P(B)."],
    stepsFr: ["Définir les événements avant les calculs.", "Utiliser un arbre pour une expérience par étapes.", "La somme des branches d’un nœud vaut 1.", "Utiliser P(A|B)=P(A∩B)/P(B).", "Tester l’indépendance avec P(A∩B)=P(A)P(B)."],
    tipsAr: ["لا تخلط بين التقاطع والاتحاد.", "احتفظ بالكسور حتى آخر خطوة."],
    tipsFr: ["Ne pas confondre intersection et union.", "Garder les fractions jusqu’à la fin."],
    keywords: ["احتمال", "شرطي", "شجرة", "probabilité"]
  },
  {
    id: "science-genetics", icon: "DNA", categoryAr: "العلوم الطبيعية", categoryFr: "Sciences naturelles",
    titleAr: "من المورثة إلى الصفة", titleFr: "Du gène au caractère",
    summaryAr: "ربط ADN والنسخ والترجمة والبروتين بظهور الصفة.",
    summaryFr: "Relier ADN, transcription, traduction, protéine et caractère.", duration: 14,
    stepsAr: ["المورثة جزء من ADN يحمل معلومة لتركيب بروتين.", "ينسخ الشريط القالب إلى ARN رسول.", "يترجم ARN على الريبوزوم إلى أحماض أمينية.", "تحدد بنية البروتين وظيفته وتؤثر الوظيفة في الصفة.", "قد تغير الطفرة البروتين أو لا تغيره حسب موقعها."],
    stepsFr: ["Un gène est une portion d’ADN portant une information.", "Le brin matrice est transcrit en ARNm.", "L’ARNm est traduit en acides aminés.", "La structure de la protéine détermine sa fonction.", "Une mutation peut modifier ou non la protéine."],
    tipsAr: ["ارسم: مورثة ← ARN ← بروتين ← صفة.", "فسر الوثائق قبل استحضار الدرس."],
    tipsFr: ["Mémoriser gène → ARN → protéine → caractère.", "Interpréter les documents avant de réciter."],
    keywords: ["ADN", "مورثة", "بروتين", "gène"]
  },
  {
    id: "arabic-essay", icon: "ض", categoryAr: "اللغة العربية", categoryFr: "Arabe",
    titleAr: "بناء موضوع إنشائي قوي", titleFr: "Construire une rédaction arabe solide",
    summaryAr: "مقدمة مركزة وأفكار مترابطة وشواهد مناسبة وخاتمة واضحة.",
    summaryFr: "Introduction, arguments liés, exemples pertinents et conclusion nette.", duration: 9,
    stepsAr: ["حول السؤال إلى إشكال واضح.", "رتب الأفكار من السبب إلى النتيجة.", "اجعل لكل فقرة فكرة ودليلًا.", "استعمل روابط منطقية بين الفقرات.", "اختم بخلاصة تجيب عن الإشكال."],
    stepsFr: ["Transformer le sujet en problématique.", "Ordonner les idées logiquement.", "Associer chaque paragraphe à une idée et un exemple.", "Utiliser des connecteurs cohérents.", "Conclure par une réponse synthétique."],
    tipsAr: ["اترك دقيقتين للمراجعة اللغوية.", "تجنب الشاهد الذي لا تستطيع شرحه."],
    tipsFr: ["Réserver deux minutes à la correction.", "Éviter une citation non expliquée."],
    keywords: ["إنشاء", "مقال", "عربية", "rédaction"]
  },
  {
    id: "philosophy", icon: "φ", categoryAr: "الفلسفة", categoryFr: "Philosophie",
    titleAr: "منهجية المقال الفلسفي", titleFr: "Méthode de dissertation philosophique",
    summaryAr: "فهم السؤال وبناء الإشكال وعرض المواقف ومناقشتها وتركيب جواب.",
    summaryFr: "Analyser, problématiser, discuter les thèses et synthétiser.", duration: 13,
    stepsAr: ["حدد مفاهيم السؤال والعلاقة بينها.", "اكشف المفارقة التي تجعل السؤال مشكلة.", "اعرض موقفًا بحججه لا باسمه فقط.", "ناقش حدود الموقف باعتراض مضبوط.", "قدم تركيبًا يجيب عن الإشكال."],
    stepsFr: ["Définir les concepts et leur relation.", "Faire apparaître la tension du sujet.", "Présenter une thèse avec ses arguments.", "Discuter ses limites précisément.", "Construire une synthèse répondant au problème."],
    tipsAr: ["الحجة أهم من كثرة أسماء الفلاسفة.", "لا تجعل الخاتمة رأيًا بلا تعليل."],
    tipsFr: ["L’argument compte plus que la liste d’auteurs.", "Éviter une conclusion sans justification."],
    keywords: ["فلسفة", "مقال", "إشكال", "philosophie"]
  },
  {
    id: "study-method", icon: "↻", categoryAr: "منهجية المراجعة", categoryFr: "Méthode de travail",
    titleAr: "المراجعة المتباعدة والاسترجاع النشط", titleFr: "Répétition espacée et rappel actif",
    summaryAr: "طريقة عملية لتثبيت المعلومات بدل إعادة القراءة فقط.",
    summaryFr: "Mémoriser durablement au lieu de relire passivement.", duration: 7,
    stepsAr: ["بعد الدرس أغلق الكتاب واكتب ما تتذكره.", "راجع بعد يوم ثم ثلاثة أيام ثم أسبوع.", "حول العناوين إلى أسئلة واختبر نفسك.", "ركز التكرار على الأخطاء لا على السهل.", "اخلط موضوعات قريبة لتتعلم التمييز بينها."],
    stepsFr: ["Fermer le cours et restituer de mémoire.", "Revoir après un jour, trois jours puis une semaine.", "Transformer les titres en questions.", "Répéter surtout les erreurs.", "Alterner des notions proches."],
    tipsAr: ["اختبار قصير أفضل من قراءة طويلة خاملة.", "اجعل الجلسة 25–40 دقيقة ثم استرح."],
    tipsFr: ["Un test court vaut mieux qu’une longue relecture.", "Travailler 25 à 40 minutes puis faire une pause."],
    keywords: ["مراجعة", "حفظ", "تكرار", "révision"]
  }
];
