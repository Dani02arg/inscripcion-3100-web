"use client";

import {
  COURSE_CYCLE_OPTIONS,
  COURSE_SHIFT_OPTIONS,
  COURSE_SPECIALITY_OPTIONS,
} from "../../lib/courses/labels.ts";
import type {
  CourseField,
  CourseFieldErrors,
  CourseFormInput,
} from "../../lib/courses/types.ts";
import SelectField from "../forms/select-field.tsx";
import TextField from "../auth/text-field.tsx";

export interface CourseFormReadOnlyMeta {
  readonly code: string | null;
  readonly currentCapacity: number;
  readonly availablePlaces: number | null;
}

interface CourseFormFieldsProps {
  values: CourseFormInput;
  errors?: CourseFieldErrors;
  onChange: (field: CourseField, value: string) => void;
  disabled?: boolean;
  meta?: CourseFormReadOnlyMeta;
  idPrefix?: string;
}

const STUDY_YEAR_OPTIONS = ["1", "2", "3", "4", "5", "6"].map((value) => ({
  value,
  label: value,
}));

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

/** Campos compartidos por los formularios de creación y edición. */
export default function CourseFormFields({
  values,
  errors = {},
  onChange,
  disabled = false,
  meta,
  idPrefix = "course",
}: CourseFormFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {meta ? (
        <>
          <TextField
            id={`${idPrefix}-code`}
            label="Código"
            value={meta.code ?? "Sin código"}
            readOnly
            className="sm:col-span-2"
          />
          <TextField
            id={`${idPrefix}-current-capacity`}
            label="Capacidad actual"
            value={formatNumber(meta.currentCapacity)}
            readOnly
          />
          <TextField
            id={`${idPrefix}-available-places`}
            label="Cupos disponibles"
            value={
              meta.availablePlaces === null
                ? "No disponible"
                : formatNumber(meta.availablePlaces)
            }
            readOnly
          />
        </>
      ) : null}

      <TextField
        id={`${idPrefix}-year`}
        name="year"
        label="Año académico"
        type="number"
        inputMode="numeric"
        value={values.year}
        onChange={(event) => onChange("year", event.target.value)}
        helpText="Año actual o futuro."
        error={errors.year}
        required
        disabled={disabled}
      />

      <SelectField
        id={`${idPrefix}-study-year`}
        name="studyYear"
        label="Año de cursada"
        value={values.studyYear}
        options={STUDY_YEAR_OPTIONS}
        onChange={(event) => onChange("studyYear", event.target.value)}
        error={errors.studyYear}
        required
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-division`}
        name="division"
        label="División"
        value={values.division}
        onChange={(event) => onChange("division", event.target.value)}
        maxLength={10}
        helpText="Hasta 10 caracteres."
        error={errors.division}
        required
        disabled={disabled}
      />

      <SelectField
        id={`${idPrefix}-cycle`}
        name="cycle"
        label="Ciclo"
        value={values.cycle}
        options={COURSE_CYCLE_OPTIONS}
        onChange={(event) => onChange("cycle", event.target.value)}
        error={errors.cycle}
        required
        disabled={disabled}
      />

      <SelectField
        id={`${idPrefix}-speciality`}
        name="speciality"
        label="Especialidad"
        value={values.speciality}
        options={COURSE_SPECIALITY_OPTIONS}
        onChange={(event) => onChange("speciality", event.target.value)}
        error={errors.speciality}
        required
        disabled={disabled}
      />

      <SelectField
        id={`${idPrefix}-shift`}
        name="shift"
        label="Turno"
        value={values.shift}
        options={COURSE_SHIFT_OPTIONS}
        onChange={(event) => onChange("shift", event.target.value)}
        error={errors.shift}
        required
        disabled={disabled}
      />

      <TextField
        id={`${idPrefix}-max-capacity`}
        name="maxCapacity"
        label="Capacidad máxima"
        type="number"
        inputMode="numeric"
        value={values.maxCapacity}
        onChange={(event) => onChange("maxCapacity", event.target.value)}
        helpText="Entero mayor que cero."
        error={errors.maxCapacity}
        required
        disabled={disabled}
      />
    </div>
  );
}
