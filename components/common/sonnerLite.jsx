"use client";

import { useEffect, useRef, useState } from "react";

let nextToastId = 1;
const listeners = new Set();

function publish(message, type = "default", options = {}) {
  const id = options?.id ?? nextToastId++;
  const item = {
    id,
    type,
    message: String(message ?? ""),
    icon: options?.icon,
    duration: options?.duration,
  };
  listeners.forEach((listener) => listener(item));
  return id;
}

function dismiss(id) {
  listeners.forEach((listener) => listener({ id, dismiss: true }));
}

export const toast = Object.assign(
  (message, options) => publish(message, "default", options),
  {
    success: (message, options) => publish(message, "success", options),
    error: (message, options) => publish(message, "error", options),
    info: (message, options) => publish(message, "info", options),
    warning: (message, options) => publish(message, "warning", options),
    message: (message, options) => publish(message, "default", options),
    dismiss,
  },
);

const TYPE_CLASSES = {
  default: "border-slate-200 bg-white text-slate-800 dark:border-white/10 dark:bg-[#12231a] dark:text-white",
  success: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950 dark:text-emerald-100",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-950 dark:text-red-100",
  info: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-950 dark:text-sky-100",
  warning: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950 dark:text-amber-100",
};

const TYPE_ICONS = {
  success: "✓",
  error: "!",
  info: "i",
  warning: "!",
};

export function Toaster({ dir = "rtl", position = "top-center", toastOptions = {} }) {
  const [items, setItems] = useState([]);
  const timers = useRef(new Map());
  const defaultDuration = Number(toastOptions?.duration) || 4200;

  useEffect(() => {
    const listener = (item) => {
      if (item.dismiss) {
        setItems((current) => current.filter((toastItem) => toastItem.id !== item.id));
        const timer = timers.current.get(item.id);
        if (timer) window.clearTimeout(timer);
        timers.current.delete(item.id);
        return;
      }

      setItems((current) => [item, ...current.filter((toastItem) => toastItem.id !== item.id)].slice(0, 4));
      const duration = Number(item.duration) || defaultDuration;
      const previousTimer = timers.current.get(item.id);
      if (previousTimer) window.clearTimeout(previousTimer);
      if (Number.isFinite(duration) && duration > 0) {
        const timer = window.setTimeout(() => {
          setItems((current) => current.filter((toastItem) => toastItem.id !== item.id));
          timers.current.delete(item.id);
        }, duration);
        timers.current.set(item.id, timer);
      }
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    };
  }, [defaultDuration]);

  const positionClass = position.startsWith("bottom") ? "bottom-5" : "top-5";

  return (
    <section
      className={`pointer-events-none fixed left-1/2 z-[100] grid w-[min(92vw,360px)] -translate-x-1/2 gap-2 ${positionClass}`}
      dir={dir}
      aria-live="polite"
      aria-atomic="false"
      aria-label="Notifications"
    >
      {items.map((item) => (
        <div
          className={`pointer-events-auto flex min-h-12 items-center gap-2.5 rounded-2xl border px-4 py-3 text-sm font-black shadow-[0_14px_36px_rgba(15,23,42,.16)] backdrop-blur-xl ${TYPE_CLASSES[item.type] || TYPE_CLASSES.default}`}
          role={item.type === "error" ? "alert" : "status"}
          key={item.id}
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-current/10 text-xs" aria-hidden="true">
            {item.icon || TYPE_ICONS[item.type] || "•"}
          </span>
          <span className="min-w-0 flex-1 leading-6">{item.message}</span>
        </div>
      ))}
    </section>
  );
}
