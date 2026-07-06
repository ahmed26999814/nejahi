"use client";

import { m, LazyMotion, domAnimation } from "framer-motion";
import { Toaster, toast } from "sonner";
import { useEffect, useState } from "react";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ASSETS_TABLE = "site_assets";
const BUCKET = "site-assets";

const BANNERS = [
  { key: "homepage_banner", title: "بنر الصفحة الرئيسية", description: "يظهر أسفل بطاقتي نتائج 2025 و2026." },
  { key: "result_page_banner", title: "بنر صفحة النتيجة", description: "يظهر داخل بطاقة النتيجة تحت أزرار المشاركة والطباعة." },
];

function assetUrl(path) {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function request(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("missing-env");
  const response = await fetch(`${SUPABASE_URL}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(await response.text());
  if (response.status === 204) return null;
  return response.json();
}

async function fetchAssets() {
  const params = new URLSearchParams({
    select: "key,image_url,storage_path,is_active,updated_at",
    key: "in.(homepage_banner,result_page_banner)",
  });
  const rows = await request(`/rest/v1/${ASSETS_TABLE}?${params.toString()}`);
  return rows.reduce((items, row) => ({ ...items, [row.key]: row }), {});
}

async function upsertAsset(asset) {
  const params = new URLSearchParams({ on_conflict: "key" });
  const rows = await request(`/rest/v1/${ASSETS_TABLE}?${params.toString()}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify(asset),
  });
  return rows?.[0] || asset;
}

async function uploadImage(key, file) {
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${key}/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;
  await request(`/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "x-upsert": "true",
    },
    body: file,
  });
  return { path, url: assetUrl(path) };
}

async function removeStorageObject(path) {
  if (!path) return;
  await request(`/storage/v1/object/${BUCKET}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
  }).catch(() => {});
}

export default function AdminPage() {
  const [assets, setAssets] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState("");

  useEffect(() => {
    fetchAssets()
      .then(setAssets)
      .catch(() => toast.error("تعذر تحميل إعدادات البنرات"))
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setAssets(await fetchAssets());
  }

  async function handleUpload(key, file) {
    if (!file) return;
    setSavingKey(key);
    try {
      const previous = assets[key];
      const uploaded = await uploadImage(key, file);
      await upsertAsset({
        key,
        image_url: uploaded.url,
        storage_path: uploaded.path,
        is_active: true,
      });
      await removeStorageObject(previous?.storage_path);
      await refresh();
      toast.success("تم رفع الصورة بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("فشل رفع الصورة");
    } finally {
      setSavingKey("");
    }
  }

  async function toggleAsset(key) {
    setSavingKey(key);
    try {
      const current = assets[key] || { key };
      const updated = await upsertAsset({
        key,
        image_url: current.image_url || null,
        storage_path: current.storage_path || null,
        is_active: !current.is_active,
      });
      setAssets((value) => ({ ...value, [key]: updated }));
      toast.success("تم حفظ التغييرات");
    } catch (error) {
      console.error(error);
      toast.error("تعذر حفظ التغييرات");
    } finally {
      setSavingKey("");
    }
  }

  async function removeAsset(key) {
    setSavingKey(key);
    try {
      const current = assets[key];
      await removeStorageObject(current?.storage_path);
      const updated = await upsertAsset({
        key,
        image_url: null,
        storage_path: null,
        is_active: false,
      });
      setAssets((value) => ({ ...value, [key]: updated }));
      toast.success("تم حذف الصورة");
    } catch (error) {
      console.error(error);
      toast.error("تعذر حذف الصورة");
    } finally {
      setSavingKey("");
    }
  }

  return (
    <LazyMotion features={domAnimation}>
      <main className="admin-page min-h-screen px-3 py-5 text-mauri-ink">
        <section className="mx-auto grid w-full max-w-5xl gap-5">
          <m.header className="admin-hero" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <span className="admin-logo">MR</span>
            <div>
              <p className="text-xs font-black text-mauri-green">MauriResults Admin</p>
              <h1 className="text-2xl font-black text-slate-950 md:text-4xl">إدارة الصور والبنرات</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">تحكم في صور الصفحة الرئيسية وبطاقة النتيجة من مكان واحد.</p>
            </div>
          </m.header>

          <section className="grid gap-4 md:grid-cols-2">
            {BANNERS.map((banner) => (
              <BannerManager
                asset={assets[banner.key]}
                banner={banner}
                key={banner.key}
                loading={loading}
                onRemove={() => removeAsset(banner.key)}
                onToggle={() => toggleAsset(banner.key)}
                onUpload={(file) => handleUpload(banner.key, file)}
                saving={savingKey === banner.key}
              />
            ))}
          </section>
        </section>
        <Toaster richColors position="top-center" dir="rtl" />
      </main>
    </LazyMotion>
  );
}

function BannerManager({ asset, banner, loading, onRemove, onToggle, onUpload, saving }) {
  const disabled = loading || saving;

  return (
    <m.article className="admin-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-slate-950">{banner.title}</h2>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-500">{banner.description}</p>
        </div>
        <button className={`admin-toggle ${asset?.is_active ? "is-on" : ""}`} disabled={disabled} onClick={onToggle} type="button">
          {asset?.is_active ? "ظاهر" : "مخفي"}
        </button>
      </div>

      <div className="admin-preview">
        {loading ? (
          <span className="admin-skeleton" />
        ) : asset?.image_url ? (
          <img src={asset.image_url} alt={banner.title} loading="lazy" onError={(event) => { event.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="admin-empty">
            <ImageIcon />
            <span>لا توجد صورة حالياً</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="admin-upload">
          <input accept="image/*" className="sr-only" disabled={disabled} onChange={(event) => onUpload(event.target.files?.[0])} type="file" />
          {saving ? "جاري الحفظ..." : "رفع / تغيير"}
        </label>
        <button className="admin-remove" disabled={disabled || !asset?.image_url} onClick={onRemove} type="button">
          حذف الصورة
        </button>
      </div>
    </m.article>
  );
}

function ImageIcon() {
  return <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5L5 20" /></svg>;
}
