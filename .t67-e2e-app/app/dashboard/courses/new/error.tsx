"use client";

import CourseFormError from "../../../ui/courses/course-form-error.tsx";

export default function NewCourseError({ reset }: { reset: () => void }) {
  return <CourseFormError reset={reset} />;
}
