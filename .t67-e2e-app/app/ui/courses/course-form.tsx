"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

import {
  createCourseAction,
  updateCourseAction,
} from "../../lib/actions/courses.ts";
import {
  COURSE_FORM_FIELDS,
  getCreateCourseDefaults,
  validateCourseInput,
} from "../../lib/validation/course.ts";
import {
  getEditDisabledReason,
  isCourseEditable,
} from "../../lib/courses/rules.ts";
import type {
  Course,
  CourseField,
  CourseFieldErrors,
  CourseFormActionState,
  CourseFormInput,
} from "../../lib/courses/types.ts";
import CourseFormFields, {
  type CourseFormReadOnlyMeta,
} from "./course-form-fields.tsx";

interface CourseFormProps {
  mode: "create" | "edit";
  currentYear: number;
  cancelHref: string;
  initialValues?: CourseFormInput;
  course?: Course;
  from?: "list" | "detail";
  returnTo?: string;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const SECONDARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app ${FOCUS_RING_CLASSES}`;

const PRIMARY_BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl bg-azul-institucional px-4 py-2.5 text-base font-semibold text-superficie transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

function courseToFormInput(course: Course): CourseFormInput {
  return {
    year: String(course.year),
    studyYear: String(course.studyYear),
    division: course.division,
    cycle: course.cycle,
    speciality: course.speciality,
    shift: course.shift,
    maxCapacity: String(course.maxCapacity),
  };
}

/** Formulario compartido de creación y edición de cursos. */
export default function CourseForm({
  mode,
  currentYear,
  cancelHref,
  initialValues,
  course,
  from = "detail",
  returnTo,
}: CourseFormProps) {
  const isEdit = mode === "edit";
  const startingValues =
    initialValues ??
    (course ? courseToFormInput(course) : getCreateCourseDefaults(currentYear));
  const [values, setValues] = useState<CourseFormInput>(startingValues);
  const [touched, setTouched] = useState<
    Partial<Record<CourseField, boolean>>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrorsHidden, setServerErrorsHidden] = useState(false);
  const submitLock = useRef(false);

  const [state, formAction, isPending] = useActionState<
    CourseFormActionState,
    FormData
  >(isEdit ? updateCourseAction : createCourseAction, {
    status: "idle",
    message: "",
    fieldErrors: {},
    values: startingValues,
  });

  const currentCapacity = course?.currentCapacity ?? 0;
  const validation = validateCourseInput(
    values,
    currentCapacity,
    currentYear,
    isEdit && course ? { originalYear: course.year } : {},
  );
  const serverErrors: CourseFieldErrors =
    state.status === "validation" && !serverErrorsHidden
      ? state.fieldErrors ?? {}
      : {};
  const visibleErrors: CourseFieldErrors = {};

  for (const field of COURSE_FORM_FIELDS) {
    const serverError = serverErrors[field];
    const localError = validation.errors[field];

    if (serverError) {
      visibleErrors[field] = serverError;
    } else if ((submitted || touched[field]) && localError) {
      visibleErrors[field] = localError;
    }
  }

  const bannerMessage =
    state.status === "idle" || state.status === "success"
      ? ""
      : state.message;

  useEffect(() => {
    if (!isPending) {
      submitLock.current = false;
    }
  }, [isPending]);

  const handleChange = (field: CourseField, value: string) => {
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

  const meta: CourseFormReadOnlyMeta | undefined = course
    ? {
        code: course.code,
        currentCapacity: course.currentCapacity,
        availablePlaces: course.availablePlaces,
      }
    : undefined;

  if (isEdit && course && !isCourseEditable(course, currentYear)) {
    return (
      <p role="alert" className="text-base text-texto-principal">
        {getEditDisabledReason(course, currentYear)}
      </p>
    );
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-5">
      {course ? (
        <>
          <input type="hidden" name="courseId" value={course.id} />
          <input
            type="hidden"
            name="currentCapacity"
            value={String(course.currentCapacity)}
          />
          <input
            type="hidden"
            name="originalYear"
            value={String(course.year)}
          />
          <input type="hidden" name="from" value={from} />
          {returnTo ? (
            <input type="hidden" name="returnTo" value={returnTo} />
          ) : null}
        </>
      ) : null}

      <CourseFormFields
        values={values}
        errors={visibleErrors}
        onChange={handleChange}
        disabled={isPending}
        meta={meta}
        idPrefix={isEdit ? "course-edit" : "course-create"}
      />

      {bannerMessage ? (
        <p role="alert" className="text-base text-estado-rechazado">
          {bannerMessage}
        </p>
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
              : "Creando..."
            : isEdit
              ? "Guardar cambios"
              : "Crear curso"}
        </button>
      </div>
    </form>
  );
}
