"use client";

import { useState } from "react";
import { contentValue } from "../common/content";
import { CodeIcon } from "../common/icons";
import DeveloperModal from "./DeveloperModal";
import FooterInfoPanel from "./FooterInfoPanel";
import FooterLinks from "./FooterLinks";

export default function Footer({ content = {}, onNavigate, text }) {
  const [developerOpen, setDeveloperOpen] = useState(false);
  const footerBanner = contentValue(content, "footer_banner");

  return (
    <footer id="developer" className="app-shell py-6 md:py-10">
      <section className="premium-footer">
        {footerBanner && <img className="footer-banner-image" src={footerBanner} alt="" loading="lazy" />}
        <div className="grid gap-6 lg:grid-cols-[1.1fr_.8fr_.7fr]">
          <FooterInfoPanel content={content} text={text} />
          <div>
            <h3 className="mb-3 text-sm font-black text-slate-950 dark:text-white">روابط سريعة</h3>
            <FooterLinks onNavigate={onNavigate} text={text} />
          </div>
          <div className="flex items-start lg:justify-end">
            <button className="developer-button" onClick={() => setDeveloperOpen(true)} type="button">
              <CodeIcon />
              {text.aboutDeveloper || text.preparedBy}
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
