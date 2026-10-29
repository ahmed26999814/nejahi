const RESTORED_LOGO = "/brand-logo.svg?v=green-gold-20260807";

export default function LogoMark({ className = "h-10 w-10", src = RESTORED_LOGO }) {
  const resolvedSrc = !src || src === "/logo.png" || src === "/brand-logo.svg" ? RESTORED_LOGO : src;

  return (
    <span className={`${className} brand-logo-frame grid shrink-0 place-items-center overflow-hidden border bg-white shadow-soft dark:border-white/10`}>
      <img
        className="h-full w-full object-contain"
        src={resolvedSrc}
        alt="MauriResults"
        loading="eager"
        width={128}
        height={128}
        decoding="async"
        onError={(event) => {
          const image = event.currentTarget;
          if (image.dataset.fallbackApplied) return;
          image.dataset.fallbackApplied = "true";
          image.src = RESTORED_LOGO;
        }}
      />
    </span>
  );
}
