import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../../lib/auth/effective-role.ts";
import { getCollapsedPreference } from "../../../lib/sidebar/collapse-cookie.ts";
import { toSidebarAccount } from "../../../lib/sidebar/account.ts";
import { getStudentPageAccess } from "../../../lib/students/guard.ts";
import {
  STUDENT_ACCESS_DENIED_MESSAGE,
  STUDENT_SECTION_ACCESS_DENIED_MESSAGE,
} from "../../../lib/students/guard-decision.ts";
import { STUDENTS_PATH } from "../../../lib/students/students-url.ts";
import CourseBreadcrumb from "../../../ui/courses/course-breadcrumb.tsx";
import RetryButton from "../../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../../ui/sidebar/private-shell.tsx";
import StudentForm from "../../../ui/students/student-form.tsx";
import {
  StudentErrorState,
  StudentForbiddenState,
} from "../../../ui/students/student-states.tsx";

export const metadata: Metadata = {
  title: "Registrar alumno | Mis hijos | EET N° 3100",
  description:
    "Registro de un alumno a cargo del tutor en la EET N° 3100.",
};

export default async function NewStudentPage() {
  const access = await getStudentPageAccess("new");
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
      <StudentForbiddenState
        message={
          access.role === "ADMINISTRATIVO" ||
          access.role === "ADMINISTRADOR"
            ? STUDENT_SECTION_ACCESS_DENIED_MESSAGE
            : STUDENT_ACCESS_DENIED_MESSAGE
        }
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
        <StudentErrorState message={message} />
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>,
    );
  }

  return shell(
    <div className="space-y-6">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Mis hijos", href: STUDENTS_PATH },
          { label: "Registrar alumno" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
          Registrar alumno
        </h1>
        <p className="mt-2 text-base text-texto-principal">
          Completá los datos para registrar a tu hijo en el sistema.
        </p>
      </div>

      <section className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6">
        <StudentForm mode="create" cancelHref={STUDENTS_PATH} />
      </section>
    </div>,
  );
}
