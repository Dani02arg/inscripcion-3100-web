import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getStudentDetail, getStudentTutor, listMyStudents } from "../../../lib/api/students.ts";
import { getEffectiveRole } from "../../../lib/auth/effective-role.ts";
import { isTutorRole } from "../../../lib/students/access.ts";
import {
  STUDENT_ACCESS_DENIED_MESSAGE,
  STUDENT_SESSION_EXPIRED_PATH,
} from "../../../lib/students/guard-decision.ts";
import { getStudentPageAccess } from "../../../lib/students/guard.ts";
import { STUDENT_NOTICES } from "../../../lib/students/labels.ts";
import { toStudentDetailState } from "../../../lib/students/student-state.ts";
import {
  getStudentReturnLabel,
  sanitizeStudentReturnPath,
} from "../../../lib/students/students-url.ts";
import type {
  StudentNotice,
  StudentTutor,
} from "../../../lib/students/types.ts";
import { toSidebarAccount } from "../../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../../lib/sidebar/collapse-cookie.ts";
import RetryButton from "../../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../../ui/sidebar/private-shell.tsx";
import StudentDetail from "../../../ui/students/student-detail.tsx";
import StudentDetailNotice from "../../../ui/students/student-detail-notice.tsx";
import {
  StudentErrorState,
  StudentForbiddenState,
  StudentNotFoundState,
} from "../../../ui/students/student-states.tsx";

export const metadata: Metadata = {
  title: "Detalle del alumno | Alumnos | EET N° 3100",
  description: "Detalle del alumno en la EET N° 3100.",
};

type StudentDetailSearchParams = {
  returnTo?: string | string[];
  from?: string | string[];
  created?: string | string[];
  updated?: string | string[];
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

function getInitialNotice(
  query: StudentDetailSearchParams,
): StudentNotice | null {
  if (readString(query.created) === "1") {
    return { kind: "success", message: STUDENT_NOTICES.created };
  }

  if (readString(query.updated) === "1") {
    return { kind: "success", message: STUDENT_NOTICES.updated };
  }

  return null;
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>;
  searchParams: Promise<StudentDetailSearchParams>;
}) {
  const access = await getStudentPageAccess("detail");
  const collapsed = await getCollapsedPreference();
  const account = access.account;

  const shell = (content: ReactNode) => (
    <PrivateShell
      role={getEffectiveRole(account) ?? account.claims.role}
      account={toSidebarAccount(account)}
      collapsed={collapsed}
    >
      <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
        <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">{content}</div>
      </main>
    </PrivateShell>
  );

  if (access.status === "forbidden") {
    return shell(<StudentForbiddenState message={STUDENT_ACCESS_DENIED_MESSAGE} />);
  }

  if (access.status === "error") {
    const message =
      access.account.status === "error"
        ? access.account.message
        : "No pudimos cargar al alumno. Intentá nuevamente.";

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
  const returnPath = sanitizeStudentReturnPath(readString(query.returnTo));
  const returnLabel = getStudentReturnLabel(access.role);
  const isTutor = isTutorRole(access.role);
  const initialNotice = getInitialNotice(query);

  if (isTutor) {
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

    const student = result.students.find((item) => item.id === studentId);

    if (!student) {
      return shell(<StudentNotFoundState returnLabel={returnLabel} returnPath={returnPath} />);
    }

    return shell(
      <>
        <StudentDetailNotice initialNotice={initialNotice} />
        <StudentDetail
          student={student}
          tutor={null}
          role={access.role}
          returnPath={returnPath}
        />
      </>,
    );
  }

  const result = await getStudentDetail(access.token, studentId);

  if (!result.ok && result.kind === "unauthorized") {
    redirect(STUDENT_SESSION_EXPIRED_PATH);
  }

  let tutor: StudentTutor | null = null;

  if (result.ok) {
    const tutorResult = await getStudentTutor(access.token, studentId);
    tutor = tutorResult.ok ? tutorResult.tutor : null;
  }

  const state = toStudentDetailState(result, tutor ? { ok: true, tutor, message: "" } : null);

  if (state.status === "forbidden") {
    return shell(<StudentForbiddenState message={state.message} />);
  }

  if (state.status === "not_found") {
    return shell(<StudentNotFoundState returnLabel={returnLabel} returnPath={returnPath} />);
  }

  if (state.status === "error" || state.status === "loading") {
    return shell(
      <div className="space-y-4">
        <StudentErrorState
          message={
            state.status === "error"
              ? state.message
              : "No pudimos cargar al alumno. Intentá nuevamente."
          }
        />
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>,
    );
  }

  return shell(
    <>
      <StudentDetailNotice initialNotice={initialNotice} />
      <StudentDetail
        student={state.student}
        tutor={state.tutor}
        role={access.role}
        returnPath={returnPath}
      />
    </>,
  );
}
