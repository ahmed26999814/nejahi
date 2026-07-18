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
import AppRuntimeShell from "../components/layout/AppRuntimeShell";
import PublicDataFetchBridge from "../components/layout/PublicDataFetchBridge";
import UiEnhancements from "../components/ui/UiEnhancements";
import BacTopperTrackOrder from "../components/ui/BacTopperTrackOrder";
import MotivationalVisibility from "../components/ui/MotivationalVisibility";
import ResultSubjectDetailsBridge from "../components/results/ResultSubjectDetailsBridge";

const siteUrl = "https://mauri-results.vercel.app";

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MauriResults",
  title: {
    default: "نتائج البكالوريا موريتانيا 2026 برقم المترشح | MauriResults",
    template: "%s | MauriResults",
  },
  description:
    "نتائج البكالوريا والبريفيه والكونكور في موريتانيا 2026 برقم المترشح عبر MauriResults، مع الأوائل ونسبة النجاح وأعلى معدل والنتائج حسب الولاية والشعبة.",
  keywords: [
    "MauriResults",
    "Mauri Results",
    "Mauri Bac",
    "MauriBAC",
    "موري باك",
    "نتائج موريتانيا",
    "نتائج المسابقات الوطنية موريتانيا 2026",
    "نتائج البكالوريا موريتانيا",
    "نتائج البكالوريا موريتانيا 2026",
    "نتائج البكالوريا 2026 برقم المترشح",
    "نتائج باكالوريا موريتانيا 2026",
    "نتائج الباك موريتانيا 2026",
    "رابط نتائج البكالوريا موريتانيا 2026",
    "موعد نتائج البكالوريا موريتانيا 2026",
    "لوائح البكالوريا موريتانيا 2026",
    "أوائل البكالوريا موريتانيا 2026",
    "نسبة النجاح في البكالوريا 2026",
    "أعلى معدل في البكالوريا موريتانيا",
    "نتائج البكالوريا حسب الولاية",
    "نتائج البكالوريا حسب الشعبة",
    "لوائح الناجحين PDF",
    "البكالوريا الدورة التكميلية 2026",
    "نتائج أبريفه موريتانيا",
    "أبريفه 2026",
    "نتائج البريفيه موريتانيا",
    "نتائج البريفيه 2026",
    "نتائج كونكور موريتانيا",
    "نتائج الكونكور 2026",
    "نتائج الامتياز موريتانيا",
    "نتائج دخول أولى إعدادية موريتانيا",
    "Resultats Bac Mauritanie 2026",
    "Résultats Bac Mauritanie 2026",
    "Résultats Bac Mauritanie par numéro",
    "Résultats BEPC Mauritanie 2026",
    "Résultats Concours Mauritanie 2026",
    "Bac Mauritanie 2026",
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
    title: "نتائج البكالوريا موريتانيا 2026 برقم المترشح | MauriResults",
    description:
      "ابحث بسرعة عن نتائج البكالوريا والبريفيه والكونكور 2026، وتابع الأوائل ونسبة النجاح وأعلى معدل في موريتانيا.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "MauriResults - نتائج موريتانيا 2026",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "نتائج البكالوريا موريتانيا 2026 برقم المترشح | MauriResults",
    description: "بحث سريع برقم المترشح عن نتائج المسابقات الوطنية في موريتانيا 2026.",
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
    "@type": "WebApplication",
    name: "MauriResults",
    alternateName: ["Mauri Results", "Mauri Bac", "موري باك"],
    url: siteUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, Android, iOS",
    inLanguage: ["ar-MR", "fr-MR"],
    description:
      "منصة موريتانية للبحث برقم المترشح عن نتائج البكالوريا والبريفيه والكونكور والامتياز 2026، ومتابعة الأوائل والإحصائيات.",
    creator: {
      "@type": "Person",
      name: "Ahmed abdellahi mady",
    },
  };

  return (
    <html lang="ar" dir="rtl" className="dark" data-theme="dark" suppressHydrationWarning>
      <body className="font-arabic antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <div className="results-notice" role="status" aria-live="polite">
          <span className="results-notice-dot" aria-hidden="true" />
          <span>تم فتح أبريفه والكونكور 2026 — ابحث الآن برقم المترشح</span>
        </div>
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
