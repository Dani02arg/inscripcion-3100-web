"use client";

import { useFormStatus } from "react-dom";

import { logoutAction } from "../../lib/actions/logout.ts";
import { LOGOUT_LABEL } from "../../lib/auth/types.ts";

const ITEM_CLASSES =
  "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-texto-principal transition-colors hover:bg-fondo-app focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-inset disabled:cursor-not-allowed disabled:opacity-60";

function LogoutSubmit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      role="menuitem"
      disabled={pending}
      aria-busy={pending}
      className={ITEM_CLASSES}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <path d="m16 17 5-5-5-5" />
        <path d="M21 12H9" />
      </svg>
      <span>{pending ? "Cerrando sesión..." : LOGOUT_LABEL}</span>
    </button>
  );
}

/** Acción de cierre de sesión como elemento del menú de cuenta. */
export default function LogoutButton() {
  return (
    <form action={logoutAction} role="none">
      <LogoutSubmit />
    </form>
  );
}
