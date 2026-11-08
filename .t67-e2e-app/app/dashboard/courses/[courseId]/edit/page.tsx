import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../../../lib/auth/effective-role.ts";
import { getCourseData } from "../../../../lib/courses/data.ts";
import { sanitizeReturnPath } from "../../../../lib/courses/filters-url.ts";
import {
  COURSE_ACCESS_DENIED_MESSAGE,
  COURSE_SESSION_EXPIRED_PATH,
  getCoursePageAccess,
} from "../../../../lib/courses/guard.ts";
import { getCollapsedPreference } from "../../../../lib/sidebar/collapse-cookie.ts";
import { toSidebarAccount } from "../../../../lib/sidebar/account.ts";
import CourseBreadcrumb from "../../../../ui/courses/course-breadcrumb.tsx";
import CourseForm from "../../../../ui/courses/course-form.tsx";
import { CourseTableErrorState } from "../../../../ui/courses/course-table-states.tsx";
import RetryButton from "../../../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../../../ui/sidebar/private-shell.tsx";

export const metadata: Metadata = {
  title: "Editar curso | Cursos | EET N° 3100",
  description:
    "Edición de un curso de la oferta académica de la EET N° 3100.",
};

type EditCourseSearchParams = {
  from?: string | string[];
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

export default async function EditCoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<EditCourseSearchParams>;
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

  const { courseId } = await params;
  const query = await searchParams;
  const fromValue = readString(query.from);
  const from = fromValue === "list" ? "list" : "detail";
  const returnTo = sanitizeReturnPath(readString(query.returnTo));
  const result = await getCourseData(access.token, courseId);

  if (!result.ok) {
    if (result.kind === "unauthorized") {
      redirect(COURSE_SESSION_EXPIRED_PATH);
    }

    if (result.kind === "not_found") {
      return shell(
        <section className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-texto-principal">
            El curso no existe o fue eliminado.
          </h1>
          <Link
            href={returnTo}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
          >
            Volver a cursos
          </Link>
        </section>,
      );
    }

    return shell(
      <div className="space-y-4">
        <CourseTableErrorState
          kind={result.kind === "forbidden" ? "forbidden" : "error"}
          message={result.message}
        />
        {result.kind === "forbidden" ? null : (
          <div className="flex justify-center">
            <RetryButton />
          </div>
        )}
      </div>,
    );
  }

  const currentYear = new Date().getFullYear();
  const cancelHref =
    from === "list"
      ? returnTo
      : `/dashboard/courses/${encodeURIComponent(result.course.id)}`;

  return shell(
    <div className="space-y-6">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Cursos", href: returnTo },
          { label: "Editar curso" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
          Editar curso
        </h1>
        <p className="mt-2 break-all font-mono text-base text-texto-principal">
          {result.course.code ?? "Sin código"}
        </p>
      </div>

      <section className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6">
        <CourseForm
          mode="edit"
          currentYear={currentYear}
          cancelHref={cancelHref}
          course={result.course}
          from={from}
          returnTo={from === "list" ? returnTo : undefined}
        />
      </section>
    </div>,
  );
}
