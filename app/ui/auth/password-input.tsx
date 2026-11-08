"use client";

import { useEffect, useRef, useState } from "react";
import type {
  ChangeEventHandler,
  FocusEventHandler,
} from "react";

import { isValidPassword } from "../../lib/validation/register.ts";
import TextField from "./text-field";

const PASSWORD_ERROR_MESSAGE =
  "La contraseña debe tener entre 8 y 16 caracteres, una mayúscula, una minúscula y un número o carácter especial.";

export interface PasswordInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  /** Activa la validación de complejidad propia del campo contraseña. */
  showPasswordPolicy?: boolean;
  /** Permite pegar el valor en el campo; por defecto se bloquea. */
  allowPaste?: boolean;
  /** Permite soltar texto en el campo; por defecto se bloquea. */
  allowDrop?: boolean;
  /** Valor de autocompletado del navegador; por defecto desactivado. */
  autoComplete?: string;
}

export default function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  helpText,
  required = false,
  disabled = false,
  showPasswordPolicy = true,
  allowPaste = false,
  allowDrop = false,
  autoComplete = "off",
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    const stripValueAttribute = () => {
      if (input.hasAttribute("value")) {
        input.removeAttribute("value");
      }
    };

    stripValueAttribute();

    const observer = new MutationObserver(stripValueAttribute);
    observer.observe(input, {
      attributes: true,
      attributeFilter: ["value"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleLabel = visible
    ? "Ocultar contraseña"
    : "Mostrar contraseña";
  const policyError =
    showPasswordPolicy && value.length > 0 && !isValidPassword(value)
      ? PASSWORD_ERROR_MESSAGE
      : "";
  const visibleError = error || policyError;

  return (
    <TextField
      inputRef={inputRef}
      id={id}
      name={name}
      label={label}
      type={visible ? "text" : "password"}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onPaste={allowPaste ? undefined : (event) => event.preventDefault()}
      onDrop={allowDrop ? undefined : (event) => event.preventDefault()}
      autoComplete={autoComplete}
      autoCapitalize="none"
      spellCheck={false}
      required={required}
      disabled={disabled}
      error={visibleError}
      helpText={helpText}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-pressed={visible}
          aria-controls={id}
          aria-label={toggleLabel}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 py-1 text-sm font-semibold text-azul-institucional transition-colors hover:bg-fondo-app focus:outline-none focus:ring-2 focus:ring-borde-focus disabled:cursor-not-allowed disabled:text-texto-secundario"
          disabled={disabled}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      }
    />
  );
}
