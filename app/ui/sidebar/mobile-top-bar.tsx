import Image from "next/image";
import Link from "next/link";
import type { Ref } from "react";

import {
  INSTITUTION_FULL_NAME,
  INSTITUTION_LOGO_PATH,
} from "../../lib/sidebar/presentation.ts";
import NotificationBell from "./notification-bell";

interface MobileTopBarProps {
  onOpenMenu: () => void;
  menuOpen?: boolean;
  menuId?: string;
  triggerRef?: Ref<HTMLButtonElement>;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fondo-app focus-visible:ring-offset-2 focus-visible:ring-offset-azul-institucional";

/** Barra compacta de tablet y móvil con hamburguesa, logo y campana. */
export default function MobileTopBar({
  onOpenMenu,
  menuOpen = false,
  menuId,
  triggerRef,
}: MobileTopBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b bg-azul-institucional text-fondo-app lg:hidden">
      <div className="flex h-14 items-center justify-between gap-2 px-2">
        <button
          ref={triggerRef}
          type="button"
          aria-label="Abrir menú"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          onClick={onOpenMenu}
          className={`inline-flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 ${FOCUS_RING_CLASSES}`}
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
          </svg>
        </button>

        <Link
          href="/dashboard"
          className={`flex items-center rounded-sm ${FOCUS_RING_CLASSES}`}
        >
          <Image
            src={INSTITUTION_LOGO_PATH}
            alt=""
            width={130}
            height={121}
            priority
            className="h-8 w-auto object-contain"
          />
          <span className="sr-only">{INSTITUTION_FULL_NAME}. Ir al inicio.</span>
        </Link>

        <NotificationBell tone="onDark" />
      </div>
    </header>
  );
}
