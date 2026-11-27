const variants = {
  success: "bg-success-100 text-success-700",
  new: "bg-brand-coral text-white",
  beta: "bg-brand-blue-200 text-brand-blue-deep",
  code: "rounded-sm bg-brand-blue-200 text-brand-blue-deep",
  default: "bg-secondary-100 text-secondary-700",
};

const Badge = ({ children, variant = "default", className = "", ...props }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold leading-none ${variants[variant] || variants.default} ${className}`.trim()}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
