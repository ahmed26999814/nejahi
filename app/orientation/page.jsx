import { Suspense } from "react";
import OrientationExplorer from "../../components/orientation/OrientationExplorer";

export const dynamic = "force-static";

export const metadata = {
  title: "دليل التوجيه الجامعي والتخصصات",
  description:
    "اكتشف التخصصات المناسبة لشعبة الباكالوريا ومعدلك، وقارن بين عروض التوجيه الجامعي في موريتانيا والبعثات الخارجية.",
  alternates: {
    canonical: "/orientation",
  },
  openGraph: {
    title: "دليل التوجيه الجامعي | MauriResults",
    description: "اعرف التخصصات المناسبة لشعبتك ومعدلك قبل ترتيب رغباتك.",
    url: "/orientation",
    type: "website",
  },
};

function OrientationLoading() {
  return (
    <main className="min-h-screen w-full overflow-x-clip bg-[#f7faf8] pb-16 text-slate-950 dark:bg-[#06110b] dark:text-white">
      <header className="border-b border-slate-200/80 bg-white/95 dark:border-white/10 dark:bg-[#07130d]/95">
        <div className="app-shell flex min-h-14 items-center justify-between gap-3">
          <span className="skeleton h-4 w-28 rounded-lg" />
          <span className="skeleton h-4 w-24 rounded-lg" />
        </div>
      </header>
      <div className="app-shell grid gap-4 py-4 md:gap-6 md:py-8">
        <section className="rounded-[24px] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[.055]">
          <span className="skeleton block h-7 w-56 rounded-xl" />
          <span className="skeleton mt-3 block h-4 w-72 max-w-full rounded-lg" />
        </section>
        <section className="rounded-[26px] border border-slate-200/80 bg-white p-4 dark:border-white/10 dark:bg-white/[.055]">
          <div className="grid grid-cols-2 gap-3">
            <span className="skeleton h-12 rounded-2xl" />
            <span className="skeleton h-12 rounded-2xl" />
            <span className="skeleton col-span-2 h-12 rounded-2xl" />
          </div>
        </section>
      </div>
    </main>
  );
}

export default function OrientationPage() {
  return (
    <Suspense fallback={<OrientationLoading />}>
      <OrientationExplorer />
    </Suspense>
  );
}
