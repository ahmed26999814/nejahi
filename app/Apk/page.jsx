import Link from "next/link";
import ApkDownload from "./ApkDownload";
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

            <ApkDownload />

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
