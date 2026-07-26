import SpecialtyGuideExplorer from "../../components/orientation/SpecialtyGuideExplorer";

export const dynamic = "force-static";

export const metadata = {
  title: "دليل التخصصات والتوجيه الجامعي",
  description:
    "ابحث عن التخصص بالعربية أو الفرنسية واعرف تعريفه والكلية أو المعهد والمواد التي تدرس عادة وآفاقه المستقبلية وآخر معدلات التوجيه.",
  alternates: {
    canonical: "/orientation",
  },
  openGraph: {
    title: "دليل التخصصات الجامعية | MauriResults",
    description: "ابحث بالعربية أو الفرنسية واعرف التخصص ومواده وآفاقه المستقبلية.",
    url: "/orientation",
    type: "website",
  },
};

export default function OrientationPage() {
  return <SpecialtyGuideExplorer />;
}
