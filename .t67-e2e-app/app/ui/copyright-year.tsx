"use client";

import { useSyncExternalStore } from "react";

const FOUNDING_YEAR = 2026;

export function calcularCopyright(
  anioFundacion: number,
  anioActual: number,
): string {
  if (anioActual <= anioFundacion) {
    return `© ${anioFundacion}`;
  }

  return `© ${anioFundacion}-${anioActual}`;
}

function subscribe(): () => void {
  return () => {};
}

function getSnapshot(): number {
  return new Date().getFullYear();
}

function getServerSnapshot(): number {
  return FOUNDING_YEAR;
}

export default function CopyrightYear() {
  const anioActual = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return <span>{calcularCopyright(FOUNDING_YEAR, anioActual)}</span>;
}
