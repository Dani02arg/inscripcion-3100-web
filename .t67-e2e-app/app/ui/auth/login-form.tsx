"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useActionState } from "react";

import { loginAction } from "../../lib/actions/login.ts";
import {
  LOGIN_FORM_FIELDS,
  validateLoginInput,
  type LoginActionState,
  type LoginField,
  type LoginInput,
} from "../../lib/validation/login.ts";
import PasswordInput from "./password-input";
import TextField from "./text-field";

const INITIAL_STATE: LoginActionState = {
  status: "idle",
  message: "",
  errors: {},
};

const EMPTY_VALUES: LoginInput = {
  email: "",
  password: "",
};

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

export default function LoginForm() {
  const [values, setValues] = useState<LoginInput>(EMPTY_VALUES);
  const [touched, setTouched] = useState<
    Partial<Record<LoginField, boolean>>
  >({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [clearedServerFields, setClearedServerFields] = useState<
    ReadonlySet<LoginField>
  >(new Set());
  const [hiddenMessageState, setHiddenMessageState] =
    useState<LoginActionState | null>(null);
  const submitLock = useRef(false);

  const [state, formAction, isPending] = useActionState(
    loginAction,
    INITIAL_STATE,
  );

  const validation = validateLoginInput(values);
  const serverMessageHidden = hiddenMessageState === state;

  useEffect(() => {
    if (!isPending) {
      submitLock.current = false;
    }
  }, [isPending]);

  function handleValueChange(field: LoginField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) =>
      current[field] ? current : { ...current, [field]: true },
    );
    setHiddenMessageState(state);
    setClearedServerFields((current) => {
      if (current.has(field)) {
        return current;
      }

      const next = new Set(current);
      next.add(field);
      return next;
    });
  }

  function handleBlur(field: LoginField) {
    setTouched((current) =>
      current[field] ? current : { ...current, [field]: true },
    );
  }

  function getFieldError(field: LoginField): string | undefined {
    const serverError =
      state.status === "error" && !clearedServerFields.has(field)
        ? state.errors[field]
        : undefined;

    if (serverError) {
      return serverError;
    }

    return showAllErrors || touched[field]
      ? validation.errors[field]
      : undefined;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isPending || submitLock.current) {
      event.preventDefault();
      return;
    }

    const currentValidation = validateLoginInput(values);

    if (!currentValidation.valid) {
      event.preventDefault();
      setShowAllErrors(true);
      setHiddenMessageState(state);
      setClearedServerFields(new Set<LoginField>(LOGIN_FORM_FIELDS));
      return;
    }

    setShowAllErrors(false);
    setHiddenMessageState(state);
    setClearedServerFields(new Set<LoginField>());
    submitLock.current = true;
  }

  function changeHandler(field: LoginField) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      handleValueChange(field, event.target.value);
    };
  }

  return (
    <form
      noValidate
      action={formAction}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className="space-y-5"
    >
      {state.status === "error" && state.message && !serverMessageHidden ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-estado-error-borde bg-superficie p-3 text-sm text-texto-principal"
        >
          <BannerIcon />
          <p>{state.message}</p>
        </div>
      ) : null}

      <TextField
        id="login-email"
        name="email"
        label="Correo electrónico"
        type="email"
        value={values.email}
        onChange={changeHandler("email")}
        onBlur={() => handleBlur("email")}
        inputMode="email"
        autoComplete="email"
        placeholder="Ej.: nombre@correo.com"
        required
        error={getFieldError("email")}
      />

      <PasswordInput
        id="login-password"
        name="password"
        label="Contraseña"
        value={values.password}
        onChange={changeHandler("password")}
        onBlur={() => handleBlur("password")}
        required
        showPasswordPolicy={false}
        allowPaste
        allowDrop
        autoComplete="current-password"
        error={getFieldError("password")}
      />

      <div className="flex flex-col gap-3 pt-2 md:flex-row">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="flex-1 rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Ingresando..." : "Iniciar sesión"}
        </button>

        <Link
          href="/register"
          className="flex-1 rounded-xl border border-borde-input bg-superficie px-6 py-3 text-center text-base font-semibold text-azul-institucional transition-colors hover:bg-fondo-app focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
        >
          Registrarse
        </Link>
      </div>

      <div className="text-center">
        <Link
          href="/password-recovery"
          className="rounded text-sm font-semibold text-azul-institucional underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
        >
          Recuperar contraseña
        </Link>
      </div>
    </form>
  );
}
