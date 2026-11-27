import { useId } from "react";

const Select = ({
  label,
  name,
  value,
  onChange,
  error,
  children,
  required = false,
  disabled = false,
  className = "",
  ...props
}) => {
  const generatedId = useId();
  const selectId = props.id || name || `select-${generatedId}`;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-secondary-700"
        >
          {label}
          {required && <span className="ml-1 text-danger-500">*</span>}
        </label>
      )}

      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={!!error}
        aria-required={required || undefined}
        aria-describedby={errorId}
        className={`
          w-full min-h-11 rounded-md border bg-white px-4 py-2.5 text-sm text-secondary-900 shadow-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 sm:min-h-10
          ${
            error
              ? "border-danger-600 focus:border-danger-600 focus-visible:ring-danger-600"
              : "border-hairline focus:border-primary-900 focus-visible:ring-primary-900"
          }
          ${disabled ? "cursor-not-allowed bg-secondary-50 text-secondary-500" : "bg-white"}
        `}
        {...props}
      >
        {children}
      </select>

      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger-600">
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;
