import { StudentFormSkeleton } from "../../ui/students/student-skeletons.tsx";

/** Estado de carga del listado de alumnos. */
export default function StudentsLoading() {
  return (
    <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
      <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">
        <StudentFormSkeleton />
      </div>
    </main>
  );
}
