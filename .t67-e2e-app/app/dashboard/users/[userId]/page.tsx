import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  USER_DETAIL_LOAD_ERROR_MESSAGE,
  USER_NOT_FOUND_MESSAGE,
} from "../../../lib/api/users.ts";
import { getEffectiveRole } from "../../../lib/auth/effective-role.ts";
import type { UserRole } from "../../../lib/auth/types.ts";
import { toSidebarAccount } from "../../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../../lib/sidebar/collapse-cookie.ts";
import { getUserDetailData } from "../../../lib/users/data.ts";
import {
  USER_ACCESS_DENIED_MESSAGE,
  USER_SESSION_EXPIRED_PATH,
} from "../../../lib/users/guard-decision.ts";
import { getUserPageAccess } from "../../../lib/users/guard.ts";
import type { UserDetailState } from "../../../lib/users/types.ts";
import { toUserDetailState } from "../../../lib/users/user-state.ts";
import { sanitizeUserReturnPath, STAFF_PATH } from "../../../lib/users/users-url.ts";
import RetryButton from "../../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../../ui/sidebar/private-shell.tsx";
import UserDetailActions from "../../../ui/users/user-detail-actions.tsx";
import UserDetailView from "../../../ui/users/user-detail.tsx";

export const metadata: Metadata = {
  title: "Detalle de usuario | Gestión de usuarios | EET N° 3100",
  description: "Consulta el detalle de un usuario de la EET N° 3100.",
};

type UserDetailSearchParams = {
  from?: string | string[];
};

const SECONDARY_ACTION_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

function readString(value: string | string[] | undefined): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return null;
}

function getReturnLabel(returnPath: string): string {
  return returnPath === STAFF_PATH
    ? "Volver al directorio"
    : "Volver al padrón";
}

function renderReturnLink(returnPath: string): ReactNode {
  return (
    <Link href={returnPath} className={SECONDARY_ACTION_CLASSES}>
      {getReturnLabel(returnPath)}
    </Link>
  );
}

function renderDeniedState(returnPath: string): ReactNode {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h1 className="text-xl font-bold text-texto-principal">
        Acceso denegado
      </h1>
      <p className="mt-2 text-base text-texto-principal">
        {USER_ACCESS_DENIED_MESSAGE}
      </p>
      <div className="mt-5 flex justify-center">
        {renderReturnLink(returnPath)}
      </div>
    </section>
  );
}

function renderErrorState(
  message: string,
  returnPath: string,
): ReactNode {
  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h1 className="text-xl font-bold text-texto-principal">
        No pudimos cargar el usuario
      </h1>
      <p className="mt-2 text-base text-texto-principal">{message}</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <RetryButton />
        {renderReturnLink(returnPath)}
      </div>
    </section>
  );
}

function renderUserDetail(
  state: Extract<UserDetailState, { status: "ready" }>,
  returnPath: string,
  viewerRole: UserRole,
  currentUserId: string | null,
): ReactNode {
  const { user } = state;

  return (
    <section className="space-y-5 rounded-2xl border border-borde-input bg-superficie p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-texto-principal">
            {user.name} {user.lastname}
          </h1>
          <p className="mt-1 text-base text-texto-secundario">
            Detalle de usuario
          </p>
        </div>
      </div>
      <UserDetailView user={user} viewerRole={viewerRole} />
      <UserDetailActions
        user={user}
        viewerRole={viewerRole}
        currentUserId={currentUserId}
        origin={returnPath === STAFF_PATH ? "staff" : "users"}
      />
      {renderReturnLink(returnPath)}
    </section>
  );
}

function renderDetailState(
  state: Exclude<UserDetailState, { readonly status: "loading" }>,
  returnPath: string,
  viewerRole: UserRole,
  currentUserId: string | null,
): ReactNode {
  if (state.status === "ready") {
    return renderUserDetail(state, returnPath, viewerRole, currentUserId);
  }

  if (state.status === "not_found") {
    return (
      <section
        role="status"
        className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
      >
        <h1 className="text-xl font-bold text-texto-principal">
          Usuario no encontrado
        </h1>
        <p className="mt-2 text-base text-texto-principal">
          {USER_NOT_FOUND_MESSAGE}
        </p>
        <div className="mt-5 flex justify-center">
          {renderReturnLink(returnPath)}
        </div>
      </section>
    );
  }

  if (state.status === "forbidden") {
    return renderDeniedState(returnPath);
  }

  return renderErrorState(state.message, returnPath);
}

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<UserDetailSearchParams>;
}) {
  const access = await getUserPageAccess();
  const collapsed = await getCollapsedPreference();
  const account = access.account;
  const role = getEffectiveRole(account) ?? account.claims.role;
  const query = await searchParams;
  const returnPath = sanitizeUserReturnPath(readString(query.from));

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
    return shell(renderDeniedState(returnPath));
  }

  if (access.status === "error") {
    const message =
      access.account.status === "error"
        ? access.account.message
        : USER_DETAIL_LOAD_ERROR_MESSAGE;

    return shell(renderErrorState(message, returnPath));
  }

  const { userId } = await params;
  const result = await getUserDetailData(access.token, userId);

  if (!result.ok && result.kind === "unauthorized") {
    redirect(USER_SESSION_EXPIRED_PATH);
  }

  const state = toUserDetailState(result);
  const currentUserId =
    access.account.status === "ok" ? access.account.user.id : null;

  return shell(
    renderDetailState(state, returnPath, access.role, currentUserId),
  );
}
