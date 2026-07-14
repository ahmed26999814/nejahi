import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../context/AppContext";
import { t } from "../lib/i18n";
import type { Exam } from "../types";
import { ExamCard } from "../components/ExamCard";
import { EmptyState, Pill, SectionTitle } from "../components/ui";

type Props = {
  onExam: (exam: Exam, initialQuery?: string) => void;
  onCalculator: () => void;
  onLessons: () => void;
  onSaved: () => void;
};

const examType = (exam: Exam) => `${exam.source_key} ${exam.title_ar} ${exam.title_fr}`.toLowerCase();

export function HomeScreen({ onExam, onCalculator, onLessons, onSaved }: Props) {
  const { colors, language, exams, history, saved, isOnline, refreshing, refreshExams } = useApp();
  const years = useMemo(() => Array.from(new Set(["2025", ...exams.map((exam) => String(exam.year || "")).filter(Boolean)])).sort((a, b) => Number(b) - Number(a)), [exams]);
  const latestAvailableYear = useMemo(() => exams.map((exam) => Number(exam.year || 0)).sort((a, b) => b - a)[0]?.toString() || "2025", [exams]);
  const [selectedYear, setSelectedYear] = useState(latestAvailableYear);
  const selectedExams = useMemo(() => exams.filter((exam) => String(exam.year || "") === selectedYear), [exams, selectedYear]);
  const latestExam = useMemo(() => [...exams].sort((a, b) => Number(b.year || 0) - Number(a.year || 0))[0], [exams]);
  const exams2025 = exams.filter((exam) => String(exam.year || "") === "2025");
  const isAr = language === "ar";
  const labels = isAr ? {
    subtitle: "النتائج، حاسبة المعدل، والدروس في تطبيق واحد",
    quick: "وصول سريع",
    results: "البحث في النتائج",
    calculator: "حاسبة المعدل",
    lessons: "الدروس والملخصات",
    saved: "نتائجي المحفوظة",
    status: "حالة نتائج 2025",
    statusHint: "يعرض التطبيق ما هو منشور فعلًا في قاعدة النتائج، ويتحدث تلقائيًا بعد الرفع.",
    available: "متاحة",
    unavailable: "لم تُرفع بعد",
    year: "اختر السنة",
    availableExams: "المسابقات المتاحة",
    noData: "لا توجد نتائج منشورة لهذه السنة حتى الآن.",
    noDataHint: "اضغط تحديث بعد رفع ملفات النتائج من لوحة الإدارة.",
    update: "تحديث الآن",
  } : {
    subtitle: "Résultats, calculateur et cours dans une seule application",
    quick: "Accès rapide",
    results: "Rechercher un résultat",
    calculator: "Calculateur de moyenne",
    lessons: "Cours et fiches",
    saved: "Mes résultats",
    status: "État des résultats 2025",
    statusHint: "L’application affiche uniquement les bases réellement publiées et se met à jour automatiquement.",
    available: "Disponible",
    unavailable: "Non importé",
    year: "Choisir l’année",
    availableExams: "Examens disponibles",
    noData: "Aucun résultat publié pour cette année.",
    noDataHint: "Actualisez après l’import depuis l’administration.",
    update: "Actualiser",
  };

  const slots = [
    { key: "bac", icon: "🎓", ar: "البكالوريا", fr: "Baccalauréat", match: (exam: Exam) => /bac|baccalaur|باكالوريا/.test(examType(exam)) },
    { key: "bepc", icon: "📘", ar: "أبريفه", fr: "BEPC", match: (exam: Exam) => /bepc|brevet|بريف|أبريفه|ابريفه/.test(examType(exam)) },
    { key: "concours", icon: "🏫", ar: "الكونكور", fr: "Concours", match: (exam: Exam) => /concours|كونكور/.test(examType(exam)) },
  ];

  const quickActions = [
    { key: "results", icon: "⌕", title: labels.results, subtitle: latestExam ? (isAr ? latestExam.title_ar : latestExam.title_fr) : t(language, "noExams"), onPress: () => latestExam && onExam(latestExam), accent: colors.primary },
    { key: "calculator", icon: "∑", title: labels.calculator, subtitle: isAr ? "حساب موزون بالمعاملات" : "Calcul pondéré", onPress: onCalculator, accent: colors.gold },
    { key: "lessons", icon: "▤", title: labels.lessons, subtitle: isAr ? "تعمل دون اتصال" : "Disponibles hors ligne", onPress: onLessons, accent: "#4B74D6" },
    { key: "saved", icon: "★", title: labels.saved, subtitle: `${saved.length} ${isAr ? "نتيجة" : "résultat(s)"}`, onPress: onSaved, accent: "#9B5AC8" },
  ];

  return <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshExams} tintColor={colors.primary} colors={[colors.primary]} />} showsVerticalScrollIndicator={false}>
    <LinearGradient colors={["#082F20", "#106B41", "#22935F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={[styles.heroTop, { flexDirection: isAr ? "row-reverse" : "row" }]}><View style={styles.heroLogo}><Text style={styles.heroLogoText}>MR</Text></View><View style={{ flex: 1, alignItems: isAr ? "flex-end" : "flex-start" }}><Text style={[styles.heroTitle, { writingDirection: isAr ? "rtl" : "ltr" }]}>{t(language, "officialResults")}</Text><Text style={[styles.heroText, { writingDirection: isAr ? "rtl" : "ltr" }]}>{labels.subtitle}</Text></View></View>
      <View style={[styles.heroFooter, { flexDirection: isAr ? "row-reverse" : "row" }]}><View style={[styles.livePill, { flexDirection: isAr ? "row-reverse" : "row" }]}><View style={[styles.liveDot, { backgroundColor: isOnline ? "#7EF0AD" : "#F6C461" }]} /><Text style={styles.liveText}>{isOnline ? t(language, "live") : t(language, "cached")}</Text></View><Text style={styles.heroCount}>{exams.length} {isAr ? "مسابقة" : "examens"}</Text></View>
    </LinearGradient>

    {!isOnline ? <View style={[styles.offline, { backgroundColor: `${colors.gold}18`, borderColor: `${colors.gold}55` }]}><Text style={[styles.offlineText, { color: colors.gold }]}>{t(language, "offline")}</Text></View> : null}

    <SectionTitle title={labels.quick} />
    <View style={styles.quickGrid}>{quickActions.map((action) => <Pressable key={action.key} onPress={action.onPress} style={({ pressed }) => [styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow, opacity: pressed ? .78 : 1 }]}><View style={[styles.quickIcon, { backgroundColor: `${action.accent}18` }]}><Text style={[styles.quickIconText, { color: action.accent }]}>{action.icon}</Text></View><Text style={[styles.quickTitle, { color: colors.text, textAlign: isAr ? "right" : "left" }]} numberOfLines={1}>{action.title}</Text><Text style={[styles.quickSubtitle, { color: colors.muted, textAlign: isAr ? "right" : "left" }]} numberOfLines={2}>{action.subtitle}</Text></Pressable>)}</View>

    <View style={styles.gap} /><SectionTitle eyebrow="2025" title={labels.status} />
    <View style={[styles.statusPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={[styles.statusHint, { color: colors.muted, textAlign: isAr ? "right" : "left" }]}>{labels.statusHint}</Text><View style={styles.statusGrid}>{slots.map((slot) => { const exam = exams2025.find(slot.match); return <Pressable key={slot.key} disabled={!exam} onPress={() => exam && onExam(exam)} style={({ pressed }) => [styles.statusCard, { backgroundColor: exam ? colors.primarySoft : colors.surfaceAlt, borderColor: exam ? `${colors.primary}55` : colors.border, opacity: pressed ? .8 : 1 }]}><Text style={styles.statusIcon}>{slot.icon}</Text><Text style={[styles.statusTitle, { color: colors.text }]}>{isAr ? slot.ar : slot.fr}</Text><Text style={[styles.statusLabel, { color: exam ? colors.primary : colors.muted }]}>{exam ? labels.available : labels.unavailable}</Text></Pressable>; })}</View>{!exams2025.length ? <Pressable onPress={() => void refreshExams()} style={({ pressed }) => [styles.refresh, { backgroundColor: colors.primary, opacity: pressed ? .8 : 1 }]}><Text style={styles.refreshText}>{refreshing ? t(language, "loading") : labels.update}</Text></Pressable> : null}</View>

    <View style={styles.gap} /><SectionTitle title={labels.year} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.years}>{years.map((year) => { const active = year === selectedYear; const count = exams.filter((exam) => String(exam.year || "") === year).length; return <Pressable key={year} onPress={() => setSelectedYear(year)} style={[styles.year, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}><Text style={[styles.yearText, { color: active ? "#FFF" : colors.text }]}>{year}</Text><View style={[styles.count, { backgroundColor: active ? "rgba(255,255,255,.2)" : colors.surfaceAlt }]}><Text style={[styles.countText, { color: active ? "#FFF" : colors.muted }]}>{count}</Text></View></Pressable>; })}</ScrollView>
    <SectionTitle eyebrow={selectedYear} title={labels.availableExams} action={<Pill text={`${selectedExams.length}`} tone={selectedExams.length ? "green" : "neutral"} />} />
    <View style={styles.list}>{selectedExams.length ? selectedExams.map((exam) => <ExamCard key={exam.source_key} exam={exam} onPress={() => onExam(exam)} />) : <EmptyState icon="📭" title={labels.noData} description={labels.noDataHint} />}</View>

    <View style={styles.gap} /><SectionTitle title={t(language, "history")} />
    {history.length ? <View style={styles.list}>{history.slice(0, 5).map((item) => { const exam = exams.find((entry) => entry.source_key === item.source); if (!exam) return null; return <Pressable key={item.id} onPress={() => onExam(exam, item.query)} style={({ pressed }) => [styles.history, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? .8 : 1 }]}><View style={[styles.historyRow, { flexDirection: isAr ? "row-reverse" : "row" }]}><View style={[styles.historyIcon, { backgroundColor: colors.primarySoft }]}><Text style={[styles.historyIconText, { color: colors.primary }]}>↻</Text></View><View style={{ flex: 1, alignItems: isAr ? "flex-end" : "flex-start" }}><Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>{isAr ? item.titleAr : item.titleFr}</Text><Text style={[styles.historyQuery, { color: colors.primary }]}>{item.query}</Text></View><Text style={[styles.historyCount, { color: colors.muted }]}>{item.resultCount}</Text></View></Pressable>; })}</View> : <EmptyState icon="🕘" title={t(language, "emptyHistory")} />}
  </ScrollView>;
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 112 }, hero: { borderRadius: 28, padding: 20, marginBottom: 14 }, heroTop: { alignItems: "center", gap: 14 }, heroLogo: { width: 67, height: 67, borderRadius: 22, backgroundColor: "rgba(255,255,255,.14)", borderWidth: 1, borderColor: "rgba(255,255,255,.24)", alignItems: "center", justifyContent: "center" }, heroLogoText: { color: "#FFF", fontSize: 24, fontWeight: "900" }, heroTitle: { color: "#FFF", fontSize: 24, fontWeight: "900" }, heroText: { color: "rgba(255,255,255,.78)", marginTop: 5, fontSize: 11, lineHeight: 18, fontWeight: "700" }, heroFooter: { alignItems: "center", justifyContent: "space-between", marginTop: 17 }, livePill: { backgroundColor: "rgba(0,0,0,.16)", borderRadius: 999, paddingHorizontal: 11, paddingVertical: 7, alignItems: "center", gap: 7 }, liveDot: { width: 8, height: 8, borderRadius: 4 }, liveText: { color: "#FFF", fontSize: 9, fontWeight: "900" }, heroCount: { color: "rgba(255,255,255,.76)", fontSize: 10, fontWeight: "800" }, offline: { borderWidth: 1, borderRadius: 16, padding: 11, marginBottom: 13 }, offlineText: { fontSize: 10, fontWeight: "800", textAlign: "center" }, quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, justifyContent: "space-between" }, quickCard: { width: "48.5%", minHeight: 139, borderWidth: 1, borderRadius: 22, padding: 14, shadowOpacity: .05, shadowOffset: { width: 0, height: 7 }, shadowRadius: 16, elevation: 1 }, quickIcon: { width: 43, height: 43, borderRadius: 15, alignItems: "center", justifyContent: "center", marginBottom: 10 }, quickIconText: { fontSize: 21, fontWeight: "900" }, quickTitle: { fontSize: 13, fontWeight: "900" }, quickSubtitle: { marginTop: 6, fontSize: 9, lineHeight: 15, fontWeight: "700" }, gap: { height: 24 }, statusPanel: { borderWidth: 1, borderRadius: 23, padding: 13 }, statusHint: { fontSize: 9, lineHeight: 16, fontWeight: "700", marginBottom: 11 }, statusGrid: { flexDirection: "row", gap: 7 }, statusCard: { flex: 1, minHeight: 108, borderWidth: 1, borderRadius: 17, alignItems: "center", justifyContent: "center", padding: 8 }, statusIcon: { fontSize: 23 }, statusTitle: { marginTop: 7, fontSize: 10, fontWeight: "900", textAlign: "center" }, statusLabel: { marginTop: 5, fontSize: 8, fontWeight: "900", textAlign: "center" }, refresh: { minHeight: 42, borderRadius: 14, marginTop: 10, alignItems: "center", justifyContent: "center" }, refreshText: { color: "#FFF", fontSize: 10, fontWeight: "900" }, years: { gap: 8, paddingBottom: 14 }, year: { minHeight: 44, borderWidth: 1, borderRadius: 15, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", gap: 8 }, yearText: { fontSize: 13, fontWeight: "900" }, count: { minWidth: 24, height: 24, borderRadius: 999, alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }, countText: { fontSize: 9, fontWeight: "900" }, list: { gap: 10 }, history: { borderWidth: 1, borderRadius: 18, padding: 12 }, historyRow: { alignItems: "center", gap: 10 }, historyIcon: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" }, historyIconText: { fontSize: 18, fontWeight: "900" }, historyTitle: { fontSize: 12, fontWeight: "900" }, historyQuery: { marginTop: 4, fontSize: 11, fontWeight: "800" }, historyCount: { minWidth: 28, fontSize: 12, fontWeight: "900", textAlign: "center" },
});
