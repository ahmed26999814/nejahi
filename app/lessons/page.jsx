import LessonsAndExams from "./LessonsAndExams";

const url = "https://mauri-results.vercel.app/lessons";

export const metadata = {
  title: "الدروس ومواضيع الامتحانات",
  description: "تصفح الكتب المدرسية ومواضيع الامتحانات ومجلدات المراجع التعليمية الإضافية للباكالوريا وابريفه وكونكور عبر MauriResults.",
  alternates: { canonical: url },
  openGraph: {
    title: "الدروس ومواضيع الامتحانات | MauriResults",
    description: "كتب ودروس ومواضيع امتحانات وطنية مع الحلول، منظمة في قسم واحد.",
    url,
    type: "website",
    images: ["/logo.png"],
  },
};

export default async function LessonsPage({ searchParams }) {
  const params = await searchParams;
  const initialTab = ["exams", "resources"].includes(params?.tab) ? params.tab : "lessons";
  return <LessonsAndExams initialTab={initialTab} />;
}
