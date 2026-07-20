"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function BacAlertRegistration() {
  const [form, setForm] = useState({ full_name: "", whatsapp: "", website: "" });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState("");

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (message) setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    if (submitting) return;

    const name = form.full_name.trim();
    const phoneDigits = form.whatsapp.replace(/\D/g, "");
    if (name.length < 2) {
      setMessage("اكتب اسمك بصورة صحيحة.");
      return;
    }
    if (phoneDigits.length < 8) {
      setMessage("اكتب رقم واتساب صحيحاً.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/result-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, exam_slug: "bac-2026" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "تعذر تسجيل الطلب.");
      setSuccess(true);
      setMessage(data.message || "تم تسجيلك بنجاح.");
    } catch (error) {
      setMessage(error.message || "تعذر تسجيل الطلب الآن. حاول مرة أخرى.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06110c] px-4 py-6 text-white sm:py-10" dir="rtl">
      <section className="mx-auto grid w-full max-w-lg gap-5">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[.06] px-4 text-sm font-black text-slate-200 transition active:scale-[.98]">
            الرجوع للرئيسية
          </Link>
          <div className="flex items-center gap-2">
            <div className="text-left">
              <strong className="block text-sm font-black">MauriResults</strong>
              <span className="text-[10px] font-bold text-emerald-300">باكالوريا 2026</span>
            </div>
            <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg">
              <Image src="/logo.png" alt="MauriResults" fill sizes="48px" className="object-contain p-1.5" priority />
            </span>
          </div>
        </header>

        <article className="overflow-hidden rounded-[30px] border border-emerald-300/15 bg-gradient-to-b from-emerald-300/[.09] to-white/[.035] shadow-[0_28px_80px_rgba(0,0,0,.28)]">
          <div className="border-b border-white/10 px-5 py-6 text-center sm:px-7">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-emerald-400/15 text-emerald-300 shadow-inner shadow-emerald-300/10 [&>svg]:h-8 [&>svg]:w-8">
              <BellIcon />
            </span>
            <p className="mt-4 text-xs font-black text-amber-300">إشعار مجاني</p>
            <h1 className="mt-2 text-2xl font-black leading-relaxed sm:text-3xl">أخبرني فور صدور نتائج باكالوريا 2026</h1>
            <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-7 text-slate-300">
              اكتب اسمك ورقم واتساب، وسنرسل لك تنبيهاً عندما تصبح النتائج الرسمية متاحة على MauriResults.
            </p>
          </div>

          {success ? (
            <section className="grid gap-5 px-5 py-8 text-center sm:px-7">
              <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-400 text-[#062014] shadow-[0_18px_50px_rgba(52,211,153,.25)] [&>svg]:h-10 [&>svg]:w-10">
                <CheckIcon />
              </span>
              <div>
                <h2 className="text-2xl font-black">تم تسجيلك بنجاح</h2>
                <p className="mt-2 text-sm font-bold leading-7 text-slate-300" aria-live="polite">{message}</p>
              </div>
              <Link href="/" className="inline-flex min-h-13 items-center justify-center rounded-2xl bg-emerald-500 px-5 text-base font-black text-white shadow-[0_14px_36px_rgba(16,185,129,.22)] transition active:scale-[.98]">
                العودة إلى MauriResults
              </Link>
            </section>
          ) : (
            <form className="grid gap-4 px-5 py-6 sm:px-7" onSubmit={submit}>
              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-100">الاسم</span>
                <input
                  value={form.full_name}
                  onChange={(event) => update("full_name", event.target.value)}
                  type="text"
                  name="full_name"
                  autoComplete="name"
                  maxLength={100}
                  placeholder="اكتب اسمك الكامل"
                  className="min-h-14 rounded-2xl border border-white/10 bg-black/20 px-4 text-base font-bold text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/10"
                  required
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black text-slate-100">رقم واتساب</span>
                <input
                  value={form.whatsapp}
                  onChange={(event) => update("whatsapp", event.target.value)}
                  type="tel"
                  name="whatsapp"
                  autoComplete="tel"
                  inputMode="tel"
                  maxLength={24}
                  placeholder="مثال: 22xxxxxx أو +22222xxxxxx"
                  dir="ltr"
                  className="min-h-14 rounded-2xl border border-white/10 bg-black/20 px-4 text-left text-base font-black tracking-wide text-white outline-none transition placeholder:text-right placeholder:font-bold placeholder:tracking-normal placeholder:text-slate-500 focus:border-emerald-400/70 focus:ring-4 focus:ring-emerald-400/10"
                  required
                />
              </label>

              <label className="sr-only" aria-hidden="true">
                Website
                <input value={form.website} onChange={(event) => update("website", event.target.value)} name="website" tabIndex={-1} autoComplete="off" />
              </label>

              {message && (
                <p className="rounded-2xl border border-rose-300/20 bg-rose-400/10 px-4 py-3 text-sm font-bold leading-6 text-rose-200" role="alert" aria-live="polite">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 inline-flex min-h-14 items-center justify-center rounded-2xl bg-emerald-500 px-5 text-base font-black text-white shadow-[0_16px_38px_rgba(16,185,129,.25)] transition active:scale-[.98] disabled:cursor-wait disabled:opacity-65"
              >
                {submitting ? "جاري التسجيل..." : "سجّلني للإشعار"}
              </button>

              <p className="text-center text-[11px] font-bold leading-5 text-slate-400">
                يُستخدم رقمك فقط لإشعارك بصدور النتيجة، ولا يظهر للعامة.
              </p>
            </form>
          )}
        </article>
      </section>
    </main>
  );
}
