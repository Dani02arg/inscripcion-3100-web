import Link from "next/link";

import type { UserRole } from "../../lib/auth/types.ts";
import { isTutorRole } from "../../lib/students/access.ts";
import {
  formatStudentDate,
  formatStudentFullName,
  formatStudentGender,
  formatStudentText,
} from "../../lib/students/labels.ts";
import {
  getStudentReturnLabel,
  sanitizeStudentReturnPath,
  studentEditPath,
} from "../../lib/students/students-url.ts";
import type { Student, StudentTutor } from "../../lib/students/types.ts";
import CourseBreadcrumb from "../courses/course-breadcrumb.tsx";

interface StudentDetailProps {
  readonly student: Student;
  readonly tutor: StudentTutor | null;
  readonly role: UserRole;
  readonly returnPath?: string | null;
}

const FOCUS_RING_CLASSES =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-borde-focus focus-visible:ring-offset-2 focus-visible:ring-offset-fondo-app";

const ACTION_BASE_CLASSES =
  `inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-base font-semibold transition-colors ${FOCUS_RING_CLASSES}`;

function DetailItem({
  label,
  value,
}: {
  readonly label: string;
  readonly value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-borde-input bg-fondo-app px-3 py-2">
      <dt className="text-sm font-semibold text-texto-principal">{label}</dt>
      <dd className="mt-1 break-words text-base font-medium text-texto-principal">
        {value}
      </dd>
    </div>
  );
}

function DetailSection({
  title,
  items,
}: {
  readonly title: string;
  readonly items: readonly { readonly label: string; readonly value: string }[];
}) {
  const sectionId = `student-detail-${title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <section
      aria-labelledby={sectionId}
      className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm"
    >
      <h2 id={sectionId} className="text-lg font-bold text-texto-principal">
        {title}
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <DetailItem key={item.label} label={item.label} value={item.value} />
        ))}
      </dl>
    </section>
  );
}

/** Detalle de un alumno con secciones y datos de tutor para roles administrativos. */
export default function StudentDetail({
  student,
  tutor,
  role,
  returnPath,
}: StudentDetailProps) {
  const isTutor = isTutorRole(role);
  const backPath = sanitizeStudentReturnPath(returnPath);
  const backLabel = getStudentReturnLabel(role);
  const fullName = formatStudentFullName(student);

  const personalItems = [
    { label: "Nombre y apellido", value: fullName },
    { label: "DNI", value: formatStudentText(student.studentDni) },
    { label: "CUIL", value: formatStudentText(student.studentCuil) },
    { label: "Fecha de nacimiento", value: formatStudentDate(student.birthdate) },
    { label: "Género", value: formatStudentGender(student.gender) },
  ];

  const contactItems = [
    { label: "Correo electrónico", value: formatStudentText(student.studentEmail) },
    { label: "Teléfono", value: formatStudentText(student.studentPhone) },
  ];

  const additionalItems = [
    { label: "Lugar de nacimiento", value: formatStudentText(student.birthplace) },
    { label: "Domicilio", value: formatStudentText(student.address) },
  ];

  const tutorItems = [
    {
      label: "Nombre y apellido",
      value: tutor
        ? formatStudentText(`${tutor.name} ${tutor.lastname}`.trim())
        : "No informado",
    },
    { label: "Correo electrónico", value: formatStudentText(tutor?.email) },
    { label: "Teléfono", value: formatStudentText(tutor?.user_phone) },
  ];

  return (
    <div className="space-y-6">
      <CourseBreadcrumb
        items={[
          { label: "Inicio", href: "/dashboard" },
          { label: isTutor ? "Mis hijos" : "Alumnos", href: backPath },
          { label: "Detalles" },
        ]}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-texto-principal sm:text-3xl">
            Detalle del alumno
          </h1>
          <p className="mt-2 text-base text-texto-principal">{fullName}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href={backPath}
            className={`${ACTION_BASE_CLASSES} border border-borde-input bg-superficie text-texto-principal hover:bg-fondo-app`}
          >
            {backLabel}
          </Link>

          {isTutor ? (
            <Link
              href={studentEditPath(student.id)}
              className={`${ACTION_BASE_CLASSES} bg-azul-institucional text-superficie hover:opacity-90`}
            >
              Editar
            </Link>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <DetailSection title="Datos personales" items={personalItems} />
        <DetailSection title="Datos de contacto" items={contactItems} />
        <DetailSection title="Datos adicionales" items={additionalItems} />
        {!isTutor ? (
          <DetailSection title="Tutor responsable" items={tutorItems} />
        ) : null}
      </div>
    </div>
  );
}
