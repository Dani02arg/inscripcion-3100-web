"use client";

import Link from "next/link";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";

import { resetPasswordAction } from "../../lib/actions/password-recovery.ts";
import {
  isRecoveryExpired,
  maskRecoveryEmail,
  type RecoveryRequest,
} from "../../lib/recovery/request-value.ts";
import {
  consumeRecoveryNotice,
  readRecoveryRequest,
} from "../../lib/recovery/storage.ts";
import {
  validateNewPassword,
  validateRecoveryCode,
  type ResetPasswordActionState,
  type ResetPasswordField,
} from "../../lib/validation/password-recovery.ts";
import { normalizeCode } from "../../lib/verification/code.ts";
import PasswordInput from "./password-input";
import RecoveryCodeField from "./recovery-code-field";

const INITIAL_STATE: ResetPasswordActionState = {
  status: "idle",
  message: "",
  errors: {},
};

const EMPTY_SLOTS = "     ";

const REQUEST_SENT_MESSAGE =
  "Se ha enviado un código de recuperación a tu correo.";

const MISSING_REQUEST_MESSAGE =
  "No hay una solicitud de recuperación activa. Volvé a solicitar un código.";

const EXPIRED_REQUEST_MESSAGE =
  "La solicitud venció. Volvé a solicitar un código.";

const SUCCESS_MESSAGE = "Contraseña restablecida correctamente.";

type RequestPhase = "loading" | "missing" | "expired" | "ready";

