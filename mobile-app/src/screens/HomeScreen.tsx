import React, { useMemo } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../context/AppContext";
import { t } from "../lib/i18n";
import type { Exam } from "../types";
import { ExamCard } from "../components/ExamCard";
import { EmptyState, Pill, SectionTitle } from "../components/ui";

export function HomeScreen({ onExam }: { onExam: (exam: Exam, initialQuery?: string) => void }) {
  const { colors, language, exams, history, isOnline, refreshing, refreshExams } = useApp();
  const sortedExams = useMemo(() => [...exams].sort((a, b) => Number(b.year || 0) - Number(a.year || 0)), [exams]);
  return <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshExams} tintColor={colors.primary} colors={[colors.primary]} />} showsVerticalScrollIndicator={false}>
    <LinearGradient colors={["#0B3F29", "#106B41", "#1B8E58"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
      <View style={styles.heroLogo}><Text style={styles.heroLogoText}>MR</Text></View><Pill text={t(language, "nativeApp")} tone="gold" />
      <Text style={[styles.heroTitle, { writingDirection: language === "ar" ? "rtl" : "ltr" }]}>{t(language, "officialResults")}</Text>
      <Text style={[styles.heroDescription, { writingDirection: language === "ar" ? "rtl" : "ltr" }]}>{t(language, "chooseExam")}</Text>
      <View style={[styles.heroStatus, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}><View style={[styles.liveDot, { backgroundColor: isOnline ? "#7EF0AD" : "#F6C461" }]} /><Text style={styles.heroStatusText}>{isOnline ? t(language, "live") : t(language, "cached")}</Text></View>
    </LinearGradient>
    {!isOnline ? <View style={[styles.offlineBanner, { backgroundColor: `${colors.gold}20`, borderColor: `${colors.gold}55` }]}><Text style={[styles.offlineText, { color: colors.gold, writingDirection: language === "ar" ? "rtl" : "ltr" }]}>{t(language, "offline")}</Text></View> : null}
    <SectionTitle eyebrow={t(language, "updated")} title={t(language, "chooseExam")} action={<Pill text={`${exams.length}`} tone="green" />} />
    <View style={styles.list}>{sortedExams.length ? sortedExams.map((exam) => <ExamCard key={exam.source_key} exam={exam} onPress={() => onExam(exam)} />) : <EmptyState icon="📭" title={t(language, "noExams")} />}</View>
    <View style={styles.sectionGap} /><SectionTitle title={t(language, "history")} />
    {history.length ? <View style={styles.list}>{history.slice(0, 6).map((item) => { const exam = exams.find((entry) => entry.source_key === item.source); if (!exam) return null; return <Pressable key={item.id} onPress={() => onExam(exam, item.query)} style={({ pressed }) => [styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}><View style={[styles.historyTop, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}><View style={{ flex: 1, alignItems: language === "ar" ? "flex-end" : "flex-start" }}><Text style={[styles.historyExam, { color: colors.text, writingDirection: language === "ar" ? "rtl" : "ltr" }]} numberOfLines={1}>{language === "ar" ? item.titleAr : item.titleFr}</Text><Text style={[styles.historyQuery, { color: colors.primary }]} numberOfLines={1}>{item.query}</Text></View><Text style={styles.historyIcon}>↻</Text></View><Text style={[styles.historyMeta, { color: colors.muted }]}>{item.resultCount} {t(language, "resultsFound")}</Text></Pressable>; })}</View> : <EmptyState icon="🕘" title={t(language, "emptyHistory")} />}
  </ScrollView>;
}

const styles = StyleSheet.create({ content: { padding: 14, paddingBottom: 110 }, hero: { borderRadius: 28, padding: 22, alignItems: "center", overflow: "hidden", marginBottom: 15 }, heroLogo: { width: 78, height: 78, borderRadius: 24, backgroundColor: "rgba(255,255,255,.14)", borderWidth: 1, borderColor: "rgba(255,255,255,.25)", alignItems: "center", justifyContent: "center", marginBottom: 13 }, heroLogoText: { color: "#FFFFFF", fontSize: 28, fontWeight: "900" }, heroTitle: { marginTop: 12, color: "#FFFFFF", fontSize: 27, fontWeight: "900", textAlign: "center", lineHeight: 36 }, heroDescription: { marginTop: 7, color: "rgba(255,255,255,.78)", fontSize: 13, fontWeight: "700", textAlign: "center" }, heroStatus: { alignItems: "center", gap: 7, marginTop: 16, backgroundColor: "rgba(0,0,0,.16)", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }, liveDot: { width: 8, height: 8, borderRadius: 4 }, heroStatusText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" }, offlineBanner: { borderWidth: 1, borderRadius: 16, padding: 12, marginBottom: 14 }, offlineText: { fontSize: 11, fontWeight: "800", textAlign: "center", lineHeight: 18 }, list: { gap: 11 }, sectionGap: { height: 24 }, historyCard: { borderWidth: 1, borderRadius: 18, padding: 13 }, historyTop: { gap: 10, alignItems: "center" }, historyExam: { fontSize: 13, fontWeight: "900" }, historyQuery: { marginTop: 4, fontSize: 12, fontWeight: "800" }, historyIcon: { fontSize: 20, color: "#79A88D" }, historyMeta: { marginTop: 8, fontSize: 10, fontWeight: "700", textAlign: "center" } });
