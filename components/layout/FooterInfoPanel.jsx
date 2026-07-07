import LogoMark from "../common/LogoMark";
import { contentValue } from "../common/content";

export default function FooterInfoPanel({ content = {}, text }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3">
        <LogoMark className="h-14 w-14 rounded-[20px]" src={contentValue(content, "logo", "/logo.png")} />
        <div className="min-w-0">
          <strong className="block text-xl font-black text-slate-950 dark:text-white">MauriResults</strong>
          <span className="text-sm font-bold text-slate-500 dark:text-slate-300">{text.platformSubtitle || "Results platform"}</span>
        </div>
      </div>
    </div>
  );
}
