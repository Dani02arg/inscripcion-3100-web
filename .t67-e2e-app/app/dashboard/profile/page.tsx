import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getEffectiveRole } from "../../lib/auth/effective-role.ts";
import type { ProfileState } from "../../lib/users/types.ts";
import { getProfileData } from "../../lib/users/data.ts";
import {
  PROFILE_ACCESS_DENIED_MESSAGE,
} from "../../lib/users/guard-decision.ts";
import { getProfilePageAccess } from "../../lib/users/guard.ts";
import { toSidebarAccount } from "../../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../../lib/sidebar/collapse-cookie.ts";
import RetryButton from "../../ui/dashboard/retry-button.tsx";
import PrivateShell from "../../ui/sidebar/private-shell.tsx";
import ProfileView from "../../ui/users/profile-view.tsx";

export const metadata: Metadata = {
  title: "Mi perfil | EET N° 3100",
  description: "Consultá la información de tu perfil en la EET N° 3100.",
};

function renderProfileState(
  state: Exclude<ProfileState, { readonly status: "loading" }>,
): ReactNode {
  if (state.status === "ready") {
    return <ProfileView user={state.user} />;
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
          No pudimos cargar tu perfil
        </h1>
        <p className="mt-2 text-base text-texto-principal">{state.message}</p>
      </section>
      <div className="flex justify-center">
        <RetryButton />
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  const access = await getProfilePageAccess();
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
      renderProfileState({
        status: "forbidden",
        message: PROFILE_ACCESS_DENIED_MESSAGE,
      }),
    );
  }

  if (access.status === "error") {
    return shell(
      renderProfileState({
        status: "error",
        message:
          access.account.status === "error"
            ? access.account.message
            : PROFILE_ACCESS_DENIED_MESSAGE,
      }),
    );
  }

  const profile = await getProfileData(access.account);
  return shell(renderProfileState(profile));
}
