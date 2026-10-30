import Link from "next/link";
import { notFound } from "next/navigation";
import { findStudyFile } from "../../../lib/study-download.mjs";

export const dynamic = "force-dynamic";

export default async function StudyReader({ searchParams }) {
  const query = await searchParams;
  const file = findStudyFile(query?.id || "");
  if (!file) notFound();
  const isPdf = file.fileType === "PDF";
  const isVideo = file.fileType === "MP4";
  const filename = String(file.title || "document").replace(/[_]+/g, " ").trim();
  const endpoint = "/api/study-files/download?id=" + encodeURIComponent(file.id);
  return (
    <main dir="rtl" className="mx-auto w-full max-w-7xl px-4 py-6 text-slate-900 dark:text-white sm:px-6">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-[#12231a]">
        <Link href="/lessons?tab=resources" className="text-sm font-extrabold text-mauri-green hover:underline">
          العودة إلى المراجع
        </Link>
        <h1 className="mt-3 break-words text-lg font-black leading-8 sm:text-xl">{filename}</h1>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={endpoint} className="inline-flex min-h-11 items-center rounded-xl bg-mauri-green px-5 text-sm font-black text-white">
            تحميل الملف
          </a>
          <p className="self-center text-xs text-slate-500 dark:text-slate-300">
            إذا تعذرت المعاينة على هاتفك، استخدم زر تحميل الملف.
          </p>
        </div>
      </div>
      {isPdf ? (
        <iframe title={"قراءة " + filename} src={endpoint + "&inline=1"}
          className="h-[76vh] min-h-[460px] w-full rounded-2xl border border-slate-200 bg-white dark:border-white/10"
          loading="eager" />
      ) : isVideo ? (
        <video controls preload="metadata" className="mx-auto max-h-[76vh] w-full rounded-2xl border border-slate-200 bg-black" src={endpoint + "&inline=1"}>
          متصفحك لا يدعم مشاهدة هذا الفيديو. يمكنك تنزيل الملف.
        </video>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm font-semibold dark:border-white/10 dark:bg-[#12231a]">
          هذا النوع من الملفات متاح للتحميل فقط.
        </div>
      )}
    </main>
  );
}
