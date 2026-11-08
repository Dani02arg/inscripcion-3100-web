import Link from "next/link";

export interface CourseBreadcrumbItem {
  readonly label: string;
  readonly href?: string;
}

interface CourseBreadcrumbProps {
  items: readonly CourseBreadcrumbItem[];
}

const LINK_CLASSES =
  "rounded-sm underline-offset-4 hover:text-azul-institucional hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

/** Breadcrumb accesible para las pantallas del módulo de cursos. */
export default function CourseBreadcrumb({
  items,
}: CourseBreadcrumbProps) {
  return (
    <nav aria-label="Ruta de navegación" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1;

          return (
            <li
              key={`${item.label}-${index}`}
              className="flex items-center gap-2"
            >
              {index > 0 ? (
                <span aria-hidden="true" className="text-texto-secundario">
                  {">"}
                </span>
              ) : null}

              {item.href && !isCurrent ? (
                <Link
                  href={item.href}
                  className={`text-texto-secundario ${LINK_CLASSES}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isCurrent ? "page" : undefined}
                  className={
                    isCurrent
                      ? "font-semibold text-texto-principal"
                      : "text-texto-secundario"
                  }
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
