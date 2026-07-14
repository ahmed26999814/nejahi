"use client";

import { useEffect, useRef, useState } from "react";
import { isNativeAppRuntime, isStandaloneMode } from "../../lib/runtimeEnvironment";

const ONLINE_MESSAGE_MS = 2200;
const ROUTE_PROGRESS_MS = 420;

function runtimeName() {
  if (isNativeAppRuntime()) return "native";
  if (isStandaloneMode()) return "standalone";
  return "web";
}

export default function AppRuntimeShell() {
  const [online, setOnline] = useState(true);
  const [reconnected, setReconnected] = useState(false);
  const [routeChanging, setRouteChanging] = useState(false);
  const routeTimerRef = useRef(0);
  const onlineTimerRef = useRef(0);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.appRuntime = runtimeName();

    const updateViewport = () => {
      root.style.setProperty("--app-viewport-height", `${window.innerHeight}px`);
    };

    const updateConnection = () => {
      const nextOnline = navigator.onLine !== false;
      setOnline((previous) => {
        if (!previous && nextOnline) {
          setReconnected(true);
          window.clearTimeout(onlineTimerRef.current);
          onlineTimerRef.current = window.setTimeout(() => setReconnected(false), ONLINE_MESSAGE_MS);
        }
        return nextOnline;
      });
      root.dataset.online = nextOnline ? "true" : "false";
    };

    const showRouteProgress = () => {
      setRouteChanging(true);
      window.clearTimeout(routeTimerRef.current);
      routeTimerRef.current = window.setTimeout(() => setRouteChanging(false), ROUTE_PROGRESS_MS);
    };

    const hapticTap = (event) => {
      if (!event.target?.closest?.("[data-haptic]")) return;
      navigator.vibrate?.(8);
    };

    updateViewport();
    updateConnection();

    window.addEventListener("resize", updateViewport, { passive: true });
    window.visualViewport?.addEventListener("resize", updateViewport, { passive: true });
    window.addEventListener("online", updateConnection, { passive: true });
    window.addEventListener("offline", updateConnection, { passive: true });
    window.addEventListener("hashchange", showRouteProgress, { passive: true });
    window.addEventListener("popstate", showRouteProgress, { passive: true });
    window.addEventListener("mauriresults:routechange", showRouteProgress);
    document.addEventListener("click", hapticTap, { passive: true });

    return () => {
      window.clearTimeout(routeTimerRef.current);
      window.clearTimeout(onlineTimerRef.current);
      window.removeEventListener("resize", updateViewport);
      window.visualViewport?.removeEventListener("resize", updateViewport);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
      window.removeEventListener("hashchange", showRouteProgress);
      window.removeEventListener("popstate", showRouteProgress);
      window.removeEventListener("mauriresults:routechange", showRouteProgress);
      document.removeEventListener("click", hapticTap);
    };
  }, []);

  return (
    <>
      <div className={`app-route-progress ${routeChanging ? "is-visible" : ""}`} aria-hidden="true">
        <span />
      </div>

      {!online && (
        <div className="app-network-status is-offline" role="status" aria-live="polite">
          <span className="app-network-dot" />
          لا يوجد اتصال بالإنترنت — سنعيد المحاولة تلقائيًا
        </div>
      )}

      {reconnected && online && (
        <div className="app-network-status is-online" role="status" aria-live="polite">
          <span className="app-network-dot" />
          عاد الاتصال بالإنترنت
        </div>
      )}
    </>
  );
}
