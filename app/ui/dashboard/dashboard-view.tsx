import {
  ACCESS_DENIED_MESSAGE,
  ROLE_LABELS,
  ROLE_SUBTITLES,
  WAVE_EMOJI,
} from "../../lib/auth/types.ts";
import type { PrivateAccountState } from "../../lib/dashboard/private-account-state.ts";
import {
  showsTutorEmptyState,
  tutorGreeting,
} from "../../lib/dashboard/role-dashboard.ts";
import EmptyStudentsState from "./empty-students";
import RetryButton from "./retry-button";

interface DashboardViewProps {
  account: PrivateAccountState;
}

/** Contenido del dashboard según el estado de la cuenta. */
export default function DashboardView({ account }: DashboardViewProps) {
  if (account.status === "forbidden") {
    return (
      <p role="alert" className="text-base text-texto-principal">
        {ACCESS_DENIED_MESSAGE}
      </p>
    );
  }

  if (account.status === "error") {
    return (
      <div className="space-y-4">
        <p role="alert" className="text-base text-texto-principal">
          {account.message}
        </p>
        <RetryButton />
      </div>
    );
  }

  const user = account.user;
  const isTutor = showsTutorEmptyState(user.role);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-texto-principal">
          {isTutor ? tutorGreeting(user.name) : `Hola, ${user.name}`}{" "}
          <span aria-hidden="true">{WAVE_EMOJI}</span>
        </h2>
        <p className="mt-2 text-base text-texto-principal">
          {ROLE_SUBTITLES[user.role]}
        </p>
      </div>

      {isTutor ? (
        <EmptyStudentsState />
      ) : (
        <dl className="space-y-2 text-base text-texto-principal">
          <div>
            <dt className="font-semibold">Correo electrónico</dt>
            <dd className="break-all">{user.email}</dd>
          </div>
          <div>
            <dt className="font-semibold">Rol</dt>
            <dd>{ROLE_LABELS[user.role]}</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
