"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "mauriresults_online_session_v2";
const LAST_HEARTBEAT_KEY = "mauriresults_online_last_heartbeat";
const CACHED_ONLINE_KEY = "mauriresults_online_cached_count";
const HEARTBEAT_MS = 5 * 60 * 1000;
const SHARED_THROTTLE_MS = 90 * 1000;

function getSessionId() {
  const stored = localStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const created = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, created);
  return created;
}

function OnlineIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M5.6 8.2a8 8 0 0 0 0 7.6M18.4 8.2a8 8 0 0 1 0 7.6" />
      <path d="M2.8 5.2a12 12 0 0 0 0 13.6M21.2 5.2a12 12 0 0 1 0 13.6" />
    </svg>
  );
}

function cachedOnline() {
  const value = Number(localStorage.getItem(CACHED_ONLINE_KEY));
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export default function OnlineUsersCounter() {
  const rootRef = useRef(null);
  const [active, setActive] = useState(false);
  const [online, setOnline] = useState(null);

  useEffect(() => {
    setOnline(cachedOnline());
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
    let stopped = false;
    const sessionId = getSessionId();

    async function heartbeat() {
      if (document.visibilityState === "hidden") return;
      const lastHeartbeat = Number(localStorage.getItem(LAST_HEARTBEAT_KEY)) || 0;
      if (Date.now() - lastHeartbeat < SHARED_THROTTLE_MS) {
        const cached = cachedOnline();
        if (!stopped && cached !== null) setOnline(cached);
        return;
      }

      localStorage.setItem(LAST_HEARTBEAT_KEY, String(Date.now()));
      try {
        const response = await fetch("/api/online", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Online counter failed");
        const nextOnline = Number(data.online) || 0;
        localStorage.setItem(CACHED_ONLINE_KEY, String(nextOnline));
        if (!stopped) setOnline(nextOnline);
      } catch (error) {
        localStorage.removeItem(LAST_HEARTBEAT_KEY);
        console.warn("[MauriResults Online]", error);
      }
    }

    heartbeat();
    const interval = window.setInterval(heartbeat, HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") heartbeat();
    };
    const onStorage = (event) => {
      if (event.key === CACHED_ONLINE_KEY) {
        const cached = cachedOnline();
        if (!stopped && cached !== null) setOnline(cached);
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("storage", onStorage);

    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("storage", onStorage);
    };
  }, [active]);

  return (
    <div
      ref={rootRef}
      className={`online-users-counter ${online === null ? "counter-pending" : ""}`}
      aria-hidden={online === null ? "true" : undefined}
      aria-label={online === null ? undefined : `النشطون الآن ${online}`}
    >
      <span className="online-users-dot" aria-hidden="true" />
      <span className="online-users-icon"><OnlineIcon /></span>
      <span className="online-users-label">النشطون الآن</span>
      <strong>{online === null ? "—" : online.toLocaleString("ar-MR")}</strong>
    </div>
  );
}
