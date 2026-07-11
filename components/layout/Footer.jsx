"use client";

import { useState } from "react";
import { contentValue } from "../common/content";
import { CodeIcon, MessageIcon } from "../common/icons";
import DeveloperModal from "./DeveloperModal";
import FooterInfoPanel from "./FooterInfoPanel";

export default function Footer({ content = {}, onNavigate, text }) {
  const [developerOpen, setDeveloperOpen] = useState(false);
  const footerBanner = contentValue(content, "footer_banner");

  return (
    <footer id="developer" className="app-shell py-6 md:py-10">
      <section className="premium-footer">
        {footerBanner && <img className="footer-banner-image" src={footerBanner} alt="" loading="lazy" />}
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <FooterInfoPanel content={content} text={text} />

          <div className="footer-actions">
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
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-mauri-border/70 pt-4 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>{text.rights}</span>
          <span>© {new Date().getFullYear()} MauriResults</span>
        </div>
      </section>
      {developerOpen && <DeveloperModal content={content} onClose={() => setDeveloperOpen(false)} text={text} />}
    </footer>
  );
}
