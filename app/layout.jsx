import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./app-runtime.css";
import "./result-polish.css";
import "./footer-contact-polish.css";
import "./navigation-topper-fixes.css";
import "./footer-dark-fix.css";
import "./exam-card-polish.css";
import "./online-counter.css";
import "./forgot-number.css";
import "./dashboard-reference.css";
import "./dashboard-mobile.css";
import "./results-notice.css";
import AppRuntimeShell from "../components/layout/AppRuntimeShell";
import UiEnhancements from "../components/ui/UiEnhancements";
import UploadedConcoursSelectEnhancer from "../components/ui/UploadedConcoursSelectEnhancer";
import ForgotCandidateNumber from "../components/ui/ForgotCandidateNumber";
import BacTopperTrackOrder from "../components/ui/BacTopperTrackOrder";
import MotivationalVisibility from "../components/ui/MotivationalVisibility";

const siteUrl = "https://mauri-results.vercel.app";

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MauriResults",
  title: {
    default: "نتائج البكالوريا وابريفه والكونكور في موريتانيا 2026 | MauriResults",
    template: "%s | MauriResults",
  },
  description:
    "MauriResults منصة موريتانية سريعة للبحث عن نتائج البكالوريا وابريفه والكونكور والامتياز 2026 بالاسم أو رقم المترشح، ومتابعة نتائج Mauri Bac في موريتانيا.",
  keywords: [
    "MauriResults",
    "Mauri Results",
    "Mauri Bac",
    "MauriBAC",
    "نتائج موريتانيا",
    "نتائج البكالوريا موريتانيا",
    "نتائج البكالوريا موريتانيا 2026",
    "نتائج ابريفه موريتانيا",
    "نتائج ابريفه 2026",
    "نتائج كونكور موريتانيا",
    "نتائج الكونكور 2026",
    "نتائج الامتياز موريتانيا",
    "نتائج المسابقات الوطنية في موريتانيا",
    "Resultats Bac Mauritanie",
    "Résultats Bac Mauritanie",
    "Résultats Concours Mauritanie",
    "Bac Mauritanie 2026",
    "Concours Mauritanie 2026",
  ],
  authors: [{ name: "Ahmed abdellahi mady" }],
  creator: "Ahmed abdellahi mady",
  publisher: "MauriResults",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: siteUrl,
    languages: {
      "ar-MR": siteUrl,
      "fr-MR": siteUrl,
    },
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
    title: "نتائج البكالوريا وابريفه والكونكور في موريتانيا | MauriResults",
    description:
      "ابحث بسرعة عن نتائج البكالوريا وابريفه والكونكور والامتياز في موريتانيا عبر MauriResults.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "MauriResults - نتائج موريتانيا",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "نتائج البكالوريا وابريفه والكونكور في موريتانيا | MauriResults",
    description: "بحث سريع عن نتائج المسابقات الوطنية في موريتانيا.",
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
    alternateName: ["Mauri Results", "Mauri Bac"],
    url: siteUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web, Android, iOS",
    inLanguage: ["ar-MR", "fr-MR"],
    description:
      "منصة موريتانية للبحث عن نتائج البكالوريا وابريفه والكونكور والامتياز.",
    creator: {
      "@type": "Person",
      name: "Ahmed abdellahi mady",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="ar" dir="rtl" className="dark" data-theme="dark" suppressHydrationWarning>
      <body className="font-arabic antialiased" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitializer }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <div className="results-notice" role="status" aria-live="polite">
          <span className="results-notice-dot" aria-hidden="true" />
          <span>نتائج ابريفه وكونكور 2026 نعمل على إضافتها، وستكون متاحة بعد لحظات</span>
        </div>
        <AppRuntimeShell />
        <UiEnhancements />
        <MotivationalVisibility />
        <UploadedConcoursSelectEnhancer />
        <ForgotCandidateNumber />
        <BacTopperTrackOrder />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
