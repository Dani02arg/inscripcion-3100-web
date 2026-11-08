"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";

import { updateTutorProfileAction } from "../../lib/actions/users.ts";
import { EDUCATION_LEVEL_OPTIONS } from "../../lib/users/labels.ts";
import { getTutorProfileValues } from "../../lib/users/profile.ts";
import { getTutorProfileFormValues } from "../../lib/users/user-state.ts";
import type { CurrentUser } from "../../lib/auth/types.ts";
import type {
  TutorProfileActionState,
  TutorProfileInput,
} from "../../lib/users/types.ts";
import { validateTutorProfile } from "../../lib/validation/users.ts";
import UserNotice from "./user-notice.tsx";

interface TutorProfileFormProps {
  readonly user: CurrentUser;
}

type TutorProfileField = "occupation" | "education_level";
type TutorProfileErrors = Partial<Record<TutorProfileField, string>>;

const FIELD_CLASSES =
  "min-h-11 w-full rounded-lg border bg-superficie px-3 py-2 text-base text-texto-principal focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario";

const BUTTON_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

function getTutorProfileFieldError(
  state: TutorProfileActionState,
  field: TutorProfileField,
): string | undefined {
  if (state.status !== "validation") {
    return undefined;
  }

  return state.fieldErrors[field];
}

/** Permite al tutor editar sus datos profesionales sin editar el resto del perfil. */
export default function TutorProfileForm({
  user,
}: TutorProfileFormProps) {
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const initialValues = getTutorProfileValues(user);
  const initialState: TutorProfileActionState = {
    status: "idle",
    message: "",
    values: initialValues,
  };
  const [state, formAction, isPending] = useActionState<
    TutorProfileActionState,
    FormData
  >(updateTutorProfileAction, initialState);
  const [editedValues, setEditedValues] = useState<{
    readonly actionState: TutorProfileActionState;
    readonly values: TutorProfileInput;
  } | null>(null);
  const [localErrors, setLocalErrors] = useState<TutorProfileErrors>({});
  const [dismissedServerErrors, setDismissedServerErrors] = useState<
    Partial<Record<TutorProfileField, boolean>>
  >({});
  const [dismissedServerState, setDismissedServerState] =
    useState<TutorProfileActionState | null>(null);
  const [dismissedNoticeState, setDismissedNoticeState] =
    useState<TutorProfileActionState | null>(null);
  const submissionLock = useRef(false);
  const refreshedState = useRef<TutorProfileActionState | null>(null);
  const isBusy = isPending || isRefreshing;
  const actionValues = getTutorProfileFormValues(state, initialValues);
  const values =
    editedValues?.actionState === state
      ? editedValues.values
      : actionValues;

  useEffect(() => {
    if (!isPending) {
      submissionLock.current = false;
    }
  }, [isPending]);

  useEffect(() => {
    if (
      state.status !== "success" ||
      refreshedState.current === state
    ) {
      return;
    }

    refreshedState.current = state;
    startTransition(() => router.refresh());
  }, [router, startTransition, state]);

  const activeDismissedServerErrors =
    dismissedServerState === state ? dismissedServerErrors : {};
  const getFieldError = (field: TutorProfileField) =>
    localErrors[field] ??
    (activeDismissedServerErrors[field]
      ? undefined
      : getTutorProfileFieldError(state, field));

  const occupationError = getFieldError("occupation");
  const educationError = getFieldError("education_level");
  const actionError =
    state.status === "forbidden" || state.status === "error"
      ? state.message
      : null;
  const dismissNotice = useCallback(() => {
    setDismissedNoticeState(state);
  }, [setDismissedNoticeState, state]);

  const updateField = (
    field: "occupation" | "educationLevel",
    value: string,
  ) => {
    setEditedValues({
      actionState: state,
      values: { ...values, [field]: value },
    });

    const errorField =
      field === "educationLevel" ? "education_level" : "occupation";
    setLocalErrors((previous) => {
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
      [errorField]: true,
    }));
  };

  return (
    <form
      action={formAction}
      noValidate
      aria-busy={isBusy}
      className="mt-5 space-y-4"
      onSubmit={(event) => {
        if (isBusy || submissionLock.current) {
          event.preventDefault();
          return;
        }

        const validation = validateTutorProfile(values);
        if (!validation.valid) {
          event.preventDefault();
          setLocalErrors(validation.errors);
          setDismissedServerState(state);
          setDismissedServerErrors({
            occupation: true,
            education_level: true,
          });
          return;
        }

        setLocalErrors({});
        submissionLock.current = true;
      }}
    >
      <div className="space-y-2">
        <label
          htmlFor="tutor-profile-occupation"
          className="block text-sm font-medium text-texto-principal"
        >
          Ocupación
        </label>
        <input
          id="tutor-profile-occupation"
          name="occupation"
          type="text"
          value={values.occupation}
          maxLength={100}
          required
          disabled={isBusy}
          aria-invalid={occupationError ? true : undefined}
          aria-describedby={
            occupationError
              ? "tutor-profile-occupation-error tutor-profile-occupation-help"
              : "tutor-profile-occupation-help"
          }
          onChange={(event) => updateField("occupation", event.target.value)}
          className={`${FIELD_CLASSES} ${
            occupationError
              ? "border-estado-error-borde focus:border-estado-error-borde focus:ring-estado-error-borde"
              : "border-borde-input"
          }`}
        />
        <p
          id="tutor-profile-occupation-help"
          className="text-sm text-texto-secundario"
        >
          Máximo 100 caracteres.
        </p>
        {occupationError ? (
          <p
            id="tutor-profile-occupation-error"
            className="text-sm text-estado-error-texto"
          >
            {occupationError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="tutor-profile-education-level"
          className="block text-sm font-medium text-texto-principal"
        >
          Nivel educativo
        </label>
        <select
          id="tutor-profile-education-level"
          name="educationLevel"
          value={values.educationLevel}
          required
          disabled={isBusy}
          aria-invalid={educationError ? true : undefined}
          aria-describedby={
            educationError ? "tutor-profile-education-level-error" : undefined
          }
          onChange={(event) =>
            updateField("educationLevel", event.target.value)
          }
          className={`${FIELD_CLASSES} ${
            educationError
              ? "border-estado-error-borde focus:border-estado-error-borde focus:ring-estado-error-borde"
              : "border-borde-input"
          }`}
        >
          <option value="" disabled>
            Seleccioná tu nivel educativo
          </option>
          {EDUCATION_LEVEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {educationError ? (
          <p
            id="tutor-profile-education-level-error"
            className="text-sm text-estado-error-texto"
          >
            {educationError}
          </p>
        ) : null}
      </div>

      {state.status === "validation" &&
      state.message &&
      dismissedServerState !== state ? (
        <p role="alert" className="text-sm text-estado-rechazado">
          {state.message}
        </p>
      ) : null}

      {actionError ? (
        <p role="alert" className="text-base text-estado-rechazado">
          {actionError}
        </p>
      ) : null}

      {state.status === "success" && state !== dismissedNoticeState ? (
        <UserNotice
          notice={{ kind: "success", message: state.message }}
          onClose={dismissNotice}
        />
      ) : null}

      {isBusy ? (
        <p role="status" className="text-sm text-texto-secundario">
          {isPending
            ? "Guardando los datos del perfil…"
            : "Actualizando el perfil y la cuenta…"}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isBusy}
        className={BUTTON_CLASSES}
      >
        {isPending
          ? "Guardando…"
          : isRefreshing
            ? "Actualizando…"
            : "Guardar cambios"}
      </button>
    </form>
  );
}
