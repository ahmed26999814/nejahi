import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { t } from "../lib/i18n";
import type { Exam } from "../types";
import { Pill } from "./ui";

function examIcon(exam: Exam) {
  const identity = `${exam.source_key} ${exam.title_ar}`.toLowerCase();
  if (/concours|كونكور/.test(identity)) return "🏫";
  if (/bepc|brevet|بريف/.test(identity)) return "📘";
  if (/bac|باكالوريا/.test(identity)) return "🎓";
  if (/excellence|امتياز/.test(identity)) return "🏅";
  return "📄";
}

export function ExamCard({ exam, onPress, compact = false }: { exam: Exam; onPress: () => void; compact?: boolean }) {
  const { colors, language, isOnline } = useApp();
  const title = language === "ar" ? exam.title_ar : exam.title_fr;
  const description = language === "ar" ? exam.description_ar : exam.description_fr;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, compact && styles.compact, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow, opacity: pressed ? 0.82 : 1 }]}>
      <View style={[styles.top, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}><Text style={styles.iconText}>{examIcon(exam)}</Text></View>
        <View style={{ flex: 1, alignItems: language === "ar" ? "flex-end" : "flex-start" }}>
          <Text style={[styles.title, { color: colors.text, writingDirection: language === "ar" ? "rtl" : "ltr" }]} numberOfLines={2}>{title}</Text>
          {!compact && description ? <Text style={[styles.description, { color: colors.muted, writingDirection: language === "ar" ? "rtl" : "ltr" }]} numberOfLines={2}>{description}</Text> : null}
        </View>
      </View>
      <View style={[styles.footer, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}>
        <Pill text={`${exam.year || "—"}`} tone="gold" />
        <Pill text={isOnline ? t(language, "live") : t(language, "cached")} tone={isOnline ? "green" : "neutral"} />
        {typeof exam.total_rows === "number" ? <Text style={[styles.count, { color: colors.muted }]}>{exam.total_rows.toLocaleString(language === "ar" ? "ar-MR" : "fr-FR")}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 15, shadowOpacity: 0.06, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 2 },
  compact: { padding: 12, borderRadius: 18 }, top: { alignItems: "flex-start", gap: 12 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" }, iconText: { fontSize: 23 },
  title: { fontSize: 15, fontWeight: "900", lineHeight: 22 }, description: { marginTop: 5, fontSize: 11, fontWeight: "700", lineHeight: 18 },
  footer: { alignItems: "center", gap: 7, marginTop: 13 }, count: { marginStart: "auto", fontSize: 10, fontWeight: "800" },
});
