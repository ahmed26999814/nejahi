"use client";

import Image from "next/image";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Toaster, toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { BANNER_ITEMS, DEVELOPER_FIELDS, IMAGE_ITEMS } from "../../constants/adminContent";
import { adminFetch, compressAdminImage as compressImage, getContentValue as getValue, mapContentItems as itemMap, uploadAdminImage as uploadWithProgress } from "../../services/adminService";

/* Legacy constants and request helpers moved to constants/adminContent and services/adminService. */
/*const IMAGE_ITEMS = [
  ["hero_background", "Hero Background", "خلفية القسم الرئيسي"],
  ["home_banner_image", "Homepage Banner", "البنر أسفل بطاقات السنوات"],
  ["result_card_image", "Result Card Banner", "البنر داخل بطاقة النتيجة"],
  ["footer_banner", "Footer Banner", "صورة خلفية الفوتر"],
  ["developer_avatar", "Developer Avatar", "صورة المطور"],
  ["developer_background", "Developer Background", "خلفية مودال المطور"],
  ["logo", "Logo", "شعار المنصة"],
  ["favicon", "Favicon", "أيقونة الموقع"],
].map(([key, title, description]) => ({ key, title, description, type: "image" }));

const DEVELOPER_FIELDS = [
  ["developer_name", "Developer Name", "text"],
  ["developer_job_title", "Job Title", "text"],
  ["developer_description", "Description", "textarea"],
  ["developer_whatsapp", "WhatsApp Link", "url"],
  ["developer_facebook", "Facebook Link", "url"],
  ["developer_telegram", "Telegram Link", "url"],
  ["developer_website", "Website Link", "url"],
  ["developer_email", "Email", "email"],
  ["developer_support_message", "Support Message", "textarea"],
].map(([key, title, type]) => ({ key, title, type }));

const BANNER_ITEMS = IMAGE_ITEMS.filter((item) => ["home_banner_image", "result_card_image"].includes(item.key));

function itemMap(items) {
  return items.reduce((map, item) => ({ ...map, [item.content_key]: item }), {});
}

function getValue(content, key) {
  return content[key]?.value || "";
}

async function compressImage(file) {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1800;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { alpha: true });
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" });
}

async function adminFetch(path, secret, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "x-admin-secret": secret,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function uploadWithProgressLegacy({ file, item, previousPath, secret, onProgress }) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("content_key", item.key);
    form.append("title", item.title);
    if (previousPath) form.append("previous_path", previousPath);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.setRequestHeader("x-admin-secret", secret);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.error || "Upload failed"));
      } catch (error) {
        reject(error);
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.send(form);
  });
}*/

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [draftSecret, setDraftSecret] = useState("");
  const [content, setContent] = useState({});
  const [draft, setDraft] = useState({});
  const [activeTab, setActiveTab] = useState("images");
  const [loading, setLoading] = useState(false);

  const unlocked = Boolean(secret);

  useEffect(() => {
    const saved = sessionStorage.getItem("mauriresults-admin-secret") || "";
    if (saved) setSecret(saved);
  }, []);

  useEffect(() => {
    if (!secret) return;
    loadContent(secret);
  }, [secret]);

  async function loadContent(adminSecret = secret) {
    setLoading(true);
    try {
      const data = await adminFetch("/api/admin/content", adminSecret);
      const mapped = itemMap(data.items || []);
      setContent(mapped);
      setDraft(Object.fromEntries(DEVELOPER_FIELDS.map((field) => [field.key, mapped[field.key]?.value || ""])));
    } catch (error) {
      toast.error(error.message === "Unauthorized" ? "كود الإدارة غير صحيح" : "تعذر تحميل المحتوى");
      setSecret("");
      sessionStorage.removeItem("mauriresults-admin-secret");
    } finally {
      setLoading(false);
    }
  }

  function unlock(event) {
    event.preventDefault();
    if (!draftSecret.trim()) return;
    sessionStorage.setItem("mauriresults-admin-secret", draftSecret.trim());
    setSecret(draftSecret.trim());
  }

  async function saveDeveloper() {
    setLoading(true);
    try {
      const items = DEVELOPER_FIELDS.map((field) => ({
        content_key: field.key,
        title: field.title,
        value: draft[field.key] || "",
        type: field.type,
      }));
      const data = await adminFetch("/api/admin/content", secret, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      setContent((current) => ({ ...current, ...itemMap(data.items || []) }));
      toast.success("تم حفظ بيانات المطور");
    } catch (error) {
      toast.error(error.message || "تعذر الحفظ");
    } finally {
      setLoading(false);
    }
  }

  async function resetDeveloper() {
    setDraft(Object.fromEntries(DEVELOPER_FIELDS.map((field) => [field.key, content[field.key]?.value || ""])));
    toast.info("تمت إعادة القيم كما كانت");
  }

  async function uploadImage(item, file, onProgress) {
    if (!file) return;
    try {
      onProgress(4);
      const compressed = await compressImage(file);
      const data = await uploadWithProgress({
        file: compressed,
        item,
        previousPath: content[item.key]?.storage_path,
        secret,
        onProgress,
      });
      setContent((current) => ({ ...current, [item.key]: data.item }));
      onProgress(100);
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      toast.error(error.message || "فشل رفع الصورة");
    }
  }

  async function deleteImage(item) {
    try {
      const data = await adminFetch("/api/admin/upload", secret, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content_key: item.key, storage_path: content[item.key]?.storage_path }),
      });
      setContent((current) => ({ ...current, [item.key]: data.items?.[0] || { content_key: item.key, value: "" } }));
      toast.success("تم حذف الصورة");
    } catch (error) {
      toast.error(error.message || "تعذر حذف الصورة");
    }
  }

  const tabs = useMemo(() => [
    ["images", "Images"],
    ["developer", "Developer Card"],
    ["banners", "Banners"],
  ], []);

  if (!unlocked) {
    return (
      <main className="admin-page grid min-h-screen place-items-center px-3 py-6">
        <form className="admin-login" onSubmit={unlock}>
          <span className="admin-logo mx-auto">MR</span>
          <h1>Website Content</h1>
          <p>أدخل كود الإدارة للوصول إلى نظام إدارة محتوى MauriResults.</p>
          <input value={draftSecret} onChange={(event) => setDraftSecret(event.target.value)} placeholder="Admin secret" type="password" />
          <button type="submit">دخول</button>
        </form>
        <Toaster richColors position="top-center" dir="rtl" />
      </main>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <main className="admin-page min-h-screen px-3 py-5 text-mauri-ink">
        <section className="mx-auto grid w-full max-w-6xl gap-5">
          <m.header className="admin-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="admin-logo">MR</span>
            <div>
              <p className="text-xs font-black text-mauri-green">MauriResults CMS</p>
              <h1 className="text-2xl font-black text-slate-950 md:text-4xl">Website Content</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">إدارة الصور، البنرات، وبطاقة المطور من Supabase بدون تعديل الكود.</p>
            </div>
            <button className="admin-remove md:justify-self-end" onClick={() => { sessionStorage.removeItem("mauriresults-admin-secret"); setSecret(""); }} type="button">خروج</button>
          </m.header>

          <nav className="admin-tabs">
            {tabs.map(([id, label]) => (
              <button className={activeTab === id ? "is-active" : ""} onClick={() => setActiveTab(id)} type="button" key={id}>{label}</button>
            ))}
          </nav>

          {activeTab === "images" && (
            <section className="grid gap-4 md:grid-cols-2">
              {IMAGE_ITEMS.map((item) => <ImageManager content={content} item={item} key={item.key} loading={loading} onDelete={deleteImage} onUpload={uploadImage} />)}
            </section>
          )}

          {activeTab === "developer" && (
            <DeveloperEditor content={content} draft={draft} loading={loading} onChange={setDraft} onDelete={deleteImage} onReset={resetDeveloper} onSave={saveDeveloper} onUpload={uploadImage} />
          )}

          {activeTab === "banners" && (
            <section className="grid gap-4 md:grid-cols-2">
              {BANNER_ITEMS.map((item) => <ImageManager content={content} item={item} key={item.key} loading={loading} onDelete={deleteImage} onUpload={uploadImage} />)}
            </section>
          )}
        </section>
        <Toaster richColors position="top-center" dir="rtl" />
      </main>
    </LazyMotion>
  );
}

