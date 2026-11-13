"use client";

import StudentFormError from "../../ui/students/student-form-error.tsx";

export default function StudentsError({ reset }: { reset: () => void }) {
  return (
    <StudentFormError
      reset={reset}
      title="No pudimos cargar los alumnos"
      message="Ocurrió un problema al preparar el listado. Intentá nuevamente."
      backHref="/dashboard"
      backLabel="Volver al inicio"
    />
  );
}
