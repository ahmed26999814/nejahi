"use client";

import { useEffect, useState } from "react";

function formatDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("ar-MR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "-";
  }
}

export default function ApkDownload() {
  const [info, setInfo] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/apk/version.json", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("APK metadata is not available");
        return response.json();
      })
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setChecking(false));

    return () => controller.abort();
  }, []);

  return (
    <>
      {info ? (
        <a
          href={info.download || "/apk/MauriResults.apk"}
          download="MauriResults.apk"
          className="apk-download"
          aria-label="تحميل تطبيق MauriResults للأندرويد"
        >
          <span className="apk-download-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
              <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
            </svg>
          </span>
          <span>
            <strong>تحميل التطبيق للأندرويد</strong>
            <small>ملف APK مباشر — {info.sizeMB || "-"} MB</small>
          </span>
        </a>
      ) : (
        <div className="apk-download apk-download-disabled" role="status" aria-live="polite">
          <span className="apk-download-icon" aria-hidden="true">…</span>
          <span>
            <strong>{checking ? "جاري التحقق من التطبيق" : "جاري تجهيز النسخة الأولى"}</strong>
            <small>سيظهر زر التحميل فور اكتمال البناء</small>
          </span>
        </div>
      )}

      <div className="apk-meta" aria-label="معلومات الإصدار">
        <span><b>الإصدار</b> {info?.version || "1.0.0"}</span>
        <span><b>النظام</b> Android {info?.minimumAndroid || "7.0"}+</span>
        {info?.sizeMB && <span><b>الحجم</b> {info.sizeMB} MB</span>}
        {info?.publishedAt && <span><b>التحديث</b> {formatDate(info.publishedAt)}</span>}
        <span><b>المصدر</b> الموقع الرسمي</span>
      </div>
    </>
  );
}
