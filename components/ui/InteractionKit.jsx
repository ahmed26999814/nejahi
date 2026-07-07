"use client";

import { useState } from "react";
import { ChevronDownIcon, XIcon } from "../common/icons";

export function RippleButton({ as: Component = "button", className = "", children, ...props }) {
  return (
    <Component
      className={`relative isolate overflow-hidden rounded-[18px] transition duration-300 before:absolute before:inset-0 before:-z-10 before:scale-0 before:rounded-full before:bg-white/25 before:opacity-0 before:transition before:duration-300 hover:-translate-y-0.5 hover:before:scale-150 hover:before:opacity-100 active:scale-[.98] ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
}

export function Accordion({ items = [] }) {
  return (
    <div className="grid gap-2">
      {items.map((item) => (
        <details className="group rounded-[22px] border border-white/70 bg-white/[.72] p-4 shadow-soft backdrop-blur-xl transition open:border-mauri-green/30 dark:border-white/10 dark:bg-white/[.06]" key={item.title}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-slate-950 dark:text-white">
            {item.title}
            <span className="grid h-8 w-8 place-items-center rounded-full bg-mauri-green/10 text-mauri-green transition group-open:rotate-180 dark:bg-emerald-300/10 dark:text-emerald-300"><ChevronDownIcon /></span>
          </summary>
          <div className="mt-3 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">{item.content}</div>
        </details>
      ))}
    </div>
  );
}

export function Tabs({ tabs = [] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((tab) => tab.id === active) || tabs[0];

  if (!tabs.length) return null;

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap gap-2 rounded-[24px] border border-white/70 bg-white/[.72] p-2 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[.06]">
        {tabs.map((tab) => (
          <button className={`rounded-[18px] px-4 py-2 text-xs font-black transition ${active === tab.id ? "bg-mauri-green text-white shadow-soft" : "text-slate-500 hover:bg-mauri-green/10 hover:text-mauri-green dark:text-slate-300"}`} onClick={() => setActive(tab.id)} type="button" key={tab.id}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="rounded-[26px] border border-white/70 bg-white/[.78] p-4 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75">
        {current?.content}
      </div>
    </section>
  );
}

export function Drawer({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 h-full w-full cursor-default" onClick={onClose} type="button" aria-label="إغلاق" />
      <aside className="absolute inset-y-0 left-0 grid w-[min(420px,calc(100%-1.25rem))] content-start gap-4 rounded-r-[34px] border-r border-white/20 bg-white/[.92] p-5 shadow-premium backdrop-blur-2xl dark:bg-[#10231a]/95">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">{title}</h2>
          <button className="icon-button" onClick={onClose} type="button" aria-label="إغلاق"><XIcon /></button>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function Tooltip({ label, children }) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 translate-y-1 rounded-[12px] bg-slate-950 px-3 py-1.5 text-[11px] font-black text-white opacity-0 shadow-premium transition group-hover:translate-y-0 group-hover:opacity-100 dark:bg-white dark:text-slate-950">
        {label}
      </span>
    </span>
  );
}

export function Pagination({ page = 1, totalPages = 1, onPageChange }) {
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => index + 1);
  return (
    <nav className="flex flex-wrap items-center justify-center gap-2">
      {pages.map((item) => (
        <button className={`grid h-10 w-10 place-items-center rounded-[14px] text-xs font-black transition ${page === item ? "bg-mauri-green text-white shadow-soft" : "border border-white/70 bg-white/[.78] text-slate-500 shadow-soft hover:text-mauri-green dark:border-white/10 dark:bg-white/[.08] dark:text-slate-300"}`} onClick={() => onPageChange?.(item)} type="button" key={item}>
          {item}
        </button>
      ))}
    </nav>
  );
}
