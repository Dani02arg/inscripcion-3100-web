"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { setCourseStatusAction } from "../../lib/actions/courses.ts";
import { COURSE_ACTION_IDLE_STATE } from "../../lib/courses/course-state.ts";
import { serializeCourseFilters } from "../../lib/courses/filters-url.ts";
import {
  clearFilters,
  filterCourses,
  paginateCourses,
  sortCourses,
  summarizeCourses,
} from "../../lib/courses/list.ts";
import {
  COURSE_CYCLES,
  COURSE_SHIFTS,
  COURSE_SPECIALITIES,
} from "../../lib/courses/types.ts";
import type {
  Course,
  CourseActionState,
  CourseFilters,
  CourseFilterOptions,
  CourseNotice as CourseNoticeData,
} from "../../lib/courses/types.ts";
import CourseFiltersPanel from "./course-filters.tsx";
import CourseNotice from "./course-notice.tsx";
import CoursePagination from "./course-pagination.tsx";
import CourseRowActions from "./course-row-actions.tsx";
import CourseSummaryCards from "./course-summary-cards.tsx";
import CourseTable from "./course-table.tsx";
import { CourseTableEmptyState } from "./course-table-states.tsx";
import CloneCourseDialog from "./clone-course-dialog.tsx";
import CloneYearDialog from "./clone-year-dialog.tsx";
import CoursesHeader from "./courses-header.tsx";
import DeleteCourseDialog from "./delete-course-dialog.tsx";
import StatusCourseDialog from "./status-dialog.tsx";

interface CoursesViewProps {
  courses: Course[];
  years: number[];
  currentYear: number;
  initialFilters: CourseFilters;
  initialPage: number;
  initialNotice?: CourseNoticeData | null;
}

