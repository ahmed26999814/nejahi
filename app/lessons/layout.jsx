import IntegratedSectionShell from "../../components/layout/IntegratedSectionShell";

const siteUrl = "https://mauriresults.vercel.app";

export const metadata = {
  title: "الكتب المدرسية الموريتانية PDF للابتدائية والإعدادية والثانوية",
  description: "تحميل الكتب المدرسية الموريتانية PDF من السنة الأولى ابتدائية حتى الباك، مرتبة حسب المرحلة والسنة والمادة والشعبة مع تنزيل مباشر.",
  keywords: ["الكتب المدرسية الموريتانية PDF", "كتب موريتانيا", "كتب الابتدائية موريتانيا", "كتب الإعدادية موريتانيا", "كتب الثانوية موريتانيا", "كتب الباك موريتانيا", "دروس موريتانية", "MauriResults الدروس"],
  alternates: { canonical: `${siteUrl}/lessons` },
  openGraph: {
    type: "website", locale: "ar_MR", url: `${siteUrl}/lessons`,
    title: "الكتب المدرسية الموريتانية PDF | MauriResults",
    description: "مكتبة كتب موريتانية مرتبة حسب المرحلة والسنة والمادة مع تحميل مباشر.",
    images: [{ url: "/logo.png", width: 1200, height: 1200, alt: "مكتبة MauriResults للكتب المدرسية" }],
  },
  twitter: { card: "summary_large_image", title: "الكتب المدرسية الموريتانية PDF | MauriResults", description: "تحميل كتب الابتدائية والإعدادية والثانوية والباك في موريتانيا.", images: ["/logo.png"] },
};

export default function LessonsLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org", "@type": "CollectionPage", name: "مكتبة الكتب المدرسية الموريتانية",
    url: `${siteUrl}/lessons`, inLanguage: "ar-MR",
    description: "كتب مدرسية موريتانية بصيغة PDF مرتبة حسب المرحلة والسنة والمادة.",
    isPartOf: { "@type": "WebSite", name: "MauriResults", url: siteUrl },
  };

  return (
    <IntegratedSectionShell active="/lessons">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <style>{`
        .lessons-route > main > header{display:none}
        .lessons-route > main{background:linear-gradient(180deg,#f8faf8 0%,#eef6f1 100%)}
        .dark .lessons-route > main{background:linear-gradient(180deg,#07130d 0%,#0a1710 100%);color:#f8fafc}
        .dark .lessons-route article,
        .dark .lessons-route button:not(.bg-mauri-green),
        .dark .lessons-route input{background:#12231a!important;border-color:#294337!important;color:#f8fafc!important}
        .dark .lessons-route article{box-shadow:0 12px 30px rgba(0,0,0,.18)!important}
        .dark .lessons-route article h3,
        .dark .lessons-route h2,
        .dark .lessons-route strong{color:#f8fafc}
        .dark .lessons-route article p,
        .dark .lessons-route .text-slate-500,
        .dark .lessons-route .text-slate-400,
        .dark .lessons-route input::placeholder{color:#c0cdc5!important}
        .dark .lessons-route .bg-mauri-green{background:#168a4d!important;color:white!important;border-color:#26a864!important}
        .dark .lessons-route .bg-mauri-green\/10{background:rgba(34,197,94,.14)!important;color:#55df91!important}
        .dark .lessons-route input:focus{border-color:#38c878!important;box-shadow:0 0 0 4px rgba(34,197,94,.14)!important}
        .dark .lessons-route a[href*="/api/books/download"]{background:#168a4d!important;color:#fff!important;box-shadow:0 8px 20px rgba(22,138,77,.22)}
        .lessons-route h2{line-height:1.5}
        @media(max-width:640px){.lessons-route section.app-shell{padding-inline:.65rem}.lessons-route h2{font-size:1.1rem}}
      `}</style>
      <div className="lessons-route">{children}</div>
    </IntegratedSectionShell>
  );
}
