import Link from "next/link";

export default function OrientationHighlights({ highCompetition, nouadhibouPrograms }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {[
        ["الأعلى تنافساً تاريخياً", highCompetition],
        ["برامج جامعة نواذيبو", nouadhibouPrograms],
      ].map(([title, rows]) => (
        <div className="rounded-[26px] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[.055]" key={title}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-base font-black">{title}</h2>
            <span className="text-[10px] font-black text-mauri-green">آخر معدلات مسجلة</span>
          </div>
          <div className="grid gap-2">
            {rows.map((program) => (
              <Link className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3 transition hover:bg-mauri-green/5 dark:bg-white/5 dark:hover:bg-emerald-300/10" href={`/orientation/${program.id}`} key={program.id}>
                <span className="min-w-0">
                  <strong className="line-clamp-1 block text-sm font-black">{program.name}</strong>
                  <small className="line-clamp-1 text-[11px] font-bold text-slate-500 dark:text-slate-300">{program.stream} · {program.institution}</small>
                </span>
                <strong className="text-mauri-green dark:text-mauri-gold">{program.lastScore.toFixed(2)}</strong>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
