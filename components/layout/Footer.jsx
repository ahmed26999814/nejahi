"use client";

import { useState } from "react";
import LogoMark from "../common/LogoMark";
import { contentValue } from "../common/content";
import { CodeIcon } from "../common/icons";
import DeveloperModal from "./DeveloperModal";

export default function Footer({ content = {}, text }) {
  const [developerOpen, setDeveloperOpen] = useState(false);
  const footerBanner = contentValue(content, "footer_banner");

  return (
    <footer id="developer" className="app-shell py-6 md:py-10">
      <section className="premium-footer">
        {footerBanner && <img className="footer-banner-image" src={footerBanner} alt="" loading="lazy" />}
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-center gap-3">
            <LogoMark className="h-12 w-12 rounded-[18px]" src={contentValue(content, "logo", "/logo.png")} />
            <div className="min-w-0">
              <strong className="block text-lg font-black text-slate-950 dark:text-white">MauriResults</strong>
              <span className="text-sm font-bold text-slate-500 dark:text-slate-300">منصة نتائج وطنية</span>
            </div>
          </div>
          <button className="developer-button" onClick={() => setDeveloperOpen((value) => !value)} type="button">
            <CodeIcon />
            {text.aboutDeveloper || text.preparedBy}
          </button>
        </div>
        <div className="mt-5 flex flex-col gap-2 border-t border-mauri-border/70 pt-4 text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <span>{text.rights}</span>
          <span>© {new Date().getFullYear()} MauriResults</span>
        </div>
      </section>
      {developerOpen && <DeveloperModal content={content} onClose={() => setDeveloperOpen(false)} text={text} />}
    </footer>
  );
}
