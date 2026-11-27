const variants = {
  base: "rounded-xl border border-hairline bg-white p-6 shadow-card",
  feature: "rounded-xl border border-hairline bg-secondary-50 p-6",
  recommendation: "rounded-lg border border-hairline bg-white p-4 shadow-card",
  product: "rounded-[32px] bg-primary-900 p-8 text-white shadow-glow",
  promo: "rounded-[32px] bg-brand-coral p-8 text-white shadow-card",
};

const Card = ({
  as: Component = "div",
  variant = "base",
  className = "",
  children,
  ...props
}) => {
  return (
    <Component
      className={`${variants[variant] || variants.base} ${className}`.trim()}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Card;
