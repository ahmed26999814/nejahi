import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { getPrimaryFields, textValue, trackText } from "../lib/result";
import type { Exam, ResultRow } from "../types";
import { Pill } from "./ui";

export function ResultCard({ exam, row, onPress }: { exam: Exam; row: ResultRow; onPress: () => void }) {
  const { colors, language, isSaved } = useApp();
  const f = getPrimaryFields(exam, row);
  const decision = textValue(f.decision);
  const passed = /admis|ناجح|مقبول|pass|admitted/i.test(decision);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow, opacity: pressed ? 0.82 : 1 }]}>
      <View style={[styles.heading, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}>
        <View style={{ flex: 1, alignItems: language === "ar" ? "flex-end" : "flex-start" }}>
          <Text style={[styles.name, { color: colors.text, writingDirection: language === "ar" ? "rtl" : "ltr" }]} numberOfLines={2}>{textValue(f.name)}</Text>
          <Text style={[styles.number, { color: colors.muted }]}>#{textValue(f.number)}</Text>
        </View>
        {isSaved(exam, row) ? <Text style={styles.bookmark}>★</Text> : null}
      </View>
      <View style={[styles.infoRow, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}>
        <View style={[styles.scoreBox, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.scoreLabel, { color: colors.primary }]}>{language === "ar" ? "المعدل" : "Moyenne"}</Text>
          <Text style={[styles.scoreValue, { color: colors.text }]}>{textValue(f.score)}</Text>
        </View>
        <View style={{ flex: 1, gap: 7, alignItems: language === "ar" ? "flex-end" : "flex-start" }}>
          <Pill text={decision} tone={passed ? "green" : "neutral"} />
          {f.track ? <Text style={[styles.track, { color: colors.muted }]} numberOfLines={1}>{trackText(f.track, language)}</Text> : null}
          {f.rank ? <Text style={[styles.rank, { color: colors.gold }]}>#{textValue(f.rank)}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 15, shadowOpacity: 0.06, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 2 },
  heading: { gap: 10, alignItems: "flex-start" }, name: { fontSize: 15, fontWeight: "900", lineHeight: 21 },
  number: { marginTop: 4, fontSize: 11, fontWeight: "800" }, bookmark: { color: "#D6A83F", fontSize: 20 },
  infoRow: { alignItems: "center", gap: 12, marginTop: 13 }, scoreBox: { minWidth: 96, borderRadius: 16, padding: 10, alignItems: "center" },
  scoreLabel: { fontSize: 9, fontWeight: "900" }, scoreValue: { marginTop: 3, fontSize: 18, fontWeight: "900" },
  track: { fontSize: 10, fontWeight: "800" }, rank: { fontSize: 11, fontWeight: "900" },
});
