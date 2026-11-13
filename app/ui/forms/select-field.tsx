import type { ChangeEventHandler } from "react";

export interface SelectOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean;
}

export interface SelectFieldProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange?: ChangeEventHandler<HTMLSelectElement>;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helpText?: string;
  error?: string;
  className?: string;
  selectClassName?: string;
  ariaDescribedBy?: string;
}

const BASE_SELECT_CLASSES =
  "min-h-11 w-full rounded-lg border bg-superficie px-3 py-2 text-base text-texto-principal transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario";

const NORMAL_SELECT_CLASSES =
  "border-borde-control focus:border-borde-focus focus:ring-borde-focus";

const ERROR_SELECT_CLASSES =
  "border-estado-error-borde focus:border-estado-error-borde focus:ring-estado-error-borde";

/** Campo de selección accesible con etiqueta, ayuda y error. */
export default function SelectField({
  id,
  name,
  label,
  value,
  options,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  helpText,
  error,
  className = "",
  selectClassName = "",
  ariaDescribedBy,
}: SelectFieldProps) {
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, helpId, errorId]
      .filter((item): item is string => Boolean(item))
      .join(" ") || undefined;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1 block text-sm font-medium text-texto-principal"
      >
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-1 text-texto-principal">
            *
          </span>
        ) : null}
      </label>

      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-required={required ? true : undefined}
        aria-describedby={describedBy}
        className={`${BASE_SELECT_CLASSES} ${
          error ? ERROR_SELECT_CLASSES : NORMAL_SELECT_CLASSES
        } ${selectClassName}`}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>

      {helpText ? (
        <p id={helpId} className="mt-1 text-sm text-texto-principal">
          {helpText}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          aria-live="polite"
          className="mt-1 text-sm text-texto-principal"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
