"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "mauriresults_online_session_v2";
const LAST_HEARTBEAT_KEY = "mauriresults_online_last_heartbeat";
const CACHED_ONLINE_KEY = "mauriresults_online_cached_count";
const INITIAL_DELAY_MIN_MS = 60 * 1000;
const INITIAL_DELAY_MAX_MS = 8 * 60 * 1000;
const HEARTBEAT_MIN_MS = 7.5 * 60 * 1000;
const HEARTBEAT_MAX_MS = 8.5 * 60 * 1000;
const SHARED_THROTTLE_MS = 7 * 60 * 1000;

function randomBetween(minimum, maximum) {
  return minimum + Math.floor(Math.random() * Math.max(1, maximum - minimum));
}

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

function rememberOnline(value) {
  const nextOnline = Number(value) || 0;
  localStorage.setItem(CACHED_ONLINE_KEY, String(nextOnline));
  return nextOnline;
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
    let heartbeatTimer;
    const countController = new AbortController();
    const sessionId = getSessionId();

    function updateOnline(value) {
      const nextOnline = rememberOnline(value);
      if (!stopped) setOnline(nextOnline);
    }

    fetch("/api/online", {
      method: "GET",
      signal: countController.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Online counter failed");
        updateOnline(data.online);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") console.warn("[MauriResults Online Count]", error);
      });

    function scheduleHeartbeat(delay) {
      window.clearTimeout(heartbeatTimer);
      heartbeatTimer = window.setTimeout(heartbeat, Math.max(1_000, delay));
    }

    async function heartbeat() {
      if (stopped) return;
      if (document.visibilityState !== "visible") {
        scheduleHeartbeat(60 * 1000);
        return;
      }

      const lastHeartbeat = Number(localStorage.getItem(LAST_HEARTBEAT_KEY)) || 0;
      const elapsed = Date.now() - lastHeartbeat;
      if (elapsed < SHARED_THROTTLE_MS) {
        scheduleHeartbeat(
          SHARED_THROTTLE_MS - elapsed + randomBetween(15 * 1000, 45 * 1000),
        );
        return;
      }

      localStorage.setItem(LAST_HEARTBEAT_KEY, String(Date.now()));
      try {
        const response = await fetch("/api/online", {
          method: "POST",
          cache: "no-store",
          keepalive: true,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Online heartbeat failed");
        updateOnline(data.online);
      } catch (error) {
        localStorage.removeItem(LAST_HEARTBEAT_KEY);
        if (!stopped) console.warn("[MauriResults Online Heartbeat]", error);
      } finally {
        if (!stopped) {
          scheduleHeartbeat(randomBetween(HEARTBEAT_MIN_MS, HEARTBEAT_MAX_MS));
        }
      }
    }

    const lastHeartbeat = Number(localStorage.getItem(LAST_HEARTBEAT_KEY)) || 0;
    const elapsed = Date.now() - lastHeartbeat;
    const initialDelay = elapsed < SHARED_THROTTLE_MS
      ? SHARED_THROTTLE_MS - elapsed + randomBetween(15 * 1000, 45 * 1000)
      : randomBetween(INITIAL_DELAY_MIN_MS, INITIAL_DELAY_MAX_MS);
    scheduleHeartbeat(initialDelay);

    const onStorage = (event) => {
      if (event.key === CACHED_ONLINE_KEY) {
        const cached = cachedOnline();
        if (!stopped && cached !== null) setOnline(cached);
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      stopped = true;
      countController.abort();
      window.clearTimeout(heartbeatTimer);
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
