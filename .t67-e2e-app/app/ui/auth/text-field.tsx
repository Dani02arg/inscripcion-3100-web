import type {
  ChangeEventHandler,
  ClipboardEventHandler,
  DragEventHandler,
  FocusEventHandler,
  HTMLInputTypeAttribute,
  InputHTMLAttributes,
  ReactNode,
  Ref,
} from "react";

export interface TextFieldProps {
  id: string;
  name?: string;
  label: string;
  type?: HTMLInputTypeAttribute;
  value: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  onPaste?: ClipboardEventHandler<HTMLInputElement>;
  onDrop?: DragEventHandler<HTMLInputElement>;
  placeholder?: string;
  autoComplete?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  helpText?: string;
  error?: string;
  trailing?: ReactNode;
  className?: string;
  inputClassName?: string;
  ariaDescribedBy?: string;
  inputRef?: Ref<HTMLInputElement>;
}

const BASE_INPUT_CLASSES =
  "min-h-11 w-full rounded-lg border bg-superficie px-3 py-2 text-base text-texto-principal placeholder:text-texto-principal transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario";

const NORMAL_INPUT_CLASSES =
  "border-borde-input focus:border-borde-focus focus:ring-borde-focus";

const ERROR_INPUT_CLASSES =
  "border-estado-error-borde focus:border-estado-error-borde focus:ring-estado-error-borde";

function ErrorIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="mt-0.5 h-4 w-4 shrink-0 text-estado-error-texto"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.5a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0v-4ZM10 14.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function TextField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  onPaste,
  onDrop,
  placeholder,
  autoComplete,
  autoCapitalize,
  spellCheck,
  inputMode,
  maxLength,
  required = false,
  readOnly = false,
  disabled = false,
  helpText,
  error,
  trailing,
  className = "",
  inputClassName = "",
  ariaDescribedBy,
  inputRef,
}: TextFieldProps) {
  const labelId = `${id}-label`;
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [ariaDescribedBy, helpId, errorId]
      .filter((item): item is string => Boolean(item))
      .join(" ") || undefined;

  return (
    <div className={className}>
      <label
        id={labelId}
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

      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onPaste={onPaste}
          onDrop={onDrop}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          spellCheck={spellCheck}
          inputMode={inputMode}
          maxLength={maxLength}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-required={required ? true : undefined}
          aria-describedby={describedBy}
          className={`${BASE_INPUT_CLASSES} ${
            error ? ERROR_INPUT_CLASSES : NORMAL_INPUT_CLASSES
          } ${trailing ? "pr-24" : ""} ${inputClassName}`}
        />

        {trailing ? (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {trailing}
          </div>
        ) : null}
      </div>

      {helpText ? (
        <p id={helpId} className="mt-1 text-sm text-texto-principal">
          {helpText}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          aria-live="polite"
          className="mt-1 flex items-start gap-1 text-sm text-texto-principal"
        >
          <ErrorIcon />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
