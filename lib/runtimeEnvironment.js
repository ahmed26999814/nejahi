export function isStandaloneMode() {
  if (typeof window === "undefined") return false;

  return Boolean(
    window.matchMedia?.("(display-mode: standalone)")?.matches
      || window.matchMedia?.("(display-mode: fullscreen)")?.matches
      || window.navigator?.standalone === true,
  );
}

export function isNativeAppRuntime() {
  if (typeof window === "undefined") return false;

  try {
    if (window.Capacitor?.isNativePlatform?.()) return true;

    const platform = window.Capacitor?.getPlatform?.();
    if (platform && platform !== "web") return true;
  } catch {
    // Keep browser detection resilient when a partial bridge is injected.
  }

  const userAgent = String(window.navigator?.userAgent || "");
  const referrer = String(document?.referrer || "");

  return /MauriResultsApp\//i.test(userAgent)
    || referrer.startsWith("android-app://com.mauriresults.app");
}

export function isMobileDevice() {
  if (typeof window === "undefined") return false;

  const userAgent = String(window.navigator?.userAgent || "");
  return /android|iphone|ipad|ipod|mobile/i.test(userAgent)
    || (window.navigator?.maxTouchPoints || 0) > 1;
}

export function shouldHideInstallPromotion() {
  return isNativeAppRuntime() || isStandaloneMode();
}
