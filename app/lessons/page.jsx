import LessonsAndExams from "./LessonsAndExams";

const url = "https://mauriresults.vercel.app/lessons";

export const metadata = {
  title: "الدروس ومواضيع الامتحانات",
  description: "تصفح الكتب والدروس المدرسية ومواضيع باكالوريا وابريفه وكونكور والامتياز مع الحلول والمذكرات والمراجع عبر MauriResults.",
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
  const initialTab = params?.tab === "exams" ? "exams" : "lessons";
  return <LessonsAndExams initialTab={initialTab} />;
}
