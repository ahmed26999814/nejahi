"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "mauriresults_visit_session_v2";
const LAST_SENT_KEY = "mauriresults_visit_last_sent";
const CACHED_COUNT_KEY = "mauriresults_visit_cached_count";
const SEND_INTERVAL_MS = 12 * 60 * 60 * 1000;
const MIN_REGISTRATION_DELAY_MS = 60 * 1000;
const MAX_REGISTRATION_DELAY_MS = 10 * 60 * 1000;

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

function getSessionId() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const created = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, created);
  return created;
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

export default function VisitorCounter() {
  const rootRef = useRef(null);
  const [active, setActive] = useState(false);
  const [count, setCount] = useState(null);

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
    let registrationTimer;
    const controller = new AbortController();

    fetch("/api/visitors", {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Visitor counter failed");
        const nextCount = rememberCount(data.count);
        if (!cancelled && nextCount > 0) setCount(nextCount);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") console.warn("[MauriResults Visitor Count]", error);
      });

    const lastSent = Number(localStorage.getItem(LAST_SENT_KEY)) || 0;
    if (Date.now() - lastSent < SEND_INTERVAL_MS) {
      return () => {
        cancelled = true;
        controller.abort();
      };
    }

    const delay = MIN_REGISTRATION_DELAY_MS
      + Math.floor(Math.random() * (MAX_REGISTRATION_DELAY_MS - MIN_REGISTRATION_DELAY_MS));

    const registerVisit = () => {
      if (cancelled) return;
      if (document.visibilityState !== "visible") {
        registrationTimer = window.setTimeout(registerVisit, 60 * 1000);
        return;
      }

      localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
      fetch("/api/visitors", {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: getSessionId() }),
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Visitor registration failed");
          const nextCount = rememberCount(data.count);
          if (!cancelled && nextCount > 0) setCount(nextCount);
        })
        .catch((error) => {
          localStorage.removeItem(LAST_SENT_KEY);
          if (error?.name !== "AbortError") console.warn("[MauriResults Visit Registration]", error);
        });
    };

    registrationTimer = window.setTimeout(registerVisit, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(registrationTimer);
      controller.abort();
    };
  }, [active]);

  return (
    <div
      ref={rootRef}
      className={`visitor-counter ${count === null ? "counter-pending" : ""}`}
      aria-hidden={count === null ? "true" : undefined}
      aria-label={count === null ? undefined : `عدد الزيارات ${count}`}
    >
      <span className="visitor-counter-icon"><VisitorsIcon /></span>
      <span className="visitor-counter-label">الزيارات</span>
      <strong>{count === null ? "—" : count.toLocaleString("ar-MR")}</strong>
    </div>
  );
}
