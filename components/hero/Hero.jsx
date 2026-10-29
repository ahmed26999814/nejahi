import LogoMark from "../common/LogoMark";

export default function Hero({ title, description, eyebrow = "MauriResults", logo = "/brand-logo.svg", lang = "ar" }) {
  const french = lang === "fr";
  return (
    <section className="results-hero" dir={french ? "ltr" : "rtl"}>
      <div className="results-hero-copy">
        <p className="results-hero-eyebrow"><span aria-hidden="true" />{french ? "Les résultats nationaux, simplement" : "نتائج المسابقات الوطنية، بكل سهولة"}</p>
        <h1>{title}</h1>
        {description && <p className="results-hero-description">{description}</p>}
        <a href="#quick-search" className="results-hero-cta">{french ? "Rechercher mon résultat" : "ابحث عن نتيجتك"}<span aria-hidden="true">{french ? "→" : "←"}</span></a>
        <p className="results-hero-note">{french ? "Gratuit · Sans inscription · Sur tous vos appareils" : "مجاني · دون تسجيل · من هاتفك أو حاسوبك"}</p>
      </div>
      <div className="results-hero-brand" aria-hidden="true">
        <LogoMark className="results-hero-logo" src={logo} />
        <strong dir="ltr">{eyebrow}</strong>
        <span>{french ? "Votre parcours commence ici" : "خطوتك التالية تبدأ هنا"}</span>
      </div>
    </section>
  );
}
