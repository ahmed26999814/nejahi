"use client";

import { useEffect, useRef } from "react";

const NATIVE_KEY = "2f3829ef67977ec13c78bedf18319319";
const MOBILE_BANNER_KEY = "a5acd9c27b4a23671b814a36d8e0b0f9";

function NativeAd() {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const script = document.createElement("script");
    script.async = true;
    script.dataset.cfasync = "false";
    script.src = `https://pl30335667.effectivecpmnetwork.com/${NATIVE_KEY}/invoke.js`;
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return (
    <section
      aria-label="إعلان"
      className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6"
    >
      <div className="mb-2 text-center text-[11px] text-slate-400">إعلان</div>
      <div
        id={`container-${NATIVE_KEY}`}
        className="min-h-[1px] overflow-hidden rounded-2xl"
      />
    </section>
  );
}

function MobileBannerAd() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || container.dataset.loaded === "true") return;
    container.dataset.loaded = "true";

    window.atOptions = {
      key: MOBILE_BANNER_KEY,
      format: "iframe",
      height: 50,
      width: 320,
      params: {},
    };

    const script = document.createElement("script");
    script.src = `https://www.highperformanceformat.com/${MOBILE_BANNER_KEY}/invoke.js`;
    script.async = true;
    container.appendChild(script);

    return () => {
      script.remove();
      delete window.atOptions;
    };
  }, []);

  return (
    <section
      aria-label="إعلان"
      className="mx-auto flex w-full justify-center px-4 pb-5 sm:hidden"
    >
      <div>
        <div className="mb-2 text-center text-[11px] text-slate-400">إعلان</div>
        <div
          ref={containerRef}
          className="h-[50px] w-[320px] max-w-full overflow-hidden rounded-lg"
        />
      </div>
    </section>
  );
}

export default function AdsterraAds() {
  return (
    <div className="bg-transparent">
      <NativeAd />
      <MobileBannerAd />
    </div>
  );
}
