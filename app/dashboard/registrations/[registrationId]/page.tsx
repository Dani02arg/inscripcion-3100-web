import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../../lib/auth/effective-role.ts";
import {
  getAvailableCoursesData,
  getRegistrationDetailData,
  getRegistrationTutorData,
} from "../../../lib/registrations/data.ts";
import {
  REGISTRATION_ACCESS_DENIED_MESSAGE,
  REGISTRATION_SESSION_EXPIRED_PATH,
} from "../../../lib/registrations/guard-decision.ts";
import { getRegistrationPageAccess } from "../../../lib/registrations/guard.ts";
import { toRegistrationDetailState } from "../../../lib/registrations/registration-state.ts";
import type {
  AvailableCourse,
  RegistrationTutor,
} from "../../../lib/registrations/types.ts";
import { toSidebarAccount } from "../../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../../lib/sidebar/collapse-cookie.ts";
import RetryButton from "../../../ui/dashboard/retry-button.tsx";
import RegistrationDetail from "../../../ui/registrations/registration-detail.tsx";
import {
  RegistrationErrorState,
  RegistrationNotFoundState,
} from "../../../ui/registrations/registration-states.tsx";
import PrivateShell from "../../../ui/sidebar/private-shell.tsx";

export const metadata: Metadata = {
  title: "Detalle de la inscripción | Inscripciones | EET N° 3100",
  description: "Detalle de una solicitud de inscripción en la EET N° 3100.",
};

export default async function RegistrationDetailPage({
  params,
}: {
  params: Promise<{ registrationId: string }>;
}) {
  const access = await getRegistrationPageAccess("detail");
  const collapsed = await getCollapsedPreference();
  const account = access.account;
  const role = getEffectiveRole(account) ?? account.claims.role;

  const shell = (content: ReactNode) => (
    <PrivateShell
      role={role}
      account={toSidebarAccount(account)}
      collapsed={collapsed}
    >
      <main className="mx-auto w-full max-w-5xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
        <div className="mx-auto w-[97%] space-y-6 md:w-[95%]">{content}</div>
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
        : "No pudimos cargar la inscripción. Intentá nuevamente.";

    return shell(
      <div className="space-y-4">
        <RegistrationErrorState kind="error" message={message} />
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>,
    );
  }

  const { registrationId } = await params;
  const result = await getRegistrationDetailData(access.token, registrationId);

  if (!result.ok && result.kind === "unauthorized") {
    redirect(REGISTRATION_SESSION_EXPIRED_PATH);
  }

  let tutor: RegistrationTutor | null = null;
  let availableCourses: readonly AvailableCourse[] = [];

  if (result.ok) {
    tutor = await getRegistrationTutorData(
      access.token,
      result.registration.studentId,
    );
    availableCourses =
      (await getAvailableCoursesData(
        access.token,
        result.registration.course.year,
      )) ?? [];
  }

  const state = toRegistrationDetailState(result, tutor);

  if (state.status === "forbidden") {
    return shell(
      <RegistrationErrorState kind="forbidden" message={state.message} />,
    );
  }

  if (state.status === "not_found") {
    return shell(<RegistrationNotFoundState />);
  }

  if (state.status === "error" || state.status === "loading") {
    return shell(
      <div className="space-y-4">
        <RegistrationErrorState
          kind="error"
          message={
            state.status === "error"
              ? state.message
              : "No pudimos cargar la inscripción. Intentá nuevamente."
          }
        />
        <div className="flex justify-center">
          <RetryButton />
        </div>
      </div>,
    );
  }

  return shell(
    <RegistrationDetail
      registration={state.registration}
      tutor={state.tutor}
      availableCourses={availableCourses}
    />,
  );
}
