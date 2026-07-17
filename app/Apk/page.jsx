import Link from "next/link";
import ApkDownload from "./ApkDownload";
import "./apk.css";
import "./apk-state.css";

export const metadata = {
  title: "تحديث MauriResults 3.0.0 للأندرويد",
  description: "نزّل تحديث MauriResults الجديد المبني بـ Flutter. تم إيقاف النسخ القديمة.",
  alternates: { canonical: "https://mauriresults.vercel.app/Apk/" },
};

const HIGHLIGHTS = [
  { icon: "⚡", title: "أسرع وأخف", text: "تطبيق Flutter أصلي بواجهة سريعة للهاتف" },
  { icon: "⌕", title: "بحث محسن", text: "ابحث بالرقم أو الاسم وجزء من الاسم" },
  { icon: "◉", title: "يعمل دون إنترنت", text: "المحفوظات والدروس وآخر عمليات البحث" },
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
            <span className="apk-kicker">تحديث إجباري جديد · الإصدار 3.0.0</span>
            <h1>نزّل تطبيق MauriResults الجديد</h1>
            <p>أعدنا بناء التطبيق بالكامل باستخدام Flutter ليصبح أسرع وأسهل وأكثر استقرارًا. تم إيقاف النسخ القديمة، ويجب تنزيل هذا التحديث لمتابعة استخدام النتائج.</p>
            <ApkDownload />
            <p className="apk-safe-note">تحميل مباشر وآمن من الموقع الرسمي · لا يمكن متابعة النسخة القديمة</p>
          </div>

          <div className="apk-phone" aria-hidden="true">
            <div className="apk-phone-top"><span>13:54</span><span>● ● ●</span></div>
            <div className="apk-phone-body">
              <div className="apk-mini-brand"><img src="/logo.png" alt="" /><div><b>MauriResults</b><small>الإصدار الجديد 3.0</small></div></div>
              <div className="apk-mini-search">ابحث عن نتيجتك بسرعة</div>
              <div className="apk-mini-grid"><span>النتائج</span><span>المعدل</span><span>الدروس</span><span>المحفوظات</span></div>
              <div className="apk-mini-card"><b>تحديث جديد</b><small>Flutter · أسرع وأكثر استقرارًا</small></div>
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
          <div><strong>طريقة التحديث</strong><p>نزّل الملف وافتحه ثم اضغط تثبيت. عند ظهور تعارض مع النسخة القديمة، احذفها وثبّت الإصدار الجديد.</p></div>
          <span aria-hidden="true">1 — 2 — 3</span>
        </section>

        <footer className="apk-footer">MauriResults · التطبيق الرسمي للنتائج الوطنية</footer>
      </section>
    </main>
  );
}
