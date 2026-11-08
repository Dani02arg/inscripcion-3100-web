"use client";

import {
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  clearUserFilters,
  getDefaultUserFilters,
} from "../../lib/users/list.ts";
import type { UserFilters as UserFiltersValues } from "../../lib/users/types.ts";
import {
  validateUserFilters,
  type UserFilterErrors,
  type UserFilterField,
} from "../../lib/validation/users.ts";
import TextField from "../auth/text-field.tsx";

export interface UserFiltersProps {
  readonly initialFilters?: UserFiltersValues;
  readonly filters?: UserFiltersValues;
  readonly fieldErrors?: UserFilterErrors;
  readonly isPending?: boolean;
  readonly onApply: (filters: UserFiltersValues) => void;
  readonly onClear: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const PRIMARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

const SECONDARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

/**
 * Filtros del padrón de usuarios (DNI, CUIL, nombre, apellido y correo).
 * Valida localmente que DNI y CUIL contengan solo dígitos y aplica la
 * consulta al presionar «Aplicar filtros» o Enter, sin consultar por tecla.
 */
export default function UserFilters({
  initialFilters,
  filters,
  fieldErrors,
  isPending = false,
  onApply,
  onClear,
}: UserFiltersProps) {
  const [draftFilters, setDraftFilters] = useState<UserFiltersValues>(
    () => filters ?? initialFilters ?? getDefaultUserFilters(),
  );
  const [localErrors, setLocalErrors] = useState<UserFilterErrors>({});
  const [dismissedFields, setDismissedFields] = useState<
    Partial<Record<UserFilterField, boolean>>
  >({});

  const currentFilters = filters ?? draftFilters;
  const busy = isPending;

  const activeErrors: UserFilterErrors = {
    dni:
      localErrors.dni ??
      (dismissedFields.dni ? undefined : fieldErrors?.dni),
    cuil:
      localErrors.cuil ??
      (dismissedFields.cuil ? undefined : fieldErrors?.cuil),
    name:
      localErrors.name ??
      (dismissedFields.name ? undefined : fieldErrors?.name),
    lastname:
      localErrors.lastname ??
      (dismissedFields.lastname ? undefined : fieldErrors?.lastname),
    email:
      localErrors.email ??
      (dismissedFields.email ? undefined : fieldErrors?.email),
  };

  const updateField = (field: UserFilterField, value: string) => {
    const nextFilters: UserFiltersValues = {
      ...currentFilters,
      [field]: value,
    };
    setDraftFilters(nextFilters);

    if (localErrors[field]) {
      setLocalErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    }

    if (fieldErrors?.[field] && !dismissedFields[field]) {
      setDismissedFields((previous) => ({
        ...previous,
        [field]: true,
      }));
    }
  };

  const applyCurrentFilters = () => {
    if (busy) {
      return;
    }

    const validation = validateUserFilters(currentFilters);

    if (!validation.valid) {
      setLocalErrors(validation.errors);
      return;
    }

    setLocalErrors({});
    setDismissedFields({});
    setDraftFilters(validation.filters);
    onApply(validation.filters);
  };

  const handleClear = () => {
    if (busy) {
      return;
    }

    const cleared = clearUserFilters();

    setLocalErrors({});
    setDismissedFields({});
    setDraftFilters(cleared);
    onClear();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyCurrentFilters();
  };

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (
      event.key === "Enter" &&
      event.target instanceof HTMLInputElement
    ) {
      event.preventDefault();
      applyCurrentFilters();
    }
  };

  return (
    <section
      aria-label="Filtros de usuarios"
      className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
    >
      <form
        noValidate
        aria-busy={busy ? true : undefined}
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField
            id="user-filter-dni"
            name="dni"
            label="DNI"
            value={currentFilters.dni}
            onChange={(event) => updateField("dni", event.target.value)}
            disabled={busy}
            placeholder="Solo dígitos (ej. 30111222)"
            inputMode="numeric"
            autoComplete="off"
            error={activeErrors.dni}
          />

          <TextField
            id="user-filter-cuil"
            name="cuil"
            label="CUIL"
            value={currentFilters.cuil}
            onChange={(event) => updateField("cuil", event.target.value)}
            disabled={busy}
            placeholder="Solo dígitos (ej. 20301112223)"
            inputMode="numeric"
            autoComplete="off"
            error={activeErrors.cuil}
          />

          <TextField
            id="user-filter-name"
            name="name"
            label="Nombre"
            value={currentFilters.name}
            onChange={(event) => updateField("name", event.target.value)}
            disabled={busy}
            placeholder="Buscar por nombre"
            autoComplete="off"
            error={activeErrors.name}
          />

          <TextField
            id="user-filter-lastname"
            name="lastname"
            label="Apellido"
            value={currentFilters.lastname}
            onChange={(event) =>
              updateField("lastname", event.target.value)
            }
            disabled={busy}
            placeholder="Buscar por apellido"
            autoComplete="off"
            error={activeErrors.lastname}
          />

          <TextField
            id="user-filter-email"
            name="email"
            label="Correo electrónico"
            value={currentFilters.email}
            onChange={(event) => updateField("email", event.target.value)}
            disabled={busy}
            placeholder="Buscar por correo"
            autoComplete="off"
            error={activeErrors.email}
            className="sm:col-span-2 lg:col-span-1"
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={busy}
            className={SECONDARY_BUTTON_CLASSES}
          >
            Limpiar filtros
          </button>

          <button
            type="submit"
            disabled={busy}
            className={PRIMARY_BUTTON_CLASSES}
          >
            Aplicar filtros
          </button>
        </div>
      </form>
    </section>
  );
}
