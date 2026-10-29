export default function VerseCard({ scope = "home" }) {
  return (
    <div data-quran-verse={scope} data-rendered-by-react="true" className={scope === "home" ? "app-shell pt-3" : "mb-3"} lang="ar" dir="rtl">
      <aside className="relative overflow-hidden rounded-[24px] border border-amber-300/20 bg-gradient-to-l from-[#06150d] via-[#0b2a1a] to-[#06150d] px-3.5 py-3 text-center text-amber-50 shadow-[0_14px_34px_rgba(0,0,0,.18)] sm:px-5 sm:py-4">
        <div className="relative mx-auto max-w-3xl">
          <span className="mx-auto mb-1.5 grid h-7 w-7 place-items-center rounded-full bg-amber-300/10 text-sm text-amber-200 ring-1 ring-amber-200/20" aria-hidden="true">ﷺ</span>
          <p className="text-[10px] font-bold leading-5 sm:text-xs sm:leading-6">﴿ إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا ﴾</p>
          <span className="mt-1 block text-[8px] font-black text-emerald-300/75 sm:text-[9px]">سورة الأحزاب — الآية ٥٦</span>
        </div>
      </aside>
    </div>
  );
}
