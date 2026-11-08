"use client";

import {
  useEffect,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";

import { applyRecoveryPaste } from "../../lib/recovery/code.ts";
import {
  CODE_LENGTH,
  nextFocusIndex,
  normalizeCode,
  setDigit,
} from "../../lib/verification/code.ts";

export interface RecoveryCodeFieldProps {
  id: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  describedBy?: string;
  className?: string;
}

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

function clearSlot(digits: string, index: number): string {
  const slots = digits.padEnd(CODE_LENGTH, " ").slice(0, CODE_LENGTH);

  return `${slots.slice(0, index)} ${slots.slice(index + 1)}`;
}

/** Campo OTP controlado de cinco casillas; informa el código por un campo oculto. */
export default function RecoveryCodeField({
  id,
  name = "code",
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
  describedBy,
  className = "",
}: RecoveryCodeFieldProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const hiddenRef = useRef<HTMLInputElement | null>(null);
  const slots = value.padEnd(CODE_LENGTH, " ").slice(0, CODE_LENGTH);
  const code = normalizeCode(slots);
  const errorId = error ? `${id}-error` : undefined;
  const describedByIds =
    [describedBy, errorId]
      .filter((item): item is string => Boolean(item))
      .join(" ") || undefined;

  useEffect(() => {
    const targets = [hiddenRef.current, ...inputsRef.current].filter(
      (input): input is HTMLInputElement => Boolean(input),
    );

    if (targets.length === 0) {
      return;
    }

    const stripValueAttribute = (target: HTMLInputElement) => {
      if (target.hasAttribute("value")) {
        target.removeAttribute("value");
      }
    };

    for (const target of targets) {
      stripValueAttribute(target);
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.target instanceof HTMLInputElement) {
          stripValueAttribute(mutation.target);
        }
      }
    });

    for (const target of targets) {
      observer.observe(target, {
        attributes: true,
        attributeFilter: ["value"],
      });
    }

    return () => observer.disconnect();
  }, []);

  function focusAt(index: number) {
    inputsRef.current[Math.min(Math.max(index, 0), CODE_LENGTH - 1)]?.focus();
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    const digitsOnly = normalizeCode(raw);

    if (!digitsOnly) {
      onChange(clearSlot(slots, index));
      return;
    }

    if (digitsOnly.length > 1) {
      const result = applyRecoveryPaste(slots, raw);

      onChange(result.digits);
      focusAt(result.focusIndex);
      return;
    }

    const next = setDigit(slots, index, digitsOnly);

    onChange(next);
    focusAt(nextFocusIndex(next, index));
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      event.preventDefault();

      if (slots[index] !== " ") {
        onChange(clearSlot(slots, index));
        return;
      }

      if (index > 0) {
        onChange(clearSlot(slots, index - 1));
        focusAt(index - 1);
      }

      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();

    const result = applyRecoveryPaste(
      slots,
      event.clipboardData.getData("text"),
    );

    onChange(result.digits);
    focusAt(result.focusIndex);
  }

  return (
    <div className={className}>
      <input
        ref={hiddenRef}
        type="text"
        name={name}
        value={code}
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />

      <fieldset disabled={disabled} className="min-w-0 border-0 p-0">
        <legend className="sr-only">
          Código de recuperación de {CODE_LENGTH} dígitos
        </legend>

        <div className="flex justify-center gap-2 sm:gap-3">
          {Array.from({ length: CODE_LENGTH }, (_, index) => {
            const digit = slots[index] === " " ? "" : slots[index];

            return (
              <input
                key={index}
                ref={(element) => {
                  inputsRef.current[index] = element;
                }}
                id={`${id}-${index}`}
                type="text"
                value={digit}
                onChange={(event) => handleChange(index, event)}
                onKeyDown={(event) => handleKeyDown(index, event)}
                onPaste={handlePaste}
                onFocus={(event) => event.currentTarget.select()}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                autoComplete={index === 0 ? "one-time-code" : "off"}
                autoCapitalize="off"
                spellCheck={false}
                autoFocus={autoFocus && index === 0}
                aria-label={`Dígito ${index + 1} de ${CODE_LENGTH}`}
                aria-invalid={error ? true : undefined}
                aria-describedby={describedByIds}
                className={`h-12 w-11 rounded-lg border bg-superficie text-center text-xl font-semibold text-texto-principal transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario sm:h-14 sm:w-12 ${
                  error
                    ? "border-estado-error-borde focus:border-estado-error-borde focus:ring-estado-error-borde"
                    : "border-borde-input focus:border-borde-focus focus:ring-borde-focus"
                }`}
              />
            );
          })}
        </div>
      </fieldset>

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-start justify-center gap-1 text-sm text-texto-principal"
        >
          <ErrorIcon />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
