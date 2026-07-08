"use client";

import { useState } from "react";
import { contentValue } from "../common/content";
import { CodeIcon } from "../common/icons";
import DeveloperModal from "./DeveloperModal";
import FooterInfoPanel from "./FooterInfoPanel";

export default function Footer({ content = {}, text }) {
  const [developerOpen, setDeveloperOpen] = useState(false);
  const footerBanner = contentValue(content, "footer_banner");
  const whatsappNumber = "32965875";
  const facebookUrl = "https://www.facebook.com/profile.php?id=61591701182537";

  return (
    <footer id="developer" className="app-shell py-6 md:py-10">
      <section className="premium-footer">
        {footerBanner && <img className="footer-banner-image" src={footerBanner} alt="" loading="lazy" />}
        <div className="grid gap-5 lg:grid-cols-[1fr_.9fr_.8fr]">
          <FooterInfoPanel content={content} text={text} />

          <div className="rounded-[26px] border border-white/70 bg-white/70 p-4 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/10">
            <h3 className="text-sm font-black text-slate-950 dark:text-white">اتصل بنا</h3>
            <p className="mt-1 text-xs font-bold leading-6 text-slate-500 dark:text-slate-300">للتواصل، الشراكات، أو ملاحظات حول النتائج.</p>
            <div className="mt-3 grid gap-2">
              <a className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700 transition hover:-translate-y-0.5 dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200" href={`https://wa.me/222${whatsappNumber}`} target="_blank" rel="noopener">
                واتساب: {whatsappNumber}
              </a>
              <a className="rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-black text-blue-700 transition hover:-translate-y-0.5 dark:border-blue-300/20 dark:bg-blue-300/10 dark:text-blue-200" href={facebookUrl} target="_blank" rel="noopener">
                صفحتنا على فيسبوك
              </a>
            </div>
          </div>

          <div className="flex items-start lg:justify-end">
            <button className="group inline-flex items-center gap-2 rounded-full border border-mauri-green/20 bg-mauri-green/10 px-4 py-2.5 text-sm font-black text-mauri-green shadow-soft transition hover:-translate-y-0.5 hover:bg-mauri-green hover:text-white dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-200" onClick={() => setDeveloperOpen(true)} type="button">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-mauri-green shadow-sm transition group-hover:bg-white/95"><CodeIcon /></span>
              الإعداد والتطوير
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
