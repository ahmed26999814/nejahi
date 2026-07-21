import Link from "next/link";
import ApkDownload from "./ApkDownload";
import "./apk.css";
import "./apk-state.css";

const canonical = "https://mauri-results.vercel.app/apk";

export const metadata = {
  title: "تحميل تطبيق MauriResults للأندرويد - الإصدار 3.2.0",
  description: "حمّل تطبيق MauriResults الرسمي للأندرويد لمتابعة نتائج باكالوريا وابريفه وكونكور في موريتانيا. الإصدار الحالي 3.2.0.",
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
    description: "التطبيق الرسمي لمتابعة النتائج والمواضيع والتوجيه بسرعة.",
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
  { icon: "🧭", title: "بحث كونكور الصحيح", text: "الولاية ثم المقاطعة ثم المركز ثم رقم المترشح" },
  { icon: "📚", title: "التعلم والتوجيه", text: "دروس وكتب ومواضيع امتحانات ومعلومات توجيه" },
  { icon: "⚡", title: "بطاقة أوضح وأخف", text: "عرض مباشر للاسم والقرار والمعدل والمركز دون تكرار" },
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
            <span className="apk-kicker">النسخة الرسمية الجديدة · الإصدار 3.2.0</span>
            <h1>حدّث التطبيق للاستفادة من البحث الجديد</h1>
            <p>تم إيقاف جميع الإصدارات السابقة. نزّل MauriResults 3.2.0 للحصول على بحث كونكور المتدرّج، والمواضيع والامتحانات، ومعلومات التوجيه، وبطاقة نتيجة أبسط.</p>
            <ApkDownload />
            <p className="apk-safe-note">تحميل مباشر وآمن من الموقع الرسمي · جميع الروابط القديمة تحوّلك إلى أحدث نسخة</p>
          </div>

          <div className="apk-phone" aria-hidden="true">
            <div className="apk-phone-top"><span>13:54</span><span>● ● ●</span></div>
            <div className="apk-phone-body">
              <div className="apk-mini-brand"><img src="/logo.png" alt="" /><div><b>MauriResults</b><small>الإصدار الجديد 3.2</small></div></div>
              <div className="apk-mini-search">ابحث عن نتيجتك بسرعة</div>
              <div className="apk-mini-grid"><span>النتائج</span><span>التعلم</span><span>المحفوظات</span><span>الإحصائيات</span></div>
              <div className="apk-mini-card"><b>كونكور</b><small>الولاية ← المقاطعة ← المركز ← الرقم</small></div>
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
