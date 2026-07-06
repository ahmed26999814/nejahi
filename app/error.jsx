"use client";

export default function Error({ error, reset }) {
  return (
    <main className="app-background grid min-h-screen place-items-center px-4 text-center text-mauri-ink dark:text-white">
      <section className="result-card max-w-md">
        <img className="mx-auto h-20 w-20 rounded-[24px] object-contain" src="/logo.png" alt="MauriResults" />
        <p className="mt-4 text-xs font-black text-red-600 dark:text-red-300">خطأ غير متوقع</p>
        <h1 className="mt-1 text-2xl font-black">تعذر تحميل الصفحة</h1>
        <p className="mt-2 text-sm font-bold leading-6 text-slate-500 dark:text-slate-300">
          حدث خطأ أثناء عرض الصفحة. يمكنك المحاولة مرة أخرى.
        </p>
        <button className="action-button mt-5 bg-gradient-to-l from-mauri-green via-emerald-600 to-emerald-500 text-white" onClick={reset} type="button">
          إعادة المحاولة
        </button>
      </section>
    </main>
  );
}
