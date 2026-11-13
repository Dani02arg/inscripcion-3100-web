"use client";

import StudentFormError from "../../../ui/students/student-form-error.tsx";

export default function StudentDetailError({ reset }: { reset: () => void }) {
  return (
    <StudentFormError
      reset={reset}
      title="No pudimos cargar el detalle del alumno"
      message="Ocurrió un problema al preparar la pantalla. Intentá nuevamente."
    />
  );
}
