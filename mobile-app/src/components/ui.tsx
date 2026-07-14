import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { useApp } from "../context/AppContext";

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const { colors } = useApp();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }, style]}>{children}</View>;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: React.ReactNode }) {
  const { colors, language } = useApp();
  return <View style={[styles.sectionHeader, { flexDirection: language === "ar" ? "row-reverse" : "row" }]}><View style={{ flex: 1, alignItems: language === "ar" ? "flex-end" : "flex-start" }}>{eyebrow ? <Text style={[styles.eyebrow, { color: colors.primary, writingDirection: language === "ar" ? "rtl" : "ltr" }]}>{eyebrow}</Text> : null}<Text style={[styles.sectionTitle, { color: colors.text, writingDirection: language === "ar" ? "rtl" : "ltr" }]}>{title}</Text></View>{action}</View>;
}

export function AppButton({ title, variant = "primary", loading = false, style, ...props }: PressableProps & { title: string; variant?: "primary" | "secondary" | "danger" | "ghost"; loading?: boolean; style?: ViewStyle | ViewStyle[] }) {
  const { colors } = useApp();
  const backgroundColor = variant === "primary" ? colors.primary : variant === "danger" ? colors.danger : variant === "secondary" ? colors.primarySoft : "transparent";
  const textColor = variant === "primary" || variant === "danger" ? "#FFFFFF" : variant === "secondary" ? colors.primary : colors.text;
  return <Pressable accessibilityRole="button" disabled={loading || props.disabled} {...props} style={({ pressed }) => [styles.button, { backgroundColor, borderColor: variant === "ghost" ? colors.border : backgroundColor, opacity: loading || props.disabled ? 0.55 : pressed ? 0.82 : 1 }, style]}>{loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>}</Pressable>;
}

export function Pill({ text, tone = "green" }: { text: string; tone?: "green" | "gold" | "neutral" | "red" }) {
  const { colors } = useApp();
  const backgroundColor = tone === "green" ? colors.primarySoft : tone === "gold" ? `${colors.gold}22` : tone === "red" ? `${colors.danger}20` : colors.surfaceAlt;
  const color = tone === "green" ? colors.primary : tone === "gold" ? colors.gold : tone === "red" ? colors.danger : colors.muted;
  return <View style={[styles.pill, { backgroundColor }]}><Text style={[styles.pillText, { color }]} numberOfLines={1}>{text}</Text></View>;
}

export function EmptyState({ icon, title, description }: { icon: string; title: string; description?: string }) {
  const { colors, language } = useApp();
  return <Card style={styles.emptyCard}><Text style={styles.emptyIcon}>{icon}</Text><Text style={[styles.emptyTitle, { color: colors.text, writingDirection: language === "ar" ? "rtl" : "ltr" }]}>{title}</Text>{description ? <Text style={[styles.emptyDescription, { color: colors.muted, writingDirection: language === "ar" ? "rtl" : "ltr" }]}>{description}</Text> : null}</Card>;
}

export function MetricCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  const { colors, language } = useApp();
  return <Card style={styles.metricCard}><View style={[styles.metricIcon, { backgroundColor: colors.primarySoft }]}><Text style={{ fontSize: 20 }}>{icon}</Text></View><Text style={[styles.metricValue, { color: colors.text }]} numberOfLines={1}>{value}</Text><Text style={[styles.metricLabel, { color: colors.muted, writingDirection: language === "ar" ? "rtl" : "ltr" }]} numberOfLines={2}>{label}</Text></Card>;
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 22, padding: 16, shadowOpacity: 0.08, shadowOffset: { width: 0, height: 10 }, shadowRadius: 24, elevation: 2 },
  sectionHeader: { alignItems: "center", gap: 12, marginBottom: 12 }, eyebrow: { fontSize: 11, fontWeight: "900", marginBottom: 3 }, sectionTitle: { fontSize: 21, fontWeight: "900" },
  button: { minHeight: 48, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 }, buttonText: { fontSize: 14, fontWeight: "900", textAlign: "center" },
  pill: { minHeight: 26, maxWidth: 150, borderRadius: 999, paddingHorizontal: 10, alignItems: "center", justifyContent: "center" }, pillText: { fontSize: 10, fontWeight: "900" },
  emptyCard: { alignItems: "center", paddingVertical: 30 }, emptyIcon: { fontSize: 40, marginBottom: 12 }, emptyTitle: { fontSize: 17, fontWeight: "900", textAlign: "center" },
  emptyDescription: { marginTop: 7, fontSize: 12, fontWeight: "700", lineHeight: 19, textAlign: "center" }, metricCard: { width: "48.5%", minHeight: 132, alignItems: "center", justifyContent: "center", padding: 12 },
  metricIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 8 }, metricValue: { fontSize: 20, fontWeight: "900" }, metricLabel: { marginTop: 4, fontSize: 11, fontWeight: "800", textAlign: "center" },
});
