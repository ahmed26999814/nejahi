export type Language = "ar" | "fr";
export type ThemeMode = "system" | "light" | "dark";

export type Exam = {
  source_key: string;
  table_name: string;
  title_ar: string;
  title_fr: string;
  description_ar?: string;
  description_fr?: string;
  year?: string;
  tone?: string;
  search_mode?: string;
  number_column?: string;
  name_column?: string;
  score_column?: string;
  decision_column?: string;
  track_column?: string | null;
  wilaya_column?: string;
  moughataa_column?: string;
  school_column?: string;
  centre_column?: string;
  birth_place_column?: string;
  birth_date_column?: string;
  total_rows?: number;
  created_at?: string;
};

export type ResultRow = Record<string, unknown>;

export type SavedResult = {
  id: string;
  exam: Exam;
  row: ResultRow;
  savedAt: string;
};

export type SearchHistoryItem = {
  id: string;
  source: string;
  titleAr: string;
  titleFr: string;
  query: string;
  resultCount: number;
  searchedAt: string;
};

export type AppSettings = {
  language: Language;
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
};

export type AnalyticsData = {
  stats?: {
    total?: number;
    passed?: number;
    failed?: number;
    average?: number;
    highest?: number;
    isConcours?: boolean;
  };
  trackStats?: Array<Record<string, unknown>>;
  regionStats?: Array<Record<string, unknown>>;
  schoolStats?: Array<Record<string, unknown>>;
  topStudents?: Array<Record<string, unknown>>;
};
