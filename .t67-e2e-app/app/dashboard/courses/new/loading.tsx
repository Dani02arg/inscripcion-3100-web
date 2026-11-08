import { CourseFormSkeleton } from "../../../ui/courses/course-skeletons.tsx";
import SidebarSkeleton from "../../../ui/sidebar/sidebar-skeleton.tsx";

export default function NewCourseLoading() {
  return (
    <div className="flex min-h-screen bg-fondo-app text-texto-principal">
      <SidebarSkeleton />

      <div className="min-w-0 flex-1 pb-16 pt-14 lg:pt-0">
        <main className="mx-auto w-full max-w-4xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
          <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">
            <CourseFormSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}
