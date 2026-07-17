import Link from "next/link";
import ApkDownload from "./ApkDownload";
import "./apk.css";
import "./apk-state.css";

export const metadata = {
  title: "تحميل تطبيق MauriResults للأندرويد",
  description: "حمّل تطبيق MauriResults للنتائج وحساب المعدل والدروس.",
  alternates: { canonical: "https://mauriresults.vercel.app/Apk/" },
};

const HIGHLIGHTS = [
  { icon: "⌕", title: "النتائج", text: "ابحث بالرقم أو الاسم بسرعة" },
  { icon: "∑", title: "حساب المعدل", text: "حاسبة بسيطة تحفظ موادك" },
  { icon: "▤", title: "الدروس", text: "ملخصات مفيدة تعمل دون اتصال" },
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
            <span className="apk-kicker">تطبيق النتائج على هاتفك</span>
            <h1>كل ما تحتاجه للدراسة والنتائج في تطبيق واحد</h1>
            <p>واجهة بسيطة وسريعة للبحث عن النتائج، حساب المعدل، ومراجعة الدروس دون تعقيد.</p>
            <ApkDownload />
            <p className="apk-safe-note">تحميل مباشر وآمن من الموقع الرسمي</p>
          </div>

          <div className="apk-phone" aria-hidden="true">
            <div className="apk-phone-top"><span>13:54</span><span>● ● ●</span></div>
            <div className="apk-phone-body">
              <div className="apk-mini-brand"><img src="/logo.png" alt="" /><div><b>MauriResults</b><small>نتائجك أقرب</small></div></div>
              <div className="apk-mini-search">ابحث عن نتيجتك</div>
              <div className="apk-mini-grid"><span>النتائج</span><span>المعدل</span><span>الدروس</span><span>المحفوظات</span></div>
              <div className="apk-mini-card"><b>نتائج 2025</b><small>متاحة الآن</small></div>
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
          <div><strong>التثبيت سهل</strong><p>بعد اكتمال التحميل افتح الملف واضغط تثبيت. قد يطلب Android السماح بالتثبيت من المتصفح لأول مرة.</p></div>
          <span aria-hidden="true">1 — 2 — 3</span>
        </section>

        <footer className="apk-footer">MauriResults · التطبيق الرسمي للنتائج الوطنية</footer>
      </section>
    </main>
  );
}
