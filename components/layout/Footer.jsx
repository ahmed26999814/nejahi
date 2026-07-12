"use client";

import { useState } from "react";
import { contentValue } from "../common/content";
import { CodeIcon, MessageIcon } from "../common/icons";
import DeveloperModal from "./DeveloperModal";
import VisitorCounter from "./VisitorCounter";

export default function Footer({ content = {}, onNavigate, text }) {
  const [developerOpen, setDeveloperOpen] = useState(false);
  const footerBanner = contentValue(content, "footer_banner");
  const showVisitors = contentValue(content, "ui_show_visitors", "true") !== "false";

  return (
    <footer id="developer" className="app-shell py-5 md:py-8">
      <section className="premium-footer compact-home-footer">
        {footerBanner && <img className="footer-banner-image" src={footerBanner} alt="" loading="lazy" />}

        <div className="footer-actions footer-actions-compact">
          <button className="footer-action-card footer-action-developer" onClick={() => setDeveloperOpen(true)} type="button">
            <span className="footer-action-icon"><CodeIcon /></span>
            <span className="min-w-0 text-start">
              <strong>الإعداد والتطوير</strong>
              <small>معلومات مطوّر المنصة</small>
            </span>
            <span className="footer-action-arrow" aria-hidden="true">←</span>
          </button>

          <button className="footer-action-card footer-action-contact" onClick={() => onNavigate?.("contact")} type="button">
            <span className="footer-action-icon"><MessageIcon /></span>
            <span className="min-w-0 text-start">
              <strong>اتصل بنا</strong>
              <small>المساعدة والملاحظات</small>
            </span>
            <span className="footer-action-arrow" aria-hidden="true">←</span>
          </button>
        </div>

        {showVisitors && <VisitorCounter />}

        <div className="mt-4 flex flex-col gap-1.5 border-t border-mauri-border/70 pt-3 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>{text.rights}</span>
          <span>© {new Date().getFullYear()} MauriResults</span>
        </div>
      </section>
      {developerOpen && <DeveloperModal content={content} onClose={() => setDeveloperOpen(false)} text={text} />}
    </footer>
  );
}
