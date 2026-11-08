import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { STAFF_LOAD_ERROR_MESSAGE } from "../../../lib/api/users.ts";
import { getEffectiveRole } from "../../../lib/auth/effective-role.ts";
import { toSidebarAccount } from "../../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../../lib/sidebar/collapse-cookie.ts";
import { getStaffData } from "../../../lib/users/data.ts";
import {
  USER_ACCESS_DENIED_MESSAGE,
  USER_SESSION_EXPIRED_PATH,
} from "../../../lib/users/guard-decision.ts";
import { getUserPageAccess } from "../../../lib/users/guard.ts";
import RetryButton from "../../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../../ui/sidebar/private-shell.tsx";
import DirectoryView from "../../../ui/users/directory-view.tsx";
import UsersHeader from "../../../ui/users/users-header.tsx";

export const metadata: Metadata = {
  title: "Directorio de staff | Gestión de usuarios | EET N° 3100",
  description:
    "Consulta el directorio del personal administrativo de la EET N° 3100.",
};

const SECONDARY_ACTION_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

function renderErrorCard(
  kind: "forbidden" | "error",
  message: string,
): ReactNode {
  if (kind === "error") {
    return (
      <div className="space-y-4">
        <section
          role="alert"
          className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
        >
          <h2 className="text-xl font-bold text-texto-principal">
            No pudimos cargar el directorio
          </h2>
          <p className="mt-2 text-base text-texto-principal">{message}</p>
        </section>
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>
    );
  }

  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h2 className="text-xl font-bold text-texto-principal">
        Acceso denegado
      </h2>
      <p className="mt-2 text-base text-texto-principal">{message}</p>
      <div className="mt-5 flex justify-center">
        <Link href="/dashboard" className={SECONDARY_ACTION_CLASSES}>
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

export default async function StaffDirectoryPage() {
  const access = await getUserPageAccess();
  const collapsed = await getCollapsedPreference();
  const role =
    getEffectiveRole(access.account) ?? access.account.claims.role;

  const shell = (content: ReactNode) => (
    <PrivateShell
      role={role}
      account={toSidebarAccount(access.account)}
      collapsed={collapsed}
    >
      <main className="mx-auto w-full max-w-7xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
        <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">
          <UsersHeader
            sectionLabel="Directorio de staff"
            usersHref="/dashboard/users"
            title="Directorio de staff"
            description="Consultá el personal administrativo de la institución."
          />
          {content}
        </div>
      </main>
    </PrivateShell>
  );

  if (access.status === "forbidden") {
    return shell(
      renderErrorCard("forbidden", USER_ACCESS_DENIED_MESSAGE),
    );
  }

  if (access.status === "error") {
    const message =
      access.account.status === "error"
        ? access.account.message
        : STAFF_LOAD_ERROR_MESSAGE;

    return shell(renderErrorCard("error", message));
  }

  const result = await getStaffData(access.token);

  if (!result.ok) {
    if (result.kind === "unauthorized") {
      redirect(USER_SESSION_EXPIRED_PATH);
    }

    return shell(
      renderErrorCard(
        result.kind === "forbidden" ? "forbidden" : "error",
        result.message,
      ),
    );
  }

  return shell(
    <DirectoryView
      users={result.users}
      role={role}
      currentUserId={
        access.account.status === "ok"
          ? access.account.user.id
          : null
      }
    />,
  );
}
