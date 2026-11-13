"use client";

import StudentFormError from "../../../../ui/students/student-form-error.tsx";

export default function EditStudentError({ reset }: { reset: () => void }) {
  return <StudentFormError reset={reset} backLabel="Volver a mis hijos" />;
}
