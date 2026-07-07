export default function Breadcrumb({ items = [] }) {
  if (!items.length) return null;

  return (
    <nav className="flex flex-wrap items-center gap-2 text-xs font-black text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span className="inline-flex items-center gap-2" key={`${item.label}-${index}`}>
          {index > 0 && <span className="text-mauri-green/50">/</span>}
          {item.onClick ? (
            <button className="transition hover:text-mauri-green" onClick={item.onClick} type="button">{item.label}</button>
          ) : (
            <span className={index === items.length - 1 ? "text-mauri-green dark:text-mauri-gold" : ""}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
