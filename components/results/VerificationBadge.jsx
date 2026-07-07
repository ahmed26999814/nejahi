import { CheckCircleIcon } from "../common/icons";

export default function VerificationBadge({ label = "رقم التحقق", value }) {
  if (!value) return null;

  return (
    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-mauri-green/15 bg-mauri-green/10 px-3 py-1.5 text-[11px] font-black text-mauri-green shadow-soft dark:border-emerald-300/20 dark:bg-emerald-300/10 dark:text-emerald-300">
      <CheckCircleIcon />
      {label}: {value}
    </span>
  );
}
