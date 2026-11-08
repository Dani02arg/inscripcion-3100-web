"use client";

import { useRouter } from "next/navigation";

/** Reintenta el render del servidor después de un error de cuenta. */
export default function RetryButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        router.refresh();
      }}
      className="rounded-xl bg-azul-institucional px-6 py-3 text-base font-semibold text-superficie transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-borde-focus focus:ring-offset-2"
    >
      Reintentar
    </button>
  );
}
