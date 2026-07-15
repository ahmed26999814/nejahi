"use client";

import { useEffect, useState } from "react";

function formatCount(value) {
  const count = Number(value || 0);
  return new Intl.NumberFormat("ar-MR", { notation: count >= 1000 ? "compact" : "standard" }).format(count);
}

export default function ApkDownload() {
  const [info, setInfo] = useState(null);
  const [downloads, setDownloads] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    Promise.allSettled([
      fetch("/apk/version.json", { cache: "no-store", signal: controller.signal }).then((response) => {
        if (!response.ok) throw new Error("APK metadata is not available");
        return response.json();
      }),
      fetch("/api/apk-download?action=count", { signal: controller.signal }).then((response) => response.json()),
    ]).then(([versionResult, countResult]) => {
      if (versionResult.status === "fulfilled") setInfo(versionResult.value);
      if (countResult.status === "fulfilled") setDownloads(Number(countResult.value?.downloads || 0));
      setChecking(false);
    });
    return () => controller.abort();
  }, []);

  return (
    <div className="apk-action-area">
      {info ? (
        <a href="/api/apk-download" className="apk-download" aria-label="تحميل تطبيق MauriResults للأندرويد">
          <span className="apk-download-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3v11m0 0 4-4m-4 4-4-4" />
              <path d="M5 18v1a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1" />
            </svg>
          </span>
          <span className="apk-download-copy">
            <strong>تحميل التطبيق</strong>
            <small>APK مباشر · {info.sizeMB || "-"} MB</small>
          </span>
        </a>
      ) : (
        <div className="apk-download apk-download-disabled" role="status" aria-live="polite">
          <span className="apk-download-icon" aria-hidden="true">…</span>
          <span className="apk-download-copy">
            <strong>{checking ? "جاري تجهيز التحميل" : "النسخة غير متاحة الآن"}</strong>
            <small>سنحاول إظهارها تلقائيًا</small>
          </span>
        </div>
      )}

      <div className="apk-trust-row" aria-label="معلومات التطبيق">
        <span>الإصدار {info?.version || "2.1.0"}</span>
        <span>Android {info?.minimumAndroid || "7.0"}+</span>
        <span>{downloads === null ? "جاري حساب التحميلات" : `${formatCount(downloads)} تحميل`}</span>
      </div>
    </div>
  );
}
