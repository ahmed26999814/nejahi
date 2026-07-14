import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useApp } from "../context/AppContext";
import { searchResults } from "../lib/api";
import { t } from "../lib/i18n";
import { getPrimaryFields, textValue } from "../lib/result";
import type { Exam, ResultRow } from "../types";
import { ExamCard } from "../components/ExamCard";
import { ResultCard } from "../components/ResultCard";
import { AppButton, EmptyState, Pill } from "../components/ui";

type SortMode = "relevance" | "score" | "name" | "number";
const numericValue = (value: unknown) => { const number = Number(String(value ?? "").replace(",", ".")); return Number.isFinite(number) ? number : Number.NEGATIVE_INFINITY; };

export function SearchScreen({ exam, initialQuery, onBack, onDetails }: { exam: Exam; initialQuery?: string; onBack: () => void; onDetails: (row: ResultRow, query: string) => void; }) {
  const { colors, language, addHistory, isOnline } = useApp();
  const [query, setQuery] = useState(initialQuery || "");
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("relevance");
  const autoSearched = useRef(false);
  const isAr = language === "ar";
  const labels = isAr ? { sort: "ترتيب النتائج", relevance: "الأقرب للبحث", score: "أعلى معدل", name: "حسب الاسم", number: "حسب الرقم", hint: "اضغط على النتيجة لعرض جميع التفاصيل", result: "النتائج" } : { sort: "Trier les résultats", relevance: "Pertinence", score: "Meilleure note", name: "Par nom", number: "Par numéro", hint: "Touchez un résultat pour afficher tous les détails", result: "Résultats" };

  const sortedRows = useMemo(() => {
    if (sortMode === "relevance") return rows;
    return [...rows].sort((a, b) => {
      const af = getPrimaryFields(exam, a); const bf = getPrimaryFields(exam, b);
      if (sortMode === "score") return numericValue(bf.score) - numericValue(af.score);
      if (sortMode === "name") return textValue(af.name).localeCompare(textValue(bf.name), isAr ? "ar" : "fr", { sensitivity: "base" });
      const an = numericValue(af.number); const bn = numericValue(bf.number);
      if (an !== Number.NEGATIVE_INFINITY && bn !== Number.NEGATIVE_INFINITY) return an - bn;
      return textValue(af.number).localeCompare(textValue(bf.number), undefined, { numeric: true });
    });
  }, [exam, isAr, rows, sortMode]);

  async function runSearch() {
    const value = query.trim(); if (!value || loading || !isOnline) return;
    setLoading(true); setError(""); setSearched(true); setSortMode("relevance");
    try {
      const resultRows = await searchResults(exam.source_key, value); setRows(resultRows);
      await addHistory({ id: `${Date.now()}:${exam.source_key}:${value}`, source: exam.source_key, titleAr: exam.title_ar, titleFr: exam.title_fr, query: value, resultCount: resultRows.length, searchedAt: new Date().toISOString() });
      await Haptics.impactAsync(resultRows.length ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Soft).catch(() => undefined);
    } catch { setRows([]); setError(t(language, "error")); } finally { setLoading(false); }
  }

  useEffect(() => { if (initialQuery && !autoSearched.current) { autoSearched.current = true; void runSearch(); } }, []);
  const sortOptions: Array<{ key: SortMode; label: string }> = [{ key: "relevance", label: labels.relevance }, { key: "score", label: labels.score }, { key: "name", label: labels.name }, { key: "number", label: labels.number }];

  const listHeader = <View style={styles.headerContent}>
    <ExamCard exam={exam} onPress={() => undefined} compact />
    {!isOnline ? <View style={[styles.notice, { borderColor: `${colors.gold}55`, backgroundColor: `${colors.gold}18` }]}><Text style={[styles.noticeText, { color: colors.gold }]}>{t(language, "offline")}</Text></View> : null}
    <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}><View style={[styles.inputWrap, { backgroundColor: colors.surfaceAlt, borderColor: colors.border, flexDirection: isAr ? "row-reverse" : "row" }]}><Text style={[styles.searchIcon, { color: colors.primary }]}>⌕</Text><TextInput value={query} onChangeText={setQuery} placeholder={t(language, "searchPlaceholder")} placeholderTextColor={colors.muted} returnKeyType="search" onSubmitEditing={() => void runSearch()} autoCapitalize="none" autoCorrect={false} style={[styles.input, { color: colors.text, textAlign: isAr ? "right" : "left", writingDirection: isAr ? "rtl" : "ltr" }]} />{query ? <Pressable onPress={() => { setQuery(""); setRows([]); setSearched(false); setError(""); }} style={styles.clear}><Text style={[styles.clearText, { color: colors.muted }]}>×</Text></Pressable> : null}</View><AppButton title={t(language, "search")} loading={loading} onPress={() => void runSearch()} disabled={!query.trim() || !isOnline} /></View>
    {error ? <View style={[styles.notice, { borderColor: `${colors.danger}55`, backgroundColor: `${colors.danger}15` }]}><Text style={[styles.noticeText, { color: colors.danger }]}>{error}</Text></View> : null}
    <View style={[styles.resultsHeader, { flexDirection: isAr ? "row-reverse" : "row" }]}><View style={{ flex: 1, alignItems: isAr ? "flex-end" : "flex-start" }}><Text style={[styles.resultsTitle, { color: colors.text }]}>{searched ? labels.result : t(language, "typeQuery")}</Text>{searched && rows.length ? <Text style={[styles.resultsHint, { color: colors.muted }]}>{labels.hint}</Text> : null}</View>{searched ? <Pill text={`${rows.length}`} tone={rows.length ? "green" : "neutral"} /> : null}</View>
    {searched && rows.length ? <View style={styles.sortSection}><Text style={[styles.sortLabel, { color: colors.muted, textAlign: isAr ? "right" : "left" }]}>{labels.sort}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortOptions}>{sortOptions.map((option) => { const active = sortMode === option.key; return <Pressable key={option.key} onPress={() => setSortMode(option.key)} style={[styles.sortChip, { backgroundColor: active ? colors.primary : colors.surface, borderColor: active ? colors.primary : colors.border }]}><Text style={[styles.sortText, { color: active ? "#FFF" : colors.text }]}>{option.label}</Text></Pressable>; })}</ScrollView></View> : null}
    {loading ? <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, { color: colors.muted }]}>{t(language, "loading")}</Text></View> : null}
    {!loading && searched && !rows.length && !error ? <EmptyState icon="🔎" title={t(language, "noResults")} /> : null}
  </View>;

  return <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: isAr ? "row-reverse" : "row" }]}><Pressable onPress={onBack} style={[styles.back, { backgroundColor: colors.surfaceAlt }]}><Text style={[styles.backText, { color: colors.text }]}>{isAr ? "→" : "←"}</Text></Pressable><View style={{ flex: 1, alignItems: isAr ? "flex-end" : "flex-start" }}><Text style={[styles.kicker, { color: colors.primary }]}>{t(language, "searchTitle")}</Text><Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{isAr ? exam.title_ar : exam.title_fr}</Text></View></View>
    <FlatList data={loading ? [] : sortedRows} keyExtractor={(row, index) => `${exam.source_key}:${index}:${JSON.stringify(row).slice(0, 50)}`} renderItem={({ item }) => <ResultCard exam={exam} row={item} onPress={() => onDetails(item, query.trim())} />} ListHeaderComponent={listHeader} ItemSeparatorComponent={() => <View style={styles.separator} />} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} initialNumToRender={8} maxToRenderPerBatch={10} windowSize={7} removeClippedSubviews={Platform.OS === "android"} />
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, header: { minHeight: 68, alignItems: "center", gap: 12, borderBottomWidth: 1, paddingHorizontal: 14, paddingVertical: 10 }, back: { width: 44, height: 44, borderRadius: 15, alignItems: "center", justifyContent: "center" }, backText: { fontSize: 22, fontWeight: "900" }, kicker: { fontSize: 9, fontWeight: "900" }, title: { marginTop: 3, fontSize: 15, fontWeight: "900" }, content: { padding: 14, paddingBottom: 38 }, headerContent: { gap: 13, marginBottom: 12 }, searchBox: { borderWidth: 1, borderRadius: 22, padding: 12, gap: 10 }, inputWrap: { minHeight: 55, borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, alignItems: "center", gap: 8 }, searchIcon: { fontSize: 20, fontWeight: "900" }, input: { flex: 1, minHeight: 52, fontSize: 15, fontWeight: "800" }, clear: { width: 31, height: 31, alignItems: "center", justifyContent: "center" }, clearText: { fontSize: 23 }, notice: { borderWidth: 1, borderRadius: 15, padding: 11 }, noticeText: { fontSize: 11, fontWeight: "800", textAlign: "center", lineHeight: 18 }, resultsHeader: { alignItems: "center", gap: 10 }, resultsTitle: { fontSize: 16, fontWeight: "900" }, resultsHint: { marginTop: 4, fontSize: 9, fontWeight: "700" }, sortSection: { gap: 7 }, sortLabel: { fontSize: 9, fontWeight: "900" }, sortOptions: { gap: 7 }, sortChip: { minHeight: 39, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, alignItems: "center", justifyContent: "center" }, sortText: { fontSize: 9, fontWeight: "900" }, loading: { paddingVertical: 30, alignItems: "center", gap: 10 }, loadingText: { fontSize: 11, fontWeight: "800" }, separator: { height: 10 } });