/** Coordina filtros, tarjetas, tabla y paginación sobre el conjunto completo. */
export default function CoursesView({
  courses,
  years,
  currentYear,
  initialFilters,
  initialPage,
  initialNotice = null,
}: CoursesViewProps) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(initialPage);
  const [notice, setNotice] = useState<CourseNoticeData | null>(
    initialNotice,
  );
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [cloneCourseTarget, setCloneCourseTarget] =
    useState<Course | null>(null);
  const [statusCourse, setStatusCourse] = useState<Course | null>(null);
  const [cloneYearOpen, setCloneYearOpen] = useState(false);
  const [isStatusPending, startStatusTransition] = useTransition();

  const filterOptions: CourseFilterOptions = useMemo(
    () => ({
      years,
      cycles: COURSE_CYCLES,
      specialities: COURSE_SPECIALITIES,
      shifts: COURSE_SHIFTS,
    }),
    [years],
  );

  const filteredCourses = useMemo(
    () => filterCourses(courses, filters),
    [courses, filters],
  );
  const sortedCourses = useMemo(
    () => sortCourses(filteredCourses),
    [filteredCourses],
  );
  const pageData = useMemo(
    () => paginateCourses(sortedCourses, page),
    [sortedCourses, page],
  );
  const summary = useMemo(
    () => summarizeCourses(filteredCourses),
    [filteredCourses],
  );
  const cloneYearOptions = useMemo(
    () =>
      years
        .filter((year) => year < currentYear)
        .map((year) => ({
          year,
          count: courses.filter((course) => course.year === year).length,
        })),
    [courses, currentYear, years],
  );

  useEffect(() => {
    const query = serializeCourseFilters(
      filters,
      pageData.page,
      new URLSearchParams(window.location.search),
    );
    const nextUrl =
      query.length > 0
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  }, [filters, pageData.page]);

  const handleFiltersChange = (nextFilters: CourseFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(clearFilters(currentYear, years));
    setPage(1);
  };

  const applyStatusResult = (state: CourseActionState) => {
    if (state.status === "success") {
      setNotice({ kind: "success", message: state.message });
      return;
    }

    if (state.status !== "idle" && state.status !== "pending") {
      setNotice({ kind: "error", message: state.message });
    }
  };

  const handleCreate = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`;
    router.push(
      `/dashboard/courses/new?returnTo=${encodeURIComponent(returnTo)}`,
    );
  };

  const handleToggleStatus = (course: Course) => {
    if (course.status === "active") {
      setStatusCourse(course);
      return;
    }

    if (isStatusPending) {
      return;
    }

    const formData = new FormData();
    formData.set("courseId", course.id);
    formData.set("status", "active");
    formData.set("currentCapacity", String(course.currentCapacity));

    startStatusTransition(async () => {
      const state = await setCourseStatusAction(
        COURSE_ACTION_IDLE_STATE,
        formData,
      );
      applyStatusResult(state);
    });
  };

  const handleCloseNotice = () => {
    setNotice(null);

    const params = new URLSearchParams(window.location.search);
    params.delete("created");
    params.delete("updated");
    const query = params.toString();
    const nextUrl =
      query.length > 0
        ? `${window.location.pathname}?${query}`
        : window.location.pathname;

    window.history.replaceState(null, "", nextUrl);
  };

  const hasCourses = courses.length > 0;
  const hasFilteredCourses = filteredCourses.length > 0;

  return (
    <div className="space-y-6">
      <CoursesHeader
        onCreate={handleCreate}
        onCloneYear={() => setCloneYearOpen(true)}
      />

      {notice ? (
        <CourseNotice notice={notice} onClose={handleCloseNotice} />
      ) : null}

      <CourseSummaryCards
        summary={summary}
        selectedYear={filters.year}
        status="ready"
      />

      <CourseFiltersPanel
        filters={filters}
        options={filterOptions}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {!hasCourses ? (
        <CourseTableEmptyState variant="global" />
      ) : !hasFilteredCourses ? (
        <CourseTableEmptyState
          variant="filtered"
          onClearFilters={handleClearFilters}
        />
      ) : (
        <div className="space-y-4">
          <CourseTable
            courses={pageData.items}
            renderRowActions={(course) => (
              <CourseRowActions
                course={course}
                currentYear={currentYear}
                onView={(selected) => {
                  const from = `${window.location.pathname}${window.location.search}`;
                  router.push(
                    `/dashboard/courses/${encodeURIComponent(selected.id)}?from=${encodeURIComponent(from)}`,
                  );
                }}
                onEdit={(selected) => {
                  const returnTo = `${window.location.pathname}${window.location.search}`;
                  router.push(
                    `/dashboard/courses/${encodeURIComponent(selected.id)}/edit?from=list&returnTo=${encodeURIComponent(returnTo)}`,
                  );
                }}
                onClone={(selected) => setCloneCourseTarget(selected)}
                onDelete={(selected) => setDeleteCourse(selected)}
                onToggleStatus={handleToggleStatus}
              />
            )}
          />
          <CoursePagination
            page={pageData.page}
            totalPages={pageData.totalPages}
            totalResults={pageData.total}
            onPageChange={setPage}
          />
        </div>
      )}

      {cloneYearOpen ? (
        <CloneYearDialog
          originYears={cloneYearOptions}
          currentYear={currentYear}
          onClose={() => setCloneYearOpen(false)}
          onCompleted={(message, kind) => {
            setNotice({ kind, message });
          }}
        />
      ) : null}

      {cloneCourseTarget ? (
        <CloneCourseDialog
          course={cloneCourseTarget}
          currentYear={currentYear}
          onClose={() => setCloneCourseTarget(null)}
          onCloned={(message) => {
            setNotice({ kind: "success", message });
          }}
        />
      ) : null}

      {deleteCourse ? (
        <DeleteCourseDialog
          course={deleteCourse}
          onClose={() => setDeleteCourse(null)}
          onDeleted={(message) => {
            setNotice({ kind: "success", message });
          }}
        />
      ) : null}

      {statusCourse ? (
        <StatusCourseDialog
          course={statusCourse}
          onClose={() => setStatusCourse(null)}
          onUpdated={(message) => {
            setNotice({ kind: "success", message });
          }}
        />
      ) : null}
    </div>
  );
}
