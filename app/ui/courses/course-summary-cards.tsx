import { COURSE_ALL_YEARS_LABEL } from "../../lib/courses/labels.ts";
import type { CourseSummary, CourseYearFilter } from "../../lib/courses/types.ts";

export type CourseSummaryCardsStatus = "loading" | "ready" | "error";

interface CourseSummaryCardsProps {
  summary: CourseSummary | null;
  selectedYear: CourseYearFilter;
  status: CourseSummaryCardsStatus;
}

const CARD_CLASSES =
  "rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm";

const LABEL_CLASSES = "text-sm font-semibold text-texto-secundario";

const VALUE_CLASSES = "mt-2 text-2xl font-bold text-texto-principal";

const NUMBER_FORMATTER = new Intl.NumberFormat("es-AR");

function formatNumber(value: number): string {
  return NUMBER_FORMATTER.format(value);
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className={CARD_CLASSES}>
      <dt className={LABEL_CLASSES}>{label}</dt>
      <dd className={VALUE_CLASSES}>{value}</dd>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className={CARD_CLASSES} aria-hidden="true">
      <div className="h-4 w-24 rounded bg-fondo-app" />
      <div className="mt-3 h-7 w-16 rounded bg-fondo-app" />
    </div>
  );
}

/** Cuatro tarjetas de resumen calculadas sobre el conjunto filtrado. */
export default function CourseSummaryCards({
  summary,
  selectedYear,
  status,
}: CourseSummaryCardsProps) {
  if (status === "loading") {
    return (
      <section aria-label="Resumen de cursos" aria-busy="true">
        <span className="sr-only">Cargando resumen de cursos.</span>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
          <LoadingCard />
        </div>
      </section>
    );
  }

  if (status === "error" || !summary) {
    return (
      <section aria-label="Resumen de cursos">
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard label="Total de cursos" value="No disponible" />
          <SummaryCard label="Año académico seleccionado" value="No disponible" />
          <SummaryCard label="Cursos activos" value="No disponible" />
          <SummaryCard label="Capacidad total" value="No disponible" />
        </dl>
      </section>
    );
  }

  const yearLabel =
    selectedYear === "all" ? COURSE_ALL_YEARS_LABEL : String(selectedYear);
  const capacityLabel =
    summary.maxCapacityTotal === null
      ? "No disponible"
      : formatNumber(summary.maxCapacityTotal);

  return (
    <section aria-label="Resumen de cursos">
      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total de cursos"
          value={formatNumber(summary.total)}
        />
        <SummaryCard
          label="Año académico seleccionado"
          value={yearLabel}
        />
        <SummaryCard
          label="Cursos activos"
          value={formatNumber(summary.active)}
        />
        <SummaryCard label="Capacidad total" value={capacityLabel} />
      </dl>
    </section>
  );
}
