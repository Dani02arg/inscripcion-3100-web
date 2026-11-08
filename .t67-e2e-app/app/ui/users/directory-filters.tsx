"use client";

import {
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import {
  clearDirectoryFilters,
  getDefaultDirectoryFilters,
  isRoleFilter,
} from "../../lib/users/list.ts";
import type { DirectoryFilters as DirectoryFilterValues } from "../../lib/users/types.ts";
import {
  ROLE_FILTER_OPTIONS,
} from "../../lib/users/labels.ts";
import {
  validateUserFilters,
  type UserFilterErrors,
  type UserFilterField,
} from "../../lib/validation/users.ts";
import SelectField from "../forms/select-field.tsx";
import TextField from "../auth/text-field.tsx";

interface DirectoryFiltersProps {
  readonly initialFilters?: DirectoryFilterValues;
  readonly onApply: (filters: DirectoryFilterValues) => void;
  readonly onClear: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const PRIMARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 ${FOCUS_RING_CLASSES}`;

const SECONDARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

/** Filtros aplicables en cliente sobre el conjunto completo del directorio. */
export default function DirectoryFilters({
  initialFilters,
  onApply,
  onClear,
}: DirectoryFiltersProps) {
  const [draftFilters, setDraftFilters] = useState(
    () => initialFilters ?? getDefaultDirectoryFilters(),
  );
  const [localErrors, setLocalErrors] = useState<UserFilterErrors>({});

  const updateTextField = (
    field: UserFilterField,
    value: string,
  ) => {
    setDraftFilters((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (localErrors[field]) {
      setLocalErrors((previous) => {
        const next = { ...previous };
        delete next[field];
        return next;
      });
    }
  };

  const applyFilters = () => {
    const validation = validateUserFilters(draftFilters);

    if (!validation.valid) {
      setLocalErrors(validation.errors);
      return;
    }

    setLocalErrors({});
    const nextFilters = {
      ...validation.filters,
      role: draftFilters.role,
    };
    setDraftFilters(nextFilters);
    onApply(nextFilters);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    applyFilters();
  };

  const handleFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (
      event.key === "Enter" &&
      event.target instanceof HTMLInputElement
    ) {
      event.preventDefault();
      applyFilters();
    }
  };

  const handleClear = () => {
    const clearedFilters = clearDirectoryFilters();
    setLocalErrors({});
    setDraftFilters(clearedFilters);
    onClear();
  };

  return (
    <section
      aria-label="Filtros del directorio"
      className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
    >
      <form
        noValidate
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <TextField
            id="staff-filter-name"
            name="name"
            label="Nombre"
            value={draftFilters.name}
            onChange={(event) =>
              updateTextField("name", event.target.value)
            }
            placeholder="Buscar por nombre"
            autoComplete="off"
          />

          <TextField
            id="staff-filter-lastname"
            name="lastname"
            label="Apellido"
            value={draftFilters.lastname}
            onChange={(event) =>
              updateTextField("lastname", event.target.value)
            }
            placeholder="Buscar por apellido"
            autoComplete="off"
          />

          <TextField
            id="staff-filter-dni"
            name="dni"
            label="DNI"
            value={draftFilters.dni}
            onChange={(event) =>
              updateTextField("dni", event.target.value)
            }
            placeholder="Solo dígitos"
            inputMode="numeric"
            autoComplete="off"
            error={localErrors.dni}
          />

          <TextField
            id="staff-filter-cuil"
            name="cuil"
            label="CUIL"
            value={draftFilters.cuil}
            onChange={(event) =>
              updateTextField("cuil", event.target.value)
            }
            placeholder="Solo dígitos"
            inputMode="numeric"
            autoComplete="off"
            error={localErrors.cuil}
          />

          <TextField
            id="staff-filter-email"
            name="email"
            label="Correo electrónico"
            value={draftFilters.email}
            onChange={(event) =>
              updateTextField("email", event.target.value)
            }
            placeholder="Buscar por correo"
            autoComplete="off"
          />

          <SelectField
            id="staff-filter-role"
            name="role"
            label="Rol"
            value={draftFilters.role}
            options={ROLE_FILTER_OPTIONS}
            onChange={(event) => {
              const { value } = event.target;

              if (isRoleFilter(value)) {
                setDraftFilters((previous) => ({
                  ...previous,
                  role: value,
                }));
              }
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={handleClear}
            className={SECONDARY_BUTTON_CLASSES}
          >
            Limpiar filtros
          </button>
          <button type="submit" className={PRIMARY_BUTTON_CLASSES}>
            Aplicar filtros
          </button>
        </div>
      </form>
    </section>
  );
}
