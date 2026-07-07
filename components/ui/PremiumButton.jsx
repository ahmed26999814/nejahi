export default function PremiumButton({ as: Component = "button", variant = "solid", className = "", children, ...props }) {
  const variantClass = variant === "light" ? "premium-button-light" : "premium-button-solid";
  return (
    <Component className={`premium-cta-button ${variantClass} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
