import Link from "next/link";

const links = [
  { href: "/", label: "الرئيسية" },
  { href: "/lessons", label: "الدروس والكتب" },
  { href: "/calculator", label: "حاسبة المعدل" },
];

export default function SiteSectionHeader({ active }) {
  return (
    <header className="sticky top-0 z-50 border-b border-mauri-border/80 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/95">
      <nav className="app-shell flex min-h-14 items-center justify-between gap-3 py-2" aria-label="التنقل الرئيسي">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <img src="/logo.png" width="36" height="36" alt="شعار MauriResults" className="h-9 w-9 rounded-[14px] object-cover" loading="eager" decoding="async" />
          <span className="min-w-0">
            <strong className="block truncate text-sm font-black tracking-tight">MauriResults</strong>
            <small className="block truncate text-[11px] font-bold text-slate-500 dark:text-slate-400">منصة النتائج والتعليم</small>
          </span>
        </Link>

        <div className="flex max-w-[62%] items-center gap-1 overflow-x-auto rounded-2xl bg-slate-100/80 p-1 dark:bg-white/5">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? "page" : undefined}
              className={`shrink-0 rounded-xl px-3 py-2 text-xs font-black transition ${active === item.href ? "bg-mauri-green text-white shadow-sm" : "text-slate-600 hover:bg-white hover:text-mauri-green dark:text-slate-300 dark:hover:bg-white/10"}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
