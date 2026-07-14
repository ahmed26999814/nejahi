import SiteSectionHeader from "../../components/layout/SiteSectionHeader";

const siteUrl = "https://mauri-results.vercel.app";

export const metadata = {
  title: "الكتب المدرسية الموريتانية PDF للابتدائية والإعدادية والثانوية",
  description: "تحميل الكتب المدرسية الموريتانية PDF من السنة الأولى ابتدائية حتى الباك، مرتبة حسب المرحلة والسنة والمادة والشعبة مع تنزيل مباشر.",
  keywords: [
    "الكتب المدرسية الموريتانية PDF",
    "كتب موريتانيا",
    "كتب الابتدائية موريتانيا",
    "كتب الإعدادية موريتانيا",
    "كتب الثانوية موريتانيا",
    "كتب الباك موريتانيا",
    "دروس موريتانية",
    "MauriResults الدروس",
  ],
  alternates: { canonical: `${siteUrl}/lessons` },
  openGraph: {
    type: "website",
    locale: "ar_MR",
    url: `${siteUrl}/lessons`,
    title: "الكتب المدرسية الموريتانية PDF | MauriResults",
    description: "مكتبة كتب موريتانية مرتبة حسب المرحلة والسنة والمادة مع تحميل مباشر.",
    images: [{ url: "/logo.png", width: 1200, height: 1200, alt: "مكتبة MauriResults للكتب المدرسية" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "الكتب المدرسية الموريتانية PDF | MauriResults",
    description: "تحميل كتب الابتدائية والإعدادية والثانوية والباك في موريتانيا.",
    images: ["/logo.png"],
  },
};

export default function LessonsLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "مكتبة الكتب المدرسية الموريتانية",
    url: `${siteUrl}/lessons`,
    inLanguage: "ar-MR",
    description: "كتب مدرسية موريتانية بصيغة PDF مرتبة حسب المرحلة والسنة والمادة.",
    isPartOf: { "@type": "WebSite", name: "MauriResults", url: siteUrl },
  };

  return (
    <div className="lessons-route">
      <SiteSectionHeader active="/lessons" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <style>{`.lessons-route > main > header{display:none}.lessons-route > main{background:linear-gradient(180deg,#f8faf8 0%,#eef6f1 100%)}.dark .lessons-route > main{background:linear-gradient(180deg,#07130d 0%,#0b1b12 100%)}`}</style>
      {children}
    </div>
  );
}
