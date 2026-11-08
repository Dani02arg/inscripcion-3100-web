"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useActionState } from "react";

import {
  clearPendingVerificationAction,
  resendVerificationAction,
  verifyEmailAction,
} from "../../lib/actions/verify-email.ts";
import {
  CODE_LENGTH,
  applyPaste,
  isCompleteCode,
  nextFocusIndex,
  normalizeCode,
  setDigit,
} from "../../lib/verification/code.ts";
import { RESEND_WAIT_MS } from "../../lib/verification/pending-value.ts";
import type {
  ResendActionState,
  VerifyActionState,
} from "../../lib/verification/types.ts";

const EMPTY_SLOTS = " ".repeat(CODE_LENGTH);
const MAX_RESENDS_PER_DAY = 5;
const SUCCESS_REDIRECT_MS = 1_500;

const INITIAL_VERIFY_STATE: VerifyActionState = {
  status: "idle",
  message: "",
  errors: {},
};

const INITIAL_RESEND_STATE: ResendActionState = {
  status: "idle",
  message: "",
};

interface VerifyEmailFormProps {
  resendAvailableAt: number;
}

function BannerIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="mt-0.5 h-5 w-5 shrink-0 text-estado-error-texto"
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

function Spinner({ small = false }: { small?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${small ? "h-4 w-4" : "h-5 w-5"}`}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
      />
    </svg>
  );
}

/** Borra una casilla conservando la longitud fija del código. */
function clearSlot(digits: string, index: number): string {
  return `${digits.slice(0, index)} ${digits.slice(index + 1)}`;
}

export default function VerifyEmailForm({
  resendAvailableAt,
}: VerifyEmailFormProps) {
  const router = useRouter();
  const [digits, setDigits] = useState(EMPTY_SLOTS);
  const [dismissedState, setDismissedState] =
    useState<VerifyActionState | null>(null);
  const [availableAt, setAvailableAt] = useState(resendAvailableAt);
  const [now, setNow] = useState(() => Date.now());
  const submitLock = useRef(false);
  const resendLock = useRef(false);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const [state, formAction, isPending] = useActionState(
    async (previous: VerifyActionState, formData: FormData) => {
      const result = await verifyEmailAction(previous, formData);

      if (result.status === "rejected" || result.status === "expired") {
        setDigits(EMPTY_SLOTS);
      }

      return result;
    },
    INITIAL_VERIFY_STATE,
  );
  const [resendState, resendFormAction, isResendPending] = useActionState(
    async (previous: ResendActionState, formData: FormData) => {
      const result = await resendVerificationAction(previous, formData);

      if (result.status === "sent" || result.status === "failed") {
        const current = Date.now();
        setNow(current);
        setAvailableAt((available) =>
          available > current ? available : current + RESEND_WAIT_MS,
        );
      }

      return result;
    },
    INITIAL_RESEND_STATE,
  );

  const code = normalizeCode(digits);
  const complete = isCompleteCode(code);
  const isSuccess = state.status === "success";
  const isMissing =
    state.status === "missing" || resendState.status === "missing";
  const remainingMs = Math.max(0, availableAt - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const isWaiting = remainingMs > 0;
  const visibleState = dismissedState === state ? null : state;
  const codeError =
    visibleState?.status === "rejected"
      ? visibleState.errors.code || visibleState.message
      : undefined;
  const remainingResends =
    resendState.remainingResends ?? MAX_RESENDS_PER_DAY;

  useEffect(() => {
    if (!isPending) {
      submitLock.current = false;
    }
  }, [isPending]);

  useEffect(() => {
    if (!isResendPending) {
      resendLock.current = false;
    }
  }, [isResendPending]);

  useEffect(() => {
    if (availableAt <= Date.now()) {
      return;
    }

    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);

      if (current >= availableAt) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [availableAt]);

  useEffect(() => {
    if (state.status !== "rejected" && state.status !== "expired") {
      return;
    }

    inputsRef.current[0]?.focus();
  }, [state]);

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timer = setTimeout(() => {
      void clearPendingVerificationAction().finally(() => {
        router.push("/login");
      });
    }, SUCCESS_REDIRECT_MS);

    return () => clearTimeout(timer);
  }, [isSuccess, router]);

  function focusAt(index: number) {
    inputsRef.current[Math.min(Math.max(index, 0), CODE_LENGTH - 1)]?.focus();
  }

  function handleChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const raw = event.target.value;
    const digitsOnly = normalizeCode(raw);

    setDismissedState(state);

    if (!digitsOnly) {
      setDigits(clearSlot(digits, index));
      return;
    }

    if (digitsOnly.length > 1) {
      setDigits(applyPaste(digits, raw, index));
      focusAt(index + digitsOnly.length);
      return;
    }

    const next = setDigit(digits, index, digitsOnly);
    setDigits(next);
    focusAt(nextFocusIndex(next, index));
  }

  function handleKeyDown(
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace") {
      event.preventDefault();
      setDismissedState(state);

      if (digits[index] !== " ") {
        setDigits(clearSlot(digits, index));
        return;
      }

      if (index > 0) {
        setDigits(clearSlot(digits, index - 1));
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

  function handlePaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    setDismissedState(state);

    const pasted = normalizeCode(event.clipboardData.getData("text"));

    if (!pasted) {
      return;
    }

    setDigits(applyPaste(digits, pasted, index));
    focusAt(index + pasted.length);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isPending || isSuccess || submitLock.current) {
      event.preventDefault();
      return;
    }

    if (!complete) {
      event.preventDefault();
      return;
    }

    setDismissedState(state);
    submitLock.current = true;
  }

  function handleResendSubmit(event: FormEvent<HTMLFormElement>) {
    if (
      isResendPending ||
      isWaiting ||
      isSuccess ||
      isMissing ||
      resendLock.current
    ) {
      event.preventDefault();
      return;
    }

    resendLock.current = true;
  }

  return (
    <div className="space-y-6">
      {isMissing ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-estado-error-borde bg-superficie p-3 text-sm text-texto-principal"
        >
          <BannerIcon />
          <p>
            La verificación ya no está disponible.{" "}
            <Link
              href="/register"
              className="font-semibold text-azul-institucional underline"
            >
              Volvé al registro
            </Link>
            .
          </p>
        </div>
      ) : null}

      {state.status === "failed" ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-estado-error-borde bg-superficie p-3 text-sm text-texto-principal"
        >
          <BannerIcon />
          <p>{state.message}</p>
        </div>
      ) : null}

      {visibleState?.status === "expired" ? (
        <div
          role="alert"
          className="rounded-lg border border-estado-pendiente bg-superficie p-3 text-sm text-texto-principal"
        >
          <p>{visibleState.message}</p>
          <p className="mt-1">
            Pedí un código nuevo con la opción de reenvío.
          </p>
        </div>
      ) : null}

      <form
        noValidate
        action={formAction}
        onSubmit={handleSubmit}
        aria-busy={isPending}
        className="space-y-5"
      >
        <input type="hidden" name="code" value={code} />

        <fieldset
          disabled={isPending || isSuccess}
          className="min-w-0 border-0 p-0"
        >
          <legend className="sr-only">
            Código de verificación de 5 dígitos
          </legend>

          <div className="flex justify-center gap-2 sm:gap-3">
            {Array.from({ length: CODE_LENGTH }, (_, index) => {
              const value = digits[index] === " " ? "" : digits[index];

              return (
                <input
                  key={index}
                  ref={(element) => {
                    inputsRef.current[index] = element;
                  }}
                  id={`verify-code-${index}`}
                  type="text"
                  value={value}
                  onChange={(event) => handleChange(index, event)}
                  onKeyDown={(event) => handleKeyDown(index, event)}
                  onPaste={(event) => handlePaste(index, event)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label={`Dígito ${index + 1} de 5`}
                  aria-invalid={codeError ? true : undefined}
                  aria-describedby={codeError ? "verify-code-error" : undefined}
                  className={`h-12 w-11 rounded-lg border bg-superficie text-center text-xl font-semibold text-texto-principal transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario sm:h-14 sm:w-12 ${
                    codeError
                      ? "border-estado-error-borde focus:border-estado-error-borde focus:ring-estado-error-borde"
                      : "border-borde-input focus:border-borde-focus focus:ring-borde-focus"
                  }`}
                />
              );
            })}
          </div>
        </fieldset>

        {codeError ? (
          <p
            id="verify-code-error"
            role="alert"
            className="flex items-start justify-center gap-1 text-sm text-texto-principal"
          >
            <ErrorIcon />
            <span>{codeError}</span>
          </p>
        ) : null}

        <div className="flex justify-center">
          <button
            type={isSuccess ? "button" : "submit"}
            disabled={!isSuccess && (!complete || isPending || isMissing)}
            aria-busy={isPending}
            aria-label={isSuccess ? "Correo verificado" : undefined}
            tabIndex={isSuccess ? -1 : undefined}
            className={`flex h-12 w-full max-w-xs items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2 disabled:cursor-not-allowed ${
              isSuccess
                ? "bg-verde-institucional text-superficie"
                : "bg-azul-institucional text-superficie hover:opacity-90 disabled:bg-borde-input disabled:text-texto-principal"
            }`}
          >
            {isSuccess ? (
              <Image
                src="/icons/ico-verify.svg"
                alt=""
                aria-hidden="true"
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 brightness-0 invert"
              />
            ) : isPending ? (
              <>
                <Spinner />
                Verificando
              </>
            ) : (
              "Verificar código"
            )}
          </button>
        </div>
      </form>

      {isSuccess ? (
        <p role="status" className="sr-only">
          Correo verificado. Te llevamos al inicio de sesión.
        </p>
      ) : (
        <div className="border-t border-borde-input pt-4 text-center">
          <form action={resendFormAction} onSubmit={handleResendSubmit}>
            <button
              type="submit"
              disabled={isResendPending || isWaiting || isPending || isMissing}
              aria-busy={isResendPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-borde-input bg-superficie px-6 py-3 text-base font-semibold text-azul-institucional transition-colors hover:bg-fondo-app focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-borde-input disabled:bg-fondo-app disabled:text-texto-secundario"
            >
              {isResendPending ? (
                <>
                  <Spinner small />
                  Reenviando
                </>
              ) : (
                "Reenviar código"
              )}
            </button>
          </form>

          <p className="mt-2 text-sm text-texto-secundario">
            Reenvíos disponibles hoy: {remainingResends} de{" "}
            {MAX_RESENDS_PER_DAY}.
          </p>

          {resendState.status === "sent" ? (
            <p role="status" className="mt-2 text-sm text-texto-principal">
              {resendState.message}
            </p>
          ) : null}

          {isWaiting ? (
            <p aria-live="off" className="mt-1 text-sm text-texto-principal">
              Podés reenviar en {remainingSeconds} s.
            </p>
          ) : null}

          {resendState.status === "failed" ? (
            <div
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-lg border border-estado-error-borde bg-superficie p-3 text-left text-sm text-texto-principal"
            >
              <BannerIcon />
              <p>{resendState.message}</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
