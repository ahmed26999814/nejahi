"use client";

import { useEffect, useState } from "react";

function isStandaloneMode() {
  return window.matchMedia?.("(display-mode: standalone)")?.matches
    || window.navigator.standalone === true;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

export default function InstallAppCard() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setInstalled(isStandaloneMode());

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setMessage("تم تثبيت MauriResults بنجاح.");
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installApp() {
    if (installed) {
      setMessage("التطبيق مثبت بالفعل على هذا الهاتف.");
      return;
    }

    if (isIosDevice()) {
      setShowIosHelp(true);
      return;
    }

    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setMessage("جاري تثبيت التطبيق...");
      }
      setInstallPrompt(null);
      return;
    }

    setMessage("افتح قائمة المتصفح ثم اختر: تثبيت التطبيق أو إضافة إلى الشاشة الرئيسية.");
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-[26px] border border-emerald-200/80 bg-gradient-to-br from-white via-emerald-50 to-amber-50 p-4 shadow-premium dark:border-white/10 dark:from-[#10231a] dark:via-[#0b2a1b] dark:to-[#30270b] md:p-6">
        <span className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-emerald-400/10" />
        <div className="relative grid items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
          <img
            src="/logo.png"
            alt="MauriResults"
            width="64"
            height="64"
            loading="lazy"
            className="h-14 w-14 rounded-2xl bg-white object-contain p-1.5 shadow-soft ring-1 ring-slate-200/70 dark:ring-white/10 sm:h-16 sm:w-16"
          />

          <div className="min-w-0">
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">تجربة أسرع على الهاتف</span>
            <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white md:text-xl">حمّل MauriResults كتطبيق</h2>
            <p className="mt-1 text-xs font-bold leading-5 text-slate-500 dark:text-slate-300">
              نسخة APK مباشرة للأندرويد، أو تثبيت سريع من المتصفح على Android وiPhone.
            </p>
            {message && <p className="mt-2 text-[11px] font-black text-emerald-700 dark:text-emerald-300">{message}</p>}
          </div>

          <div className="grid min-w-[164px] gap-2">
            <a
              href="/Apk/"
              className="grid min-h-12 place-items-center rounded-2xl bg-emerald-700 px-5 py-3 text-center text-sm font-black text-white shadow-[0_12px_28px_rgba(4,120,72,.22)] transition hover:bg-emerald-800 active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
            >
              تحميل APK للأندرويد
            </a>
            <button
              type="button"
              onClick={installApp}
              className="min-h-11 rounded-2xl border border-emerald-700/20 bg-white/80 px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-white active:scale-[.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/20 disabled:cursor-default disabled:opacity-70 dark:border-white/10 dark:bg-white/10 dark:text-emerald-200"
            >
              {installed ? "نسخة المتصفح مثبّتة ✓" : "تثبيت من المتصفح"}
            </button>
          </div>
        </div>
      </section>

      {showIosHelp && (
        <div className="fixed inset-0 z-[140] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-5" onClick={() => setShowIosHelp(false)}>
          <section
            className="w-full rounded-t-[28px] bg-white p-5 shadow-2xl dark:bg-[#10231a] sm:max-w-md sm:rounded-[28px]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300">iPhone وiPad</span>
                <h2 className="mt-1 text-lg font-black text-slate-950 dark:text-white">إضافة التطبيق إلى الشاشة الرئيسية</h2>
              </div>
              <button type="button" onClick={() => setShowIosHelp(false)} className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-xl dark:bg-white/10 dark:text-white">×</button>
            </div>

            <ol className="mt-5 grid gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
              <li className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[.05]">1. افتح الموقع باستخدام Safari.</li>
              <li className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[.05]">2. اضغط زر المشاركة في أسفل المتصفح.</li>
              <li className="rounded-2xl bg-slate-50 p-3 dark:bg-white/[.05]">3. اختر «إضافة إلى الشاشة الرئيسية» ثم اضغط «إضافة».</li>
            </ol>
          </section>
        </div>
      )}
    </>
  );
}
