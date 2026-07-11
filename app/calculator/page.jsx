import AverageCalculator from "../../components/calculator/AverageCalculator";
import "./calculator.css";

export const metadata = {
  title: "حاسبة معدل الباك وأبريفه في موريتانيا",
  description: "احسب معدل الباكالوريا أو أبريفه في موريتانيا حسب معاملات الشعبة بسهولة من الهاتف.",
  alternates: { canonical: "https://mauri-results.vercel.app/calculator" },
};

export default function CalculatorPage() {
  return <AverageCalculator />;
}
