import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../../../lib/auth/effective-role.ts";
import { listMyStudents } from "../../../../lib/api/students.ts";
import { getCollapsedPreference } from "../../../../lib/sidebar/collapse-cookie.ts";
import { toSidebarAccount } from "../../../../lib/sidebar/account.ts";
import { getStudentPageAccess } from "../../../../lib/students/guard.ts";
import {
  STUDENT_ACCESS_DENIED_MESSAGE,
  STUDENT_SECTION_ACCESS_DENIED_MESSAGE,
  STUDENT_SESSION_EXPIRED_PATH,
} from "../../../../lib/students/guard-decision.ts";
import {
  STUDENTS_PATH,
  getStudentReturnLabel,
  sanitizeStudentReturnPath,
  studentDetailPath,
} from "../../../../lib/students/students-url.ts";
import CourseBreadcrumb from "../../../../ui/courses/course-breadcrumb.tsx";
import RetryButton from "../../../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../../../ui/sidebar/private-shell.tsx";
import StudentForm from "../../../../ui/students/student-form.tsx";
import {
  StudentErrorState,
  StudentForbiddenState,
  StudentNotFoundState,
} from "../../../../ui/students/student-states.tsx";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Editar alumno | Mis hijos | EET N° 3100",
  description:
    "Edición de los datos de un alumno a cargo del tutor en la EET N° 3100.",
};

type EditStudentSearchParams = {
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

export default async function EditStudentPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<EditStudentSearchParams>;
}) {
  const access = await getStudentPageAccess("edit");
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

  const { studentId } = await params;
  const query = await searchParams;
  const fromValue = readString(query.from);
  const from = fromValue === "list" ? "list" : "detail";
  const returnTo = sanitizeStudentReturnPath(readString(query.returnTo));
  const result = await listMyStudents(access.token);

  if (!result.ok) {
    if (result.kind === "unauthorized") {
      redirect(STUDENT_SESSION_EXPIRED_PATH);
    }

    return shell(
      <div className="space-y-4">
        <StudentForbiddenState
          message={
            result.kind === "forbidden"
              ? result.message
              : result.message
          }
        />
        {result.kind === "forbidden" ? null : (
          <div className="flex justify-center">
            <RetryButton />
          </div>
        )}
      </div>,
    );
  }

  const student = result.students.find((item) => item.id === studentId);

  if (!student) {
    return shell(
      <StudentNotFoundState
        returnLabel={getStudentReturnLabel(access.role)}
      />,
    );
  }

  const cancelHref =
    from === "list" ? returnTo : studentDetailPath(student.id);

  return shell(
    <div className="space-y-6">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Mis hijos", href: STUDENTS_PATH },
          { label: "Editar alumno" },
        ]}
      />

      <div>
        <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
          Editar alumno
        </h1>
        <p className="mt-2 text-base text-texto-principal">
          Actualizá los datos del alumno. El DNI y el CUIL no se pueden modificar.
        </p>
      </div>

      <section className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6">
        <StudentForm
          mode="edit"
          cancelHref={cancelHref}
          student={student}
          from={from}
          returnTo={from === "list" ? returnTo : undefined}
        />
      </section>
    </div>,
  );
}
