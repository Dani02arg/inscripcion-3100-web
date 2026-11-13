"use client";

import StudentFormError from "../../../ui/students/student-form-error.tsx";

export default function NewStudentError({ reset }: { reset: () => void }) {
  return <StudentFormError reset={reset} backLabel="Volver a mis hijos" />;
}
