import type { ReactNode } from "react";

import type { UserRole } from "../../lib/auth/types.ts";
import type { SidebarAccountState } from "../../lib/sidebar/types.ts";
import Sidebar from "./sidebar";

interface PrivateShellProps {
  role: UserRole;
  account: SidebarAccountState;
  collapsed: boolean;
  children: ReactNode;
}

/**
 * Armazón de las páginas privadas: menú lateral de escritorio, barra
 * compacta en tablet y móvil, y contenido. No hace `fetch`.
 */
export default function PrivateShell({
  role,
  account,
  collapsed,
  children,
}: PrivateShellProps) {
  return (
    <div className="flex min-h-screen bg-fondo-app text-texto-principal">
      <Sidebar
        role={role}
        account={account}
        initialCollapsed={collapsed}
      />

      <div className="min-w-0 flex-1 pb-16 pt-14 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
