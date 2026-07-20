import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./app-runtime.css";
import "./result-polish.css";
import "./footer-contact-polish.css";
import "./navigation-topper-fixes.css";
import "./footer-dark-fix.css";
import "./exam-card-polish.css";
import "./online-counter.css";
import "./dashboard-reference.css";
import "./dashboard-mobile.css";
import "./results-notice.css";
import "./bottom-nav-expanded.css";
import "./root-background-fix.css";
import AppRuntimeShell from "../components/layout/AppRuntimeShell";
import PublicDataFetchBridge from "../components/layout/PublicDataFetchBridge";
import Bac2026CountdownNotice from "../components/layout/Bac2026CountdownNotice";
import UiEnhancements from "../components/ui/UiEnhancements";
import BacTopperTrackOrder from "../components/ui/BacTopperTrackOrder";
import MotivationalVisibility from "../components/ui/MotivationalVisibility";
import ResultSubjectDetailsBridge from "../components/results/ResultSubjectDetailsBridge";

const siteUrl = "https://mauri-results.vercel.app";

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MauriResults",
  title: {
    default: "MauriResults | نتائج المسابقات الوطنية في موريتانيا",
    template: "%s | MauriResults",
  },
  description:
    "تابع نتائج باكالوريا 2026 فور صدورها الرسمية، وابحث عن نتائج ابريفه وكونكور وبقية المسابقات الوطنية في موريتانيا بسرعة عبر MauriResults.",
  keywords: [
    "MauriResults",
    "Mauri Results",
    "Mauri Bac",
    "موري باك",
    "نتائج موريتانيا",
    "نتائج المسابقات الوطنية موريتانيا 2026",
    "نتائج باكالوريا موريتانيا 2026",
    "نتائج باكالوريا 2026 برقم المترشح",
    "نتائج البكالوريا موريتانيا 2026",
    "نتائج الباك موريتانيا 2026",
    "رابط نتائج باكالوريا موريتانيا 2026",
    "موعد نتائج باكالوريا موريتانيا 2026",
    "لوائح باكالوريا موريتانيا 2026",
    "أوائل باكالوريا موريتانيا 2026",
    "نسبة النجاح في باكالوريا 2026",
    "أعلى معدل في باكالوريا موريتانيا",
    "نتائج باكالوريا حسب الولاية",
    "نتائج باكالوريا حسب الشعبة",
    "باكالوريا الدورة التكميلية 2026",
    "نتائج ابريفه موريتانيا",
    "نتائج ابريفه 2026",
    "ابريفه 2026",
    "نتائج كونكور موريتانيا",
    "نتائج كونكور 2026",
    "نتائج الامتياز موريتانيا",
    "نتائج دخول أولى إعدادية موريتانيا",
    "Resultats Bac Mauritanie 2026",
    "Résultats Bac Mauritanie 2026",
    "Résultats Bac Mauritanie par numéro",
    "Résultats Brevet Mauritanie 2026",
    "Brevet Mauritanie 2026",
    "Résultats Concours Mauritanie 2026",
    "Concours Mauritanie 2026",
  ],
  authors: [{ name: "Ahmed abdellahi mady" }],
  creator: "Ahmed abdellahi mady",
  publisher: "MauriResults",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ar_MR",
    url: siteUrl,
    siteName: "MauriResults",
    title: "MauriResults | نتائج المسابقات الوطنية في موريتانيا",
    description:
      "نتائج باكالوريا 2026 فور صدورها، مع البحث السريع عن نتائج ابريفه وكونكور وبقية المسابقات الوطنية في موريتانيا.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "MauriResults - نتائج المسابقات الوطنية في موريتانيا",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MauriResults | نتائج المسابقات الوطنية في موريتانيا",
    description: "تابع نتائج باكالوريا 2026 وابحث عن نتائج المسابقات الوطنية بسرعة.",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    title: "MauriResults",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#07130d",
};

const themeInitializer = `(function(){try{var key="mauriresults-theme";var saved=localStorage.getItem(key);var theme=saved==="light"||saved==="dark"?saved:"dark";if(!saved)localStorage.setItem(key,theme);var root=document.documentElement;root.dataset.theme=theme;root.classList.toggle("dark",theme==="dark");root.style.colorScheme=theme;}catch(error){var root=document.documentElement;root.dataset.theme="dark";root.classList.add("dark");root.style.colorScheme="dark";}})();`;

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: "MauriResults",
        alternateName: ["Mauri Results", "Mauri Bac", "موري باك"],
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${siteUrl}/logo.png`,
        },
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        name: "MauriResults",
        alternateName: "Mauri Results",
        url: siteUrl,
        publisher: { "@id": `${siteUrl}/#organization` },
        inLanguage: ["ar-MR", "fr-MR"],
      },
      {
        "@type": "WebApplication",
        "@id": `${siteUrl}/#webapp`,
        name: "MauriResults",
        url: siteUrl,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Web, Android, iOS",
        inLanguage: ["ar-MR", "fr-MR"],
        description:
          "منصة موريتانية لمتابعة نتائج باكالوريا والبحث عن نتائج ابريفه وكونكور والامتياز، مع الأوائل والإحصائيات.",
        publisher: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };

  return (
    <html lang="ar" dir="rtl" className="dark" data-theme="dark" suppressHydrationWarning>
      <body className="font-arabic antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <Bac2026CountdownNotice />
        <PublicDataFetchBridge />
        <AppRuntimeShell />
        <UiEnhancements />
        <MotivationalVisibility />
        <BacTopperTrackOrder />
        <ResultSubjectDetailsBridge />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
