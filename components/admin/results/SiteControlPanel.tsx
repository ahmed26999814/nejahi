"use client";

import { useEffect, useMemo, useState } from "react";

type ControlKey =
  | "search"
  | "toppers"
  | "analytics"
  | "calculator"
  | "contact"
  | "developer"
  | "footer";

type ControlState = {
  visible: boolean;
  label: string;
};

const DEFAULTS: Record<ControlKey, ControlState> = {
  search: { visible: true, label: "البحث" },
  toppers: { visible: true, label: "الأوائل" },
  analytics: { visible: true, label: "الإحصائيات" },
  calculator: { visible: true, label: "حاسبة المعدل" },
  contact: { visible: true, label: "اتصل بنا" },
  developer: { visible: true, label: "الإعداد والتطوير" },
  footer: { visible: true, label: "الفوتر" },
};

const ITEMS: Array<{ key: ControlKey; title: string; description: string; editable: boolean }> = [
  { key: "search", title: "قسم البحث", description: "إظهار أو إخفاء زر وصفحة البحث.", editable: true },
  { key: "toppers", title: "قسم الأوائل", description: "إظهار أو إخفاء الأوائل من التنقل.", editable: true },
  { key: "analytics", title: "قسم الإحصائيات", description: "إظهار أو إخفاء الإحصائيات.", editable: true },
  { key: "calculator", title: "حاسبة المعدل", description: "إظهار أو إخفاء رابط الحاسبة.", editable: true },
  { key: "contact", title: "اتصل بنا", description: "التحكم في زر وصفحة التواصل.", editable: true },
  { key: "developer", title: "الإعداد والتطوير", description: "التحكم في بطاقة معلومات المطور.", editable: true },
  { key: "footer", title: "أسفل الموقع", description: "إخفاء الفوتر كاملًا عند الحاجة.", editable: false },
];

function fromRows(rows: Array<{ content_key?: string; value?: string | null }>) {
  const next = structuredClone(DEFAULTS);
  for (const item of rows || []) {
    const key = String(item.content_key || "");
    const value = String(item.value ?? "");
    const visibleMatch = key.match(/^ui_show_(.+)$/);
    const labelMatch = key.match(/^ui_label_(.+)$/);
    if (visibleMatch && visibleMatch[1] in next) next[visibleMatch[1] as ControlKey].visible = value !== "false";
    if (labelMatch && labelMatch[1] in next && value.trim()) next[labelMatch[1] as ControlKey].label = value;
  }
  return next;
}

export default function SiteControlPanel() {
  const [secret, setSecret] = useState("");
  const [controls, setControls] = useState<Record<ControlKey, ControlState>>(DEFAULTS);
  const [status, setStatus] = useState("جاري تحميل إعدادات الموقع...");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mauriresults-admin-secret") || "";
    setSecret(stored);
    if (!stored) {
      setStatus("أدخل ADMIN_SECRET في قسم الرفع أولًا، ثم أعد فتح الصفحة.");
      return;
    }

    fetch("/api/admin/content", { headers: { "x-admin-secret": stored }, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "تعذر تحميل الإعدادات");
        setControls(fromRows(data.items || []));
        setStatus("الإعدادات جاهزة.");
      })
      .catch((error) => setStatus(String(error.message || error)));
  }, []);

  const changedCount = useMemo(() => ITEMS.filter(({ key }) => {
    const current = controls[key];
    const initial = DEFAULTS[key];
    return current.visible !== initial.visible || current.label !== initial.label;
  }).length, [controls]);

  function update(key: ControlKey, patch: Partial<ControlState>) {
    setControls((current) => ({ ...current, [key]: { ...current[key], ...patch } }));
  }

  async function save() {
    if (!secret) {
      setStatus("ADMIN_SECRET غير موجود.");
      return;
    }

    setSaving(true);
    setStatus("جاري حفظ التعديلات...");
    try {
      const items = ITEMS.flatMap(({ key, title, editable }) => {
        const values = [
          {
            content_key: `ui_show_${key}`,
            title: `إظهار ${title}`,
            value: String(controls[key].visible),
            type: "boolean",
          },
        ];
        if (editable) {
          values.push({
            content_key: `ui_label_${key}`,
            title: `اسم ${title}`,
            value: controls[key].label.trim() || DEFAULTS[key].label,
            type: "text",
          });
        }
        return values;
      });

      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ items }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "تعذر حفظ الإعدادات");
      setStatus("تم حفظ التعديلات. ستظهر في الموقع عند التحديث.");
      window.dispatchEvent(new Event("mauriresults:site-controls-updated"));
    } catch (error) {
      setStatus(`فشل الحفظ: ${String(error)}`);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setControls(structuredClone(DEFAULTS));
    setStatus("تمت إعادة القيم الافتراضية محليًا. اضغط حفظ لتطبيقها.");
  }

  return (
    <section className="site-control-panel" dir="rtl">
      <header className="site-control-header">
        <div>
          <p>التحكم بالموقع</p>
          <h2>إظهار، إخفاء وتعديل الأقسام</h2>
          <span>غيّر ما يظهر للزوار دون الدخول إلى الكود.</span>
        </div>
        <span className="site-control-count">{changedCount} تعديلات</span>
      </header>

      <div className="site-control-grid">
        {ITEMS.map((item) => (
          <article className={`site-control-item ${controls[item.key].visible ? "is-visible" : "is-hidden"}`} key={item.key}>
            <div className="site-control-item-head">
              <div>
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </div>
              <label className="site-control-switch">
                <input
                  type="checkbox"
                  checked={controls[item.key].visible}
                  onChange={(event) => update(item.key, { visible: event.target.checked })}
                />
                <span aria-hidden="true" />
              </label>
            </div>

            {item.editable && (
              <label className="site-control-label-field">
                <span>الاسم الظاهر للزوار</span>
                <input
                  value={controls[item.key].label}
                  onChange={(event) => update(item.key, { label: event.target.value })}
                  maxLength={40}
                />
              </label>
            )}

            <span className="site-control-state">{controls[item.key].visible ? "ظاهر في الموقع" : "مخفي من الموقع"}</span>
          </article>
        ))}
      </div>

      <div className="site-control-actions">
        <button type="button" className="site-control-reset" onClick={reset} disabled={saving}>استعادة الافتراضي</button>
        <button type="button" className="site-control-save" onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ وتطبيق"}</button>
      </div>

      <p className="site-control-status">{status}</p>
    </section>
  );
}
