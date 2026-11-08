"use client";

interface CoursePaginationProps {
  page: number;
  totalPages: number;
  totalResults: number;
  onPageChange: (page: number) => void;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const BUTTON_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl border border-borde-input bg-superficie px-4 py-2 text-base font-semibold text-texto-principal transition-colors hover:bg-fondo-app disabled:cursor-not-allowed disabled:bg-fondo-app disabled:text-texto-secundario ${FOCUS_RING_CLASSES}`;

/** Controles accesibles de paginación del listado. */
export default function CoursePagination({
  page,
  totalPages,
  totalResults,
  onPageChange,
}: CoursePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);
  const resultLabel =
    totalResults === 1 ? "1 resultado" : `${totalResults} resultados`;

  return (
    <nav
      aria-label="Paginación de cursos"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-sm text-texto-principal">
        Página {safePage} de {safeTotalPages} · {resultLabel}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
          className={BUTTON_CLASSES}
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= safeTotalPages}
          className={BUTTON_CLASSES}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}
