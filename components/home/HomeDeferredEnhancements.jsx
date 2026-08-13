"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const MotivationalVisibility = dynamic(
  () => import("../ui/MotivationalVisibility"),
  { ssr: false },
);
const BacTopperTrackOrder = dynamic(
  () => import("../ui/BacTopperTrackOrder"),
  { ssr: false },
);
const ResultSubjectDetailsBridge = dynamic(
  () => import("../results/ResultSubjectDetailsBridge"),
  { ssr: false },
);
const ResultDetailSanitizer = dynamic(
  () => import("../results/ResultDetailSanitizer"),
  { ssr: false },
);

function routeView(detail) {
  if (detail?.view) return detail.view;
  const hash = String(window.location.hash || "").replace(/^#/, "").trim();
  if (!hash || hash === "home") return "home";
  if (hash === "result") return "result";
  return "other";
}

export default function HomeDeferredEnhancements() {
  const [activeView, setActiveView] = useState("home");

  useEffect(() => {
    const sync = (event) => setActiveView(routeView(event?.detail));
    sync();
    window.addEventListener("mauriresults:routechange", sync);
    window.addEventListener("hashchange", sync, { passive: true });
    window.addEventListener("popstate", sync, { passive: true });
    return () => {
      window.removeEventListener("mauriresults:routechange", sync);
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  return (
    <>
      <MotivationalVisibility />
      {activeView !== "home" && <BacTopperTrackOrder />}
      {activeView === "result" && <ResultSubjectDetailsBridge />}
      <ResultDetailSanitizer />
    </>
  );
}
