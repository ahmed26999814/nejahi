import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Alert, useColorScheme } from "react-native";
import * as Haptics from "expo-haptics";
import * as Network from "expo-network";
import * as Notifications from "expo-notifications";
import { fetchExams } from "../lib/api";
import { t } from "../lib/i18n";
import { resultIdentity } from "../lib/result";
import { storage } from "../lib/storage";
import { darkColors, lightColors, type AppColors } from "../theme/colors";
import type { AppSettings, Exam, Language, ResultRow, SavedResult, SearchHistoryItem, ThemeMode } from "../types";

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }) });

type AppContextValue = { ready: boolean; exams: Exam[]; saved: SavedResult[]; history: SearchHistoryItem[]; settings: AppSettings; colors: AppColors; isDark: boolean; isOnline: boolean; refreshing: boolean; language: Language; refreshExams: () => Promise<void>; saveResult: (exam: Exam, row: ResultRow) => Promise<void>; removeSaved: (id: string) => Promise<void>; isSaved: (exam: Exam, row: ResultRow) => boolean; addHistory: (item: SearchHistoryItem) => Promise<void>; clearHistory: () => Promise<void>; setLanguage: (language: Language) => Promise<void>; setThemeMode: (themeMode: ThemeMode) => Promise<void>; setNotificationsEnabled: (enabled: boolean) => Promise<void>; };
const AppContext = createContext<AppContextValue | null>(null);

async function ensureNotificationChannel() { await Notifications.setNotificationChannelAsync("results", { name: "نتائج جديدة", importance: Notifications.AndroidImportance.DEFAULT, vibrationPattern: [0, 180, 100, 180], lightColor: "#106B41" }); }

export function AppProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [ready, setReady] = useState(false); const [exams, setExams] = useState<Exam[]>([]); const [saved, setSaved] = useState<SavedResult[]>([]); const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ language: "ar", themeMode: "system", notificationsEnabled: true });
  const [isOnline, setIsOnline] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const language = settings.language; const isDark = settings.themeMode === "dark" || (settings.themeMode === "system" && systemScheme === "dark"); const colors = (isDark ? darkColors : lightColors) as AppColors;

  const refreshExams = useCallback(async () => {
    setRefreshing(true);
    try {
      const network = await Network.getNetworkStateAsync(); const online = Boolean(network.isConnected && network.isInternetReachable !== false); setIsOnline(online); if (!online) return;
      const fresh = await fetchExams(); if (!fresh.length) return; const known = await storage.readKnownExamSources(); const freshSources = fresh.map((exam) => exam.source_key); const newSources = known.length ? freshSources.filter((source) => !known.includes(source)) : [];
      setExams(fresh); await Promise.all([storage.writeExams(fresh), storage.writeKnownExamSources(freshSources)]);
      if (newSources.length && settings.notificationsEnabled) { const permission = await Notifications.getPermissionsAsync(); if (permission.granted) await Notifications.scheduleNotificationAsync({ content: { title: t(settings.language, "newExamTitle"), body: t(settings.language, "newExamBody"), data: { source: newSources[0] } }, trigger: null }); }
    } catch { setIsOnline(false); } finally { setRefreshing(false); }
  }, [settings.language, settings.notificationsEnabled]);

  useEffect(() => { let active = true; (async () => { await ensureNotificationChannel().catch(() => undefined); const [cachedExams, cachedSaved, cachedHistory, cachedSettings] = await Promise.all([storage.readExams(), storage.readSaved(), storage.readHistory(), storage.readSettings()]); if (!active) return; setExams(cachedExams); setSaved(cachedSaved); setHistory(cachedHistory); setSettings(cachedSettings); setReady(true); })(); return () => { active = false; }; }, []);
  useEffect(() => { if (ready) void refreshExams(); }, [ready, refreshExams]);

  const saveResult = useCallback(async (exam: Exam, row: ResultRow) => { const id = resultIdentity(exam, row); const next: SavedResult[] = [{ id, exam, row, savedAt: new Date().toISOString() }, ...saved.filter((item) => item.id !== id)].slice(0, 100); setSaved(next); await storage.writeSaved(next); await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined); }, [saved]);
  const removeSaved = useCallback(async (id: string) => { const next = saved.filter((item) => item.id !== id); setSaved(next); await storage.writeSaved(next); await Haptics.selectionAsync().catch(() => undefined); }, [saved]);
  const isSaved = useCallback((exam: Exam, row: ResultRow) => saved.some((item) => item.id === resultIdentity(exam, row)), [saved]);
  const addHistory = useCallback(async (item: SearchHistoryItem) => { const next = [item, ...history.filter((entry) => !(entry.source === item.source && entry.query === item.query))].slice(0, 30); setHistory(next); await storage.writeHistory(next); }, [history]);
  const clearHistory = useCallback(async () => { setHistory([]); await storage.writeHistory([]); }, []);
  const updateSettings = useCallback(async (patch: Partial<AppSettings>) => { const next = { ...settings, ...patch }; setSettings(next); await storage.writeSettings(next); }, [settings]);
  const setLanguage = useCallback(async (nextLanguage: Language) => { await updateSettings({ language: nextLanguage }); await Haptics.selectionAsync().catch(() => undefined); }, [updateSettings]);
  const setThemeMode = useCallback(async (themeMode: ThemeMode) => { await updateSettings({ themeMode }); await Haptics.selectionAsync().catch(() => undefined); }, [updateSettings]);
  const setNotificationsEnabled = useCallback(async (enabled: boolean) => { if (enabled) { await ensureNotificationChannel().catch(() => undefined); const permission = await Notifications.requestPermissionsAsync(); if (!permission.granted) { Alert.alert(t(language, "notifications"), t(language, "permissionNeeded")); await updateSettings({ notificationsEnabled: false }); return; } } await updateSettings({ notificationsEnabled: enabled }); await Haptics.selectionAsync().catch(() => undefined); }, [language, updateSettings]);
  const value = useMemo<AppContextValue>(() => ({ ready, exams, saved, history, settings, colors, isDark, isOnline, refreshing, language, refreshExams, saveResult, removeSaved, isSaved, addHistory, clearHistory, setLanguage, setThemeMode, setNotificationsEnabled }), [ready, exams, saved, history, settings, colors, isDark, isOnline, refreshing, language, refreshExams, saveResult, removeSaved, isSaved, addHistory, clearHistory, setLanguage, setThemeMode, setNotificationsEnabled]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() { const context = useContext(AppContext); if (!context) throw new Error("useApp must be used inside AppProvider"); return context; }
