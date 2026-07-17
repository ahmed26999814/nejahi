export const LEGACY_2025_EXAMS: Array<Record<string, unknown>> = [
  {
    source_key: "bac", table_name: "bac_results", title_ar: "نتائج باكالوريا 2025", title_fr: "Résultats Bac 2025",
    description_ar: "النتائج الرسمية للباكالوريا لسنة 2025.", description_fr: "Résultats officiels du baccalauréat 2025.",
    year: "2025", tone: "green", search_mode: "simple", number_column: "Numero", name_column: "NOM", score_column: "MOD",
    decision_column: "KR", track_column: "TS", wilaya_column: "WL", moughataa_column: "", school_column: "MS", centre_column: "MD",
    birth_place_column: "", birth_date_column: "", ranked_view: "bac_ranked_results", total_rows: null, created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    source_key: "brevet", table_name: "brevet_results", title_ar: "نتائج ابريفه 2025", title_fr: "Résultats BEPC 2025",
    description_ar: "نتائج شهادة ختم الدروس الإعدادية الرسمية لسنة 2025.", description_fr: "Résultats officiels du BEPC 2025.",
    year: "2025", tone: "blue", search_mode: "simple", number_column: "Num_Bepc", name_column: "NOM", score_column: "Moyenne_Bepc",
    decision_column: "Decision", track_column: null, wilaya_column: "WILAYA", moughataa_column: "", school_column: "Ecole", centre_column: "Centre",
    birth_place_column: "LIEU_NAIS", birth_date_column: "DATE_NAISS", ranked_view: "brevet_ranked_results", total_rows: null, created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    source_key: "concours", table_name: "concours_results_view", title_ar: "نتائج كونكور 2025", title_fr: "Résultats Concours 2025",
    description_ar: "ابحث بالولاية والمقاطعة والمركز ورقم المترشح لسنة 2025.", description_fr: "Recherche par région, département, centre et numéro 2025.",
    year: "2025", tone: "gold", search_mode: "concours", number_column: "NODOSS", name_column: "NOM_AR", score_column: "total_num",
    decision_column: "TYPE", track_column: null, wilaya_column: "WILAYA_AR", moughataa_column: "MOUGHATAA_AR", school_column: "Ecole_AR",
    centre_column: "Centre Examen_AR", birth_place_column: "LIEU NAISS_AR", birth_date_column: "ANNEE_NAISS", ranked_view: "concours_ranked_results",
    total_rows: null, created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    source_key: "excellence_1as", table_name: "excellence_1as_results", title_ar: "نتائج الامتياز الأولى إعدادية 2025", title_fr: "Résultats Excellence 1AS 2025",
    description_ar: "نتائج مسابقة الامتياز الأولى إعدادية لسنة 2025.", description_fr: "Résultats du concours Excellence 1AS 2025.",
    year: "2025", tone: "teal", search_mode: "simple", number_column: "Num_Excellence_1AS", name_column: "Nom", score_column: "Mgex",
    decision_column: "Decision", track_column: "SERIE", wilaya_column: "Wilaya_AR", moughataa_column: "", school_column: "", centre_column: "CENTRE_AR",
    birth_place_column: "Lieu", birth_date_column: "DATEN", ranked_view: "excellence_1as_ranked_results", total_rows: null, created_at: "2025-07-01T00:00:00.000Z",
  },
  {
    source_key: "bac_session", table_name: "bac_session2_results", title_ar: "نتائج باكالوريا الدورة التكميلية 2025", title_fr: "Résultats Bac session complémentaire 2025",
    description_ar: "نتائج الدورة التكميلية للباكالوريا لسنة 2025.", description_fr: "Résultats de la session complémentaire du Bac 2025.",
    year: "2025", tone: "amber", search_mode: "simple", number_column: "NODOSS", name_column: "NOM_AR", score_column: "Moy Bac_Session",
    decision_column: "Decision", track_column: "SERIE", wilaya_column: "Wilaya_AR", moughataa_column: "", school_column: "Etablissement_AR",
    centre_column: "Centre Examen_AR", birth_place_column: "LIEUNN_AR", birth_date_column: "DATN", ranked_view: "bac_session2_ranked_results",
    total_rows: null, created_at: "2025-07-01T00:00:00.000Z",
  },
];