function DeveloperEditor({ content, draft, loading, onChange, onDelete, onReset, onSave, onUpload }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_.85fr]">
      <article className="admin-card">
        <div>
          <h2 className="text-xl font-black text-slate-950">Developer Card</h2>
          <p className="mt-1 text-sm font-bold text-slate-500">كل هذه البيانات تظهر مباشرة في نافذة “عن المطور”.</p>
        </div>
        <div className="grid gap-3">
          {DEVELOPER_FIELDS.map((field) => (
            <label className="admin-field" key={field.key}>
              <span>{field.title}</span>
              {field.type === "textarea" ? (
                <textarea value={draft[field.key] || ""} onChange={(event) => onChange((value) => ({ ...value, [field.key]: event.target.value }))} rows={4} />
              ) : (
                <input value={draft[field.key] || ""} onChange={(event) => onChange((value) => ({ ...value, [field.key]: event.target.value }))} type={field.type === "email" ? "email" : "text"} />
              )}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="admin-upload" disabled={loading} onClick={onSave} type="button">Save</button>
          <button className="admin-remove" disabled={loading} onClick={onReset} type="button">Reset</button>
        </div>
      </article>

      <section className="grid gap-4">
        {IMAGE_ITEMS.filter((item) => ["developer_avatar", "developer_background"].includes(item.key)).map((item) => (
          <ImageManager content={content} item={item} key={item.key} loading={loading} onDelete={onDelete} onUpload={onUpload} compact />
        ))}
      </section>
    </section>
  );
}

function ImageManager({ compact = false, content, item, loading, onDelete, onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const current = content[item.key];
  const busy = loading || (progress > 0 && progress < 100);

  async function upload(file) {
    setProgress(1);
    await onUpload(item, file, setProgress);
    window.setTimeout(() => setProgress(0), 900);
  }

  function drop(event) {
    event.preventDefault();
    setDragging(false);
    upload(event.dataTransfer.files?.[0]);
  }

  return (
    <m.article className={`admin-card ${compact ? "admin-card-compact" : ""}`} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <div>
        <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
        <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{item.description}</p>
        <code className="mt-2 inline-block rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">{item.key}</code>
      </div>

      <div
        className={`admin-preview ${dragging ? "is-dragging" : ""}`}
        onDragLeave={() => setDragging(false)}
        onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
        onDrop={drop}
      >
        {current?.value ? (
          <Image src={current.value} alt={item.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        ) : (
          <div className="admin-empty">
            <ImageIcon />
            <span>اسحب الصورة هنا أو ارفعها من الجهاز</span>
          </div>
        )}
        {busy && <span className="admin-progress" style={{ width: `${progress}%` }} />}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="admin-upload">
          <input accept="image/*" className="sr-only" disabled={busy} onChange={(event) => upload(event.target.files?.[0])} type="file" />
          {current?.value ? "Replace" : "Upload"}
        </label>
        <button className="admin-remove" disabled={busy || !current?.value} onClick={() => onDelete(item)} type="button">Delete</button>
      </div>
    </m.article>
  );
}

function ImageIcon() {
  return <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5L5 20" /></svg>;
}
