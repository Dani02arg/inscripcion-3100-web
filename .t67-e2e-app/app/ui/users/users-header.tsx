import CourseBreadcrumb, {
  type CourseBreadcrumbItem,
} from "../courses/course-breadcrumb.tsx";

export interface UsersHeaderProps {
  readonly sectionLabel?: string;
  readonly usersHref?: string;
  readonly title?: string;
  readonly description?: string;
}

const DEFAULT_SECTION_LABEL = "Padrón";
const DEFAULT_TITLE = "Padrón de usuarios";
const DEFAULT_DESCRIPTION =
  "Consultá y administrá las cuentas registradas en la institución.";

/**
 * Encabezado compartido del módulo de usuarios con breadcrumb
 * «Inicio > Usuarios > sección», título y descripción, sin acciones de alta.
 */
export default function UsersHeader({
  sectionLabel = DEFAULT_SECTION_LABEL,
  usersHref,
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
}: UsersHeaderProps) {
  const breadcrumbItems: CourseBreadcrumbItem[] = [
    { label: "Inicio", href: "/dashboard" },
    usersHref
      ? { label: "Usuarios", href: usersHref }
      : { label: "Usuarios" },
    { label: sectionLabel },
  ];

  return (
    <header className="space-y-5">
      <CourseBreadcrumb items={breadcrumbItems} />

      <div>
        <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-base text-texto-principal">
          {description}
        </p>
      </div>
    </header>
  );
}
