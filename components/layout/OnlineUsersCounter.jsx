"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "mauriresults_online_session";
const HEARTBEAT_MS = 120_000;

function getSessionId() {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const created = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, created);
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

export default function OnlineUsersCounter() {
  const rootRef = useRef(null);
  const [active, setActive] = useState(false);
  const [online, setOnline] = useState(null);

  useEffect(() => {
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
    }, { rootMargin: "300px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return undefined;
    let stopped = false;
    const sessionId = getSessionId();

    async function heartbeat() {
      if (document.visibilityState === "hidden") return;
      try {
        const response = await fetch("/api/online", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Online counter failed");
        if (!stopped) setOnline(Number(data.online) || 0);
      } catch (error) {
        console.warn("[MauriResults Online]", error);
      }
    }

    heartbeat();
    const interval = window.setInterval(heartbeat, HEARTBEAT_MS);
    const onVisibility = () => {
      if (document.visibilityState === "visible") heartbeat();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
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
