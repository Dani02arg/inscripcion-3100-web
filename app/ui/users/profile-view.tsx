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

/** Presenta el perfil propio en lectura y omite identificadores sensibles. */
export default function ProfileView({ user }: ProfileViewProps) {
  const sections = getOwnProfileSections(user);
  const isTutor = user.role === "TUTOR";

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4 rounded-2xl border border-borde-input border-l-4 border-l-azul-institucional bg-superficie p-5 shadow-sm sm:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-texto-principal">Mi perfil</h1>
          <p className="text-xl font-semibold text-texto-principal">
            {getProfileDisplayName(user)}
          </p>
        </div>
        <UserRoleBadge role={user.role} />
      </header>

      <div className="grid gap-4 lg:grid-cols-2">
        {sections.map((section, index) => {
          const headingId = `profile-section-${index}`;

          return (
            <section
              key={section.title}
              aria-labelledby={headingId}
              className="rounded-2xl border border-borde-input bg-superficie p-4 shadow-sm sm:p-6"
            >
              <h2
                id={headingId}
                className="border-b border-borde-input pb-3 text-xl font-bold text-texto-principal"
              >
                {section.title}
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {section.fields
                  .filter(
                    (field) =>
                      !isTutor ||
                      section.title !== "Datos personales" ||
                      (field.label !== "Ocupación" &&
                        field.label !== "Nivel educativo"),
                  )
                  .map((field) => (
                    <div key={field.label} className="min-w-0 space-y-1">
                      <dt className="text-sm font-semibold text-texto-secundario">
                        {field.label}
                      </dt>
                      <dd className="break-words text-base text-texto-principal">
                        {field.value}
                      </dd>
                    </div>
                  ))}
              </dl>
              {isTutor && section.title === "Datos personales" ? (
                <TutorProfileForm user={user} />
              ) : null}
            </section>
          );
        })}
      </div>
    </div>
  );
}
