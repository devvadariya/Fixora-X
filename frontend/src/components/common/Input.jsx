import { useId } from "react";

const Input = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  className = "",
  inputClassName = "",
  icon,
  iconPosition = "left",
  ...props
}) => {
  const generatedId = useId();
  const inputId = props.id || name || `input-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText && !error ? `${inputId}-help` : undefined;
  const describedBy =
    [errorId, helperId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-secondary-700"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && iconPosition === "left" && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <span className="text-secondary-400">{icon}</span>
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-invalid={!!error}
          aria-required={required || undefined}
          aria-describedby={describedBy}
          className={`
            w-full min-h-11 rounded-md border bg-white px-4 py-2.5 text-sm text-secondary-900 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 sm:min-h-10
            ${icon && iconPosition === "left" ? "pl-11" : ""}
            ${icon && iconPosition === "right" ? "pr-11" : ""}
            ${
              error
                ? "border-danger-600 focus:border-danger-600 focus-visible:ring-danger-600"
                : "border-hairline focus:border-primary-900 focus-visible:ring-primary-900"
            }
            ${
              disabled
                ? "cursor-not-allowed bg-secondary-50 text-secondary-500"
                : "bg-white text-secondary-900"
            }
            ${inputClassName}
          `}
          {...props}
        />

        {icon && iconPosition === "right" && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <span className="text-secondary-400">{icon}</span>
          </div>
        )}
      </div>

      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger-600">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p id={helperId} className="mt-1 text-sm text-secondary-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
