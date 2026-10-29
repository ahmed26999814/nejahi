"use client";

import Link from "next/link";

const ALERTS = [
  { id: "excellence", ar: "إشعار الامتياز 2026", fr: "Alerte Excellence 2026", href: "/notify/excellence-2026", match: /excellence|امتياز/ },
  { id: "supplementary", ar: "إشعار الدورة التكميلية 2026", fr: "Alerte session complémentaire 2026", href: "/notify/bac-session-2026", match: /session|complémentaire|complementaire|تكميل/ },
];

// Use the already-loaded publication catalogue. A failed request cannot establish
// that an exam is unpublished, and must never turn into an announcement.
export default function Bac2026CountdownNotice({ exams = [], status, lang = "ar" }) {
  if (status !== "ready" || !exams.length) return null;
  const pending = ALERTS.filter((alert) => !exams.some((exam) => String(exam.year) === "2026" && alert.match.test(`${exam.source} ${exam.title?.ar} ${exam.title?.fr}`)));
  if (!pending.length) return null;
  return (
    <aside className="bac-release-notice results-alerts-notice" aria-label={lang === "fr" ? "Alertes de publication" : "إشعارات نشر النتائج"}>
      <div className="bac-release-notice-inner results-alerts-notice-inner">
        <p>{lang === "fr" ? "Recevoir une alerte à la publication" : "استقبل إشعارًا عند نشر النتائج"}</p>
        <div className="results-alert-notice-actions">{pending.map((alert) => <Link key={alert.id} href={alert.href} className="bac-release-notice-link">{alert[lang] || alert.ar}</Link>)}</div>
      </div>
    </aside>
  );
}
