"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isMobileDevice,
  isNativeAppRuntime,
  shouldHideInstallPromotion,
} from "../../lib/runtimeEnvironment";

const DISMISS_KEY = "mauriresults-install-promo-dismissed-at";
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isIosDevice() {
  if (typeof window === "undefined") return false;

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
    || (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

function isAndroidDevice() {
  if (typeof window === "undefined") return false;
  return /android/i.test(window.navigator.userAgent);
}

export default function InstallAppCard() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [message, setMessage] = useState("");
  const [iosDevice, setIosDevice] = useState(false);
  const [androidDevice, setAndroidDevice] = useState(false);

  useEffect(() => {
    if (shouldHideInstallPromotion()) {
      setVisible(false);
      return undefined;
    }

    const mobile = isMobileDevice();
    const isIos = isIosDevice();
    const isAndroid = isAndroidDevice();
    setIosDevice(isIos);
    setAndroidDevice(isAndroid);

    if (!mobile || isNativeAppRuntime()) {
      setVisible(false);
      return undefined;
    }

    const dismissedAt = Number(window.localStorage.getItem(DISMISS_KEY) || 0);
    const dismissedRecently = Number.isFinite(dismissedAt)
      && dismissedAt > 0
      && Date.now() - dismissedAt < DISMISS_TTL_MS;

    // The Android 3.0.0 update is mandatory, so its card cannot be dismissed.
    setVisible(isAndroid || !dismissedRecently);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handleInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setMessage("تم تثبيت MauriResults بنجاح.");
      if (!isAndroid) setVisible(false);
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const actionLabel = useMemo(() => {
    if (androidDevice) return "تحديث الآن";
    if (installPrompt) return "تثبيت";
    if (iosDevice) return "طريقة التثبيت";
    return "تثبيت";
  }, [androidDevice, installPrompt, iosDevice]);

  function dismissPromotion() {
    if (androidDevice) return;
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  }

  async function installApp() {
    if (shouldHideInstallPromotion()) {
      setVisible(false);
      return;
    }

    if (androidDevice) {
      window.location.assign("/Apk/");
      return;
    }

    if (iosDevice) {
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

    setMessage("افتح قائمة المتصفح واختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية». ");
  }

  if (!visible) return null;

  const title = androidDevice ? "تحديث MauriResults الجديد 3.0.0" : "ثبّت MauriResults على هاتفك";
  const description = androidDevice
    ? "تم إيقاف النسخة القديمة. نزّل تطبيق Flutter الجديد للمتابعة."
    : "وصول أسرع للنتائج من الشاشة الرئيسية.";

  return (
    <>
      <aside
        className="relative flex items-center gap-3 overflow-hidden rounded-[20px] border border-emerald-200/80 bg-white/90 px-3 py-2.5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#10231a]/90 md:hidden"
        aria-label={androidDevice ? "تحديث تطبيق MauriResults الإجباري" : "اقتراح تثبيت التطبيق"}
      >
        <span className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-emerald-500/10 to-transparent" aria-hidden="true" />
        <img
          src="/logo.png"
          alt=""
          width="40"
          height="40"
          className="relative h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1 shadow-sm ring-1 ring-slate-200/70 dark:ring-white/10"
        />

        <div className="relative min-w-0 flex-1">
          <strong className="block text-sm font-black text-slate-950 dark:text-white">{title}</strong>
          <span className="mt-0.5 block text-[11px] font-bold leading-4 text-slate-500 dark:text-slate-300">
            {description}
          </span>
          {message && <span className="mt-1 block text-[10px] font-black text-emerald-700 dark:text-emerald-300" aria-live="polite">{message}</span>}
        </div>

        <button
          type="button"
          onClick={installApp}
          className="relative min-h-9 shrink-0 rounded-xl bg-emerald-700 px-3 py-2 text-[11px] font-black text-white shadow-sm transition hover:bg-emerald-800 active:scale-[.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/25"
        >
          {actionLabel}
        </button>

        {!androidDevice && (
          <button
            type="button"
            onClick={dismissPromotion}
            className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            aria-label="إخفاء اقتراح التثبيت"
          >
            ×
          </button>
        )}
      </aside>

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
