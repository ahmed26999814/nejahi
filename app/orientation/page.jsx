import OrientationExplorer from "../../components/orientation/OrientationExplorer";

export const metadata = {
  title: "دليل التوجيه الجامعي والتخصصات",
  description:
    "اكتشف التخصصات المناسبة لشعبة الباكالوريا ومعدلك، وقارن بين عروض التوجيه الجامعي في موريتانيا والبعثات الخارجية.",
  alternates: {
    canonical: "/orientation",
  },
  openGraph: {
    title: "دليل التوجيه الجامعي | MauriResults",
    description: "اعرف التخصصات المناسبة لشعبتك ومعدلك قبل ترتيب رغباتك.",
    url: "/orientation",
    type: "website",
  },
};

export default function OrientationPage() {
  return <OrientationExplorer />;
}
