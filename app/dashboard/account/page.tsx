import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../lib/auth/effective-role.ts";
import type { AccountState } from "../../lib/users/types.ts";
import { getAccountData } from "../../lib/users/data.ts";
import {
  PROFILE_ACCESS_DENIED_MESSAGE,
} from "../../lib/users/guard-decision.ts";
import { getAccountPageAccess } from "../../lib/users/guard.ts";
import { toSidebarAccount } from "../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../lib/sidebar/collapse-cookie.ts";
import AccountView from "../../ui/users/account-view.tsx";
import RetryButton from "../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../ui/sidebar/private-shell.tsx";

export const metadata: Metadata = {
  title: "Configuración de cuenta | EET N° 3100",
  description: "Consultá los datos asociados a tu cuenta en la EET N° 3100.",
};

function renderAccountState(
  state: Exclude<AccountState, { readonly status: "loading" }>,
): ReactNode {
  if (state.status === "ready") {
    return <AccountView user={state.user} />;
  }

  if (state.status === "forbidden") {
    return (
      <section
        role="alert"
        className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
      >
        <h1 className="text-xl font-bold text-texto-principal">
          Acceso denegado
        </h1>
        <p className="mt-2 text-base text-texto-principal">
          {PROFILE_ACCESS_DENIED_MESSAGE}
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section
        role="alert"
        className="rounded-2xl border border-borde-input bg-superficie p-6 text-center shadow-sm"
      >
        <h1 className="text-xl font-bold text-texto-principal">
          No pudimos cargar la configuración de tu cuenta
        </h1>
        <p className="mt-2 text-base text-texto-principal">{state.message}</p>
      </section>
      <div className="flex justify-center">
        <RetryButton />
      </div>
    </div>
  );
}

export default async function AccountPage() {
  const access = await getAccountPageAccess();
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
      renderAccountState({
        status: "forbidden",
        message: PROFILE_ACCESS_DENIED_MESSAGE,
      }),
    );
  }

  if (access.status === "error") {
    return shell(
      renderAccountState({
        status: "error",
        message:
          access.account.status === "error"
            ? access.account.message
            : PROFILE_ACCESS_DENIED_MESSAGE,
      }),
    );
  }

  const accountState = await getAccountData(access.account);
  return shell(renderAccountState(accountState));
}
