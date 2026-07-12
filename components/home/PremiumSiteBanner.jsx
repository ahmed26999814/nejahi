export default function PremiumSiteBanner({ asset }) {
  if (!asset?.is_active || !asset?.image_url) return null;

  return (
    <figure className="overflow-hidden rounded-[24px] border border-white/70 bg-white/[.78] shadow-premium backdrop-blur-2xl dark:border-white/10 dark:bg-[#10231a]/75 md:rounded-[30px]">
      <img
        className="h-full max-h-[320px] w-full object-cover"
        src={asset.image_url}
        alt=""
        loading="lazy"
        decoding="async"
        fetchPriority="low"
        sizes="(max-width: 768px) 96vw, 1040px"
      />
    </figure>
  );
}
