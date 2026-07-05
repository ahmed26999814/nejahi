import "./globals.css";

const siteUrl = "https://mauri-results.vercel.app";

export const metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: "MauriResults",
  title: {
    default: "MauriResults | نتائج المسابقات الوطنية في موريتانيا",
    template: "%s | MauriResults",
  },
  description: "منصة موريتانية حديثة وسريعة لعرض نتائج البكالوريا والبريفيه والكونكور ومسابقات الامتياز.",
  keywords: [
    "نتائج موريتانيا",
    "نتائج البكالوريا موريتانيا",
    "نتائج البريفيه موريتانيا",
    "نتائج الكونكور موريتانيا",
    "MauriResults",
    "Résultats Mauritanie",
    "Bac Mauritanie",
  ],
  authors: [{ name: "Ahmed abdellahi mady" }],
  creator: "Ahmed abdellahi mady",
  publisher: "MauriResults",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "ar_MR",
    url: siteUrl,
    siteName: "MauriResults",
    title: "MauriResults | نتائج المسابقات الوطنية في موريتانيا",
    description: "ابحث عن نتيجتك الرسمية بسرعة عبر منصة حديثة ومهيأة للهاتف.",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 1200,
        alt: "MauriResults",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MauriResults | نتائج المسابقات الوطنية في موريتانيا",
    description: "منصة نتائج وطنية سريعة وحديثة.",
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
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-arabic antialiased">{children}</body>
    </html>
  );
}
