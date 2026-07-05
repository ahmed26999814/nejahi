import "./globals.css";

export const metadata = {
  title: "MauriResults | نتائج المسابقات الوطنية في موريتانيا",
  description: "MauriResults منصة موريتانية حديثة وسريعة لعرض نتائج البكالوريا والبريفيه والكونكور ومسابقات الامتياز.",
  keywords: [
    "نتائج البكالوريا موريتانيا",
    "Bac Mauritanie",
    "MauriResults",
    "نتائج البريفيه موريتانيا",
    "نتائج الكونكور موريتانيا",
    "Résultats BAC Mauritanie",
  ],
  openGraph: {
    title: "MauriResults | نتائج المسابقات الوطنية في موريتانيا",
    description: "ابحث عن نتيجتك خلال ثوان في منصة موريتانية حديثة وسريعة.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body className="font-arabic antialiased">{children}</body>
    </html>
  );
}
