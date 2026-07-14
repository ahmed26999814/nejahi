import Link from "next/link";
import "./apk.css";

export const metadata = {
  title: "تحميل تطبيق MauriResults للأندرويد",
  description: "حمّل تطبيق MauriResults الرسمي للأندرويد مباشرة من الموقع.",
  alternates: {
    canonical: "https://mauri-results.vercel.app/Apk/",
  },
};

const FEATURES = [
  "بحث سريع في نتائج الباك والكونكور وأبريفه",
  "نفس البيانات والتحديثات الموجودة في الموقع",
  "واجهة مهيأة للهاتف مع الوضع الداكن",
  "لا يحتاج إلى Google Play أو Google Drive",
];

export default function ApkDownloadPage() {
  return (
    <main className="apk-page" dir="rtl">
      <section className="apk-shell">
        <Link href="/" className="apk-back" aria-label="الرجوع إلى الموقع">
          <span aria-hidden="true">→</span>
          الرجوع إلى الموقع
        </Link>

        <section className="apk-card">
          <div className="apk-glow apk-glow-one" />
          <div className="apk-glow apk-glow-two" />

          <div className="apk-content">
            <div className="apk-logo-wrap">
              <img src="/logo.png" alt="شعار MauriResults" className="apk-logo" width="112" height="112" />
              <span className="apk-android-badge">Android</span>
            </div>

            <p className="apk-kicker">التطبيق الرسمي</p>
            <h1>تطبيق MauriResults</h1>
            <p className="apk-description">
              احصل على نتائج المسابقات الوطنية بسرعة من هاتفك، مع بقاء الموقع ولوحة الإدارة وكل التحديثات كما هي.
            </p>

            <a
              href="/apk/MauriResults.apk"
              download="MauriResults.apk"
              className="apk-download"
              aria-label="تحميل تطبيق MauriResults للأندرويد"
            >
              <span className="apk-download-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
                  <path d="M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
                </svg>
              </span>
              <span>
                <strong>تحميل التطبيق للأندرويد</strong>
                <small>ملف APK مباشر من MauriResults</small>
              </span>
            </a>

            <div className="apk-meta" aria-label="معلومات الإصدار">
              <span><b>الإصدار</b> 1.0.0</span>
              <span><b>النظام</b> Android 7+</span>
              <span><b>المصدر</b> الموقع الرسمي</span>
            </div>

            <ul className="apk-features">
              {FEATURES.map((feature) => (
                <li key={feature}>
                  <span aria-hidden="true">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <aside className="apk-install-note">
              <span aria-hidden="true">!</span>
              <p>
                قد يطلب Android السماح بالتثبيت من هذا المتصفح لأن التطبيق يُحمّل مباشرة وليس من Google Play. اختر
                <strong> السماح من هذا المصدر </strong>
                ثم أكمل التثبيت.
              </p>
            </aside>
          </div>
        </section>

        <p className="apk-footer">MauriResults — منصة النتائج الوطنية في موريتانيا</p>
      </section>
    </main>
  );
}
