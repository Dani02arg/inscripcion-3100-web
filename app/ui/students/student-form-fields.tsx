"use client";

import { GENDER_OPTIONS } from "../../lib/students/labels.ts";
import type {
  StudentField,
  StudentFieldErrors,
  StudentFormInput,
} from "../../lib/validation/students.ts";
import BirthdatePicker from "../auth/birthdate-picker.tsx";
import TextField from "../auth/text-field.tsx";
import SelectField from "../forms/select-field.tsx";

interface StudentFormFieldsProps {
  readonly values: StudentFormInput;
  readonly errors?: StudentFieldErrors;
  readonly onChange: (field: StudentField, value: string) => void;
  readonly onBlur?: (field: StudentField) => void;
  readonly disabled?: boolean;
  readonly isEdit?: boolean;
  readonly idPrefix?: string;
}

/** Campos del formulario de alta y edición de alumnos. */
export default function StudentFormFields({
  values,
  errors = {},
  onChange,
  onBlur,
  disabled = false,
  isEdit = false,
  idPrefix = "student",
}: StudentFormFieldsProps) {
  const identityReadOnly = isEdit;
  const identityHelp = isEdit ? "No se puede modificar." : undefined;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <TextField
        id={`${idPrefix}-dni`}
        name={isEdit ? undefined : "studentDni"}
        label="DNI"
        value={values.studentDni}
        onChange={
          identityReadOnly
            ? undefined
            : (event) => onChange("studentDni", event.target.value)
        }
        onBlur={identityReadOnly ? undefined : () => onBlur?.("studentDni")}
        inputMode="numeric"
        autoComplete="off"
        placeholder="Ej.: 12345678"
        helpText={identityHelp ?? "7 u 8 dígitos."}
        required={!isEdit}
        readOnly={identityReadOnly}
        disabled={disabled && !identityReadOnly}
        error={errors.studentDni}
      />

      <TextField
        id={`${idPrefix}-cuil`}
        name={isEdit ? undefined : "studentCuil"}
        label="CUIL"
        value={values.studentCuil}
        onChange={
          identityReadOnly
            ? undefined
            : (event) => onChange("studentCuil", event.target.value)
        }
        onBlur={identityReadOnly ? undefined : () => onBlur?.("studentCuil")}
        inputMode="numeric"
        autoComplete="off"
        placeholder="Ej.: 20123456789"
        helpText={identityHelp ?? "11 dígitos, sin guiones."}
        required={!isEdit}
        readOnly={identityReadOnly}
        disabled={disabled && !identityReadOnly}
        error={errors.studentCuil}
      />

      <TextField
        id={`${idPrefix}-first-name`}
        name="firstName"
        label="Nombre"
        value={values.firstName}
        onChange={(event) => onChange("firstName", event.target.value)}
        onBlur={() => onBlur?.("firstName")}
        autoComplete="given-name"
        required
        disabled={disabled}
        error={errors.firstName}
      />

      <TextField
        id={`${idPrefix}-last-name`}
        name="lastName"
        label="Apellido"
        value={values.lastName}
        onChange={(event) => onChange("lastName", event.target.value)}
        onBlur={() => onBlur?.("lastName")}
        autoComplete="family-name"
        required
        disabled={disabled}
        error={errors.lastName}
      />

      <div className="md:col-span-2">
        <BirthdatePicker
          id={`${idPrefix}-birthdate`}
          name="birthdate"
          value={values.birthdate}
          onChange={(value) => onChange("birthdate", value)}
          label="Fecha de nacimiento"
          helpText="Escribí la fecha como DD/MM/YYYY o elegila en el calendario."
          required
          minimumAge={0}
          calendarTitle="Seleccioná la fecha de nacimiento"
          error={errors.birthdate}
          className={disabled ? "pointer-events-none opacity-60" : ""}
        />
      </div>

      <SelectField
        id={`${idPrefix}-gender`}
        name="gender"
        label="Género"
        value={values.gender}
        options={GENDER_OPTIONS}
        onChange={(event) => onChange("gender", event.target.value)}
        placeholder="Seleccioná un género"
        required
        disabled={disabled}
        error={errors.gender}
      />

      <TextField
        id={`${idPrefix}-email`}
        name="studentEmail"
        label="Correo electrónico (opcional)"
        type="email"
        value={values.studentEmail}
        onChange={(event) => onChange("studentEmail", event.target.value)}
        onBlur={() => onBlur?.("studentEmail")}
        inputMode="email"
        autoComplete="email"
        placeholder="Ej.: nombre@correo.com"
        helpText="Hasta 255 caracteres."
        disabled={disabled}
        error={errors.studentEmail}
      />

      <TextField
        id={`${idPrefix}-phone`}
        name="studentPhone"
        label="Teléfono (opcional)"
        type="tel"
        value={values.studentPhone}
        onChange={(event) => onChange("studentPhone", event.target.value)}
        onBlur={() => onBlur?.("studentPhone")}
        inputMode="tel"
        autoComplete="tel"
        placeholder="Ej.: 3874112233"
        helpText="Solo dígitos."
        disabled={disabled}
        error={errors.studentPhone}
      />

      <TextField
        id={`${idPrefix}-birthplace`}
        name="birthplace"
        label="Lugar de nacimiento (opcional)"
        value={values.birthplace}
        onChange={(event) => onChange("birthplace", event.target.value)}
        onBlur={() => onBlur?.("birthplace")}
        autoComplete="off"
        helpText="Hasta 150 caracteres."
        disabled={disabled}
        error={errors.birthplace}
      />

      <div className="md:col-span-2">
        <TextField
          id={`${idPrefix}-address`}
          name="address"
          label="Domicilio (opcional)"
          value={values.address}
          onChange={(event) => onChange("address", event.target.value)}
          onBlur={() => onBlur?.("address")}
          autoComplete="street-address"
          disabled={disabled}
          error={errors.address}
        />
      </div>
    </div>
  );
}
