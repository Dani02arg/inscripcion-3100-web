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

import { registerAction } from "../../lib/actions/auth.ts";
import {
  REGISTER_FORM_FIELDS,
  validateRegisterInput,
  type RegisterActionState,
  type RegisterField,
  type RegisterInput,
} from "../../lib/validation/register.ts";
import BirthdatePicker from "./birthdate-picker";
import PasswordInput from "./password-input";
import TextField from "./text-field";

const INITIAL_STATE: RegisterActionState = {
  status: "idle",
  message: "",
  errors: {},
};

const EMPTY_VALUES: RegisterInput = {
  dni: "",
  cuil: "",
  name: "",
  lastname: "",
  email: "",
  password: "",
  confirmPassword: "",
  user_phone: "",
  birthdate: "",
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

export default function RegisterForm() {
  const [values, setValues] = useState<RegisterInput>(EMPTY_VALUES);
  const [touched, setTouched] = useState<
    Partial<Record<RegisterField, boolean>>
  >({});
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [clearedServerFields, setClearedServerFields] = useState<
    ReadonlySet<RegisterField>
  >(new Set());
  const [hiddenMessageState, setHiddenMessageState] =
    useState<RegisterActionState | null>(null);
  const submitLock = useRef(false);

  const [state, formAction, isPending] = useActionState(
    registerAction,
    INITIAL_STATE,
  );

  const validation = validateRegisterInput(values);
  const serverMessageHidden = hiddenMessageState === state;

  useEffect(() => {
    if (!isPending) {
      submitLock.current = false;
    }
  }, [isPending]);

  function handleValueChange(field: RegisterField, value: string) {
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

  function handleBlur(field: RegisterField) {
    setTouched((current) =>
      current[field] ? current : { ...current, [field]: true },
    );
  }

  function getFieldError(field: RegisterField): string | undefined {
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

    const currentValidation = validateRegisterInput(values);

    if (!currentValidation.valid) {
      event.preventDefault();
      setShowAllErrors(true);
      setHiddenMessageState(state);
      setClearedServerFields(
        new Set<RegisterField>(REGISTER_FORM_FIELDS),
      );
      return;
    }

    setShowAllErrors(false);
    setHiddenMessageState(state);
    setClearedServerFields(new Set<RegisterField>());
    submitLock.current = true;
  }

  function changeHandler(field: RegisterField) {
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id="register-name"
          name="name"
          label="Nombre"
          value={values.name}
          onChange={changeHandler("name")}
          onBlur={() => handleBlur("name")}
          autoComplete="given-name"
          required
          error={getFieldError("name")}
        />
        <TextField
          id="register-lastname"
          name="lastname"
          label="Apellido"
          value={values.lastname}
          onChange={changeHandler("lastname")}
          onBlur={() => handleBlur("lastname")}
          autoComplete="family-name"
          required
          error={getFieldError("lastname")}
        />
        <TextField
          id="register-dni"
          name="dni"
          label="DNI"
          value={values.dni}
          onChange={changeHandler("dni")}
          onBlur={() => handleBlur("dni")}
          inputMode="numeric"
          autoComplete="off"
          placeholder="Ej.: 12345678"
          required
          error={getFieldError("dni")}
        />
        <TextField
          id="register-cuil"
          name="cuil"
          label="CUIL"
          value={values.cuil}
          onChange={changeHandler("cuil")}
          onBlur={() => handleBlur("cuil")}
          autoComplete="off"
          placeholder="Ej.: 20-12345678-9"
          helpText="Podés ingresarlo con o sin guiones."
          required
          error={getFieldError("cuil")}
        />
      </div>

      <BirthdatePicker
        id="register-birthdate"
        value={values.birthdate}
        onChange={(value) => handleValueChange("birthdate", value)}
        helpText="Escribí tu fecha como DD/MM/YYYY o elegila en el calendario."
        required
        error={getFieldError("birthdate")}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField
          id="register-email"
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
        <TextField
          id="register-phone"
          name="user_phone"
          label="Teléfono"
          type="tel"
          value={values.user_phone}
          onChange={changeHandler("user_phone")}
          onBlur={() => handleBlur("user_phone")}
          inputMode="tel"
          autoComplete="tel"
          placeholder="Ej.: 1123456789"
          helpText="10 dígitos, sin el prefijo +54."
          required
          error={getFieldError("user_phone")}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <PasswordInput
          id="register-password"
          name="password"
          label="Contraseña"
          value={values.password}
          onChange={changeHandler("password")}
          onBlur={() => handleBlur("password")}
          helpText="Entre 8 y 16 caracteres, con mayúscula, minúscula y número o carácter especial."
          required
          error={getFieldError("password")}
        />

        <PasswordInput
          id="register-confirm-password"
          name="confirmPassword"
          label="Confirmar contraseña"
          value={values.confirmPassword}
          onChange={changeHandler("confirmPassword")}
          onBlur={() => handleBlur("confirmPassword")}
          helpText="Repetí la contraseña exactamente."
          required
          showPasswordPolicy={false}
          error={getFieldError("confirmPassword")}
        />
      </div>

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className="flex-1 rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Registrando" : "Registrarse"}
        </button>

        {/* Enlace al inicio de sesión, implementado en la spec 006. */}
        <Link
          href="/login"
          className="flex-1 rounded-xl border border-borde-input bg-superficie px-6 py-3 text-center text-base font-semibold text-azul-institucional transition-colors hover:bg-fondo-app focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
        >
          Iniciar sesión
        </Link>
      </div>
    </form>
  );
}
