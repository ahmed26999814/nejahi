import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import { AppProvider, useApp } from "./src/context/AppContext";
import { t } from "./src/lib/i18n";
import type { Exam, ResultRow, SavedResult } from "./src/types";
import type { Lesson } from "./src/data/lessons";
import { HomeScreen } from "./src/screens/HomeScreen";
import { SavedScreen } from "./src/screens/SavedScreen";
import { StatsScreen } from "./src/screens/StatsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { ResultDetailsScreen } from "./src/screens/ResultDetailsScreen";
import { CalculatorScreen } from "./src/screens/CalculatorScreen";
import { LessonsScreen } from "./src/screens/LessonsScreen";
import { LessonDetailsScreen } from "./src/screens/LessonDetailsScreen";

type TabName = "home" | "calculator" | "lessons" | "saved" | "stats";
type Route =
  | { name: "tabs" }
  | { name: "settings" }
  | { name: "lesson"; lesson: Lesson }
  | { name: "search"; exam: Exam; initialQuery?: string }
  | {
      name: "details";
      exam: Exam;
      row: ResultRow;
      returnTo: { type: "search"; query: string } | { type: "saved" };
    };

const TAB_ICONS: Record<TabName, string> = {
  home: "⌂",
  calculator: "∑",
  lessons: "▤",
  saved: "★",
  stats: "▥",
};

