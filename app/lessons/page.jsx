import LessonsExplorer from "./LessonsExplorer";

const url = "https://mauri-results.vercel.app/lessons";

export const metadata = {
  title: "الدروس والملخصات التعليمية في موريتانيا",
  description: "تصفح الدروس والملخصات والملفات التعليمية للطلاب في موريتانيا عبر MauriResults من الهاتف بسرعة.",
  alternates: { canonical: url },
  openGraph: {
    title: "الدروس والملخصات التعليمية | MauriResults",
    description: "دروس وملخصات تعليمية منظمة للطلاب في موريتانيا.",
    url,
    type: "website",
    images: ["/logo.png"],
  },
};

export default function LessonsPage() {
  return <LessonsExplorer />;
}
