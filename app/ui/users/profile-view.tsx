
import {
  BookOpen,
  Briefcase,
  Calendar,
  FileText,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  User,
  UserCheck,
} from "lucide-react";

import {
  getOwnProfileSections,
  getProfileDisplayName,
} from "../../lib/users/profile.ts";

import type { CurrentUser } from "../../lib/auth/types.ts";

import TutorProfileForm from "./tutor-profile-form.tsx";
import UserRoleBadge from "./user-role-badge.tsx";

interface ProfileViewProps {
  readonly user: CurrentUser;
}

function getSectionIcon(title: string) {
  const normalized = title.toLowerCase();

  if (normalized.includes("personal")) {
    return <User className="size-5 text-azul-institucional" aria-hidden="true" />;
  }

  if (
    normalized.includes("contacto") ||
    normalized.includes("ubicación") ||
    normalized.includes("ubicacion")
  ) {
    return <MapPin className="size-5 text-azul-institucional" aria-hidden="true" />;
  }

  if (
    normalized.includes("acad") ||
    normalized.includes("educ") ||
    normalized.includes("escolar")
  ) {
    return <GraduationCap className="size-5 text-azul-institucional" aria-hidden="true" />;
  }

  return <FileText className="size-5 text-azul-institucional" aria-hidden="true" />;
}

function getFieldIcon(label: string) {
  const normalized = label.toLowerCase();

  if (
    normalized.includes("correo") ||
    normalized.includes("email") ||
    normalized.includes("mail")
  ) {
    return <Mail className="size-4 shrink-0 text-azul-institucional" aria-hidden="true" />;
  }

  if (
    normalized.includes("tel") ||
    normalized.includes("celu") ||
    normalized.includes("whatsapp")
  ) {
    return <Phone className="size-4 shrink-0 text-azul-institucional" aria-hidden="true" />;
  }

  if (
    normalized.includes("direc") ||
    normalized.includes("domic") ||
    normalized.includes("local") ||
    normalized.includes("barrio")
  ) {
    return <MapPin className="size-4 shrink-0 text-azul-institucional" aria-hidden="true" />;
  }

  if (
    normalized.includes("fecha") ||
    normalized.includes("nacim")
  ) {
    return <Calendar className="size-4 shrink-0 text-azul-institucional" aria-hidden="true" />;
  }

  if (
    normalized.includes("ocup") ||
    normalized.includes("trab") ||
    normalized.includes("prof")
  ) {
    return <Briefcase className="size-4 shrink-0 text-azul-institucional" aria-hidden="true" />;
  }

  if (
    normalized.includes("nivel") ||
    normalized.includes("curso") ||
    normalized.includes("estudi")
  ) {
    return <GraduationCap className="size-4 shrink-0 text-azul-institucional" aria-hidden="true" />;
  }

  if (
    normalized.includes("dni") ||
    normalized.includes("doc") ||
    normalized.includes("legajo")
  ) {
    return <IdCard className="size-4 shrink-0 text-azul-institucional" aria-hidden="true" />;
  }

  if (
    normalized.includes("materia") ||
    normalized.includes("divisi")
  ) {
    return <BookOpen className="size-4 shrink-0 text-azul-institucional" aria-hidden="true" />;
  }

  return <FileText className="size-4 shrink-0 text-azul-institucional" aria-hidden="true" />;
}

/** Presenta el perfil propio en lectura y omite identificadores sensibles. */
export default function ProfileView({ user }: ProfileViewProps) {
  const sections = getOwnProfileSections(user);
  const isTutor = user.role === "TUTOR";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">

      {/* CABECERA DEL PERFIL */}
      <header className="rounded-xl border border-borde-input border-l-4 border-l-azul-institucional bg-superficie p-5 shadow-sm sm:p-6">

        <div className="flex flex-wrap items-center justify-between gap-4">

          <div className="flex min-w-0 items-center gap-4">

            {/* ICONO DE PERSONA */}
            <div className="flex size-14 shrink-0 items-center justify-center rounded-full border border-[#DCE5F5] bg-[#EEF3FF] text-azul-institucional">
              <User className="size-7" aria-hidden="true" />
            </div>

            {/* NOMBRE Y APELLIDO */}
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-texto-secundario">
                Mi perfil
              </p>

              <h1 className="break-words text-xl font-bold tracking-tight text-texto-principal sm:text-2xl">
                {getProfileDisplayName(user)}
              </h1>

              <p className="text-sm text-texto-secundario">
                Información personal y datos registrados.
              </p>
            </div>

          </div>

          {/* ROL */}
          <UserRoleBadge role={user.role} />

        </div>
      </header>

      {/* CONTENEDORES DEL PERFIL: UNO DEBAJO DEL OTRO */}
      <div className="flex flex-col gap-5">

        {sections.map((section, index) => {
          const headingId = `profile-section-${index}`;

          const visibleFields = section.fields.filter(
            (field) =>
              !isTutor ||
              section.title !== "Datos personales" ||
              (field.label !== "Ocupación" &&
                field.label !== "Nivel educativo"),
          );

          return (
            <section
              key={section.title}
              aria-labelledby={headingId}
              className="w-full rounded-xl border border-borde-input bg-superficie p-5 shadow-sm sm:p-6"
            >

              {/* ENCABEZADO DE SECCIÓN */}
              <div className="flex items-center gap-3 border-b border-borde-input pb-4">

                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-fondo-app">
                  {getSectionIcon(section.title)}
                </div>

                <h2
                  id={headingId}
                  className="text-base font-bold text-texto-principal sm:text-lg"
                >
                  {section.title}
                </h2>

              </div>

              {/* INFORMACIÓN */}
              <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                {visibleFields.map((field) => {
                  const normalized = field.label.toLowerCase();

                  const isEmail =
                    normalized.includes("correo") ||
                    normalized.includes("email");

                  return (
                    <div
                      key={field.label}
                      className={`min-w-0 rounded-lg border border-borde-input/60 bg-fondo-app/50 p-3.5 ${
                        isEmail ? "sm:col-span-2" : ""
                      }`}
                    >

                      <dt className="flex items-center gap-2 text-xs font-semibold text-texto-secundario">

                        <span className="shrink-0">
                          {getFieldIcon(field.label)}
                        </span>

                        <span>{field.label}</span>

                      </dt>

                      <dd
                        className={`mt-2 text-sm font-medium leading-relaxed text-texto-principal sm:text-base ${
                          isEmail ? "break-all" : "break-words"
                        }`}
                      >
                        {field.value}
                      </dd>

                    </div>
                  );
                })}

              </dl>

              {/* FORMULARIO DE EDICIÓN DEL TUTOR */}
              {isTutor && section.title === "Datos personales" ? (
                <div className="mt-6 border-t border-borde-input pt-5">

                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-texto-principal">
                      Actualizar información
                    </h3>

                    <p className="mt-1 text-xs text-texto-secundario">
                      Modificá los datos personales que necesites actualizar.
                    </p>
                  </div>

                  <TutorProfileForm user={user} />

                </div>
              ) : null}

            </section>
          );
        })}

      </div>
    </div>
  );
}
