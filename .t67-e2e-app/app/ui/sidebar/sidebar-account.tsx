import type { ReactNode, Ref } from "react";

import { getAccountAccessibleName } from "../../lib/sidebar/account.ts";
import type { SidebarAccountState } from "../../lib/sidebar/types.ts";

interface SidebarAccountProps {
  account: SidebarAccountState;
  collapsed: boolean;
  menuOpen?: boolean;
  menuId?: string;
  onToggleMenu?: () => void;
  menu?: ReactNode;
  triggerRef?: Ref<HTMLButtonElement>;
}

function GenericAvatar() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-fondo-app text-texto-principal"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    </span>
  );
}

/** Pie con iniciales, nombre y correo, o su estado degradado. */
export default function SidebarAccount({
  account,
  collapsed,
  menuOpen = false,
  menuId,
  onToggleMenu,
  menu,
  triggerRef,
}: SidebarAccountProps) {
  const data = account.status === "ready" ? account.data : null;
  const displayName = data?.displayName ?? "";
  const email = data?.email ?? "";
  const accessibleName = getAccountAccessibleName(displayName);

  const avatar =
    data?.initials !== null && data?.initials !== undefined ? (
      <span
        aria-hidden="true"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-azul-institucional text-sm font-semibold text-superficie"
      >
        {data.initials}
      </span>
    ) : (
      <GenericAvatar />
    );

  const content = (
    <>
      {avatar}

      {!collapsed && (
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-texto-principal">
            {displayName.length > 0 ? displayName : "Cuenta"}
          </span>

          {email.length > 0 && (
            <span className="block truncate text-xs text-texto-principal">
              {email}
            </span>
          )}

          {data?.roleLabel ? (
            <span className="block truncate text-xs text-texto-principal">
              {data.roleLabel}
            </span>
          ) : null}
        </span>
      )}
    </>
  );

  const layoutClasses = [
    "flex min-h-14 w-full items-center gap-3 rounded-lg px-2 py-2 text-left",
    collapsed ? "justify-center px-0" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <footer className="border-t border-borde-input p-2">
      <div className="relative">
        {onToggleMenu ? (
          <button
            ref={triggerRef}
            type="button"
            aria-label={accessibleName}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={onToggleMenu}
            className={`${layoutClasses} transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-superficie`}
          >
            {content}
          </button>
        ) : (
          <div className={layoutClasses}>{content}</div>
        )}

        {menu}
      </div>
    </footer>
  );
}
