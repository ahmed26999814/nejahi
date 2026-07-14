export default function Loading() {
  return (
    <main className="app-background min-h-screen pb-24 text-mauri-ink dark:text-white" aria-busy="true" aria-label="جاري تحميل MauriResults">
      <header className="border-b border-mauri-border/70 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#07130d]/90">
        <div className="app-shell flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="skeleton h-9 w-9 rounded-[14px]" />
            <div className="grid gap-1.5">
              <span className="skeleton h-3.5 w-28" />
              <span className="skeleton h-2.5 w-20" />
            </div>
          </div>
          <div className="flex gap-2">
            <span className="skeleton h-9 w-9 rounded-xl" />
            <span className="skeleton h-9 w-10 rounded-xl" />
          </div>
        </div>
      </header>

      <section className="app-shell grid gap-5 py-4 md:gap-8 md:py-8">
        <section className="rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-premium dark:border-white/10 dark:bg-white/[.05] md:p-8">
          <div className="mx-auto grid max-w-2xl justify-items-center gap-4">
            <span className="skeleton h-24 w-24 rounded-[28px] md:h-32 md:w-32" />
            <span className="skeleton h-5 w-28 rounded-full" />
            <span className="skeleton h-8 w-[85%] max-w-lg rounded-xl md:h-12" />
            <span className="skeleton h-4 w-[70%] max-w-md" />
          </div>
        </section>

        <section className="grid grid-cols-2 gap-2.5 md:gap-3">
          <span className="skeleton h-[132px] rounded-[22px] md:h-[170px] md:rounded-[30px]" />
          <span className="skeleton h-[132px] rounded-[22px] md:h-[170px] md:rounded-[30px]" />
        </section>
      </section>
    </main>
  );
}
