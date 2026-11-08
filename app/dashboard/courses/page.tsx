import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../lib/auth/effective-role.ts";
import { getCourseListData } from "../../lib/courses/data.ts";
import { parseCourseFilters } from "../../lib/courses/filters-url.ts";
import { getCourseYears } from "../../lib/courses/list.ts";
import type { CourseNotice } from "../../lib/courses/types.ts";
import {
  COURSE_ACCESS_DENIED_MESSAGE,
  COURSE_SESSION_EXPIRED_PATH,
  getCoursePageAccess,
} from "../../lib/courses/guard.ts";
import { getCollapsedPreference } from "../../lib/sidebar/collapse-cookie.ts";
import { toSidebarAccount } from "../../lib/sidebar/account.ts";
import RetryButton from "../../ui/dashboard/retry-button.tsx";
import CoursesView from "../../ui/courses/courses-view.tsx";
import { CourseTableErrorState } from "../../ui/courses/course-table-states.tsx";
import PrivateShell from "../../ui/sidebar/private-shell.tsx";

export const metadata: Metadata = {
  title: "Cursos | EET N° 3100",
  description:
    "Gestión de la oferta académica de la EET N° 3100.",
};

type CoursesSearchParams = Record<
  string,
  string | string[] | undefined
>;

function toSearchParams(
  input: CoursesSearchParams,
): URLSearchParams {
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

function getInitialNotice(params: URLSearchParams): CourseNotice | null {
  const created = params.get("created");

  if (created) {
    return {
      kind: "success",
      message: `Curso creado correctamente: ${created}.`,
    };
  }

  const updated = params.get("updated");

  if (updated) {
    return {
      kind: "success",
      message: `Curso actualizado correctamente: ${updated}.`,
    };
  }

  return null;
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: Promise<CoursesSearchParams>;
}) {
  const access = await getCoursePageAccess();
  const collapsed = await getCollapsedPreference();
  const account = access.account;
  const role = getEffectiveRole(account) ?? account.claims.role;

  const shell = (content: ReactNode) => (
    <PrivateShell
      role={role}
      account={toSidebarAccount(account)}
      collapsed={collapsed}
    >
      <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
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
        : "No pudimos cargar los cursos. Intentá nuevamente.";

    return shell(
      <div className="space-y-4">
        <CourseTableErrorState kind="error" message={message} />
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>,
    );
  }

  const result = await getCourseListData(access.token);

  if (!result.ok) {
    if (result.kind === "unauthorized") {
      redirect(COURSE_SESSION_EXPIRED_PATH);
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
  const years = getCourseYears(result.courses);
  const params = toSearchParams(await searchParams);
  const initial = parseCourseFilters(params, currentYear, years);
  const initialNotice = getInitialNotice(params);

  return shell(
    <CoursesView
      courses={result.courses}
      years={years}
      currentYear={currentYear}
      initialFilters={initial.filters}
      initialPage={initial.page}
      initialNotice={initialNotice}
    />,
  );
}
