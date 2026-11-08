import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import {
  USER_DELETE_SUCCESS_MESSAGE,
  USERS_LOAD_ERROR_MESSAGE,
} from "../../lib/api/users.ts";
import { getEffectiveRole } from "../../lib/auth/effective-role.ts";
import type { UserRole } from "../../lib/auth/types.ts";
import { toSidebarAccount } from "../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../lib/sidebar/collapse-cookie.ts";
import { getUserListData } from "../../lib/users/data.ts";
import {
  USER_ACCESS_DENIED_MESSAGE,
  USER_SESSION_EXPIRED_PATH,
} from "../../lib/users/guard-decision.ts";
import { getUserPageAccess } from "../../lib/users/guard.ts";
import { hasActiveUserFilters } from "../../lib/users/list.ts";
import type {
  UserListState,
  UserNotice,
} from "../../lib/users/types.ts";
import { toUserListState } from "../../lib/users/user-state.ts";
import { parseUserFilters } from "../../lib/users/users-url.ts";
import PrivateShell from "../../ui/sidebar/private-shell.tsx";
import UsersView from "../../ui/users/users-view.tsx";
import {
  UserTableErrorState,
} from "../../ui/users/user-table-states.tsx";

export const metadata: Metadata = {
  title: "Padrón de usuarios | EET N° 3100",
  description:
    "Consulta y administración del padrón de usuarios de la EET N° 3100.",
};

type UsersSearchParams = Record<string, string | string[] | undefined>;

const SECONDARY_ACTION_CLASSES =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2.5 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

function toSearchParams(input: UsersSearchParams): URLSearchParams {
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

function getInitialNotice(params: URLSearchParams): UserNotice | null {
  if (params.get("deleted") === "1") {
    return {
      kind: "success",
      message: USER_DELETE_SUCCESS_MESSAGE,
    };
  }

  return null;
}

function renderErrorCard(
  kind: "forbidden" | "error",
  message: string,
): ReactNode {
  if (kind === "error") {
    return <UserTableErrorState message={message} />;
  }

  return (
    <section
      role="alert"
      className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
    >
      <h1 className="text-xl font-bold text-texto-principal">
        Acceso denegado
      </h1>
      <p className="mt-2 text-base text-texto-principal">{message}</p>
      <div className="mt-5 flex justify-center">
        <Link href="/dashboard" className={SECONDARY_ACTION_CLASSES}>
          Volver al inicio
        </Link>
      </div>
    </section>
  );
}

function renderListState(
  state: Extract<UserListState, { status: "ready" | "empty" | "no_results" }>,
  filters: ReturnType<typeof parseUserFilters>["filters"],
  notice: UserNotice | null,
  role: UserRole,
  currentUserId: string | null,
): ReactNode {
  return (
    <UsersView
      state={state}
      filters={filters}
      initialNotice={notice}
      role={role}
      currentUserId={currentUserId}
    />
  );
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<UsersSearchParams>;
}) {
  const access = await getUserPageAccess();
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
    return shell(renderErrorCard("forbidden", USER_ACCESS_DENIED_MESSAGE));
  }

  if (access.status === "error") {
    const message =
      access.account.status === "error"
        ? access.account.message
        : USERS_LOAD_ERROR_MESSAGE;

    return shell(renderErrorCard("error", message));
  }

  const params = toSearchParams(await searchParams);
  const initial = parseUserFilters(params);
  const initialNotice = getInitialNotice(params);
  const result = await getUserListData(
    access.token,
    initial.filters,
    initial.page,
  );

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

  const state = toUserListState(
    result,
    hasActiveUserFilters(initial.filters),
  );

  if (
    state.status === "loading" ||
    state.status === "forbidden" ||
    state.status === "error"
  ) {
    return shell(
      renderErrorCard(
        state.status === "forbidden" ? "forbidden" : "error",
        state.status === "loading"
          ? USERS_LOAD_ERROR_MESSAGE
          : state.message,
      ),
    );
  }

  return shell(
    renderListState(
      state,
      initial.filters,
      initialNotice,
      role,
      access.account.status === "ok" ? access.account.user.id : null,
    ),
  );
}
