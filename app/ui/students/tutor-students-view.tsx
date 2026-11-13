"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { UserRole } from "../../lib/auth/types.ts";
import type { Student, StudentNotice as StudentNoticeData } from "../../lib/students/types.ts";
import {
  studentDetailPath,
  studentEditPath,
} from "../../lib/students/students-url.ts";
import StudentEmptyState from "./student-empty-state.tsx";
import StudentNotice from "./student-notice.tsx";
import StudentRowActions from "./student-row-actions.tsx";
import StudentTable from "./student-table.tsx";
import StudentUnavailableDialog from "./student-unavailable-dialog.tsx";
import StudentsHeader from "./students-header.tsx";

interface TutorStudentsViewProps {
  readonly students: readonly Student[];
  readonly role: UserRole;
  readonly initialNotice: StudentNoticeData | null;
}

/** Vista del tutor: listado propio, estado vacío, avisos y acciones. */
export default function TutorStudentsView({
  students,
  role,
  initialNotice,
}: TutorStudentsViewProps) {
  const router = useRouter();
  const noticeKey = initialNotice
    ? `${initialNotice.kind}:${initialNotice.message}`
    : null;
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [deleteUnavailable, setDeleteUnavailable] = useState(false);
  const notice =
    noticeKey !== null && dismissedKey !== noticeKey ? initialNotice : null;

  const handleClearNotice = useCallback(() => {
    setDismissedKey(noticeKey);

    const params = new URLSearchParams(window.location.search);
    params.delete("created");
    params.delete("updated");
    const query = params.toString();
    const nextUrl =
      query.length > 0
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  }, [noticeKey]);

  const hasStudents = students.length > 0;

  return (
    <div className="space-y-6">
      <StudentsHeader variant="tutor" showRegisterButton={hasStudents} />

      {notice ? (
        <StudentNotice
          key={`${notice.kind}-${notice.message}`}
          notice={notice}
          onClose={handleClearNotice}
        />
      ) : null}

      {!hasStudents ? (
        <StudentEmptyState variant="tutor" />
      ) : (
        <StudentTable
          students={students}
          caption="Listado de alumnos a tu cargo"
          variant="tutor"
          renderRowActions={(student) => (
            <StudentRowActions
              student={student}
              role={role}
              onView={(selected) => router.push(studentDetailPath(selected.id))}
              onEdit={(selected) => router.push(studentEditPath(selected.id))}
              onDelete={() => setDeleteUnavailable(true)}
            />
          )}
        />
      )}

      <StudentUnavailableDialog
        open={deleteUnavailable}
        onClose={() => setDeleteUnavailable(false)}
      />
    </div>
  );
}
