export default function LogoMark({ className = "h-10 w-10", src = "/logo.png" }) {
  return (
    <span className={`${className} grid shrink-0 place-items-center overflow-hidden border border-mauri-green/10 bg-white shadow-soft dark:border-white/10`}>
      <img
        className="h-full w-full object-contain p-1"
        src={src}
        alt="MauriResults"
        loading="eager"
        onError={(event) => {
          event.currentTarget.src = "/logo.png";
        }}
      />
    </span>
  );
}
