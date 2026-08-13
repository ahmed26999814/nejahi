"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const STATUS_RECHECK_MIN_MS = 60_000;
const STATUS_RECHECK_JITTER_MS = 30_000;

const ALERTS = [
  {
    id: "excellence",
    label: "نتائج الامتياز 2026",
    shortLabel: "إشعار الامتياز",
    href: "/notify/excellence-2026",
  },
  {
    id: "supplementary",
    label: "باكالوريا الدورة التكميلية 2026",
    shortLabel: "إشعار الدورة التكميلية",
    href: "/notify/bac-session-2026",
  },
];

function examIdentity(exam) {
  return [exam?.source_key, exam?.table_name, exam?.title_ar, exam?.title_fr]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function is2026Exam(exam) {
  return String(exam?.year || "").trim() === "2026";
}

function isExcellence2026Exam(exam) {
  if (!is2026Exam(exam)) return false;
  return /excellence|امتياز/.test(examIdentity(exam));
}

function isSupplementaryBac2026Exam(exam) {
  if (!is2026Exam(exam)) return false;
  const identity = examIdentity(exam);
  const isBac = /bac|baccalaureat|baccalauréat|باكالوريا/.test(identity);
  const isSupplementary = /session2|session 2|session_2|session complémentaire|session complementaire|complémentaire|complementaire|تكميل|تكميلية/.test(identity);
  return isBac && isSupplementary;
}

export default function Bac2026CountdownNotice() {
  const pathname = usePathname();
  const [isHomeView, setIsHomeView] = useState(false);
  const [checked, setChecked] = useState(false);
  const [published, setPublished] = useState({ excellence: false, supplementary: false });

  useEffect(() => {
    if (pathname !== "/") {
      setIsHomeView(false);
      return undefined;
    }

    let frame = 0;

    function syncVisibility(routeDetail) {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const routedView = routeDetail?.view;
        const isHomeRoute = routedView ? routedView === "home" : !window.location.hash;
        setIsHomeView(isHomeRoute);
      });
    }

    function handleRouteChange(event) {
      syncVisibility(event.detail);
    }

    function handleLocationChange() {
      syncVisibility();
    }

    syncVisibility();
    window.addEventListener("mauriresults:routechange", handleRouteChange);
    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("mauriresults:routechange", handleRouteChange);
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [pathname]);

  const shouldCheck = pathname === "/" && isHomeView;

  useEffect(() => {
    if (!shouldCheck) return undefined;

    let cancelled = false;
    let nextCheckTimer;

    async function checkPublication() {
      let nextPublished = { excellence: false, supplementary: false };

      try {
        const response = await fetch("/api/public-exams", {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const payload = await response.json();
          const exams = Array.isArray(payload?.exams) ? payload.exams : [];
          nextPublished = {
            excellence: exams.some(isExcellence2026Exam),
            supplementary: exams.some(isSupplementaryBac2026Exam),
          };
        }
      } catch {
        // Keep the alert visible when publication status cannot be verified.
      }

      if (cancelled) return;
      setPublished(nextPublished);
      setChecked(true);

      if (nextPublished.excellence && nextPublished.supplementary) return;

      const delay = STATUS_RECHECK_MIN_MS + Math.floor(Math.random() * STATUS_RECHECK_JITTER_MS);
      nextCheckTimer = window.setTimeout(checkPublication, delay);
    }

    checkPublication();

    return () => {
      cancelled = true;
      if (nextCheckTimer) window.clearTimeout(nextCheckTimer);
    };
  }, [shouldCheck]);

  const pendingAlerts = useMemo(
    () => ALERTS.filter((alert) => !published[alert.id]),
    [published],
  );

  if (!shouldCheck || !checked || !pendingAlerts.length) return null;

  return (
    <aside className="bac-release-notice results-alerts-notice" aria-label="إشعارات النتائج المنتظرة 2026">
      <div className="bac-release-notice-inner results-alerts-notice-inner">
        <span className="bac-release-notice-dot" aria-hidden="true" />
        <p>
          <strong>إشعارات النتائج</strong>
          <span>{pendingAlerts.map((alert) => alert.label).join(" • ")}</span>
        </p>
        <div className="results-alert-notice-actions">
          {pendingAlerts.map((alert) => (
            <Link key={alert.id} href={alert.href} className="bac-release-notice-link bac-release-notice-link-alert">
              {alert.shortLabel}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
