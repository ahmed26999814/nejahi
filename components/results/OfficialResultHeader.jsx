import LogoMark from "../common/LogoMark";
import { contentValue } from "../common/content";
import { StatusBadge } from "./ResultDesignKit";
import VerificationBadge from "./VerificationBadge";

export default function OfficialResultHeader({ content, status, text, verificationCode }) {
  return (
    <header className="official-result-header">
      <div className="flex min-w-0 items-center gap-3">
        <LogoMark className="h-12 w-12 rounded-[18px]" src={contentValue(content, "logo", "/logo.png")} />
        <div className="min-w-0">
          <p className="text-[11px] font-black text-mauri-green dark:text-mauri-gold">MauriResults</p>
          <h1 className="line-clamp-1 text-xl font-black text-slate-950 dark:text-white md:text-3xl">{text?.officialResult || "بطاقة النتيجة الرسمية"}</h1>
          <div className="mt-2">
            <VerificationBadge label={text?.verification || "رقم التحقق"} value={verificationCode} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={status.className} label={status.label} />
      </div>
    </header>
  );
}
