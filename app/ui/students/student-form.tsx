"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  registerStudentAction,
  updateStudentAction,
} from "../../lib/actions/students.ts";
import type { StudentFormActionState } from "../../lib/students/action-core.ts";
import type { Student } from "../../lib/students/types.ts";
import {
  STUDENT_FORM_FIELDS,
  getEmptyStudentForm,
  studentToFormInput,
  validateStudentInput,
  type StudentField,
  type StudentFieldErrors,
  type StudentFormInput,
} from "../../lib/validation/students.ts";
import StudentFormFields from "./student-form-fields.tsx";

interface StudentFormProps {
  readonly mode: "create" | "edit";
  readonly cancelHref: string;
  readonly initialValues?: StudentFormInput;
  readonly student?: Student;
  readonly from?: "list" | "detail";
  readonly returnTo?: string;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const SECONDARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

const PRIMARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

/** Formulario compartido de alta y edición de alumnos. */
export default function StudentForm({
  mode,
  cancelHref,
  initialValues,
  student,
  from = "detail",
  returnTo,
}: StudentFormProps) {
  const isEdit = mode === "edit";
  const startingValues =
    initialValues ??
    (student ? studentToFormInput(student) : getEmptyStudentForm());
  const [values, setValues] = useState<StudentFormInput>(startingValues);
  const [touched, setTouched] = useState<
    Partial<Record<StudentField, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrorsHidden, setServerErrorsHidden] = useState(false);
  const submitLock = useRef(false);

  const [state, formAction, isPending] = useActionState<
    StudentFormActionState,
    FormData
  >(isEdit ? updateStudentAction : registerStudentAction, {
    status: "idle",
    message: "",
    values: startingValues,
  });

  const validation = validateStudentInput(values, isEdit);
  const serverErrors: StudentFieldErrors =
    state.status === "validation" && !serverErrorsHidden
      ? state.fieldErrors ?? {}
      : {};
  const visibleErrors: StudentFieldErrors = {};

  for (const field of STUDENT_FORM_FIELDS) {
    const serverError = serverErrors[field];
    const localError = validation.errors[field];

    if (serverError) {
      visibleErrors[field] = serverError;
    } else if ((submitted || touched[field]) && localError) {
      visibleErrors[field] = localError;
    }
  }

  const bannerMessage =
    state.status === "idle" ? "" : state.message || "";

  useEffect(() => {
    if (!isPending) {
      submitLock.current = false;
    }
  }, [isPending]);

  const handleChange = (field: StudentField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
    setServerErrorsHidden(true);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    setSubmitted(true);
    setServerErrorsHidden(false);

    if (!validation.valid) {
      event.preventDefault();
      return;
    }

    if (submitLock.current) {
      event.preventDefault();
      return;
    }

    submitLock.current = true;
  };

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      className="space-y-5"
    >
      {isEdit && student ? (
        <>
          <input type="hidden" name="studentId" value={student.id} />
          <input type="hidden" name="from" value={from} />
          {returnTo ? (
            <input type="hidden" name="returnTo" value={returnTo} />
          ) : null}
        </>
      ) : null}

      <StudentFormFields
        values={values}
        errors={visibleErrors}
        onChange={handleChange}
        onBlur={(field) =>
          setTouched((current) =>
            current[field] ? current : { ...current, [field]: true },
          )
        }
        disabled={isPending}
        isEdit={isEdit}
        idPrefix={isEdit ? "student-edit" : "student-create"}
      />

      {bannerMessage ? (
        <div
          role="alert"
          className="rounded-lg border border-estado-error-borde bg-superficie p-3 text-sm text-texto-principal"
        >
          <p>{bannerMessage}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        <Link href={cancelHref} className={SECONDARY_BUTTON_CLASSES}>
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={isPending}
          aria-busy={isPending}
          className={PRIMARY_BUTTON_CLASSES}
        >
          {isPending
            ? isEdit
              ? "Guardando..."
              : "Registrando..."
            : isEdit
              ? "Guardar cambios"
              : "Registrar alumno"}
        </button>
      </div>
    </form>
  );
}
