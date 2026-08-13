import AverageCalculator from "../../components/calculator/AverageCalculator";
import "./calculator.css";
import "./result-status.css";

const canonical = "https://mauri-results.vercel.app/calculator";

export const metadata = {
  title: "حاسبة معدل الباك وابريفه في موريتانيا",
  description: "احسب معدل البكالوريا أو ابريفه في موريتانيا حسب معاملات المواد، واعرف تقدير النجاح أو الدورة التكميلية بسرعة.",
  alternates: { canonical },
  openGraph: {
    title: "حاسبة معدل الباك وابريفه | MauriResults",
    description: "حاسبة سريعة لمعدلات البكالوريا وابريفه في موريتانيا حسب معاملات الشعب.",
    url: canonical,
    type: "website",
    images: ["/logo.png"],
  },
};

export default function CalculatorPage() {
  return <AverageCalculator />;
}
