import Link from "next/link";
import ApkDownload from "./ApkDownload";
import "./apk.css";
import "./apk-state.css";

const canonical = "https://mauri-results.vercel.app/apk";

export const metadata = {
  title: "تطبيق MauriResults للأندرويد - حالة التنزيل",
  description: "تحقق من توفر تطبيق MauriResults للأندرويد، أو تابع نتائج المسابقات مباشرة عبر الموقع.",
  keywords: [
    "تحميل تطبيق MauriResults",
    "تطبيق نتائج موريتانيا",
    "تطبيق نتائج باكالوريا موريتانيا 2026",
    "تطبيق ابريفه وكونكور",
    "MauriResults APK",
  ],
  alternates: { canonical },
  openGraph: {
    type: "website",
    locale: "ar_MR",
    url: canonical,
    title: "تحميل تطبيق MauriResults للأندرويد",
    description: "التطبيق الرسمي لمتابعة النتائج والتوجيه والإحصائيات بسرعة.",
    siteName: "MauriResults",
    images: [{ url: "/logo.png", width: 1200, height: 1200, alt: "تطبيق MauriResults" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "تحميل تطبيق MauriResults للأندرويد",
    description: "حمّل الإصدار الرسمي لمتابعة نتائج باكالوريا وابريفه وكونكور.",
    images: ["/logo.png"],
  },
};

const HIGHLIGHTS = [
  { icon: "📊", title: "درجات مواد الباك", text: "عرض الدرجات الرسمية للمواد داخل بطاقة النتيجة" },
  { icon: "🧭", title: "التوجيه في الشريط السفلي", text: "وصول أسرع إلى الكليات والتخصصات المناسبة" },
  { icon: "⚡", title: "أخف وأسرع", text: "حجم أصغر مع دعم هواتف Android بنظامي 32 و64 بت" },
];

export default function ApkDownloadPage() {
  return (
    <main className="apk-page" dir="rtl">
      <section className="apk-shell">
        <header className="apk-nav">
          <Link href="/" className="apk-back" aria-label="الرجوع إلى الموقع">الرجوع للموقع</Link>
          <div className="apk-brand"><img src="/logo.png" alt="" width="38" height="38" /><span>MauriResults</span></div>
        </header>

        <section className="apk-hero">
          <div className="apk-hero-copy">
            <span className="apk-kicker">النسخة الرسمية الجديدة · الإصدار 3.3.0</span>
            <h1>تطبيق MauriResults للأندرويد</h1>
            <p>الإصدار الحالي 3.3.0 يعرض درجات مواد الباك والتوجيه. نتحقق من توفر ملف التطبيق قبل إتاحة التنزيل، ويمكنك متابعة نتائج المسابقات عبر الموقع.</p>
            <ApkDownload />
            <p className="apk-safe-note">إذا تعذر التنزيل، استخدم الموقع لمتابعة النتائج حتى عودة الخدمة.</p>
            <div className="mt-5 rounded-2xl border border-white/20 bg-white/10 p-4 text-white">
              <h2 className="text-lg font-black">بديل مؤقت دون تنزيل APK</h2>
              <p className="mt-2 text-sm leading-7">يمكنك إضافة موقع MauriResults إلى الشاشة الرئيسية لهاتفك واستخدامه مثل تطبيق ويب. هذا لا يثبت ملف Android الأصلي.</p>
              <ol className="mt-2 list-decimal space-y-1 pr-6 text-sm leading-7">
                <li>افتح الموقع في متصفح Chrome على Android.</li>
                <li>اضغط قائمة النقاط الثلاث في المتصفح.</li>
                <li>اختر «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق» إن ظهر الخيار.</li>
              </ol>
              <Link href="/" className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-white/35 bg-white/15 px-4 font-bold text-white">الاستمرار باستخدام الموقع</Link>
            </div>
          </div>

          <div className="apk-phone" aria-hidden="true">
            <div className="apk-phone-top"><span>13:54</span><span>● ● ●</span></div>
            <div className="apk-phone-body">
              <div className="apk-mini-brand"><img src="/logo.png" alt="" /><div><b>MauriResults</b><small>الإصدار الجديد 3.3</small></div></div>
              <div className="apk-mini-search">ابحث عن نتيجتك بسرعة</div>
              <div className="apk-mini-grid"><span>النتائج</span><span>التوجيه</span><span>الإحصائيات</span><span>المزيد</span></div>
              <div className="apk-mini-card"><b>درجات مواد الباك</b><small>عرض الدرجات الرسمية أسفل بطاقة النتيجة</small></div>
            </div>
          </div>
        </section>

        <section className="apk-highlights" aria-label="أهم الميزات">
          {HIGHLIGHTS.map((item) => (
            <article key={item.title}>
              <span>{item.icon}</span>
              <div><h2>{item.title}</h2><p>{item.text}</p></div>
            </article>
          ))}
        </section>

        <section className="apk-install-help">
          <div><strong>طريقة التحديث</strong><p>عند توفر التنزيل، اضغط زر التحميل ثم افتح الملف واضغط تثبيت. إذا طلب Android تأكيد استبدال النسخة القديمة فوافق على التحديث.</p></div>
          <span aria-hidden="true">1 — 2 — 3</span>
        </section>

        <footer className="apk-footer">MauriResults · التطبيق الرسمي للنتائج الوطنية</footer>
      </section>
    </main>
  );
}
