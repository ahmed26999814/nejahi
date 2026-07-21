"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const BAC_2026_TARGET = Date.UTC(2026, 6, 23, 18, 0, 0);
const STATUS_RECHECK_MIN_MS = 60_000;
const STATUS_RECHECK_JITTER_MS = 30_000;

function isMainBac2026Exam(exam) {
  if (String(exam?.year || "").trim() !== "2026") return false;

  const sourceText = [
    exam?.source_key,
    exam?.table_name,
    exam?.title_ar,
    exam?.title_fr,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const isBac =
    sourceText.includes("باكالوريا") ||
    sourceText.includes("baccalauréat") ||
    sourceText.includes("baccalaureat") ||
    /(^|[^a-z])bac([^a-z]|$)/i.test(sourceText);

  const isSupplementary =
    sourceText.includes("تكميل") ||
    sourceText.includes("session2") ||
    sourceText.includes("session 2") ||
    sourceText.includes("complément") ||
    sourceText.includes("complement");

  return isBac && !isSupplementary;
}

function getRemainingParts(remainingMs) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds };
}

function CountdownUnit({ label, value }) {
  const displayValue = value === null || value === undefined ? "--" : String(value).padStart(2, "0");

  return (
    <span className="bac-release-countdown-unit">
      <strong>{displayValue}</strong>
      <small>{label}</small>
    </span>
  );
}

export default function Bac2026CountdownNotice() {
  const pathname = usePathname();
  const [isHomeView, setIsHomeView] = useState(false);
  const [now, setNow] = useState(null);
  const [isPublished, setIsPublished] = useState(false);

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
        const hasOpenResult = Boolean(document.querySelector(".result-modal"));
        setIsHomeView(isHomeRoute && !hasOpenResult);
      });
    }

    function handleRouteChange(event) {
      syncVisibility(event.detail);
    }

    function handleLocationChange() {
      syncVisibility();
    }

    const observer = new MutationObserver(() => syncVisibility());
    observer.observe(document.body, { childList: true, subtree: true });

    syncVisibility();
    window.addEventListener("mauriresults:routechange", handleRouteChange);
    window.addEventListener("hashchange", handleLocationChange);
    window.addEventListener("popstate", handleLocationChange);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("mauriresults:routechange", handleRouteChange);
      window.removeEventListener("hashchange", handleLocationChange);
      window.removeEventListener("popstate", handleLocationChange);
    };
  }, [pathname]);

  const shouldShow = pathname === "/" && isHomeView;

  useEffect(() => {
    if (!shouldShow) return undefined;

    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow) return undefined;

    let cancelled = false;
    let nextCheckTimer;

    async function checkBacPublication() {
      let published = false;

      try {
        const response = await fetch("/api/public-exams", {
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          const payload = await response.json();
          published = Array.isArray(payload?.exams) && payload.exams.some(isMainBac2026Exam);
        }
      } catch {
        published = false;
      }

      if (cancelled) return;

      if (published) {
        setIsPublished(true);
        return;
      }

      const delay = STATUS_RECHECK_MIN_MS + Math.floor(Math.random() * STATUS_RECHECK_JITTER_MS);
      nextCheckTimer = window.setTimeout(checkBacPublication, delay);
    }

    checkBacPublication();

    return () => {
      cancelled = true;
      if (nextCheckTimer) window.clearTimeout(nextCheckTimer);
    };
  }, [shouldShow]);

  const remainingMs = now === null ? null : Math.max(0, BAC_2026_TARGET - now);
  const countdown = useMemo(
    () => (remainingMs === null ? null : getRemainingParts(remainingMs)),
    [remainingMs],
  );

  if (!shouldShow) return null;

  if (isPublished) {
    return (
      <aside className="bac-release-notice bac-release-notice-live" aria-label="نتائج باكالوريا 2026 متاحة">
        <div className="bac-release-notice-inner">
          <span className="bac-release-notice-dot" aria-hidden="true" />
          <p>
            <strong>تم نشر نتائج باكالوريا 2026</strong>
            <span>العداد متوقف — البحث متاح الآن.</span>
          </p>
          <Link href="/#year-2026" className="bac-release-notice-link">
            ابحث الآن
          </Link>
        </div>
      </aside>
    );
  }

  const targetReached = remainingMs === 0;

  return (
    <aside className="bac-release-notice" aria-label="العد التنازلي لباكالوريا 2026">
      <div className="bac-release-notice-inner">
        <span className="bac-release-notice-dot" aria-hidden="true" />
        <p>
          <strong>باكالوريا 2026</strong>
          <span>{targetReached ? "نترقب النشر الرسمي" : "الخميس 23 يوليو — الساعة 18:00"}</span>
        </p>

        {targetReached ? (
          <span className="bac-release-countdown-finished">بانتظار النشر</span>
        ) : (
          <span className="bac-release-countdown" aria-label="الوقت المتبقي">
            <CountdownUnit label="يوم" value={countdown?.days} />
            <CountdownUnit label="ساعة" value={countdown?.hours} />
            <CountdownUnit label="دقيقة" value={countdown?.minutes} />
            <CountdownUnit label="ثانية" value={countdown?.seconds} />
          </span>
        )}

        <Link href="/notify/bac-2026" className="bac-release-notice-link bac-release-notice-link-alert">
          أخبرني
        </Link>
      </div>
    </aside>
  );
}
