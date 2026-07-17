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
const SUGGESTION_WHATSAPP_URL = `https://wa.me/22244881891?text=${encodeURIComponent("السلام عليكم، لدي اقتراح لموقع MauriResults")}`;

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
    <footer id="developer" className={`app-shell ${isApp ? "py-3" : "py-5 md:py-8"}`} data-control-key="footer">
      <section className="premium-footer compact-home-footer">
        {footerBanner && isWeb && <img className="footer-banner-image" src={footerBanner} alt="" loading="lazy" />}

        <div className="footer-actions footer-actions-compact">
          <button className="footer-action-card footer-action-developer active:scale-[.98]" onClick={() => setDeveloperOpen(true)} type="button" data-control-key="developer" data-haptic>
            <span className="footer-action-icon"><CodeIcon /></span>
            <span className="min-w-0 text-start">
              <strong data-control-label>الإعداد والتطوير</strong>
              {isWeb && <small>معلومات مطوّر المنصة</small>}
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">←</span>}
          </button>

          <button className="footer-action-card footer-action-contact active:scale-[.98]" onClick={() => onNavigate?.("contact")} type="button" data-control-key="contact" data-haptic>
            <span className="footer-action-icon"><MessageIcon /></span>
            <span className="min-w-0 text-start">
              <strong data-control-label>اتصل بنا</strong>
              {isWeb && <small>المساعدة والملاحظات</small>}
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">←</span>}
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
              <strong>مجموعة الموقع على واتساب</strong>
              {isWeb && <small>تنبيهات النتائج وآخر الأخبار</small>}
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">←</span>}
          </a>

          <a
            className="footer-action-card footer-action-whatsapp footer-action-suggestion active:scale-[.98]"
            href={SUGGESTION_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="اقترح لنا عبر واتساب"
            data-haptic
          >
            <span className="footer-action-icon"><MessageIcon /></span>
            <span className="min-w-0 text-start">
              <strong>اقترح لنا</strong>
              {isWeb && <small>شاركنا فكرتك لتطوير الموقع</small>}
            </span>
            {isWeb && <span className="footer-action-arrow" aria-hidden="true">←</span>}
          </a>
        </div>

        {(showVisitors || showOnline) && (
          <div className="site-live-counters">
            {showVisitors && <VisitorCounter />}
            {showOnline && <OnlineUsersCounter />}
          </div>
        )}

        {isWeb && (
          <div className="mt-4 border-t border-mauri-border/70 pt-3 text-center text-xs font-bold text-slate-500 dark:border-white/10 dark:text-slate-400">
            <nav className="footer-seo-links" aria-label="روابط المنصة">
              <Link href="/toppers">الأوائل</Link>
              <Link href="/statistics">الإحصائيات</Link>
              <Link href="/lessons">الدروس</Link>
              <Link href="/calculator">حاسبة المعدل</Link>
            </nav>
            <span>© {new Date().getFullYear()} MauriResults</span>
          </div>
        )}
      </section>
      {developerOpen && <DeveloperModal content={content} onClose={() => setDeveloperOpen(false)} text={text} />}
    </footer>
  );
}
