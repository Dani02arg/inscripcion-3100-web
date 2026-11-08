"use client";

import { useEffect, useRef, type RefObject } from "react";
import Link from "next/link";

import { ACCOUNT_PATH } from "../../lib/sidebar/navigation.ts";
import type { SidebarAccountState } from "../../lib/sidebar/types.ts";
import LogoutButton from "./logout-button";

interface SidebarAccountMenuProps {
  open: boolean;
  id: string;
  account: SidebarAccountState;
  collapsed: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}

const ITEM_CLASSES =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-inset";

/** Menú de cuenta anclado al avatar. */
export default function SidebarAccountMenu({
  open,
  id,
  account,
  collapsed,
  onClose,
  triggerRef,
}: SidebarAccountMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const menu = menuRef.current;
    const firstItem = menu?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus();

    function closeAndFocus() {
      onClose();
      triggerRef.current?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeAndFocus();
      }
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (menu?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }

      closeAndFocus();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, onClose, triggerRef]);

  if (!open) {
    return null;
  }

  const data = account.status === "ready" ? account.data : null;
  const displayName = data?.displayName ?? "";
  const email = data?.email ?? "";

  return (
    <div
      ref={menuRef}
      id={id}
      role="menu"
      aria-label="Opciones de cuenta"
      data-account-menu-open="true"
      className="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-xl border border-borde-input bg-superficie p-1 shadow-lg"
    >
      {collapsed && (
        <div className="border-b border-borde-input px-3 py-2">
          <p className="truncate text-sm font-semibold text-texto-principal">
            {displayName.length > 0 ? displayName : "Cuenta"}
          </p>
          {email.length > 0 && (
            <p className="truncate text-xs text-texto-principal">{email}</p>
          )}
        </div>
      )}

      <Link
        href={ACCOUNT_PATH}
        role="menuitem"
        onClick={onClose}
        className={ITEM_CLASSES}
      >
        <span className="min-w-0 flex-1">Configuración de cuenta</span>
      </Link>

      <LogoutButton />
    </div>
  );
}
