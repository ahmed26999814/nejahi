"use client";

import { useEffect, useState } from "react";
import { contentValue } from "../common/content";
import { CodeIcon, MessageIcon } from "../common/icons";
import { isNativeAppRuntime, isStandaloneMode } from "../../lib/runtimeEnvironment";
import DeveloperModal from "./DeveloperModal";
import VisitorCounter from "./VisitorCounter";
import OnlineUsersCounter from "./OnlineUsersCounter";

export default function Footer({ content = {}, onNavigate, text }) {
  const [developerOpen, setDeveloperOpen] = useState(false);
  const [appMode, setAppMode] = useState(null);
  const footerBanner = contentValue(content, "footer_banner");
  const showVisitors = contentValue(content, "ui_show_visitors", "true") !== "false";
  const showOnline = contentValue(content, "ui_show_online", "true") !== "false";
  const isApp = appMode === true;
  const isWeb = appMode === false;

  useEffect(() => {
    setAppMode(isNativeAppRuntime() || isStandaloneMode());
  }, []);

  return (
    <footer id="developer" className={`app-shell ${isApp ? "py-3" : "py-5 md:py-8"}`}>
      <section className="premium-footer compact-home-footer">
        {footerBanner && isWeb && <img className="footer-banner-image" src={footerBanner} alt="" loading="lazy" />}

        <div className="footer-actions footer-actions-compact">
          <button className="footer-action-card footer-action-developer" onClick={() => setDeveloperOpen(true)} type="button">
            <span className="footer-action-icon"><CodeIcon /></span>
            <span className="min-w-0 text-start">
              <strong>الإعداد والتطوير</strong>
              {isWeb && <small>معلومات مطوّر المنصة</small>}
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">←</span>}
          </button>

          <button className="footer-action-card footer-action-contact" onClick={() => onNavigate?.("contact")} type="button">
            <span className="footer-action-icon"><MessageIcon /></span>
            <span className="min-w-0 text-start">
              <strong>اتصل بنا</strong>
              {isWeb && <small>المساعدة والملاحظات</small>}
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">←</span>}
          </button>
        </div>

        {(showVisitors || showOnline) && (
          <div className="site-live-counters">
            {showVisitors && <VisitorCounter />}
            {showOnline && <OnlineUsersCounter />}
          </div>
        )}

        {isWeb && (
          <div className="mt-4 border-t border-mauri-border/70 pt-3 text-center text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
            <span>© {new Date().getFullYear()} MauriResults</span>
          </div>
        )}
      </section>
      {developerOpen && <DeveloperModal content={content} onClose={() => setDeveloperOpen(false)} text={text} />}
    </footer>
  );
}
