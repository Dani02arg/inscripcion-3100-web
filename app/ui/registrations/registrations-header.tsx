import CourseBreadcrumb from "../courses/course-breadcrumb.tsx";

/** Encabezado del listado de inscripciones. */
export default function RegistrationsHeader() {
  return (
    <header className="space-y-5">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: "Inscripciones" },
        ]}
      />

      
    </header>
  );
}