function MainApp() {
  const { ready, colors, isDark, language, isOnline, exams } = useApp();
  const [tab, setTab] = useState<TabName>("home");
  const [route, setRoute] = useState<Route>({ name: "tabs" });
  const lastBackPress = useRef(0);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const source = String(response.notification.request.content.data?.source || "");
      const exam = exams.find((entry) => entry.source_key === source);
      if (exam) setRoute({ name: "search", exam });
    });
    return () => subscription.remove();
  }, [exams]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (route.name === "search") {
        setRoute({ name: "tabs" });
        return true;
      }

      if (route.name === "details") {
        if (route.returnTo.type === "search") {
          setRoute({ name: "search", exam: route.exam, initialQuery: route.returnTo.query });
        } else {
          setTab("saved");
          setRoute({ name: "tabs" });
        }
        return true;
      }

      if (route.name === "settings" || route.name === "lesson") {
        setRoute({ name: "tabs" });
        return true;
      }

      if (tab !== "home") {
        setTab("home");
        return true;
      }

      const now = Date.now();
      if (now - lastBackPress.current < 2000) return false;
      lastBackPress.current = now;
      if (Platform.OS === "android") {
        ToastAndroid.show(
          language === "ar" ? "اضغط رجوع مرة ثانية للخروج" : "Appuyez encore pour quitter",
          ToastAndroid.SHORT,
        );
      }
      return true;
    });

    return () => subscription.remove();
  }, [language, route, tab]);

  const tabLabels = useMemo<Record<TabName, string>>(
    () => ({
      home: t(language, "home"),
      calculator: t(language, "calculator"),
      lessons: t(language, "lessons"),
      saved: t(language, "saved"),
      stats: t(language, "stats"),
    }),
    [language],
  );

  if (!ready) {
    return (
      <SafeAreaView style={[styles.loadingRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingLogo, { backgroundColor: colors.primary }]}>
          <Text style={styles.loadingLogoText}>MR</Text>
        </View>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingTitle, { color: colors.text }]}>MauriResults</Text>
      </SafeAreaView>
    );
  }

  if (route.name === "search") {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <SearchScreen
          exam={route.exam}
          initialQuery={route.initialQuery}
          onBack={() => setRoute({ name: "tabs" })}
          onDetails={(row, query) =>
            setRoute({ name: "details", exam: route.exam, row, returnTo: { type: "search", query } })
          }
        />
      </SafeAreaView>
    );
  }

  if (route.name === "details") {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <ResultDetailsScreen
          exam={route.exam}
          row={route.row}
          onBack={() => {
            if (route.returnTo.type === "search") {
              setRoute({ name: "search", exam: route.exam, initialQuery: route.returnTo.query });
            } else {
              setTab("saved");
              setRoute({ name: "tabs" });
            }
          }}
        />
      </SafeAreaView>
    );
  }

  if (route.name === "lesson") {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <LessonDetailsScreen lesson={route.lesson} onBack={() => setRoute({ name: "tabs" })} />
      </SafeAreaView>
    );
  }

  if (route.name === "settings") {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <View
          style={[
            styles.routeHeader,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              flexDirection: language === "ar" ? "row-reverse" : "row",
            },
          ]}
        >
          <Pressable
            onPress={() => setRoute({ name: "tabs" })}
            style={[styles.routeBack, { backgroundColor: colors.surfaceAlt }]}
          >
            <Text style={[styles.routeBackText, { color: colors.text }]}>{language === "ar" ? "→" : "←"}</Text>
          </Pressable>
          <Text style={[styles.routeTitle, { color: colors.text }]}>{t(language, "settings")}</Text>
        </View>
        <SettingsScreen />
      </SafeAreaView>
    );
  }

  function openSaved(item: SavedResult) {
    setRoute({ name: "details", exam: item.exam, row: item.row, returnTo: { type: "saved" } });
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]} edges={["top", "bottom"]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            flexDirection: language === "ar" ? "row-reverse" : "row",
          },
        ]}
      >
        <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
          <Text style={styles.brandIconText}>MR</Text>
        </View>
        <View style={{ flex: 1, alignItems: language === "ar" ? "flex-end" : "flex-start" }}>
          <Text style={[styles.brandName, { color: colors.text }]}>MauriResults</Text>
          <Text style={[styles.brandSubtitle, { color: colors.muted }]}>{t(language, "nativeApp")}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: isOnline ? colors.primarySoft : `${colors.gold}20` }]}>
          <View style={[styles.statusDot, { backgroundColor: isOnline ? colors.primary : colors.gold }]} />
          <Text style={[styles.statusText, { color: isOnline ? colors.primary : colors.gold }]}>
            {isOnline ? "ON" : "OFF"}
          </Text>
        </View>
        <Pressable
          onPress={() => setRoute({ name: "settings" })}
          accessibilityLabel={t(language, "settings")}
          style={({ pressed }) => [
            styles.settingsButton,
            { backgroundColor: colors.surfaceAlt, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Text style={[styles.settingsIcon, { color: colors.text }]}>⚙</Text>
        </Pressable>
      </View>

      <View style={styles.contentArea}>
        {tab === "home" ? (
          <HomeScreen
            onExam={(exam, initialQuery) => setRoute({ name: "search", exam, initialQuery })}
            onCalculator={() => setTab("calculator")}
            onLessons={() => setTab("lessons")}
            onSaved={() => setTab("saved")}
          />
        ) : null}
        {tab === "calculator" ? <CalculatorScreen /> : null}
        {tab === "lessons" ? <LessonsScreen onOpen={(lesson) => setRoute({ name: "lesson", lesson })} /> : null}
        {tab === "saved" ? <SavedScreen onOpen={openSaved} /> : null}
        {tab === "stats" ? <StatsScreen /> : null}
      </View>

      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {(Object.keys(TAB_ICONS) as TabName[]).map((name) => {
          const active = tab === name;
          return (
            <Pressable
              key={name}
              onPress={() => setTab(name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={({ pressed }) => [
                styles.tabButton,
                {
                  backgroundColor: active ? colors.primary : "transparent",
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Text style={[styles.tabIcon, { color: active ? "#FFFFFF" : colors.muted }]}>{TAB_ICONS[name]}</Text>
              <Text style={[styles.tabLabel, { color: active ? "#FFFFFF" : colors.muted }]} numberOfLines={1}>
                {tabLabels[name]}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <MainApp />
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  loadingLogo: { width: 82, height: 82, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  loadingLogoText: { color: "#FFFFFF", fontSize: 29, fontWeight: "900" },
  loadingTitle: { fontSize: 18, fontWeight: "900" },
  topBar: {
    minHeight: 64,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    gap: 9,
  },
  brandIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  brandIconText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  brandName: { fontSize: 15, fontWeight: "900" },
  brandSubtitle: { marginTop: 2, fontSize: 9, fontWeight: "700" },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 5, minHeight: 27, borderRadius: 999, paddingHorizontal: 8 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 8, fontWeight: "900" },
  settingsButton: { width: 38, height: 38, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  settingsIcon: { fontSize: 17 },
  contentArea: { flex: 1 },
  bottomBar: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 7,
    minHeight: 68,
    borderWidth: 1,
    borderRadius: 24,
    padding: 5,
    flexDirection: "row",
    gap: 3,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    elevation: 10,
  },
  tabButton: {
    flex: 1,
    minHeight: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 1,
  },
  tabIcon: { fontSize: 17, fontWeight: "900" },
  tabLabel: { maxWidth: "100%", fontSize: 8, fontWeight: "900", textAlign: "center" },
  routeHeader: { minHeight: 64, borderBottomWidth: 1, paddingHorizontal: 13, alignItems: "center", gap: 12 },
  routeBack: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  routeBackText: { fontSize: 21, fontWeight: "900" },
  routeTitle: { flex: 1, fontSize: 17, fontWeight: "900" },
});
