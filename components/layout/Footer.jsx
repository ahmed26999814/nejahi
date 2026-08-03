"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { contentValue } from "../common/content";
import { CodeIcon, MessageIcon } from "../common/icons";
import { isNativeAppRuntime, isStandaloneMode } from "../../lib/runtimeEnvironment";
import DeveloperModal from "./DeveloperModal";
import VisitorCounter from "./VisitorCounter";
import OnlineUsersCounter from "./OnlineUsersCounter";

const WHATSAPP_GROUP_URL = "https://chat.whatsapp.com/GN6CJ4edITnJqVfaV5rYuI?s=cl&p=a&ilr=0&amv=3";

export default function Footer({ content = {}, onNavigate, text }) {
  const [developerOpen, setDeveloperOpen] = useState(false);
  const [appMode, setAppMode] = useState(null);
  const isFrench = text?.home === "Accueil";
  const lang = isFrench ? "fr" : "ar";
  const labels = isFrench
    ? {
        developer: "Conception et développement",
        contact: "Nous contacter",
        contactHelp: "Assistance et remarques",
        whatsappGroup: "Groupe WhatsApp du site",
        whatsappGroupDesc: "Alertes des résultats et actualités",
        suggest: "Proposer une idée",
        suggestDesc: "Partagez une idée pour améliorer le site",
        suggestAria: "Proposer une idée via WhatsApp",
        platformLinks: "Liens de la plateforme",
        about: "À propos de MauriResults",
        toppers: "Lauréats",
        statistics: "Statistiques",
        lessons: "Cours",
        calculator: "Calculateur de moyenne",
        suggestionMessage: "Bonjour, j’ai une suggestion pour le site MauriResults",
      }
    : {
        developer: "الإعداد والتطوير",
        contact: "اتصل بنا",
        contactHelp: "المساعدة والملاحظات",
        whatsappGroup: "مجموعة الموقع على واتساب",
        whatsappGroupDesc: "تنبيهات النتائج وآخر الأخبار",
        suggest: "اقترح لنا",
        suggestDesc: "شاركنا فكرتك لتطوير الموقع",
        suggestAria: "اقترح لنا عبر واتساب",
        platformLinks: "روابط المنصة",
        about: "عن MauriResults",
        toppers: "الأوائل",
        statistics: "الإحصائيات",
        lessons: "الدروس",
        calculator: "حاسبة المعدل",
        suggestionMessage: "السلام عليكم، لدي اقتراح لموقع MauriResults",
      };
  const suggestionWhatsappUrl = `https://wa.me/22244881891?text=${encodeURIComponent(labels.suggestionMessage)}`;
  const footerBanner = contentValue(content, "footer_banner");
  const developerLabel = isFrench
    ? labels.developer
    : contentValue(content, "ui_label_developer", labels.developer);
  const developerName = contentValue(content, "developer_name", "Ahmed abdellahi mady");
  const showVisitors = contentValue(content, "ui_show_visitors", "true") !== "false";
  const showOnline = contentValue(content, "ui_show_online", "true") !== "false";
  const isApp = appMode === true;
  const isWeb = appMode === false;
  const arrow = isFrench ? "→" : "←";

  useEffect(() => {
    setAppMode(isNativeAppRuntime() || isStandaloneMode());
  }, []);

  return (
    <footer id="developer" className={`app-shell ${isApp ? "py-3" : "py-5 md:py-8"}`} data-control-key="footer">
      <section className="premium-footer compact-home-footer">
        {footerBanner && isWeb && <img className="footer-banner-image" src={footerBanner} alt="" loading="lazy" />}

        <div className="footer-actions footer-actions-compact">
          <button className="footer-action-card footer-action-developer active:scale-[.98]" onClick={() => setDeveloperOpen(true)} type="button" data-control-key="developer" data-haptic>
            <span className="footer-action-icon"><CodeIcon /></span>
            <span className="min-w-0 text-start">
              <strong data-control-label>{developerLabel}</strong>
              <small>{developerName}</small>
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">{arrow}</span>}
          </button>

          <button className="footer-action-card footer-action-contact active:scale-[.98]" onClick={() => onNavigate?.("contact")} type="button" data-control-key="contact" data-haptic>
            <span className="footer-action-icon"><MessageIcon /></span>
            <span className="min-w-0 text-start">
              <strong data-control-label>{labels.contact}</strong>
              {isWeb && <small>{labels.contactHelp}</small>}
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">{arrow}</span>}
          </button>

          <a
            className="footer-action-card footer-action-whatsapp active:scale-[.98]"
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            data-haptic
          >
            <span className="footer-action-icon"><MessageIcon /></span>
            <span className="min-w-0 text-start">
              <strong>{labels.whatsappGroup}</strong>
              {isWeb && <small>{labels.whatsappGroupDesc}</small>}
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">{arrow}</span>}
          </a>

          <a
            className="footer-action-card footer-action-whatsapp footer-action-suggestion active:scale-[.98]"
            href={suggestionWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={labels.suggestAria}
            data-haptic
          >
            <span className="footer-action-icon"><MessageIcon /></span>
            <span className="min-w-0 text-start">
              <strong>{labels.suggest}</strong>
              {isWeb && <small>{labels.suggestDesc}</small>}
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">{arrow}</span>}
          </a>
        </div>

        {(showVisitors || showOnline) && (
          <div className="site-live-counters">
            {showVisitors && <VisitorCounter lang={lang} />}
            {showOnline && <OnlineUsersCounter lang={lang} />}
          </div>
        )}

        {isWeb && (
          <div className="mt-4 border-t border-white/15 pt-3 text-center text-xs font-bold text-white/75">
            <nav className="footer-seo-links" aria-label={labels.platformLinks}>
              <Link href="/about">{labels.about}</Link>
              <Link href="/toppers">{labels.toppers}</Link>
              <Link href="/statistics">{labels.statistics}</Link>
              <Link href="/lessons">{labels.lessons}</Link>
              <Link href="/calculator">{labels.calculator}</Link>
            </nav>
            <span>© {new Date().getFullYear()} MauriResults</span>
          </div>
        )}
      </section>
      {developerOpen && <DeveloperModal content={content} onClose={() => setDeveloperOpen(false)} text={text} />}
    </footer>
  );
}
