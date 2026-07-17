import IntegratedSectionShell from "../../components/layout/IntegratedSectionShell";

const siteUrl = "https://mauriresults.vercel.app";

export const metadata = {
  title: "حاسبة معدل الباك وابريفه في موريتانيا",
  description: "حاسبة سريعة لمعدل البكالوريا وابريفه في موريتانيا حسب معاملات الشعب، مع تقدير حالة النجاح أو الدورة التكميلية.",
  keywords: ["حاسبة معدل الباك موريتانيا", "حساب معدل البكالوريا", "حاسبة ابريفه", "معاملات الباك موريتانيا", "MauriResults"],
  alternates: { canonical: `${siteUrl}/calculator` },
};

export default function CalculatorLayout({ children }) {
  return (
    <IntegratedSectionShell active="/calculator">
      <div className="calculator-route">
        <style>{`
          .calculator-route .average-calculator-page{padding-top:1.2rem;background:linear-gradient(180deg,#f8faf8 0%,#eef6f1 100%)}
          .calculator-route .calculator-heading{border-color:rgba(20,99,63,.18);background:linear-gradient(135deg,rgba(255,255,255,.98),rgba(236,248,241,.96))}
          .calculator-route .calculator-card{background:#fff;border-color:rgba(20,99,63,.14)}
          .dark .calculator-route .average-calculator-page{background:linear-gradient(180deg,#07130d 0%,#0a1710 100%);color:#f8fafc}
          .dark .calculator-route .calculator-heading,
          .dark .calculator-route .calculator-card,
          .dark .calculator-route .calculator-subject-row{background:#12231a!important;border-color:#294337!important;color:#f8fafc!important}
          .dark .calculator-route .calculator-heading{background:linear-gradient(135deg,#153122,#10261a)!important}
          .dark .calculator-route .calculator-heading h1,
          .dark .calculator-route .calculator-card-title h2,
          .dark .calculator-route .calculator-subject-name,
          .dark .calculator-route .calculator-card-title>strong{color:#f8fafc!important}
          .dark .calculator-route .calculator-heading p,
          .dark .calculator-route .calculator-heading div>span,
          .dark .calculator-route .calculator-card-title span,
          .dark .calculator-route .calculator-table-head,
          .dark .calculator-route .calculator-note,
          .dark .calculator-route .calculator-score-field em{color:#c0cdc5!important}
          .dark .calculator-route .calculator-card-title>strong{background:#1b3a29!important}
          .dark .calculator-route .calculator-subject-row{box-shadow:0 8px 20px rgba(0,0,0,.16)!important}
          .dark .calculator-route .calculator-score-field{background:#0d1b13!important;border-color:#365241!important}
          .dark .calculator-route .calculator-score-field input{color:#fff!important}
          .dark .calculator-route .calculator-score-field input::placeholder{color:#aebbb3!important}
          .dark .calculator-route .calculator-coefficient{color:#55df91!important}
          .dark .calculator-route .calculator-track-tabs button{background:#263b30!important;border-color:#3b5848!important;color:#edf7f1!important}
          .dark .calculator-route .calculator-track-tabs button.is-active{background:#168a4d!important;border-color:#26a864!important;color:#fff!important}
          .dark .calculator-route .calculator-submit{background:#168a4d!important;color:#fff!important}
          .dark .calculator-route .calculator-sport-option{background:#2b2413!important;border-color:#6e5b25!important;color:#f5e7ba!important}
          .dark .calculator-route .calculator-sport-option small{color:#dbc77f!important}
          .dark .calculator-route .calculator-home-link{color:#55df91!important}
          @media(max-width:560px){.calculator-route .average-calculator-page{padding-inline:.6rem}.calculator-route .calculator-heading h1{color:#0f5132}.dark .calculator-route .calculator-heading h1{color:#fff!important}}
        `}</style>
        {children}
      </div>
    </IntegratedSectionShell>
  );
}
