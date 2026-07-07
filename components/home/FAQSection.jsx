const FAQ_ITEMS = [
  {
    question: "كيف أبحث عن النتيجة؟",
    answer: "اختر نوع المسابقة ثم أدخل رقم المترشح أو الاسم الكامل، وسيتم عرض النتيجة فور العثور عليها.",
  },
  {
    question: "هل الموقع يعمل على الهاتف؟",
    answer: "نعم، الواجهة مصممة لتعمل على الهاتف والكمبيوتر مع أزرار واضحة وتجربة سريعة.",
  },
  {
    question: "ما معنى بطاقة النتيجة؟",
    answer: "هي صفحة منظمة تعرض معلومات المترشح، المعدل، الحالة، المدرسة، والمركز بطريقة قابلة للمشاركة والطباعة.",
  },
];

export default function FAQSection() {
  return (
    <section className="grid gap-3 rounded-[30px] border border-white/70 bg-white/[.72] p-4 shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75 md:p-5">
      <div className="grid gap-1 text-start">
        <span className="text-xs font-black text-mauri-green dark:text-mauri-gold">FAQ</span>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">أسئلة شائعة</h2>
      </div>
      <div className="grid gap-2">
        {FAQ_ITEMS.map((item) => (
          <details className="group rounded-[22px] border border-mauri-border bg-white/70 p-4 shadow-soft transition open:border-mauri-green/30 dark:border-white/10 dark:bg-white/[.06]" key={item.question}>
            <summary className="cursor-pointer list-none text-sm font-black text-slate-950 outline-none dark:text-white">
              <span className="flex items-center justify-between gap-3">
                {item.question}
                <span className="grid h-7 w-7 place-items-center rounded-full bg-mauri-green/10 text-mauri-green transition group-open:rotate-45">+</span>
              </span>
            </summary>
            <p className="mt-3 text-sm font-bold leading-7 text-slate-500 dark:text-slate-300">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
