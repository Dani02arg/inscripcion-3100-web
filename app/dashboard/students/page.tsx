import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { listAllStudents, listMyStudents } from "../../lib/api/students.ts";
import { STUDENTS_LOAD_ERROR_MESSAGE } from "../../lib/api/students.ts";
import { getEffectiveRole } from "../../lib/auth/effective-role.ts";
import { toSidebarAccount } from "../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../lib/sidebar/collapse-cookie.ts";
import {
  STUDENT_ACCESS_DENIED_MESSAGE,
  STUDENT_SESSION_EXPIRED_PATH,
} from "../../lib/students/guard-decision.ts";
import { getStudentPageAccess } from "../../lib/students/guard.ts";
import { STUDENT_NOTICES } from "../../lib/students/labels.ts";
import { parseStudentUrl } from "../../lib/students/students-url.ts";
import type { StudentNotice } from "../../lib/students/types.ts";
import RetryButton from "../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../ui/sidebar/private-shell.tsx";
import AdminStudentsView from "../../ui/students/admin-students-view.tsx";
import {
  StudentErrorState,
  StudentForbiddenState,
} from "../../ui/students/student-states.tsx";
import TutorStudentsView from "../../ui/students/tutor-students-view.tsx";

export const metadata: Metadata = {
  title: "Alumnos | EET N° 3100",
  description: "Gestión de alumnos de la EET N° 3100.",
};

type StudentsSearchParams = Record<string, string | string[] | undefined>;

function toSearchParams(input: StudentsSearchParams): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(input)) {
    if (typeof value === "string") {
      params.set(key, value);
    } else if (Array.isArray(value)) {
      for (const item of value) {
        params.append(key, item);
      }
    }
  }

  return params;
}

function getInitialNotice(params: StudentsSearchParams): StudentNotice | null {
  const created = params.created;
  if (created === "1" || (Array.isArray(created) && created[0] === "1")) {
    return { kind: "success", message: STUDENT_NOTICES.created };
  }

  const updated = params.updated;
  if (updated === "1" || (Array.isArray(updated) && updated[0] === "1")) {
    return { kind: "success", message: STUDENT_NOTICES.updated };
  }

  return null;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<StudentsSearchParams>;
}) {
  const access = await getStudentPageAccess("list");
  const collapsed = await getCollapsedPreference();
  const role = getEffectiveRole(access.account) ?? access.account.claims.role;

  const shell = (content: ReactNode) => (
    <PrivateShell
      role={role}
      account={toSidebarAccount(access.account)}
      collapsed={collapsed}
    >
      <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
        <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">{content}</div>
      </main>
    </PrivateShell>
  );

  if (access.status === "forbidden") {
    return shell(
      <StudentForbiddenState message={STUDENT_ACCESS_DENIED_MESSAGE} />,
    );
  }

  if (access.status === "error") {
    const message =
      access.account.status === "error"
        ? access.account.message
        : STUDENTS_LOAD_ERROR_MESSAGE;

    return shell(
      <div className="space-y-4">
        <StudentErrorState message={message} />
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>,
    );
  }

  const params = await searchParams;
  const initialNotice = getInitialNotice(params);

  if (role !== "TUTOR") {
    const initial = parseStudentUrl(toSearchParams(params));
    const result = await listAllStudents(access.token);

    if (!result.ok) {
      if (result.kind === "unauthorized") {
        redirect(STUDENT_SESSION_EXPIRED_PATH);
      }

      return shell(
        <div className="space-y-4">
          {result.kind === "forbidden" ? (
            <StudentForbiddenState message={result.message} />
          ) : (
            <>
              <StudentErrorState message={result.message} />
              <div className="flex justify-center">
                <RetryButton />
              </div>
            </>
          )}
        </div>,
      );
    }

    return shell(
      <AdminStudentsView
        students={result.students}
        role={role}
        initialFilters={initial.filters}
        initialPage={initial.page}
        initialNotice={initialNotice}
      />,
    );
  }

  const result = await listMyStudents(access.token);

  if (!result.ok) {
    if (result.kind === "unauthorized") {
      redirect(STUDENT_SESSION_EXPIRED_PATH);
    }

    return shell(
      <div className="space-y-4">
        {result.kind === "forbidden" ? (
          <StudentForbiddenState message={result.message} />
        ) : (
          <>
            <StudentErrorState message={result.message} />
            <div className="flex justify-center">
              <RetryButton />
            </div>
          </>
        )}
      </div>,
    );
  }

  return shell(
    <TutorStudentsView
      students={result.students}
      role={role}
      initialNotice={initialNotice}
    />,
  );
}
