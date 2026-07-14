import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useApp } from "../context/AppContext";
import { getPrimaryFields, textValue, trackText } from "../lib/result";
import type { Exam, ResultRow } from "../types";
import { Pill } from "./ui";

const isConcours = (exam: Exam) => exam.search_mode === "concours" || /concours|كونكور/i.test(`${exam.source_key} ${exam.title_ar}`);

export function ResultCard({ exam, row, onPress }: { exam: Exam; row: ResultRow; onPress: () => void }) {
  const { colors, language, isSaved } = useApp();
  const f = getPrimaryFields(exam, row);
  const isAr = language === "ar";
  const decision = textValue(f.decision);
  const passed = /admis|ناجح|مقبول|pass|admitted/i.test(decision);
  const initial = textValue(f.name).replace("—", "?").slice(0, 1).toUpperCase();
  const scoreLabel = isConcours(exam) ? (isAr ? "المجموع" : "Total") : (isAr ? "المعدل" : "Moyenne");
  const location = [f.wilaya, f.school].map(textValue).filter((value) => value !== "—").join(" • ");
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow, opacity: pressed ? .8 : 1, transform: [{ scale: pressed ? .99 : 1 }] }]}>
    <View style={[styles.heading, { flexDirection: isAr ? "row-reverse" : "row" }]}><View style={[styles.avatar, { backgroundColor: colors.primarySoft }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text></View><View style={{ flex: 1, alignItems: isAr ? "flex-end" : "flex-start" }}><Text style={[styles.name, { color: colors.text, writingDirection: isAr ? "rtl" : "ltr" }]} numberOfLines={2}>{textValue(f.name)}</Text><View style={[styles.identity, { flexDirection: isAr ? "row-reverse" : "row" }]}><Text style={[styles.numberLabel, { color: colors.muted }]}>{isAr ? "رقم" : "N°"}</Text><Text style={[styles.number, { color: colors.text }]}>{textValue(f.number)}</Text>{f.rank ? <View style={[styles.rankBadge, { backgroundColor: `${colors.gold}18` }]}><Text style={[styles.rank, { color: colors.gold }]}>#{textValue(f.rank)}</Text></View> : null}</View></View>{isSaved(exam, row) ? <Text style={[styles.bookmark, { color: colors.gold }]}>★</Text> : <Text style={[styles.chevron, { color: colors.muted }]}>{isAr ? "‹" : "›"}</Text>}</View>
    <View style={[styles.main, { flexDirection: isAr ? "row-reverse" : "row" }]}><View style={[styles.score, { backgroundColor: colors.primarySoft }]}><Text style={[styles.scoreLabel, { color: colors.primary }]}>{scoreLabel}</Text><Text style={[styles.scoreValue, { color: colors.text }]}>{textValue(f.score)}</Text></View><View style={{ flex: 1, gap: 8, alignItems: isAr ? "flex-end" : "flex-start" }}>{decision !== "—" ? <Pill text={decision} tone={passed ? "green" : "neutral"} /> : <Pill text={isAr ? "نتيجة مترشح" : "Résultat candidat"} tone="neutral" />}{f.track ? <Text style={[styles.track, { color: colors.muted }]} numberOfLines={1}>{trackText(f.track, language)}</Text> : null}{location ? <Text style={[styles.location, { color: colors.muted, textAlign: isAr ? "right" : "left", writingDirection: isAr ? "rtl" : "ltr" }]} numberOfLines={2}>⌖ {location}</Text> : null}</View></View>
    <View style={[styles.openRow, { borderTopColor: colors.border, flexDirection: isAr ? "row-reverse" : "row" }]}><Text style={[styles.openText, { color: colors.primary }]}>{isAr ? "عرض التفاصيل الكاملة" : "Voir tous les détails"}</Text><Text style={[styles.openArrow, { color: colors.primary }]}>{isAr ? "←" : "→"}</Text></View>
  </Pressable>;
}

const styles = StyleSheet.create({ card: { borderWidth: 1, borderRadius: 23, padding: 14, shadowOpacity: .06, shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 2 }, heading: { gap: 11, alignItems: "center" }, avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" }, avatarText: { fontSize: 18, fontWeight: "900" }, name: { fontSize: 15, fontWeight: "900", lineHeight: 22 }, identity: { alignItems: "center", gap: 5, marginTop: 6 }, numberLabel: { fontSize: 8, fontWeight: "800" }, number: { fontSize: 11, fontWeight: "900" }, rankBadge: { minHeight: 25, borderRadius: 999, paddingHorizontal: 8, alignItems: "center", justifyContent: "center", marginStart: 4 }, rank: { fontSize: 9, fontWeight: "900" }, bookmark: { fontSize: 20 }, chevron: { fontSize: 28 }, main: { alignItems: "center", gap: 12, marginTop: 14 }, score: { width: 104, minHeight: 78, borderRadius: 18, padding: 10, alignItems: "center", justifyContent: "center" }, scoreLabel: { fontSize: 8, fontWeight: "900" }, scoreValue: { marginTop: 4, fontSize: 21, fontWeight: "900" }, track: { fontSize: 10, fontWeight: "800" }, location: { fontSize: 9, fontWeight: "700", lineHeight: 15 }, openRow: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 13, paddingTop: 10, alignItems: "center", justifyContent: "space-between" }, openText: { fontSize: 9, fontWeight: "900" }, openArrow: { fontSize: 14, fontWeight: "900" } });
