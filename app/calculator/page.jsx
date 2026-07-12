import AverageCalculator from "../../components/calculator/AverageCalculator";
import "./calculator.css";
import "./result-status.css";

export const metadata = {
  title: "حاسبة المعدل | الباك وأبريفه في موريتانيا",
  description: "احسب معدل الباكالوريا أو أبريفه في موريتانيا واعرف حالة النجاح أو الدورة التكميلية حسب المعدل.",
  alternates: { canonical: "https://mauri-results.vercel.app/calculator" },
};

export default function CalculatorPage() {
  return <AverageCalculator />;
}
