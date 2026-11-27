const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  icon,
  iconPosition = "left",
  fullWidth = false,
  ...props
}) => {
  const baseClasses =
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 sm:min-h-10";

  const variantClasses = {
    primary:
      "bg-primary-900 text-white focus-visible:ring-primary-900 active:bg-charcoal",
    secondary:
      "border border-primary-900 bg-white text-primary-900 focus-visible:ring-primary-900 active:bg-surface",
    tertiary:
      "border border-hairline bg-white text-primary-900 focus-visible:ring-primary-900 active:bg-surface",
    success:
      "bg-success-600 text-white focus-visible:ring-success-600 active:bg-success-700",
    warning:
      "bg-warning-600 text-white focus-visible:ring-warning-600 active:bg-warning-700",
    danger:
      "bg-danger-600 text-white focus-visible:ring-danger-600 active:bg-danger-700",
    outline:
      "border border-primary-900 bg-transparent text-primary-900 focus-visible:ring-primary-900 active:bg-surface",
    "outline-danger":
      "border border-danger-600 bg-transparent text-danger-700 focus-visible:ring-danger-600 active:bg-danger-50",
    "outline-success":
      "border border-success-600 bg-transparent text-success-700 focus-visible:ring-success-600 active:bg-success-50",
    ghost:
      "bg-transparent text-primary-900 focus-visible:ring-primary-900 active:bg-surface",
  };

  const sizeClasses = {
    xs: "px-3 py-1.5 text-xs",
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    xl: "px-8 py-4 text-base",
  };

  const buttonClasses = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    fullWidth ? "w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={props.type || "button"}
      className={buttonClasses}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}

      {icon && iconPosition === "left" && !loading && (
        <span className="shrink-0">{icon}</span>
      )}

      {children}

      {icon && iconPosition === "right" && !loading && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  );
};

export default Button;
