import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function BookReader({ searchParams }) {
  const params = await searchParams;
  const rawUrl = String(params?.url || "");
  let parsed;
  try { parsed = new URL(rawUrl); } catch { notFound(); }
  if (parsed.protocol !== "https:" || !(
    (parsed.hostname === "docs.bsimr.com" || parsed.hostname === "bsimr.s3.us-east-2.amazonaws.com") &&
    parsed.pathname.startsWith("/pdfs/") && parsed.pathname.toLowerCase().endsWith(".pdf")
  )) notFound();
  const name = String(params?.name || "كتاب مدرسي").slice(0, 100);
  const endpoint = "/api/books/download?url=" + encodeURIComponent(rawUrl) + "&name=" + encodeURIComponent(name + ".pdf");
  return <main dir="rtl" className="mx-auto w-full max-w-7xl px-4 py-6 text-slate-900 dark:text-white sm:px-6">
    <header className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#12231a]">
      <Link href="/lessons" className="text-sm font-black text-mauri-green">العودة إلى الكتب</Link>
      <h1 className="mt-2 text-lg font-black">{name}</h1>
      <a href={endpoint} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-mauri-green px-5 text-sm font-black text-white">تحميل الكتاب</a>
      <p className="mt-2 text-xs text-slate-500 dark:text-slate-300">إذا لم تظهر المعاينة على جهازك، استخدم زر التحميل.</p>
    </header>
    <iframe title={name} src={endpoint + "&inline=1"} loading="eager"
      className="h-[75vh] min-h-[440px] w-full rounded-2xl border border-slate-200 bg-white dark:border-white/10" />
  </main>;
}
