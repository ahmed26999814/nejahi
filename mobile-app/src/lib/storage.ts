import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AppSettings, Exam, SavedResult, SearchHistoryItem } from "../types";

const KEYS = {
  exams: "mr:exams:v2",
  saved: "mr:saved:v2",
  history: "mr:history:v2",
  settings: "mr:settings:v2",
  knownExamSources: "mr:known-exams:v2",
} as const;

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  readExams: () => readJson<Exam[]>(KEYS.exams, []),
  writeExams: (exams: Exam[]) => writeJson(KEYS.exams, exams),
  readSaved: () => readJson<SavedResult[]>(KEYS.saved, []),
  writeSaved: (saved: SavedResult[]) => writeJson(KEYS.saved, saved),
  readHistory: () => readJson<SearchHistoryItem[]>(KEYS.history, []),
  writeHistory: (history: SearchHistoryItem[]) => writeJson(KEYS.history, history.slice(0, 30)),
  readSettings: () => readJson<AppSettings>(KEYS.settings, {
    language: "ar",
    themeMode: "system",
    notificationsEnabled: true,
  }),
  writeSettings: (settings: AppSettings) => writeJson(KEYS.settings, settings),
  readKnownExamSources: () => readJson<string[]>(KEYS.knownExamSources, []),
  writeKnownExamSources: (sources: string[]) => writeJson(KEYS.knownExamSources, sources),
};
