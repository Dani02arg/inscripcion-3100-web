"use client";

import {
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";

import { clearStudentFilters } from "../../lib/students/list.ts";
import type { StudentFilters as StudentFiltersValues } from "../../lib/students/types.ts";
import {
  validateStudentFilters,
  type StudentFilterErrors,
  type StudentFilterField,
} from "../../lib/validation/students.ts";
import TextField from "../auth/text-field.tsx";

export interface StudentFiltersProps {
  readonly initialFilters?: StudentFiltersValues;
  readonly filters?: StudentFiltersValues;
  readonly fieldErrors?: StudentFilterErrors;
  readonly isPending?: boolean;
  readonly onApply: (filters: StudentFiltersValues) => void;
  readonly onClear: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const PRIMARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

const SECONDARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:opacity-60 ${FOCUS_RING_CLASSES}`;

/**
 * Filtros del padrón de alumnos (DNI, CUIL, nombre y apellido).
 * Valida localmente que DNI y CUIL contengan solo dígitos y aplica la consulta
 * al presionar «Aplicar filtros» o Enter, sin buscar con cada tecla.
 */
export default function StudentFilters({
  initialFilters,
  filters,
  fieldErrors,
  isPending = false,
  onApply,
  onClear,
}: StudentFiltersProps) {
  const [draftFilters, setDraftFilters] = useState<StudentFiltersValues>(
    () => filters ?? initialFilters ?? clearStudentFilters(),
  );
  const [localErrors, setLocalErrors] = useState<StudentFilterErrors>({});
  const [dismissedFields, setDismissedFields] = useState<
    Partial<Record<StudentFilterField, boolean>>
  >({});

  const currentFilters = filters ?? draftFilters;
  const busy = isPending;

  const activeErrors: StudentFilterErrors = {
    studentDni:
      localErrors.studentDni ??
      (dismissedFields.studentDni ? undefined : fieldErrors?.studentDni),
    studentCuil:
      localErrors.studentCuil ??
      (dismissedFields.studentCuil ? undefined : fieldErrors?.studentCuil),
    firstName:
      localErrors.firstName ??
      (dismissedFields.firstName ? undefined : fieldErrors?.firstName),
    lastName:
      localErrors.lastName ??
      (dismissedFields.lastName ? undefined : fieldErrors?.lastName),
  };

  const updateField = (field: StudentFilterField, value: string) => {
    setDraftFilters({
      ...currentFilters,
      [field]: value,
    });

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

    const validation = validateStudentFilters(currentFilters);

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

    const cleared = clearStudentFilters();

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
      aria-label="Filtros de alumnos"
      className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
    >
      <form
        noValidate
        aria-busy={busy ? true : undefined}
        onSubmit={handleSubmit}
        onKeyDown={handleFormKeyDown}
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TextField
            id="student-filter-dni"
            name="studentDni"
            label="DNI"
            value={currentFilters.studentDni}
            onChange={(event) =>
              updateField("studentDni", event.target.value)
            }
            disabled={busy}
            placeholder="Solo dígitos (ej. 30111222)"
            inputMode="numeric"
            autoComplete="off"
            error={activeErrors.studentDni}
          />

          <TextField
            id="student-filter-cuil"
            name="studentCuil"
            label="CUIL"
            value={currentFilters.studentCuil}
            onChange={(event) =>
              updateField("studentCuil", event.target.value)
            }
            disabled={busy}
            placeholder="Solo dígitos (ej. 20301112223)"
            inputMode="numeric"
            autoComplete="off"
            error={activeErrors.studentCuil}
          />

          <TextField
            id="student-filter-first-name"
            name="firstName"
            label="Nombre"
            value={currentFilters.firstName}
            onChange={(event) =>
              updateField("firstName", event.target.value)
            }
            disabled={busy}
            placeholder="Buscar por nombre"
            autoComplete="off"
            error={activeErrors.firstName}
          />

          <TextField
            id="student-filter-last-name"
            name="lastName"
            label="Apellido"
            value={currentFilters.lastName}
            onChange={(event) =>
              updateField("lastName", event.target.value)
            }
            disabled={busy}
            placeholder="Buscar por apellido"
            autoComplete="off"
            error={activeErrors.lastName}
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
