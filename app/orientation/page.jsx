import OrientationHub from "../../components/orientation/OrientationHub";
import { buildOrientationInstitutions, ORIENTATION_DIRECTORY_SOURCES } from "../../data/orientation-institutions";
import { orientationPrograms } from "../../data/orientation-programs";

export const dynamic = "force-static";

export const metadata = {
  title: "التوجيه الجامعي في موريتانيا",
  description:
    "دليل سريع للجامعات والمعاهد والكليات والتخصصات والمواد وآخر معدلات التوجيه، مع البحث في المؤسسات والتخصصات والمقارنة حسب شعبة الباك والمعدل.",
  alternates: {
    canonical: "/orientation",
  },
  openGraph: {
    title: "دليل التوجيه الجامعي | MauriResults",
    description: "استكشف الجامعات والمعاهد والكليات والتخصصات والمواد وآخر معدلات التوجيه في موريتانيا.",
    url: "/orientation",
    type: "website",
  },
};

const institutions = buildOrientationInstitutions(orientationPrograms);

export default function OrientationPage() {
  return <OrientationHub institutions={institutions} sources={ORIENTATION_DIRECTORY_SOURCES} />;
}
