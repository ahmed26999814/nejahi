const TESTIMONIALS = [
  {
    quote: "واجهة سهلة، البحث واضح، والنتيجة تظهر بطريقة منظمة.",
    author: "مستخدم من موريتانيا",
  },
  {
    quote: "بطاقة النتيجة ممتازة للمشاركة والطباعة بسرعة.",
    author: "ولي أمر",
  },
  {
    quote: "التصميم الجديد يعطي ثقة أكبر للموقع ويجعل التجربة أسرع.",
    author: "طالب",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="grid gap-3">
      <div className="grid gap-1 text-start">
        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">Trust</span>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">ثقة وتجربة أفضل</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {TESTIMONIALS.map((item) => (
          <article className="relative overflow-hidden rounded-[26px] border border-white/70 bg-white/[.78] p-4 shadow-soft backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-mauri-green/30 hover:shadow-premium dark:border-white/10 dark:bg-[#10231a]/75" key={item.quote}>
            <span className="pointer-events-none absolute -left-8 -top-10 h-24 w-24 rounded-full bg-mauri-gold/15 blur-3xl" />
            <p className="text-sm font-bold leading-7 text-slate-600 dark:text-slate-300">“{item.quote}”</p>
            <strong className="mt-4 block text-xs font-black text-mauri-green dark:text-mauri-gold">{item.author}</strong>
          </article>
        ))}
      </div>
    </section>
  );
}
