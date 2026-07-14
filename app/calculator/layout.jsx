import IntegratedSectionShell from "../../components/layout/IntegratedSectionShell";

const siteUrl = "https://mauri-results.vercel.app";

export const metadata = {
  title: "حاسبة معدل الباك والبريفيه في موريتانيا",
  description: "حاسبة سريعة لمعدل البكالوريا والبريفيه في موريتانيا حسب معاملات الشعب، مع تقدير حالة النجاح أو الدورة التكميلية.",
  keywords: ["حاسبة معدل الباك موريتانيا", "حساب معدل البكالوريا", "حاسبة البريفيه", "معاملات الباك موريتانيا", "MauriResults"],
  alternates: { canonical: `${siteUrl}/calculator` },
};

export default function CalculatorLayout({ children }) {
  return (
    <IntegratedSectionShell active="/calculator">
      <div className="calculator-route">
        <style>{`.calculator-route .average-calculator-page{padding-top:1.2rem;background:linear-gradient(180deg,#f8faf8 0%,#eef6f1 100%)}.calculator-route .calculator-heading{border-color:rgba(20,99,63,.18);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(236,248,241,.96))}.calculator-route .calculator-card{background:#fff;border-color:rgba(20,99,63,.14)}.dark .calculator-route .average-calculator-page{background:linear-gradient(180deg,#07130d 0%,#0b1b12 100%)}`}</style>
        {children}
      </div>
    </IntegratedSectionShell>
  );
}
