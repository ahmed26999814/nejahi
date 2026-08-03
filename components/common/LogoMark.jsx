export default function LogoMark({ className = "h-10 w-10", src = "/brand-logo.svg" }) {
  const resolvedSrc = !src || src === "/logo.png" ? "/brand-logo.svg" : src;

  return (
    <span className={`${className} brand-logo-frame grid shrink-0 place-items-center overflow-hidden border bg-white shadow-soft dark:border-white/10`}>
      <img
        className="h-full w-full object-contain"
        src={resolvedSrc}
        alt="MauriResults"
        loading="eager"
        onError={(event) => {
          event.currentTarget.src = "/brand-logo.svg";
        }}
      />
    </span>
  );
}
