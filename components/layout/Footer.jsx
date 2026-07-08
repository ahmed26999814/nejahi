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

          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            <button className="group inline-flex items-center gap-2 rounded-full border border-mauri-green/20 bg-mauri-green/10 px-3.5 py-2 text-xs font-black text-mauri-green shadow-soft transition hover:-translate-y-0.5 hover:bg-mauri-green hover:text-white dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200" onClick={() => setDeveloperOpen(true)} type="button">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-mauri-green shadow-sm transition group-hover:bg-white/95"><CodeIcon /></span>
              الإعداد والتطوير
            </button>
            <button className="group inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-black text-blue-700 shadow-soft transition hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white dark:border-blue-300/20 dark:bg-blue-300/10 dark:text-blue-200" onClick={() => onNavigate?.("contact")} type="button">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-white text-blue-600 shadow-sm transition group-hover:bg-white/95"><MessageIcon /></span>
              اتصل بنا
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
