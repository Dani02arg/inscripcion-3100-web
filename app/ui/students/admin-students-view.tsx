"use client";

import { useEffect, useMemo, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";

import type { UserRole } from "../../lib/auth/types.ts";
import {
  clearStudentFilters,
  filterStudents,
  hasActiveStudentFilters,
  paginateStudents,
} from "../../lib/students/list.ts";
import {
  clearStudentFiltersStorage,
  readStudentFilters,
  writeStudentFilters,
} from "../../lib/students/filters-storage.ts";
import {
  getStudentListPath,
  studentDetailPath,
} from "../../lib/students/students-url.ts";
import type {
  Student,
  StudentFilters as StudentFiltersValues,
  StudentNotice as StudentNoticeData,
} from "../../lib/students/types.ts";
import UserPagination from "../users/user-pagination.tsx";
import StudentEmptyState from "./student-empty-state.tsx";
import StudentFilters from "./student-filters.tsx";
import StudentNotice from "./student-notice.tsx";
import StudentRowActions from "./student-row-actions.tsx";
import StudentTable from "./student-table.tsx";
import StudentsHeader from "./students-header.tsx";

interface AdminStudentsViewProps {
  readonly students: readonly Student[];
  readonly role: UserRole;
  readonly initialFilters: StudentFiltersValues;
  readonly initialPage: number;
  readonly initialNotice: StudentNoticeData | null;
}

const CLEAR_BUTTON_CLASSES =
  "mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

/** Padrón administrativo: filtros, paginación de 15, dirección y avisos. */
export default function AdminStudentsView({
  students,
  role,
  initialFilters,
  initialPage,
  initialNotice,
}: AdminStudentsViewProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const noticeKey = initialNotice
    ? `${initialNotice.kind}:${initialNotice.message}`
    : null;
  const notice =
    noticeKey !== null && dismissedKey !== noticeKey ? initialNotice : null;

  useEffect(() => {
    const stored = readStudentFilters();

    if (stored.studentDni.length === 0 && stored.studentCuil.length === 0) {
      return;
    }

    startTransition(() => {
      setFilters((previous) => ({
        ...previous,
        studentDni: stored.studentDni,
        studentCuil: stored.studentCuil,
      }));
      setPage(1);
    });
  }, [startTransition]);

  const filteredStudents = useMemo(
    () => filterStudents(students, filters),
    [filters, students],
  );
  const pageData = useMemo(
    () => paginateStudents(filteredStudents, page),
    [filteredStudents, page],
  );

  useEffect(() => {
    const nextUrl = getStudentListPath(
      filters,
      pageData.page,
      new URLSearchParams(window.location.search),
    );
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [filters, pageData.page]);

  const filtersKey = `${filters.studentDni}|${filters.studentCuil}|${getStudentListPath(filters, 1)}`;

  const handleApply = (nextFilters: StudentFiltersValues) => {
    setFilters(nextFilters);
    setPage(1);
    writeStudentFilters({
      studentDni: nextFilters.studentDni,
      studentCuil: nextFilters.studentCuil,
    });
  };

  const handleClear = () => {
    setFilters(clearStudentFilters());
    setPage(1);
    clearStudentFiltersStorage();
  };

  const handleCloseNotice = useCallback(() => {
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
  const hasFilteredStudents = filteredStudents.length > 0;
  const hasFilters = hasActiveStudentFilters(filters);

  return (
    <div className="space-y-6">
      <StudentsHeader variant="admin" />

      {notice ? (
        <StudentNotice
          key={`${notice.kind}-${notice.message}`}
          notice={notice}
          onClose={handleCloseNotice}
        />
      ) : null}

      <StudentFilters
        key={filtersKey}
        initialFilters={filters}
        isPending={isPending}
        onApply={handleApply}
        onClear={handleClear}
      />

      {!hasStudents ? (
        <StudentEmptyState variant="admin" />
      ) : !hasFilteredStudents ? (
        <section
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
        >
          <h2 className="text-xl font-bold text-texto-principal">
            Sin resultados
          </h2>
          <p className="mt-2 text-base text-texto-principal">
            No encontramos alumnos con los filtros aplicados.
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={handleClear}
              className={CLEAR_BUTTON_CLASSES}
            >
              Limpiar filtros
            </button>
          ) : null}
        </section>
      ) : (
        <StudentTable
          students={pageData.items}
          caption="Padrón de alumnos"
          variant="admin"
          renderRowActions={(student) => (
            <StudentRowActions
              student={student}
              role={role}
              onView={(selected) => {
                const returnTo = `${window.location.pathname}${window.location.search}`;
                router.push(
                  `${studentDetailPath(selected.id)}?returnTo=${encodeURIComponent(returnTo)}`,
                );
              }}
            />
          )}
        />
      )}

      <UserPagination
        page={pageData.page}
        totalPages={pageData.totalPages}
        totalResults={pageData.total}
        isPending={isPending}
        onPageChange={setPage}
        label="Paginación del padrón de alumnos"
      />
    </div>
  );
}
