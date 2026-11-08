"use client";

import {
  COURSE_ALL_YEARS_LABEL,
  COURSE_CYCLE_FILTER_OPTIONS,
  COURSE_SHIFT_FILTER_OPTIONS,
  COURSE_SPECIALITY_FILTER_OPTIONS,
  isCourseCycle,
  isCourseShift,
  isCourseSpeciality,
} from "../../lib/courses/labels.ts";
import type {
  CourseFilters,
  CourseFilterOptions,
  CourseYearFilter,
} from "../../lib/courses/types.ts";
import SelectField from "../forms/select-field.tsx";

interface CourseFiltersProps {
  filters: CourseFilters;
  options: CourseFilterOptions;
  onFiltersChange: (filters: CourseFilters) => void;
  onClear: () => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const LABEL_CLASSES = "mb-1 block text-sm font-medium text-texto-principal";

const CONTROL_CLASSES =
  `min-h-11 w-full rounded-lg border border-borde-input bg-superficie px-3 py-2 text-base text-texto-principal transition-colors focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus ${FOCUS_RING_CLASSES}`;

function parseYear(
  value: string,
  years: readonly number[],
): CourseYearFilter {
  if (value === "all") {
    return "all";
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && years.includes(parsed)
    ? parsed
    : "all";
}

/** Filtros controlados del listado; la vista que los contiene resuelve la página. */
export default function CourseFilters({
  filters,
  options,
  onFiltersChange,
  onClear,
}: CourseFiltersProps) {
  const update = <K extends keyof CourseFilters>(
    key: K,
    value: CourseFilters[K],
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const yearOptions = [
    { value: "all", label: COURSE_ALL_YEARS_LABEL },
    ...options.years.map((year) => ({
      value: String(year),
      label: String(year),
    })),
  ];

  return (
    <section
      aria-label="Filtros de cursos"
      className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm"
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="md:col-span-2 xl:col-span-2">
          <label htmlFor="course-search" className={LABEL_CLASSES}>
            Buscar curso
          </label>
          <input
            id="course-search"
            type="search"
            value={filters.query}
            onChange={(event) => update("query", event.target.value)}
            placeholder="Código, año, división, ciclo, especialidad o turno"
            autoComplete="off"
            className={CONTROL_CLASSES}
          />
        </div>

        <SelectField
          id="course-year-filter"
          label="Año académico"
          value={filters.year === "all" ? "all" : String(filters.year)}
          options={yearOptions}
          onChange={(event) =>
            update("year", parseYear(event.target.value, options.years))
          }
        />

        <SelectField
          id="course-cycle-filter"
          label="Ciclo"
          value={filters.cycle}
          options={COURSE_CYCLE_FILTER_OPTIONS}
          onChange={(event) => {
            const value = event.target.value;

            if (value === "all" || isCourseCycle(value)) {
              update("cycle", value);
            }
          }}
        />

        <SelectField
          id="course-speciality-filter"
          label="Especialidad"
          value={filters.speciality}
          options={COURSE_SPECIALITY_FILTER_OPTIONS}
          onChange={(event) => {
            const value = event.target.value;

            if (value === "all" || isCourseSpeciality(value)) {
              update("speciality", value);
            }
          }}
        />

        <SelectField
          id="course-shift-filter"
          label="Turno"
          value={filters.shift}
          options={COURSE_SHIFT_FILTER_OPTIONS}
          onChange={(event) => {
            const value = event.target.value;

            if (value === "all" || isCourseShift(value)) {
              update("shift", value);
            }
          }}
        />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onClear}
          className={`inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`}
        >
          Limpiar filtros
        </button>
      </div>
    </section>
  );
}
