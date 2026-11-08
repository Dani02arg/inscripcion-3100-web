import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../../lib/auth/effective-role.ts";
import { sanitizeReturnPath } from "../../../lib/courses/filters-url.ts";
import {
  COURSE_ACCESS_DENIED_MESSAGE,
  getCoursePageAccess,
} from "../../../lib/courses/guard.ts";
import {
  getCreateCourseDefaults,
} from "../../../lib/validation/course.ts";
import { getCollapsedPreference } from "../../../lib/sidebar/collapse-cookie.ts";
import { toSidebarAccount } from "../../../lib/sidebar/account.ts";
import CourseBreadcrumb from "../../../ui/courses/course-breadcrumb.tsx";
import CourseForm from "../../../ui/courses/course-form.tsx";
import { CourseTableErrorState } from "../../../ui/courses/course-table-states.tsx";
import RetryButton from "../../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../../ui/sidebar/private-shell.tsx";

export const metadata: Metadata = {
  title: "Crear curso | Cursos | EET N° 3100",
  description:
    "Creación de un curso para la oferta académica de la EET N° 3100.",
};

type CreateCourseSearchParams = {
  returnTo?: string | string[];
};

function readString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
}

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<CreateCourseSearchParams>;
}) {
  const access = await getCoursePageAccess();
  const collapsed = await getCollapsedPreference();
  const account = access.account;

  const shell = (content: ReactNode) => (
    <PrivateShell
      role={getEffectiveRole(account) ?? account.claims.role}
      account={toSidebarAccount(account)}
      collapsed={collapsed}
    >
      <main className="mx-auto w-full max-w-4xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
        <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">
          {content}
        </div>
      </main>
    </PrivateShell>
  );

  if (access.status === "forbidden") {
    return shell(
      <CourseTableErrorState
        kind="forbidden"
        message={COURSE_ACCESS_DENIED_MESSAGE}
      />,
    );
  }

  if (access.status === "error") {
    const message =
      access.account.status === "error"
        ? access.account.message
        : "No pudimos preparar el formulario. Intentá nuevamente.";

    return shell(
      <div className="space-y-4">
        <CourseTableErrorState kind="error" message={message} />
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>,
    );
  }

  const returnTo = readString((await searchParams).returnTo);
  const cancelHref = sanitizeReturnPath(returnTo);
  const currentYear = new Date().getFullYear();

  return shell(
    <div className="space-y-6">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Cursos", href: cancelHref },
          { label: "Crear curso" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
          Crear curso
        </h1>
        <p className="mt-2 text-base text-texto-principal">
          Completá los datos para incorporar el curso a la oferta académica.
        </p>
      </div>

      <section className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6">
        <CourseForm
          mode="create"
          currentYear={currentYear}
          cancelHref={cancelHref}
          initialValues={getCreateCourseDefaults(currentYear)}
        />
      </section>
    </div>,
  );
}
