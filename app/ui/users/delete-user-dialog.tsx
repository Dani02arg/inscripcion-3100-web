"use client";

import { useActionState, useEffect, useRef } from "react";

import { deleteUserAction } from "../../lib/actions/users.ts";
import { USER_ACTION_IDLE_STATE } from "../../lib/users/user-state.ts";
import {
  formatUserFullName,
  getUserRoleLabel,
  USER_NO_INFO_LABEL,
} from "../../lib/users/labels.ts";
import type {
  UserActionState,
  UserOrigin,
  UserSummary,
} from "../../lib/users/types.ts";
import CourseDialog from "../courses/course-dialog.tsx";

interface DeleteUserDialogProps {
  readonly user: UserSummary;
  readonly origin?: UserOrigin;
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

const DANGER_BUTTON_CLASSES =
  `${BUTTON_CLASSES} bg-estado-rechazado text-superficie hover:opacity-90`;

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

/** Confirma una baja lógica; nunca ofrece una acción de restauración. */
export default function DeleteUserDialog({
  user,
  origin,
  onClose,
  onSuccess,
  onNotFound,
}: DeleteUserDialogProps) {
  const [state, formAction, isPending] = useActionState<
    UserActionState,
    FormData
  >(deleteUserAction, USER_ACTION_IDLE_STATE);
  const completedRef = useRef(false);
  const notFoundRef = useRef(false);
  const errorMessage = getErrorMessage(state);
  const name = formatUserFullName(user);
  const dni = user.dni?.trim() || USER_NO_INFO_LABEL;
  const email = user.email?.trim() || USER_NO_INFO_LABEL;
  const role = getUserRoleLabel(user.role);

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
      id="delete-user-dialog"
      title="Dar de baja usuario"
      describedBy="delete-user-consequence"
      onClose={onClose}
      closeDisabled={isPending}
    >
      <form
        action={formAction}
        className="space-y-5"
        aria-busy={isPending}
        onSubmit={(event) => {
          if (isPending) {
            event.preventDefault();
          }
        }}
      >
        <input type="hidden" name="userId" value={user.id} />
        {origin ? (
          <input type="hidden" name="origin" value={origin} />
        ) : null}

        <div className="space-y-2 text-base text-texto-principal">
          <p>
            Vas a dar de baja a <strong>{name}</strong>.
          </p>
          <dl className="grid gap-1 sm:grid-cols-[auto_1fr] sm:gap-x-3">
            <dt className="font-semibold">DNI</dt>
            <dd>{dni}</dd>
            <dt className="font-semibold">Correo</dt>
            <dd className="break-all">{email}</dd>
            <dt className="font-semibold">Rol</dt>
            <dd>{role}</dd>
          </dl>
        </div>

        <p
          id="delete-user-consequence"
          className="rounded-xl border border-estado-pendiente bg-estado-pendiente-fondo p-3 text-base text-texto-principal"
        >
          La baja es lógica: la persona no podrá volver a iniciar sesión y
          dejará de aparecer en los listados.
        </p>

        {errorMessage ? (
          <p role="alert" className="text-base text-estado-rechazado">
            {errorMessage}
          </p>
        ) : null}

        {isPending ? (
          <p role="status" className="text-sm text-texto-secundario">
            Procesando la baja…
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
            disabled={isPending}
            aria-busy={isPending}
            className={DANGER_BUTTON_CLASSES}
          >
            {isPending ? "Dando de baja..." : "Confirmar baja"}
          </button>
        </div>
      </form>
    </CourseDialog>
  );
}
