"use client";

export default function SectionTitle({ eyebrow, title, description, align = "start", className = "" }) {
  const isCenter = align === "center";

  return (
    <div className={`${isCenter ? "mx-auto text-center" : "text-start"} max-w-3xl ${className}`}>
      {eyebrow && (
        <span className="mb-3 inline-flex rounded-full border border-mauri-green/20 bg-mauri-green/10 px-3 py-1 text-[11px] font-black text-mauri-green shadow-soft dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">
          {eyebrow}
        </span>
      )}
      <h2 className="text-2xl font-black leading-tight text-slate-950 dark:text-white md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className={`${isCenter ? "mx-auto" : ""} mt-3 max-w-2xl text-sm font-bold leading-7 text-slate-500 dark:text-slate-300 md:text-base`}>
          {description}
        </p>
      )}
    </div>
  );
}
