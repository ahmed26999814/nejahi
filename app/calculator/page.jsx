import AverageCalculator from "../../components/calculator/AverageCalculator";
import "./calculator.css";
import "./result-status.css";

export const metadata = {
  title: "حاسبة معدل الباك وابريفه في موريتانيا",
  description: "احسب معدل البكالوريا أو ابريفه في موريتانيا حسب معاملات المواد، واعرف تقدير النجاح أو الدورة التكميلية بسرعة.",
  alternates: { canonical: "https://mauriresults.vercel.app/calculator" },
  openGraph: {
    title: "حاسبة معدل الباك وابريفه | MauriResults",
    description: "حاسبة سريعة لمعدلات البكالوريا وابريفه في موريتانيا حسب معاملات الشعب.",
    url: "https://mauriresults.vercel.app/calculator",
    type: "website",
    images: ["/logo.png"],
  },
};

export default function CalculatorPage() {
  return <AverageCalculator />;
}
