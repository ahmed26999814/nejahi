import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./result-polish.css";
import "./footer-contact-polish.css";
import "./navigation-topper-fixes.css";
import "./footer-dark-fix.css";
import "./exam-card-polish.css";
import "./online-counter.css";
import "./forgot-number.css";
import "./dashboard-reference.css";
import "./dashboard-mobile.css";
import UiEnhancements from "../components/ui/UiEnhancements";
import AdminPublishedLabelCleaner from "../components/ui/AdminPublishedLabelCleaner";
import UploadedConcoursSelectEnhancer from "../components/ui/UploadedConcoursSelectEnhancer";
import PublishedExamCardEnhancer from "../components/ui/PublishedExamCardEnhancer";
import ForgotCandidateNumber from "../components/ui/ForgotCandidateNumber";
import BacTopperTrackOrder from "../components/ui/BacTopperTrackOrder";
import MotivationalVisibility from "../components/ui/MotivationalVisibility";

const siteUrl = "https://mauri-results.vercel.app";

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MauriResults",
  title: {
    default: "MauriResults | نتائج البكالوريا والكونكور وأبريفه في موريتانيا",
    template: "%s | MauriResults",
  },
  description: "ابحث بسرعة عن نتائج البكالوريا، الكونكور، أبريفه، والامتياز في موريتانيا عبر منصة MauriResults المهيأة للهاتف والضغط العالي.",
  keywords: [
    "نتائج موريتانيا",
    "نتائج باكالوريا موريتانيا",
    "نتائج البكالوريا موريتانيا 2026",
    "نتائج كونكور موريتانيا",
    "نتائج الكونكور 2026",
    "نتائج أبريفه موريتانيا",
    "نتائج البريفيه موريتانيا",
    "نتائج المسابقات الوطنية في موريتانيا",
    "MauriResults",
    "Résultats Mauritanie",
    "Résultats Bac Mauritanie",
    "Résultats Concours Mauritanie",
    "Bac Mauritanie",
    "Concours Mauritanie",
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
    title: "MauriResults | نتائج المسابقات الوطنية في موريتانيا",
    description: "منصة سريعة للبحث عن نتائج البكالوريا والكونكور وأبريفه في موريتانيا.",
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
    title: "MauriResults | نتائج البكالوريا والكونكور في موريتانيا",
    description: "بحث سريع عن نتائج المسابقات الوطنية في موريتانيا.",
    images: ["/logo.png"],
  },
  appleWebApp: {
    capable: true,
    title: "MauriResults",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAF8" },
    { media: "(prefers-color-scheme: dark)", color: "#07130d" },
  ],
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "MauriResults",
    url: siteUrl,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    inLanguage: ["ar-MR", "fr-MR"],
    description: "منصة نتائج المسابقات الوطنية في موريتانيا.",
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
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-arabic antialiased">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <UiEnhancements />
        <MotivationalVisibility />
        <AdminPublishedLabelCleaner />
        <UploadedConcoursSelectEnhancer />
        <PublishedExamCardEnhancer />
        <ForgotCandidateNumber />
        <BacTopperTrackOrder />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
