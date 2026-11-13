"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { changeUserRoleAction } from "../../lib/actions/users.ts";
import { isKnownRole } from "../../lib/auth/session.ts";
import { KNOWN_ROLES, ROLE_LABELS } from "../../lib/auth/types.ts";
import { USER_ACTION_IDLE_STATE } from "../../lib/users/user-state.ts";
import {
  USER_NO_INFO_LABEL,
  getUserRoleLabel,
  formatUserFullName,
} from "../../lib/users/labels.ts";
import type { UserRole } from "../../lib/auth/types.ts";
import type {
  UserActionState,
  UserSummary,
} from "../../lib/users/types.ts";
import CourseDialog from "../courses/course-dialog.tsx";

interface ChangeRoleDialogProps {
  readonly user: UserSummary;
  readonly targetVerified?: boolean;
  readonly onClose: () => void;
  readonly onSuccess: (message: string) => void;
  readonly onNotFound: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-base font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

const SECONDARY_BUTTON_CLASSES =
  `${BUTTON_CLASSES} border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app`;

const PRIMARY_BUTTON_CLASSES =
  `${BUTTON_CLASSES} bg-azul-institucional text-superficie hover:opacity-90`;

function getErrorMessage(state: UserActionState): string | null {
  switch (state.status) {
    case "validation":
    case "conflict":
    case "forbidden":
    case "not_found":
    case "error":
      return state.message;
    default:
      return null;
  }
}

function getFieldError(state: UserActionState): string | undefined {
  return state.status === "validation"
    ? state.fieldErrors.newRole
    : undefined;
}

/** Confirma el cambio de rol sin aplicar cambios optimistas. */
export default function ChangeRoleDialog({
  user,
  targetVerified,
  onClose,
  onSuccess,
  onNotFound,
}: ChangeRoleDialogProps) {
  const [state, formAction, isPending] = useActionState<
    UserActionState,
    FormData
  >(changeUserRoleAction, USER_ACTION_IDLE_STATE);
  const [newRole, setNewRole] = useState<UserRole | "">("");
  const completedRef = useRef(false);
  const notFoundRef = useRef(false);
  const errorMessage = getErrorMessage(state);
  const fieldError = getFieldError(state);
  const name = formatUserFullName(user);
  const dni = user.dni?.trim() || USER_NO_INFO_LABEL;
  const email = user.email?.trim() || USER_NO_INFO_LABEL;

  useEffect(() => {
    if (state.status === "success" && !completedRef.current) {
      completedRef.current = true;
      onSuccess(state.message);
    } else if (state.status === "not_found" && !notFoundRef.current) {
      notFoundRef.current = true;
      onNotFound();
    }
  }, [onNotFound, onSuccess, state]);

  return (
    <CourseDialog
      open
      id="change-user-role-dialog"
      title="Cambiar rol"
      describedBy="change-user-role-description"
      onClose={onClose}
      closeDisabled={isPending}
    >
      <form
        action={formAction}
        className="space-y-5"
        aria-busy={isPending}
        onSubmit={(event) => {
          if (isPending || newRole.length === 0 || newRole === user.role) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="currentRole" value={user.role} />
        {targetVerified !== undefined ? (
          <input
            type="hidden"
            name="targetVerified"
            value={String(targetVerified)}
          />
        ) : null}

        <div className="space-y-2 text-base text-texto-principal">
          <p id="change-user-role-description">
            Vas a cambiar el rol de <strong>{name}</strong>.
          </p>
          <dl className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-3">
            <dt className="font-semibold">DNI</dt>
            <dd>{dni}</dd>
            <dt className="font-semibold">Correo</dt>
            <dd className="break-all">{email}</dd>
            <dt className="font-semibold">Rol actual</dt>
            <dd>{getUserRoleLabel(user.role)}</dd>
          </dl>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="change-user-role-select"
            className="block text-sm font-medium text-texto-principal"
          >
            Nuevo rol
          </label>
          <select
            id="change-user-role-select"
            name="newRole"
            value={newRole}
            onChange={(event) => {
              const value = event.target.value;
              setNewRole(isKnownRole(value) ? value : "");
            }}
            disabled={isPending}
            required
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={
              fieldError ? "change-user-role-error" : undefined
            }
            className={`min-h-11 w-full rounded-lg border bg-superficie px-3 py-2 text-base text-texto-principal focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${
              fieldError
                ? "border-estado-error-borde focus:border-estado-error-borde focus:ring-estado-error-borde"
                : "border-borde-control"
            }`}
          >
            <option value="" disabled>
              Seleccioná un rol
            </option>
            {KNOWN_ROLES.map((role) => {
              const isCurrentRole = role === user.role;

              return (
                <option key={role} value={role} disabled={isCurrentRole}>
                  {ROLE_LABELS[role]}
                  {isCurrentRole ? " (Rol actual)" : ""}
                </option>
              );
            })}
            {!isKnownRole(user.role) ? (
              <option value={user.role} disabled>
                {getUserRoleLabel(user.role)} (Rol actual)
              </option>
            ) : null}
          </select>
          {fieldError ? (
            <p
              id="change-user-role-error"
              className="text-sm text-estado-error-texto"
            >
              {fieldError}
            </p>
          ) : null}
        </div>

        {errorMessage ? (
          <p role="alert" className="text-base text-estado-rechazado">
            {errorMessage}
          </p>
        ) : null}

        {isPending ? (
          <p role="status" className="text-sm text-texto-secundario">
            Guardando el nuevo rol…
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={SECONDARY_BUTTON_CLASSES}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              isPending || newRole.length === 0 || newRole === user.role
            }
            aria-busy={isPending}
            className={PRIMARY_BUTTON_CLASSES}
          >
            {isPending ? "Guardando..." : "Confirmar cambio"}
          </button>
        </div>
      </form>
    </CourseDialog>
  );
}
