"use client";

import CourseFormError from "../../../../ui/courses/course-form-error.tsx";

export default function EditCourseError({ reset }: { reset: () => void }) {
  return <CourseFormError reset={reset} />;
}
