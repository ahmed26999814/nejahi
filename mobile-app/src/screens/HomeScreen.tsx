import React, { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useApp } from "../context/AppContext";
import { t } from "../lib/i18n";
import type { Exam } from "../types";
import { ExamCard } from "../components/ExamCard";
import { EmptyState } from "../components/ui";

type Props = {
  onExam: (exam: Exam, initialQuery?: string) => void;
  onCalculator: () => void;
  onLessons: () => void;
  onSaved: () => void;
};

export function HomeScreen({ onExam, onCalculator, onLessons, onSaved }: Props) {
  const { colors, language, exams, history, saved, isOnline, refreshing, refreshExams } = useApp();
  const isAr = language === "ar";
  const years = useMemo(
    () => Array.from(new Set(exams.map((exam) => String(exam.year || "")).filter(Boolean))).sort((a, b) => Number(b) - Number(a)),
    [exams],
  );
  const [selectedYear, setSelectedYear] = useState(years[0] || "2025");
  const selectedExams = useMemo(
    () => exams.filter((exam) => String(exam.year || "") === selectedYear),
    [exams, selectedYear],
  );
  const latestExam = selectedExams[0] || exams[0];

  const labels = isAr
    ? {
        hello: "مرحبًا بك",
        headline: "ابحث عن نتيجتك بسهولة",
        subtitle: "اختر المسابقة أو استخدم الأدوات السريعة.",
        search: "ابدأ البحث",
        quick: "الأدوات",
        calculator: "حساب المعدل",
        lessons: "الدروس",
        saved: "المحفوظات",
        exams: "المسابقات",
        history: "آخر عمليات البحث",
        empty: "لا توجد مسابقات منشورة لهذه السنة.",
      }
    : {
        hello: "Bienvenue",
        headline: "Trouvez votre résultat facilement",
        subtitle: "Choisissez un examen ou utilisez les outils rapides.",
        search: "Commencer",
        quick: "Outils",
        calculator: "Moyenne",
        lessons: "Cours",
        saved: "Favoris",
        exams: "Examens",
        history: "Recherches récentes",
        empty: "Aucun examen publié pour cette année.",
      };

  const tools = [
    { key: "calculator", icon: "∑", title: labels.calculator, onPress: onCalculator, tint: colors.gold },
    { key: "lessons", icon: "▤", title: labels.lessons, onPress: onLessons, tint: "#4774D7" },
    { key: "saved", icon: "★", title: labels.saved, onPress: onSaved, tint: "#8A5BC7", badge: saved.length },
  ];

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshExams} colors={[colors.primary]} tintColor={colors.primary} />}
    >
      <LinearGradient colors={["#0D5A38", "#15905A"]} style={styles.hero}>
        <View style={[styles.heroHead, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <View style={styles.logo}><Text style={styles.logoText}>MR</Text></View>
          <View style={{ flex: 1, alignItems: isAr ? "flex-end" : "flex-start" }}>
            <Text style={styles.hello}>{labels.hello}</Text>
            <Text style={[styles.heroTitle, { textAlign: isAr ? "right" : "left" }]}>{labels.headline}</Text>
          </View>
        </View>
        <Text style={[styles.heroSubtitle, { textAlign: isAr ? "right" : "left" }]}>{labels.subtitle}</Text>
        <Pressable
          disabled={!latestExam}
          onPress={() => latestExam && onExam(latestExam)}
          style={({ pressed }) => [styles.searchButton, { opacity: pressed ? 0.86 : latestExam ? 1 : 0.55 }]}
        >
          <Text style={styles.searchIcon}>⌕</Text>
          <Text style={styles.searchText}>{labels.search}</Text>
        </Pressable>
        <View style={[styles.liveRow, { flexDirection: isAr ? "row-reverse" : "row" }]}>
          <View style={[styles.liveDot, { backgroundColor: isOnline ? "#8FF2B6" : "#F4C667" }]} />
          <Text style={styles.liveLabel}>{isOnline ? t(language, "live") : t(language, "cached")}</Text>
        </View>
      </LinearGradient>

      <View style={[styles.sectionHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{labels.quick}</Text>
      </View>
      <View style={styles.toolsRow}>
        {tools.map((tool) => (
          <Pressable
            key={tool.key}
            onPress={tool.onPress}
            style={({ pressed }) => [styles.toolCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.78 : 1 }]}
          >
            <View style={[styles.toolIcon, { backgroundColor: `${tool.tint}18` }]}><Text style={[styles.toolIconText, { color: tool.tint }]}>{tool.icon}</Text></View>
            <Text style={[styles.toolTitle, { color: colors.text }]} numberOfLines={1}>{tool.title}</Text>
            {typeof tool.badge === "number" ? <Text style={[styles.toolBadge, { color: colors.muted }]}>{tool.badge}</Text> : null}
          </Pressable>
        ))}
      </View>

      <View style={[styles.sectionHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{labels.exams}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearRow}>
          {years.map((year) => {
            const active = year === selectedYear;
            return (
              <Pressable key={year} onPress={() => setSelectedYear(year)} style={[styles.yearChip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}>
                <Text style={[styles.yearText, { color: active ? "#fff" : colors.text }]}>{year}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.examList}>
        {selectedExams.length ? selectedExams.map((exam) => <ExamCard key={exam.source_key} exam={exam} onPress={() => onExam(exam)} />) : <EmptyState icon="⌕" title={labels.empty} />}
      </View>

      {history.length ? (
        <>
          <View style={[styles.sectionHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{labels.history}</Text>
          </View>
          <View style={styles.historyList}>
            {history.slice(0, 3).map((item) => {
              const exam = exams.find((entry) => entry.source_key === item.source);
              if (!exam) return null;
              return (
                <Pressable key={item.id} onPress={() => onExam(exam, item.query)} style={({ pressed }) => [styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.8 : 1, flexDirection: isAr ? "row-reverse" : "row" }]}>
                  <View style={[styles.historyIcon, { backgroundColor: colors.primarySoft }]}><Text style={{ color: colors.primary, fontWeight: "900" }}>↻</Text></View>
                  <View style={{ flex: 1, alignItems: isAr ? "flex-end" : "flex-start" }}>
                    <Text style={[styles.historyTitle, { color: colors.text }]} numberOfLines={1}>{isAr ? item.titleAr : item.titleFr}</Text>
                    <Text style={[styles.historyQuery, { color: colors.muted }]}>{item.query}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 15, paddingBottom: 112 },
  hero: { borderRadius: 30, padding: 20, shadowColor: "#0C4028", shadowOpacity: 0.18, shadowOffset: { width: 0, height: 12 }, shadowRadius: 24, elevation: 5 },
  heroHead: { alignItems: "center", gap: 13 },
  logo: { width: 54, height: 54, borderRadius: 18, backgroundColor: "rgba(255,255,255,.16)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,.24)" },
  logoText: { color: "#fff", fontWeight: "900", fontSize: 18 },
  hello: { color: "rgba(255,255,255,.7)", fontSize: 10, fontWeight: "800" },
  heroTitle: { color: "#fff", fontSize: 22, lineHeight: 29, fontWeight: "900", marginTop: 3 },
  heroSubtitle: { color: "rgba(255,255,255,.72)", marginTop: 12, fontSize: 11, lineHeight: 18, fontWeight: "700" },
  searchButton: { minHeight: 54, marginTop: 18, borderRadius: 18, backgroundColor: "#fff", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  searchIcon: { color: "#126D43", fontSize: 20, fontWeight: "900" },
  searchText: { color: "#126D43", fontSize: 14, fontWeight: "900" },
  liveRow: { alignItems: "center", justifyContent: "center", gap: 7, marginTop: 13 },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  liveLabel: { color: "rgba(255,255,255,.76)", fontSize: 9, fontWeight: "800" },
  sectionHeader: { alignItems: "center", justifyContent: "space-between", marginTop: 25, marginBottom: 11, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  toolsRow: { flexDirection: "row", gap: 9 },
  toolCard: { flex: 1, minHeight: 106, borderWidth: 1, borderRadius: 20, padding: 12, alignItems: "center", justifyContent: "center" },
  toolIcon: { width: 39, height: 39, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  toolIconText: { fontSize: 18, fontWeight: "900" },
  toolTitle: { fontSize: 10, fontWeight: "900", marginTop: 9, textAlign: "center" },
  toolBadge: { fontSize: 8, marginTop: 3, fontWeight: "800" },
  yearRow: { gap: 6 },
  yearChip: { minWidth: 58, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  yearText: { fontSize: 10, fontWeight: "900", textAlign: "center" },
  examList: { gap: 10 },
  historyList: { gap: 9 },
  historyCard: { minHeight: 67, padding: 11, borderWidth: 1, borderRadius: 18, alignItems: "center", gap: 10 },
  historyIcon: { width: 39, height: 39, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  historyTitle: { fontSize: 11, fontWeight: "900" },
  historyQuery: { fontSize: 9, marginTop: 4, fontWeight: "700" },
});
