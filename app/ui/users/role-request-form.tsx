"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { requestRoleChangeAction } from "../../lib/actions/users.ts";
import { USER_ROLE_FORM_OPTIONS } from "../../lib/users/labels.ts";
import type {
  RoleRequestActionState,
  RoleRequestInput,
} from "../../lib/users/types.ts";
import { validateRoleRequest } from "../../lib/validation/users.ts";
import UserNotice from "./user-notice.tsx";

const EMPTY_VALUES: RoleRequestInput = {
  requestedRole: "",
  reason: "",
};

const INITIAL_STATE: RoleRequestActionState = {
  status: "idle",
  message: "",
  values: EMPTY_VALUES,
};

const FIELD_CLASSES =
  "min-h-11 w-full rounded-lg border bg-superficie px-3 py-2 text-base text-texto-principal focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario";

const BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

type RoleRequestField = "requested_role" | "reason";
type RoleRequestErrors = Partial<Record<RoleRequestField, string>>;
type DismissedRoleRequestErrors = Partial<
  Record<RoleRequestField, boolean>
>;

function getServerFieldError(
  state: RoleRequestActionState,
  field: RoleRequestField,
): string | undefined {
  return state.status === "validation" ? state.fieldErrors[field] : undefined;
}

/** Permite al tutor enviar al servicio un pedido de cambio de rol. */
export default function RoleRequestForm({
  currentRole,
}: {
  readonly currentRole: string;
}) {
  const [state, formAction, isPending] = useActionState<
    RoleRequestActionState,
    FormData
  >(requestRoleChangeAction, INITIAL_STATE);
  const [values, setValues] = useState<RoleRequestInput>(EMPTY_VALUES);
  const [localErrors, setLocalErrors] = useState<RoleRequestErrors>({});
  const [dismissedServerState, setDismissedServerState] =
    useState<RoleRequestActionState | null>(null);
  const [dismissedServerErrors, setDismissedServerErrors] =
    useState<DismissedRoleRequestErrors>({});
  const [dismissedNoticeState, setDismissedNoticeState] =
    useState<RoleRequestActionState | null>(null);
  const submissionLock = useRef(false);

  useEffect(() => {
    if (!isPending) {
      submissionLock.current = false;
    }
  }, [isPending]);

  const getFieldError = (field: RoleRequestField) =>
    localErrors[field] ??
    (dismissedServerState === state && dismissedServerErrors[field]
      ? undefined
      : getServerFieldError(state, field));
  const requestedRoleError = getFieldError("requested_role");
  const reasonError = getFieldError("reason");
  const actionError =
    state.status === "forbidden" || state.status === "error"
      ? state.message
      : null;

  function updateField(field: keyof RoleRequestInput, value: string) {
    setValues((previous) => ({ ...previous, [field]: value }));
    setLocalErrors((previous) => {
      const errorField =
        field === "requestedRole" ? "requested_role" : "reason";
      if (!previous[errorField]) {
        return previous;
      }

      const next = { ...previous };
      delete next[errorField];
      return next;
    });
    setDismissedServerState(state);
    setDismissedServerErrors((previous) => ({
      ...previous,
      [field === "requestedRole" ? "requested_role" : "reason"]: true,
    }));
    setDismissedNoticeState(state);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (isPending || submissionLock.current) {
      event.preventDefault();
      return;
    }

    const validation = validateRoleRequest(values, currentRole);
    if (!validation.valid) {
      event.preventDefault();
      setLocalErrors(validation.errors);
      setDismissedServerState(state);
      setDismissedServerErrors({
        requested_role: true,
        reason: true,
      });
      setDismissedNoticeState(state);
      return;
    }

    setLocalErrors({});
    submissionLock.current = true;
  }

  const visibleSuccess =
    state.status === "success" && state !== dismissedNoticeState;
  const dismissNotice = useCallback(() => {
    setDismissedNoticeState(state);
  }, [state]);

  return (
    <form
      action={formAction}
      noValidate
      aria-busy={isPending}
      className="mt-5 space-y-4"
      onSubmit={handleSubmit}
    >
      <div className="space-y-2">
        <label
          htmlFor="role-request-requested-role"
          className="block text-sm font-medium text-texto-principal"
        >
          Rol que querés solicitar
        </label>
        <select
          id="role-request-requested-role"
          name="requestedRole"
          value={values.requestedRole}
          required
          disabled={isPending}
          aria-invalid={requestedRoleError ? true : undefined}
          aria-describedby={
            requestedRoleError
              ? "role-request-requested-role-error"
              : undefined
          }
          onChange={(event) =>
            updateField("requestedRole", event.target.value)
          }
          className={`${FIELD_CLASSES} ${
            requestedRoleError
              ? "border-estado-error-borde focus:border-estado-error-borde focus:ring-estado-error-borde"
              : "border-borde-input"
          }`}
        >
          <option value="" disabled>
            Seleccioná un rol
          </option>
          {USER_ROLE_FORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {requestedRoleError ? (
          <p
            id="role-request-requested-role-error"
            className="text-sm text-estado-error-texto"
          >
            {requestedRoleError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="role-request-reason"
          className="block text-sm font-medium text-texto-principal"
        >
          Motivo
        </label>
        <textarea
          id="role-request-reason"
          name="reason"
          value={values.reason}
          required
          rows={4}
          disabled={isPending}
          aria-invalid={reasonError ? true : undefined}
          aria-describedby={
            reasonError
              ? "role-request-reason-help role-request-reason-error"
              : "role-request-reason-help"
          }
          onChange={(event) => updateField("reason", event.target.value)}
          className={`${FIELD_CLASSES} resize-y ${
            reasonError
              ? "border-estado-error-borde focus:border-estado-error-borde focus:ring-estado-error-borde"
              : "border-borde-input"
          }`}
        />
        <p
          id="role-request-reason-help"
          className="text-sm text-texto-secundario"
        >
          Hasta 500 caracteres.
        </p>
        {reasonError ? (
          <p
            id="role-request-reason-error"
            className="text-sm text-estado-error-texto"
          >
            {reasonError}
          </p>
        ) : null}
      </div>

      {state.status === "validation" && state.message ? (
        <p role="alert" className="text-sm text-estado-rechazado">
          {state.message}
        </p>
      ) : null}

      {actionError ? (
        <p role="alert" className="text-base text-estado-rechazado">
          {actionError}
        </p>
      ) : null}

      {visibleSuccess ? (
        <div className="space-y-3">
          <UserNotice
            notice={{ kind: "success", message: state.message }}
            onClose={dismissNotice}
          />
          <p
            role="note"
            className="rounded-xl border border-estado-pendiente bg-estado-pendiente-fondo p-3 text-base text-texto-principal"
          >
            Este pedido no queda registrado ni notifica a los
            administradores; tampoco modifica tu rol.
          </p>
        </div>
      ) : null}

      {isPending ? (
        <p role="status" className="text-sm text-texto-secundario">
          Enviando la solicitud…
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={BUTTON_CLASSES}
      >
        {isPending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}
