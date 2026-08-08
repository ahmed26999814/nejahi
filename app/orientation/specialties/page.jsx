import SpecialtyGuideExplorer from "../../../components/orientation/SpecialtyGuideExplorer";

export const dynamic = "force-static";

export const metadata = {
  title: "التخصصات والمواد الجامعية",
  description:
    "ابحث عن التخصص بالعربية أو الفرنسية واعرف تعريفه والكلية أو المعهد والمواد التي تدرس عادة وآفاقه المستقبلية وآخر معدلات التوجيه.",
  alternates: {
    canonical: "/orientation/specialties",
  },
  openGraph: {
    title: "التخصصات والمواد الجامعية | MauriResults",
    description: "ابحث بالعربية أو الفرنسية واعرف التخصص ومواده وآفاقه والكليات التي توفره.",
    url: "/orientation/specialties",
    type: "website",
  },
};

export default function OrientationSpecialtiesPage() {
  return <SpecialtyGuideExplorer />;
}
