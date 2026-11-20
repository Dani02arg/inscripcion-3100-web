import type { ReactNode } from "react";

interface ReportPreviewShellProps {
  readonly children: ReactNode;
  /** Nombre accesible del área de vista previa. */
  readonly label: string;
  readonly className?: string;
}

/**
 * Contenedor acotado de vista previa (V1/RNF-9).
 * Altura objetivo 60 % del área de contenido, mínima 20 rem y máxima acotada
 * para mantener alcanzables filtros (arriba) y descarga (abajo) mediante scroll
 * externo. Provee scroll interno vertical y horizontal.
 */
export default function ReportPreviewShell({
  children,
  label,
  className = "",
}: ReportPreviewShellProps) {
  return (
    <section
      aria-label={label}
      role="region"
      tabIndex={0}
      className={`h-[60dvh] min-h-[20rem] max-h-[calc(100dvh-20rem)] overflow-auto rounded-2xl border border-borde-input bg-superficie shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app ${className}`.trim()}
    >
      {children}
    </section>
  );
}
