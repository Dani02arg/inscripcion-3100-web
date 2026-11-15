import type { Metadata } from "next";

import { getEffectiveRole } from "../lib/auth/effective-role.ts";
import { getSessionToken } from "../lib/auth/session-cookie.ts";
import { DASHBOARD_TITLE } from "../lib/auth/types.ts";
import { getPrivateAccount } from "../lib/dashboard/private-account.ts";
import { showsPendingRegistrationsCard } from "../lib/dashboard/role-dashboard.ts";
import { getPendingRegistrationsTotalData } from "../lib/registrations/data.ts";
import { toSidebarAccount } from "../lib/sidebar/account.ts";
import { getCollapsedPreference } from "../lib/sidebar/collapse-cookie.ts";
import DashboardView from "../ui/dashboard/dashboard-view";
import PrivateShell from "../ui/sidebar/private-shell";

export const metadata: Metadata = {
  title: `${DASHBOARD_TITLE} | EET N° 3100`,
  description:
    "Panel principal de la EET N° 3100 para administradores, administrativos y tutores.",
};

export default async function DashboardPage() {
  const account = await getPrivateAccount();
  const collapsed = await getCollapsedPreference();
  const sidebarAccount = toSidebarAccount(account);
  const role = getEffectiveRole(account) ?? account.claims.role;

  let pendingTotal: number | null = null;

  if (account.status === "ok" && showsPendingRegistrationsCard(role)) {
    const token = await getSessionToken();

    if (token) {
      pendingTotal = await getPendingRegistrationsTotalData(token);
    }
  }

  return (
    <PrivateShell
      role={role}
      account={sidebarAccount}
      collapsed={collapsed}
    >
      <main className="mx-auto w-full max-w-4xl px-3 pb-16 pt-6 sm:px-6 lg:pt-10">
        <section className="mx-auto w-[97%] rounded-2xl border border-borde-input bg-superficie p-3 shadow-sm sm:p-6 md:w-[95%] lg:p-8">
          <h1 className="text-2xl font-bold text-texto-principal">
            {DASHBOARD_TITLE}
          </h1>

          <div className="mt-6">
            <DashboardView account={account} pendingTotal={pendingTotal} />
          </div>
        </section>
      </main>
    </PrivateShell>
  );
}
