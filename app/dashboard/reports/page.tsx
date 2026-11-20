import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../lib/auth/effective-role.ts";
import { getCourseListData } from "../../lib/courses/data.ts";
import { getCourseYears } from "../../lib/courses/list.ts";
import { REPORT_ACCESS_DENIED_MESSAGE } from "../../lib/reports/constants.ts";
import type { FiltersAvailability } from "../../lib/reports/filters.ts";
import { getReportsPageAccess } from "../../lib/reports/guard.ts";
import { toSidebarAccount } from "../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../lib/sidebar/collapse-cookie.ts";
import RetryButton from "../../ui/dashboard/retry-button.tsx";
import ReportsView from "../../ui/reports/reports-view.tsx";
import PrivateShell from "../../ui/sidebar/private-shell.tsx";

export const metadata: Metadata = {
  title: "Reportes | EET N° 3100",
  description:
    "Generación y descarga de reportes del personal de la EET N° 3100.",
};

function renderAccessDenied(): ReactNode {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h2 className="text-xl font-bold text-texto-principal">Acceso denegado</h2>
      <p className="mt-2 text-base text-texto-principal">
        {REPORT_ACCESS_DENIED_MESSAGE}
      </p>
      <div className="mt-5 flex justify-center">
        <Link
          href="/dashboard"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app"
        >
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

function renderLoadError(message: string): ReactNode {
  return (
    <div>
      <section
        role="alert"
        className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
      >
        <h2 className="text-xl font-bold text-texto-principal">
          No pudimos cargar los reportes
        </h2>
        <p className="mt-2 text-base text-texto-principal">{message}</p>
      </section>
      <div className="mt-4 flex justify-center">
        <RetryButton />
      </div>
    </div>
  );
}

export default async function ReportsPage() {
  const access = await getReportsPageAccess();
  const collapsed = await getCollapsedPreference();
  const account = access.account;
  const role = getEffectiveRole(account) ?? account.claims.role;
  const sidebarAccount = toSidebarAccount(account);

  if (access.status === "forbidden") {
    return (
      <PrivateShell role={role} account={sidebarAccount} collapsed={collapsed}>
        <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
          <div className="mx-auto w-[97%] md:w-[95%]">
            {renderAccessDenied()}
          </div>
        </main>
      </PrivateShell>
    );
  }

  if (access.status === "error") {
    return (
      <PrivateShell role={role} account={sidebarAccount} collapsed={collapsed}>
        <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
          <div className="mx-auto w-[97%] md:w-[95%]">
            {renderLoadError(
              access.account.status === "error"
                ? access.account.message
                : "Ocurrió un problema al preparar el módulo. Intentá nuevamente.",
            )}
          </div>
        </main>
      </PrivateShell>
    );
  }

  const coursesResult = await getCourseListData(access.token);
  const enrolledStudentsAvailability: FiltersAvailability = {
    year: coursesResult.ok ? getCourseYears(coursesResult.courses) : [],
  };

  return (
    <PrivateShell role={role} account={sidebarAccount} collapsed={collapsed}>
      <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
        <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">
          <ReportsView
            role={access.role}
            enrolledStudentsAvailability={enrolledStudentsAvailability}
          />
        </div>
      </main>
    </PrivateShell>
  );
}
