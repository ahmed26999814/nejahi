import Link from "next/link";
import ApkDownload from "./ApkDownload";
import "./apk.css";
import "./apk-state.css";

export const metadata = {
  title: "تحديث MauriResults 3.1.0 للأندرويد",
  description: "نزّل النسخة الجديدة من تطبيق MauriResults. تم إيقاف الإصدار 3.0.0 وجميع النسخ الأقدم.",
  alternates: { canonical: "https://mauri-results.vercel.app/Apk/" },
};

const HIGHLIGHTS = [
  { icon: "✨", title: "واجهة جديدة", text: "تصميم أجمل وأوضح مع أيقونات وانتقالات خفيفة" },
  { icon: "✓", title: "تمييز الناجح", text: "بطاقة خاصة وتأثير تهنئة واضح عند النجاح" },
  { icon: "⚡", title: "سريع وخفيف", text: "تحسينات بصرية دون إضافة مكتبات أو طلبات ثقيلة" },
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
            <span className="apk-kicker">النسخة الرسمية الجديدة · الإصدار 3.1.0</span>
            <h1>لديك نسخة قديمة؟ حمّل النسخة الجديدة الآن</h1>
            <p>تم إيقاف الإصدار 3.0.0 وجميع النسخ الأقدم. نزّل MauriResults 3.1.0 لمتابعة استخدام التطبيق والاستفادة من الواجهة الجديدة وتأثير النجاح المميز.</p>
            <ApkDownload />
            <p className="apk-safe-note">تحميل مباشر وآمن من الموقع الرسمي · جميع الروابط القديمة تحوّلك إلى أحدث نسخة</p>
          </div>

          <div className="apk-phone" aria-hidden="true">
            <div className="apk-phone-top"><span>13:54</span><span>● ● ●</span></div>
            <div className="apk-phone-body">
              <div className="apk-mini-brand"><img src="/logo.png" alt="" /><div><b>MauriResults</b><small>الإصدار الجديد 3.1</small></div></div>
              <div className="apk-mini-search">ابحث عن نتيجتك بسرعة</div>
              <div className="apk-mini-grid"><span>النتائج</span><span>الدروس</span><span>المحفوظات</span><span>الإحصائيات</span></div>
              <div className="apk-mini-card"><b>مبروك النجاح</b><small>واجهة جديدة وتأثير خاص للناجحين</small></div>
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
          <div><strong>طريقة التحديث</strong><p>اضغط زر التحميل ثم افتح الملف واضغط تثبيت. إذا طلب Android تأكيد استبدال النسخة القديمة فوافق على التحديث.</p></div>
          <span aria-hidden="true">1 — 2 — 3</span>
        </section>

        <footer className="apk-footer">MauriResults · التطبيق الرسمي للنتائج الوطنية</footer>
      </section>
    </main>
  );
}
