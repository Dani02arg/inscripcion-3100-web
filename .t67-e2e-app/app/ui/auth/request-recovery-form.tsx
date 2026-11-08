"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useActionState } from "react";

import { requestRecoveryAction } from "../../lib/actions/password-recovery.ts";
import {
  readRecoveryRequest,
  writeRecoveryNotice,
  writeRecoveryRequest,
} from "../../lib/recovery/storage.ts";
import {
  validateRecoveryEmail,
  type RequestRecoveryActionState,
} from "../../lib/validation/password-recovery.ts";
import TextField from "./text-field";

const INITIAL_STATE: RequestRecoveryActionState = {
  status: "idle",
  message: "",
  errors: {},
};

const EMPTY_VALUES = { email: "" };

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

export default function RequestRecoveryForm({
  restoreSavedRequest = true,
}: {
  readonly restoreSavedRequest?: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [touched, setTouched] = useState(false);
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [clearedServerField, setClearedServerField] = useState(false);
  const [hiddenMessageState, setHiddenMessageState] =
    useState<RequestRecoveryActionState | null>(null);
  const submitLock = useRef(false);
  const handledState = useRef<RequestRecoveryActionState | null>(null);

  const [state, formAction, isPending] = useActionState(
    requestRecoveryAction,
    INITIAL_STATE,
  );

  const validation = validateRecoveryEmail(values.email);
  const serverMessageHidden = hiddenMessageState === state;
  const isSent = state.status === "sent";

  useEffect(() => {
    if (!restoreSavedRequest) {
      return;
    }

    const request = readRecoveryRequest();

    if (!request) {
      return;
    }

    const timer = window.setTimeout(() => {
      setValues((current) =>
        current.email ? current : { email: request.email },
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [restoreSavedRequest]);

  useEffect(() => {
    if (!isPending) {
      submitLock.current = false;
    }
  }, [isPending]);

  useEffect(() => {
    if (state.status !== "sent" || handledState.current === state) {
      return;
    }

    handledState.current = state;

    writeRecoveryRequest({
      email: state.values?.email ?? values.email,
      requestedAt: Date.now(),
    });
    writeRecoveryNotice();
    router.push("/password-recovery/reset");
  }, [state, values.email, router]);

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setValues({ email: event.target.value });
    setTouched(true);
    setHiddenMessageState(state);
    setClearedServerField(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isPending || isSent || submitLock.current) {
      event.preventDefault();
      return;
    }

    const currentValidation = validateRecoveryEmail(values.email);

    if (!currentValidation.valid) {
      event.preventDefault();
      setShowAllErrors(true);
      setHiddenMessageState(state);
      setClearedServerField(true);
      return;
    }

    setShowAllErrors(false);
    setHiddenMessageState(state);
    setClearedServerField(false);
    submitLock.current = true;
  }

  const serverError =
    state.status === "error" && !clearedServerField
      ? state.errors.email
      : undefined;
  const fieldError =
    serverError ??
    (showAllErrors || touched ? validation.error : undefined);

  return (
    <form
      noValidate
      action={formAction}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className="space-y-5"
    >
      {state.status === "error" &&
      state.message &&
      !serverMessageHidden ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-estado-error-borde bg-superficie p-3 text-sm text-texto-principal"
        >
          <BannerIcon />
          <p>{state.message}</p>
        </div>
      ) : null}

      <TextField
        id="password-recovery-email"
        name="email"
        label="Correo electrónico"
        type="email"
        value={values.email}
        onChange={handleEmailChange}
        onBlur={() => setTouched(true)}
        inputMode="email"
        autoComplete="email"
        placeholder="Ej.: nombre@correo.com"
        disabled={isPending || isSent}
        required
        error={fieldError}
      />

      <button
        type="submit"
        disabled={isPending || isSent}
        aria-busy={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? (
          <>
            <Spinner />
            Solicitando
          </>
        ) : (
          "Solicitar código"
        )}
      </button>
    </form>
  );
}
