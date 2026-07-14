import AverageCalculator from "../../components/calculator/AverageCalculator";
import "./calculator.css";
import "./result-status.css";

export const metadata = {
  title: "حاسبة معدل الباك والبريفيه في موريتانيا",
  description: "احسب معدل البكالوريا أو البريفيه في موريتانيا حسب معاملات المواد، واعرف تقدير النجاح أو الدورة التكميلية بسرعة.",
  alternates: { canonical: "https://mauri-results.vercel.app/calculator" },
  openGraph: {
    title: "حاسبة معدل الباك والبريفيه | MauriResults",
    description: "حاسبة سريعة لمعدلات البكالوريا والبريفيه في موريتانيا حسب معاملات الشعب.",
    url: "https://mauri-results.vercel.app/calculator",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function CalculatorPage() {
  return <AverageCalculator />;
}
