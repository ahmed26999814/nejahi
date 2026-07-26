import SpecialtyGuideExplorer from "../../components/orientation/SpecialtyGuideExplorer";

export const dynamic = "force-static";

export const metadata = {
  title: "دليل التخصصات والتوجيه الجامعي",
  description:
    "ابحث عن أي تخصص جامعي واعرف ما الذي ستدرسه والمهارات المطلوبة وفرص العمل والجهات التي توفره وآخر معدلات التوجيه المسجلة.",
  alternates: {
    canonical: "/orientation",
  },
  openGraph: {
    title: "دليل التخصصات الجامعية | MauriResults",
    description: "اكتب اسم أي تخصص واحصل على شرح مبسط قبل ترتيب رغبات التوجيه.",
    url: "/orientation",
    type: "website",
  },
};

export default function OrientationPage() {
  return <SpecialtyGuideExplorer />;
}
