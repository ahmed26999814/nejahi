import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import type { Lesson } from "../data/lessons";
import { Card, Pill } from "../components/ui";

export function LessonDetailsScreen({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  const { colors, language } = useApp();
  const isAr = language === "ar";
  const title = isAr ? lesson.titleAr : lesson.titleFr;
  const summary = isAr ? lesson.summaryAr : lesson.summaryFr;
  const category = isAr ? lesson.categoryAr : lesson.categoryFr;
  const steps = isAr ? lesson.stepsAr : lesson.stepsFr;
  const tips = isAr ? lesson.tipsAr : lesson.tipsFr;
  const labels = isAr ? { lesson: "درس مختصر", plan: "خطوات الفهم والحل", tips: "نصائح للتثبيت", minutes: "دقيقة", offline: "متاح دون اتصال" } : { lesson: "Fiche de cours", plan: "Étapes de compréhension", tips: "Conseils de mémorisation", minutes: "min", offline: "Disponible hors ligne" };
  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: isAr ? "row-reverse" : "row" }]}><Pressable onPress={onBack} style={[styles.back, { backgroundColor: colors.surfaceAlt }]}><Text style={[styles.backText, { color: colors.text }]}>{isAr ? "→" : "←"}</Text></Pressable><View style={{ flex: 1, alignItems: isAr ? "flex-end" : "flex-start" }}><Text style={[styles.kicker, { color: colors.primary }]}>{labels.lesson}</Text><Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>{category}</Text></View></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card style={styles.intro}><View style={[styles.icon, { backgroundColor: colors.primarySoft }]}><Text style={[styles.iconText, { color: colors.primary }]}>{lesson.icon}</Text></View><Text style={[styles.title, { color: colors.text, writingDirection: isAr ? "rtl" : "ltr" }]}>{title}</Text><Text style={[styles.summary, { color: colors.muted, writingDirection: isAr ? "rtl" : "ltr" }]}>{summary}</Text><View style={styles.pills}><Pill text={`${lesson.duration} ${labels.minutes}`} tone="gold" /><Pill text={labels.offline} tone="green" /></View></Card>
      <Card><Text style={[styles.sectionTitle, { color: colors.text, textAlign: isAr ? "right" : "left" }]}>{labels.plan}</Text><View style={styles.steps}>{steps.map((step, index) => <View key={`${index}:${step}`} style={[styles.step, { flexDirection: isAr ? "row-reverse" : "row" }]}><View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={styles.stepNumberText}>{index + 1}</Text></View><Text style={[styles.stepText, { color: colors.text, textAlign: isAr ? "right" : "left", writingDirection: isAr ? "rtl" : "ltr" }]}>{step}</Text></View>)}</View></Card>
      <Card style={[styles.tips, { borderColor: `${colors.gold}55` }]}><Text style={[styles.sectionTitle, { color: colors.gold, textAlign: isAr ? "right" : "left" }]}>{labels.tips}</Text>{tips.map((tip) => <View key={tip} style={[styles.tipRow, { flexDirection: isAr ? "row-reverse" : "row" }]}><Text style={[styles.tipDot, { color: colors.gold }]}>•</Text><Text style={[styles.tipText, { color: colors.text, textAlign: isAr ? "right" : "left", writingDirection: isAr ? "rtl" : "ltr" }]}>{tip}</Text></View>)}</Card>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { minHeight: 66, borderBottomWidth: 1, paddingHorizontal: 13, gap: 11, alignItems: "center" }, back: { width: 43, height: 43, borderRadius: 14, alignItems: "center", justifyContent: "center" }, backText: { fontSize: 21, fontWeight: "900" }, kicker: { fontSize: 8, fontWeight: "900" }, headerTitle: { marginTop: 3, fontSize: 14, fontWeight: "900" }, content: { padding: 14, gap: 12, paddingBottom: 36 }, intro: { alignItems: "center", paddingVertical: 24 }, icon: { width: 72, height: 72, borderRadius: 23, alignItems: "center", justifyContent: "center" }, iconText: { fontSize: 24, fontWeight: "900" }, title: { marginTop: 15, fontSize: 21, lineHeight: 30, fontWeight: "900", textAlign: "center" }, summary: { marginTop: 8, fontSize: 11, lineHeight: 19, fontWeight: "700", textAlign: "center" }, pills: { flexDirection: "row", gap: 8, marginTop: 13 }, sectionTitle: { fontSize: 15, fontWeight: "900", marginBottom: 13 }, steps: { gap: 13 }, step: { alignItems: "flex-start", gap: 11 }, stepNumber: { width: 31, height: 31, borderRadius: 11, alignItems: "center", justifyContent: "center" }, stepNumberText: { color: "#FFF", fontSize: 11, fontWeight: "900" }, stepText: { flex: 1, fontSize: 11, lineHeight: 19, fontWeight: "800" }, tips: { gap: 4 }, tipRow: { alignItems: "flex-start", gap: 9 }, tipDot: { width: 16, fontSize: 20, lineHeight: 20, fontWeight: "900" }, tipText: { flex: 1, fontSize: 11, lineHeight: 19, fontWeight: "800" } });
