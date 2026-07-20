"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";

const SECRET_KEY = "mauriresults-admin-secret";

async function adminRequest(path, secret, options = {}) {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: {
      "x-admin-secret": secret,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-MR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export default function ResultAlertsAdmin() {
  const [secret, setSecret] = useState("");
  const [draftSecret, setDraftSecret] = useState("");
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(SECRET_KEY) || localStorage.getItem(SECRET_KEY) || "";
    if (saved) {
      sessionStorage.setItem(SECRET_KEY, saved);
      localStorage.setItem(SECRET_KEY, saved);
      setSecret(saved);
    }
  }, []);

  useEffect(() => {
    if (secret) loadAlerts(1, appliedQuery, secret);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  const pendingCount = useMemo(() => items.filter((item) => !item.notified).length, [items]);

  async function loadAlerts(pageNumber = page, search = appliedQuery, adminSecret = secret) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pageNumber),
        limit: "50",
      });
      if (search.trim()) params.set("query", search.trim());
      const data = await adminRequest(`/api/admin/result-alerts?${params}`, adminSecret);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setHasMore(Boolean(data.has_more));
      setPage(data.page || pageNumber);
    } catch (error) {
      if (error.message === "Unauthorized") {
        sessionStorage.removeItem(SECRET_KEY);
        localStorage.removeItem(SECRET_KEY);
        setSecret("");
        toast.error("كود الإدارة غير صحيح");
      } else {
        toast.error(error.message || "تعذر تحميل طلبات الإشعار");
      }
    } finally {
      setLoading(false);
    }
  }

  function unlock(event) {
    event.preventDefault();
    const value = draftSecret.trim();
    if (!value) return;
    sessionStorage.setItem(SECRET_KEY, value);
    localStorage.setItem(SECRET_KEY, value);
    setSecret(value);
  }

  function logout() {
    sessionStorage.removeItem(SECRET_KEY);
    localStorage.removeItem(SECRET_KEY);
    setSecret("");
    setItems([]);
  }

  function search(event) {
    event.preventDefault();
    const value = query.trim();
    setAppliedQuery(value);
    loadAlerts(1, value);
  }

  async function toggleNotified(item) {
    try {
      const data = await adminRequest("/api/admin/result-alerts", secret, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, notified: !item.notified }),
      });
      setItems((current) => current.map((row) => (row.id === item.id ? { ...row, ...data.item } : row)));
      toast.success(item.notified ? "أعيد إلى قائمة الانتظار" : "تم وضعه كمُشعَر");
    } catch (error) {
      toast.error(error.message || "تعذر تحديث الحالة");
    }
  }

  async function remove(item) {
    if (!window.confirm(`حذف طلب ${item.full_name}؟`)) return;
    try {
      await adminRequest("/api/admin/result-alerts", secret, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      });
      setItems((current) => current.filter((row) => row.id !== item.id));
      setTotal((value) => Math.max(0, value - 1));
      toast.success("تم حذف الطلب");
    } catch (error) {
      toast.error(error.message || "تعذر حذف الطلب");
    }
  }

  async function copyPhone(item) {
    try {
      await navigator.clipboard.writeText(item.whatsapp_normalized || item.whatsapp);
      toast.success("تم نسخ الرقم");
    } catch {
      toast.error("تعذر نسخ الرقم");
    }
  }

  function exportVisible() {
    if (!items.length) return;
    const rows = [
      ["الاسم", "واتساب", "الرقم الموحّد", "الحالة", "تاريخ التسجيل"],
      ...items.map((item) => [
        item.full_name,
        item.whatsapp,
        item.whatsapp_normalized,
        item.notified ? "تم الإشعار" : "بانتظار الإشعار",
        item.created_at,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bac-2026-alerts-page-${page}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!secret) {
    return (
      <main className="admin-page grid min-h-screen place-items-center px-4 py-8" dir="rtl">
        <form className="admin-login" onSubmit={unlock}>
          <span className="admin-logo mx-auto">MR</span>
          <h1>طلبات إشعار باكالوريا</h1>
          <p>أدخل كود الإدارة لعرض الأسماء وأرقام واتساب المسجلة.</p>
          <input value={draftSecret} onChange={(event) => setDraftSecret(event.target.value)} placeholder="Admin secret" type="password" />
          <button type="submit">دخول</button>
          <Link href="/admin" className="text-center text-sm font-black text-mauri-green">العودة إلى لوحة الإدارة</Link>
        </form>
        <Toaster richColors position="top-center" dir="rtl" />
      </main>
    );
  }

  return (
    <main className="admin-page min-h-screen px-3 py-5 text-mauri-ink" dir="rtl">
      <section className="mx-auto grid w-full max-w-6xl gap-5">
        <header className="admin-hero">
          <span className="admin-logo">MR</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-mauri-green">Bac 2026 WhatsApp Alerts</p>
            <h1 className="text-2xl font-black text-slate-950 md:text-4xl">طلبات الإشعار</h1>
            <p className="mt-1 text-sm font-bold text-slate-500">الأسماء وأرقام واتساب المسجلة لإشعار باكالوريا 2026.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 md:flex">
            <Link href="/admin" className="admin-upload inline-flex items-center justify-center">لوحة الإدارة</Link>
            <button className="admin-remove" onClick={logout} type="button">خروج</button>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm">
            <span className="block text-[11px] font-black text-slate-500">إجمالي المسجلين</span>
            <strong className="mt-1 block text-2xl font-black text-slate-950">{total}</strong>
          </article>
          <article className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-center shadow-sm">
            <span className="block text-[11px] font-black text-amber-700">بانتظار الإشعار</span>
            <strong className="mt-1 block text-2xl font-black text-amber-900">{pendingCount}</strong>
          </article>
          <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-center shadow-sm">
            <span className="block text-[11px] font-black text-emerald-700">الصفحة الحالية</span>
            <strong className="mt-1 block text-2xl font-black text-emerald-900">{page}</strong>
          </article>
        </section>

        <section className="admin-card">
          <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto]" onSubmit={search}>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-mauri-green"
              placeholder="ابحث بالاسم أو رقم واتساب"
            />
            <button className="admin-upload" disabled={loading} type="submit">بحث</button>
            <button className="admin-remove" disabled={loading || !items.length} onClick={exportVisible} type="button">تصدير المعروض</button>
          </form>
        </section>

        <section className="grid gap-3">
          {loading && !items.length ? (
            <article className="admin-card text-center font-black">جاري تحميل الطلبات...</article>
          ) : items.length ? (
            items.map((item) => (
              <article key={item.id} className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black text-slate-950">{item.full_name}</h2>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${item.notified ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}`}>
                        {item.notified ? "تم الإشعار" : "بانتظار الإشعار"}
                      </span>
                    </div>
                    <a href={`https://wa.me/${item.whatsapp_normalized}`} target="_blank" rel="noreferrer" dir="ltr" className="mt-2 inline-flex text-base font-black tracking-wide text-mauri-green underline decoration-mauri-green/30 underline-offset-4">
                      +{item.whatsapp_normalized}
                    </a>
                    <p className="mt-2 text-xs font-bold text-slate-500">سُجل: {formatDate(item.created_at)}</p>
                    {item.notified_at && <p className="mt-1 text-xs font-bold text-slate-500">أُشعر: {formatDate(item.notified_at)}</p>}
                  </div>
                  <div className="grid min-w-[150px] grid-cols-2 gap-2">
                    <button className="admin-upload" onClick={() => copyPhone(item)} type="button">نسخ الرقم</button>
                    <button className="admin-upload" onClick={() => toggleNotified(item)} type="button">{item.notified ? "إلغاء الحالة" : "تم الإشعار"}</button>
                    <button className="admin-remove col-span-2" onClick={() => remove(item)} type="button">حذف الطلب</button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <article className="admin-card text-center">
              <h2 className="text-xl font-black text-slate-950">لا توجد طلبات</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">ستظهر التسجيلات هنا فور إرسال المستخدمين للنموذج.</p>
            </article>
          )}
        </section>

        <footer className="grid grid-cols-3 items-center gap-2">
          <button className="admin-remove" disabled={loading || page <= 1} onClick={() => loadAlerts(page - 1)} type="button">السابق</button>
          <span className="text-center text-sm font-black text-slate-600">صفحة {page}</span>
          <button className="admin-upload" disabled={loading || !hasMore} onClick={() => loadAlerts(page + 1)} type="button">التالي</button>
        </footer>
      </section>
      <Toaster richColors position="top-center" dir="rtl" />
    </main>
  );
}
