import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../lib/auth/effective-role.ts";
import { getRegistrationListData } from "../../lib/registrations/data.ts";
import {
  REGISTRATION_ACCESS_DENIED_MESSAGE,
  REGISTRATION_SESSION_EXPIRED_PATH,
} from "../../lib/registrations/guard-decision.ts";
import { getRegistrationPageAccess } from "../../lib/registrations/guard.ts";
import { parseRegistrationsUrl } from "../../lib/registrations/registrations-url.ts";
import { toSidebarAccount } from "../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../lib/sidebar/collapse-cookie.ts";
import RetryButton from "../../ui/dashboard/retry-button.tsx";
import { RegistrationErrorState } from "../../ui/registrations/registration-states.tsx";
import RegistrationsView from "../../ui/registrations/registrations-view.tsx";
import PrivateShell from "../../ui/sidebar/private-shell.tsx";

export const metadata: Metadata = {
  title: "Inscripciones | EET N° 3100",
  description:
    "Evaluación de las solicitudes de inscripción de la EET N° 3100.",
};

type RegistrationsSearchParams = Record<
  string,
  string | string[] | undefined
>;

function toSearchParams(
  input: RegistrationsSearchParams,
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

export default async function RegistrationsPage({
  searchParams,
}: {
  searchParams: Promise<RegistrationsSearchParams>;
}) {
  const access = await getRegistrationPageAccess();
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
      <RegistrationErrorState
        kind="forbidden"
        message={REGISTRATION_ACCESS_DENIED_MESSAGE}
      />,
    );
  }

  if (access.status === "error") {
    const message =
      access.account.status === "error"
        ? access.account.message
        : "No pudimos cargar las inscripciones. Intentá nuevamente.";

    return shell(
      <div className="space-y-4">
        <RegistrationErrorState kind="error" message={message} />
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>,
    );
  }

  const result = await getRegistrationListData(access.token);

  if (!result.ok) {
    if (result.kind === "unauthorized") {
      redirect(REGISTRATION_SESSION_EXPIRED_PATH);
    }

    return shell(
      <div className="space-y-4">
        <RegistrationErrorState
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

  const years = [
    ...new Set(result.registrations.map((item) => item.course.year)),
  ].sort((left, right) => right - left);

  const initial = parseRegistrationsUrl(toSearchParams(await searchParams));

  return shell(
    <RegistrationsView
      registrations={result.registrations}
      years={years}
      initialTab={initial.tab}
      initialFilters={initial.filters}
      initialPage={initial.page}
    />,
  );
}
