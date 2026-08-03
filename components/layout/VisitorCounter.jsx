"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const CACHED_COUNT_KEY = "mauriresults_pageview_cached_count_v1";

function VisitorsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="4" />
      <path d="M17 11a4 4 0 0 1 4 4v2" />
      <path d="M16 3.2a4 4 0 0 1 0 7.6" />
    </svg>
  );
}

function cachedCount() {
  const value = Number(localStorage.getItem(CACHED_COUNT_KEY));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function rememberCount(value) {
  const nextCount = Number(value) || 0;
  if (nextCount > 0) localStorage.setItem(CACHED_COUNT_KEY, String(nextCount));
  return nextCount;
}

function sendPageView() {
  try {
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon("/api/pageviews")) return;
  } catch {
    // Fall back to a non-blocking fetch below.
  }

  fetch("/api/pageviews", {
    method: "POST",
    cache: "no-store",
    keepalive: true,
  }).catch(() => {});
}

export default function VisitorCounter({ lang = "ar" }) {
  const pathname = usePathname();
  const rootRef = useRef(null);
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(null);
  const isFrench = lang === "fr";
  const label = isFrench ? "Visites" : "الزيارات";
  const locale = isFrench ? "fr-MR" : "ar-MR";

  useEffect(() => {
    if (!pathname) return;
    sendPageView();
  }, [pathname]);

  useEffect(() => {
    setCount(cachedCount());
    const element = rootRef.current;
    if (!element) return undefined;
    if (!("IntersectionObserver" in window)) {
      setActive(true);
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setActive(true);
        observer.disconnect();
      }
    }, { rootMargin: "200px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    const controller = new AbortController();

    fetch("/api/visitors", {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Page-view counter failed");
        const nextCount = rememberCount(data.count);
        if (!cancelled && nextCount > 0) setCount(nextCount);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") console.warn("[MauriResults Page Views]", error);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [active, pathname]);

  return (
    <div
      ref={rootRef}
      className={`visitor-counter ${count === null ? "counter-pending" : ""}`}
      aria-hidden={count === null ? "true" : undefined}
      aria-label={count === null ? undefined : `${label} ${count}`}
    >
      <span className="visitor-counter-icon"><VisitorsIcon /></span>
      <span className="visitor-counter-label">{label}</span>
      <strong>{count === null ? "—" : count.toLocaleString(locale)}</strong>
    </div>
  );
}
