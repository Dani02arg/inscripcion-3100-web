"use client";

import { useState } from "react";

interface RegistrationPaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-3 py-2 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

const INPUT_CLASSES =
  "min-h-11 w-16 rounded-xl border border-borde-input bg-superficie px-2 py-2 text-center text-base font-semibold text-texto-principal focus:border-borde-focus focus:outline-none focus:ring-2 focus:ring-borde-focus";

function PageInput({
  page,
  onCommit,
}: {
  page: number;
  onCommit: (page: number) => void;
}) {
  const [value, setValue] = useState(String(page));

  const commit = () => {
    const parsed = Number(value);

    if (Number.isSafeInteger(parsed) && parsed >= 1) {
      onCommit(parsed);
    } else {
      setValue(String(page));
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(event) => setValue(event.target.value.replace(/\D/g, ""))}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          commit();
        }
      }}
      aria-label="Página actual"
      className={INPUT_CLASSES}
    />
  );
}

/** Paginación con extremos y página actual editable. */
export default function RegistrationPagination({
  page,
  totalPages,
  totalResults,
  onPageChange,
}: RegistrationPaginationProps) {
  const safeTotal = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotal);

  const goTo = (target: number) => {
    const clamped = Math.min(Math.max(1, target), safeTotal);
    onPageChange(clamped);
  };

  const pages = [safePage - 1, safePage, safePage + 1].filter(
    (candidate) => candidate >= 1 && candidate <= safeTotal,
  );

  return (
    <nav
      aria-label="Paginación del listado de inscripciones"
      className="flex flex-wrap items-center gap-2"
    >
      <button
        type="button"
        onClick={() => goTo(1)}
        disabled={safePage <= 1}
        className={BUTTON_CLASSES}
      >
        Inicio
      </button>
      <button
        type="button"
        onClick={() => goTo(safePage - 1)}
        disabled={safePage <= 1}
        className={BUTTON_CLASSES}
      >
        Anterior
      </button>

      {pages.map((candidate) =>
        candidate === safePage ? (
          <PageInput key={safePage} page={safePage} onCommit={goTo} />
        ) : (
          <button
            key={candidate}
            type="button"
            onClick={() => goTo(candidate)}
            className={BUTTON_CLASSES}
          >
            {candidate}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goTo(safePage + 1)}
        disabled={safePage >= safeTotal}
        className={BUTTON_CLASSES}
      >
        Siguiente
      </button>
      <button
        type="button"
        onClick={() => goTo(safeTotal)}
        disabled={safePage >= safeTotal}
        className={BUTTON_CLASSES}
      >
        Final
      </button>

      <p aria-live="polite" className="text-sm text-texto-principal">
        Página {safePage} de {safeTotal} · {totalResults} resultados
      </p>
    </nav>
  );
}
