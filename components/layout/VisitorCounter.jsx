"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "mauriresults_visit_session";

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
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (stored) return stored;
  const created = crypto.randomUUID();
  sessionStorage.setItem(SESSION_KEY, created);
  return created;
}

export default function VisitorCounter() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const sessionId = getSessionId();

    fetch("/api/visitors", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Visitor counter failed");
        if (!cancelled) setCount(Number(data.count) || 0);
      })
      .catch((error) => console.warn("[MauriResults Visits]", error));

    return () => { cancelled = true; };
  }, []);

  if (count === null) return null;

  return (
    <div className="visitor-counter" aria-label={`عدد الزيارات ${count}`}>
      <span className="visitor-counter-icon"><VisitorsIcon /></span>
      <span className="visitor-counter-label">الزيارات</span>
      <strong>{count.toLocaleString("ar-MR")}</strong>
    </div>
  );
}
