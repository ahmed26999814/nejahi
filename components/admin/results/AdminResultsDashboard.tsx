"use client";

import { useState, type ReactNode } from "react";
import FastResultsUploadApplication from "./FastResultsUploadApplication";
import PublishedResultsManager from "./PublishedResultsManager";
import SiteControlPanel from "./SiteControlPanel";

type View = "home" | "publish" | "manage" | "site";

const ACTIONS: Array<{
  id: Exclude<View, "home">;
  title: string;
  description: string;
  badge: string;
  icon: ReactNode;
}> = [
  {
    id: "publish",
    title: "نشر نتائج جديدة",
    description: "رفع ملف Excel، تحديد الأعمدة ثم نشر النتائج في الموقع.",
    badge: "رفع ونشر",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>
    ),
  },
  {
    id: "manage",
    title: "إدارة النتائج المنشورة",
    description: "إخفاء نتيجة وزرها من الموقع أو إعادتها لاحقًا دون حذف البيانات.",
    badge: "إظهار وإخفاء",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10"/><circle cx="18" cy="18" r="2.5"/></svg>
    ),
  },
  {
    id: "site",
    title: "تعديل واجهة الموقع",
    description: "إظهار أو إخفاء الأقسام والأزرار وتعديل الأسماء الظاهرة للزوار.",
    badge: "تحكم بالموقع",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4z"/><path d="M4 9h16M8 5v4"/></svg>
    ),
  },
];

const TITLES: Record<View, string> = {
  home: "ماذا تريد أن تفعل؟",
  publish: "نشر نتائج جديدة",
  manage: "إدارة النتائج المنشورة",
  site: "تعديل واجهة الموقع",
};

export default function AdminResultsDashboard() {
  const [view, setView] = useState<View>("home");

  function open(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="admin-results-dashboard" dir="rtl">
      <section className="admin-results-dashboard-shell">
        <header className="admin-results-dashboard-header">
          <div className="admin-results-brand">
            <span className="admin-results-brand-icon">MR</span>
            <div>
              <p>MauriResults Admin</p>
              <h1>لوحة إدارة النتائج والموقع</h1>
            </div>
          </div>
          <a href="/" className="admin-results-site-link">فتح الموقع</a>
        </header>

        {view === "home" ? (
          <section className="admin-task-home">
            <div className="admin-task-intro">
              <span>اختر المهمة</span>
              <h2>اختر إحدى البطاقات الثلاث</h2>
              <p>لن يظهر أي قسم قبل اختيار البطاقة المناسبة.</p>
            </div>

            <div className="admin-task-grid admin-task-grid-three">
              {ACTIONS.map((action, index) => (
                <button className={`admin-task-card admin-task-card-${action.id}`} onClick={() => open(action.id)} type="button" key={action.id}>
                  <span className="admin-task-number">0{index + 1}</span>
                  <span className="admin-task-icon">{action.icon}</span>
                  <span className="admin-task-copy">
                    <small>{action.badge}</small>
                    <strong>{action.title}</strong>
                    <em>{action.description}</em>
                  </span>
                  <span className="admin-task-arrow">←</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section className="admin-workspace">
            <div className="admin-workspace-bar">
              <button type="button" onClick={() => open("home")} className="admin-workspace-back">→ البطاقات الثلاث</button>
              <div>
                <span>المهمة الحالية</span>
                <h2>{TITLES[view]}</h2>
              </div>
              <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="admin-workspace-top">أعلى</button>
            </div>

            <div className="admin-workspace-content">
              {view === "publish" && <FastResultsUploadApplication />}
              {view === "manage" && <PublishedResultsManager />}
              {view === "site" && <SiteControlPanel />}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
