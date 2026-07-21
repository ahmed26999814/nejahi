import { permanentRedirect } from "next/navigation";

export const metadata = {
  title: "الدروس ومواضيع الامتحانات",
  description: "انتقل إلى قسم الدروس ومواضيع الامتحانات في MauriResults.",
  alternates: { canonical: "/lessons" },
  robots: { index: false, follow: true },
};

export default function DocumentsPage() {
  permanentRedirect("/lessons?tab=exams");
}
