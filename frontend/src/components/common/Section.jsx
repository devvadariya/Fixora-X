const Section = ({
  eyebrow,
  title,
  description,
  actions,
  children,
  className = "",
}) => {
  return (
    <section className={`w-full ${className}`.trim()}>
      {(eyebrow || title || description || actions) && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            {eyebrow && (
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-secondary-500">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-primary-900 sm:text-3xl">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-2 text-base leading-7 text-secondary-600">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
};

export default Section;
