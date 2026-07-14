import Link from "next/link";
import ApkDownload from "./ApkDownload";
import "./apk.css";
import "./apk-state.css";

export const metadata = {
  title: "تحميل تطبيق MauriResults الأصلي للأندرويد",
  description: "حمّل تطبيق MauriResults الأصلي للنتائج وحساب المعدل والدروس، المبني بـ React Native.",
  alternates: {
    canonical: "https://mauri-results.vercel.app/Apk/",
  },
};

const FEATURES = [
  "تطبيق Android أصلي بالكامل — لا يستخدم WebView",
  "واجهة جديدة وتنقل مريح مع معالجة زر الرجوع",
  "بحث سريع وترتيب النتائج حسب المعدل أو الاسم أو الرقم",
  "لوحة مباشرة لحالة نتائج 2025 وتفعيلها فور رفعها",
  "حاسبة معدل موزون تحفظ المواد والمعاملات",
  "دروس وملخصات مراجعة تعمل دون اتصال",
  "حفظ النتائج وسجل البحث ومشاركة النتيجة وتصدير PDF",
  "إحصائيات المسابقات والأوائل والولايات",
  "العربية والفرنسية والوضع الفاتح والداكن",
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
              <span className="apk-android-badge">Native</span>
            </div>

            <p className="apk-kicker">React Native + Expo</p>
            <h1>تطبيق MauriResults الأصلي</h1>
            <p className="apk-description">
              نتائج المسابقات، حاسبة المعدل، والدروس في تطبيق مستقل بواجهات هاتف حقيقية، بينما يبقى الموقع ولوحة الإدارة منفصلين ويعملان كالمعتاد.
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
                لأن التحميل مباشر وليس من Google Play، قد يطلب Android اختيار
                <strong> السماح من هذا المصدر</strong>. ثبّت الإصدار الجديد فوق النسخة 2.0.0، أو احذف النسخة القديمة أولًا عند ظهور تعارض.
              </p>
            </aside>
          </div>
        </section>

        <p className="apk-footer">MauriResults — تطبيق النتائج الوطنية الأصلي في موريتانيا</p>
      </section>
    </main>
  );
}