interface DismissedErrors {
  state: ResetPasswordActionState;
  fields: Partial<Record<ResetPasswordField, boolean>>;
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

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-5 w-5 animate-spin"
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

function RequestLink() {
  return (
    <Link
      href="/password-recovery"
      className="inline-flex items-center justify-center rounded-xl border border-borde-input bg-superficie px-6 py-3 text-base font-semibold text-azul-institucional transition-colors hover:bg-fondo-app focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
    >
      Volver a solicitar
    </Link>
  );
}

function RequestProblem({ message }: { message: string }) {
  return (
    <div className="space-y-5">
      <p
        role="alert"
        className="flex items-start gap-2 rounded-lg border border-estado-error-borde bg-superficie p-3 text-sm text-texto-principal"
      >
        <BannerIcon />
        <span>{message}</span>
      </p>

      <RequestLink />
    </div>
  );
}

export default function ResetPasswordForm() {
  const [phase, setPhase] = useState<RequestPhase>("loading");
  const [request, setRequest] = useState<RecoveryRequest | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const [code, setCode] = useState(EMPTY_SLOTS);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [touched, setTouched] = useState<
    Partial<Record<ResetPasswordField, boolean>>
  >({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [dismissedErrors, setDismissedErrors] =
    useState<DismissedErrors | null>(null);
  const [hiddenMessageState, setHiddenMessageState] =
    useState<ResetPasswordActionState | null>(null);
  const submitLock = useRef(false);
  const handledInvalidCode = useRef<ResetPasswordActionState | null>(null);

  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    INITIAL_STATE,
  );

  const normalizedCode = normalizeCode(code);
  const passwordValidation = validateNewPassword(password, confirmation);
  const isSuccess = state.status === "success";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readRecoveryRequest();
      const notice = consumeRecoveryNotice();

      if (!stored) {
        setPhase("missing");
        return;
      }

      setRequest(stored);

      if (isRecoveryExpired(stored)) {
        setPhase("expired");
        return;
      }

      setPhase("ready");
      setShowNotice(notice);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isPending) {
      submitLock.current = false;
    }
  }, [isPending]);

  useEffect(() => {
    if (
      state.status !== "invalid_code" ||
      handledInvalidCode.current === state
    ) {
      return;
    }

    handledInvalidCode.current = state;

    const timer = window.setTimeout(() => {
      setCode(EMPTY_SLOTS);
      document.getElementById("password-recovery-code-0")?.focus();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [state]);

  function dismissServerErrors(fields: ResetPasswordField[]) {
    setDismissedErrors((current) => {
      const currentFields =
        current?.state === state ? current.fields : {};

      return {
        state,
        fields: fields.reduce(
          (result, field) => ({ ...result, [field]: true }),
          currentFields,
        ),
      };
    });
  }

  function serverFieldError(
    field: ResetPasswordField,
  ): string | undefined {
    const error = state.errors[field];

    if (!error) {
      return undefined;
    }

    if (
      dismissedErrors?.state === state &&
      dismissedErrors.fields[field]
    ) {
      return undefined;
    }

    return error;
  }

  function fieldError(
    field: ResetPasswordField,
    localError?: string,
  ): string | undefined {
    return (
      serverFieldError(field) ??
      (showAllErrors || touched[field] ? localError : undefined)
    );
  }

  function markTouched(field: ResetPasswordField) {
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function handleCodeChange(value: string) {
    setCode(value);
    dismissServerErrors(["code"]);
  }

  function handlePasswordChange(event: ChangeEvent<HTMLInputElement>) {
    setPassword(event.target.value);
    markTouched("password");
    dismissServerErrors(["password", "passwordConfirmation"]);
  }

  function handleConfirmationChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setConfirmation(event.target.value);
    markTouched("passwordConfirmation");
    dismissServerErrors(["passwordConfirmation"]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isPending || isSuccess || submitLock.current) {
      event.preventDefault();
      return;
    }

    if (phase !== "ready" || !request) {
      event.preventDefault();
      return;
    }

    const codeError = validateRecoveryCode(normalizedCode);
    const currentValidation = validateNewPassword(
      password,
      confirmation,
    );

    if (codeError || !currentValidation.valid) {
      event.preventDefault();
      setShowAllErrors(true);
      setTouched({
        code: true,
        password: true,
        passwordConfirmation: true,
      });
      return;
    }

    setShowAllErrors(false);
    setHiddenMessageState(state);
    setDismissedErrors({
      state,
      fields: {
        code: true,
        password: true,
        passwordConfirmation: true,
      },
    });
    submitLock.current = true;
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    formData.set("email", request.email);
    startTransition(() => formAction(formData));
  }

  const codeError = fieldError(
    "code",
    validateRecoveryCode(normalizedCode),
  );
  const passwordError = fieldError(
    "password",
    passwordValidation.errors.password,
  );
  const confirmationError = fieldError(
    "passwordConfirmation",
    passwordValidation.errors.passwordConfirmation,
  );
  const serverMessageHidden = hiddenMessageState === state;
  const emailError = serverFieldError("email");
  const generalMessage =
    state.status === "invalid_code" || isSuccess
      ? ""
      : state.message || emailError || "";
  const visibleGeneralMessage =
    generalMessage && !serverMessageHidden ? generalMessage : "";
  const needsRequestAction =
    state.status === "email_not_registered" ||
    state.status === "timeout";

  if (isSuccess) {
    return (
      <div className="space-y-5">
        <p
          role="status"
          className="rounded-lg border border-borde-input bg-fondo-app p-4 text-base font-semibold text-texto-principal"
        >
          {SUCCESS_MESSAGE}
        </p>

        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <p role="status" className="text-base text-texto-principal">
        Cargando la solicitud de recuperación.
      </p>
    );
  }

  if (phase === "missing") {
    return <RequestProblem message={MISSING_REQUEST_MESSAGE} />;
  }

  if (phase === "expired") {
    return <RequestProblem message={EXPIRED_REQUEST_MESSAGE} />;
  }

  if (!request) {
    return <RequestProblem message={MISSING_REQUEST_MESSAGE} />;
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className="space-y-5"
    >
      {showNotice ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-borde-input bg-fondo-app p-3 text-sm text-texto-principal"
        >
          {REQUEST_SENT_MESSAGE}
        </p>
      ) : null}

      <p className="text-base text-texto-principal">
        Enviamos el código a{" "}
        <strong className="font-semibold">
          {maskRecoveryEmail(request.email)}
        </strong>
        .
      </p>

      {visibleGeneralMessage ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-estado-error-borde bg-superficie p-3 text-sm text-texto-principal"
        >
          <BannerIcon />
          <p>{visibleGeneralMessage}</p>
        </div>
      ) : null}

      <div>
        <p className="mb-2 block text-sm font-medium text-texto-principal">
          Código de recuperación
        </p>

        <RecoveryCodeField
          id="password-recovery-code"
          name="code"
          value={code}
          onChange={handleCodeChange}
          error={codeError}
          disabled={isPending}
        />
      </div>

      <PasswordInput
        id="password-recovery-password"
        name="password"
        label="Nueva contraseña"
        value={password}
        onChange={handlePasswordChange}
        onBlur={() => markTouched("password")}
        helpText="Entre 8 y 16 caracteres, con mayúscula, minúscula y número o carácter especial."
        autoComplete="new-password"
        required
        disabled={isPending}
        error={passwordError}
      />

      <PasswordInput
        id="password-recovery-confirmation"
        name="passwordConfirmation"
        label="Confirmar nueva contraseña"
        value={confirmation}
        onChange={handleConfirmationChange}
        onBlur={() => markTouched("passwordConfirmation")}
        helpText="Repetí la nueva contraseña exactamente."
        autoComplete="new-password"
        required
        disabled={isPending}
        showPasswordPolicy={false}
        error={confirmationError}
      />

      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Spinner />
            Cambiando
          </>
        ) : (
          "Cambiar contraseña"
        )}
      </button>

      {needsRequestAction ? (
        <div className="flex flex-col gap-3 sm:flex-row">
          <RequestLink />

          {state.status === "timeout" ? (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
            >
              Ir a iniciar sesión
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="flex justify-center">
          <Link
            href="/password-recovery"
            className="inline-flex min-h-11 items-center justify-center rounded-sm px-2 text-sm font-semibold text-azul-institucional underline-offset-4 transition-colors hover:underline focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
          >
            Volver a solicitar
          </Link>
        </div>
      )}
    </form>
  );
}
